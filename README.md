# Movie App

A React app for discovering movies. Search the TMDB catalog, browse movie cards with ratings, language and release year, and see which movies are trending based on what people search for.

**Live demo:** https://movie-radar-beryl.vercel.app

> Based on the [JavaScript Mastery React tutorial](https://www.youtube.com/watch?v=dCLhUialKPQ). See [what I changed from the tutorial](#what-i-changed-from-the-tutorial) for my additions.

## Features

- Search movies by title with a 500 ms debounce, so a request is only sent after the user stops typing
- Popular movies shown by default
- Movie cards with poster, rating, original language and release year, with a fallback image when a poster is missing
- Trending section: the top 5 searched movies, ranked by how many times they were searched. It is hidden when there is nothing to show
- Loading spinners for the movie list and the trending section, and an error message if a request fails
- Cold-start handling: if the backend takes more than 5 seconds to answer, the app explains that the free hosting is waking up, and retries automatically

## Architecture

The browser talks only to my own backend. TMDB and Appwrite credentials never reach the client.

```text
Browser (React/Vite, Vercel)
        |  GET /api/movies, /api/movies/popular, /api/trending
        v
Spring Boot BFF (Render)  ---> TMDB API
                          ---> Appwrite (search counts)
```

The backend is a separate project: [movie-radar-bff](https://github.com/tchiwara/movie-radar-bff). It validates and rate-limits requests, caches TMDB responses, maps them to the compact shape this UI needs, and records search terms for the trending list. Its README covers the architecture diagrams, API, configuration and deployment in detail.

## Tech stack

- React 19 + Vite
- Tailwind CSS 4
- `react-use` for the `useDebounce` hook
- Backend: Spring Boot BFF (see above), which calls the [TMDB API](https://www.themoviedb.org/documentation/api) and [Appwrite](https://appwrite.io) (TablesDB)
- Hosting: Vercel (frontend), Render (backend)

## How trending works

When a search returns results, the BFF normalizes the term (trimmed, lowercased, minimum 3 characters) and looks it up in an Appwrite table. If it exists, its count goes up by one. If not, a new row is created with the term, the first result's movie id and poster URL, and a count of 1. The trending section shows the 5 rows with the highest count.

## What I changed from the tutorial

- Replaced the direct TMDB and Appwrite calls in the browser with my own Spring Boot backend-for-frontend, so no token or API key is shipped to the client
- Moved search counting and normalization into the backend, with the Appwrite credentials kept server-side
- Removed the Appwrite SDK and all Appwrite configuration from the frontend
- Added cold-start handling: a "waking up" message after 5 seconds, and automatic retries (up to 12 attempts, 5 seconds apart) on network errors and 502/503/504 responses, because the free-tier backend sleeps when idle
- Cancelled stale requests with `AbortController`, so an old or retrying request can never overwrite newer results
- Added a loading state for the trending section, and hid the section when there are no trending movies
- Added specific messages for rate limiting (429) and an unreachable service
- Pinned the dev server to port 5173 (`strictPort`), because the backend's CORS allowlist is an exact match

## Getting started

1. Clone the repo and install dependencies:

```bash
   git clone https://github.com/tchiwara/movie-app.git
   cd movie-app
   npm install
```

2. Run the backend. Either use the deployed one, or run [movie-radar-bff](https://github.com/tchiwara/movie-radar-bff) locally by following its README (that needs your own TMDB token and Appwrite project).

3. Copy `.env.example` to `.env` and set the backend URL, with no trailing slash:

```text
   VITE_API_BASE_URL=http://localhost:8080
```

To use the deployed backend instead, set it to `https://movie-radar-bff.onrender.com`. The backend's CORS allowlist must include `http://localhost:5173`.

4. Start the dev server:

```bash
   npm run dev
```

## Known limitations

- The backend runs on a free instance that sleeps after about 15 minutes without traffic. The first request after a sleep can take around a minute, which is why the app shows a "waking up" message and retries.
- Trending counts are updated with a read-then-write sequence in the backend, so simultaneous searches for the same term can occasionally lose an increment.
- There is no pagination: each view shows the first page of results.

## Roadmap

Planned improvements live in the backend's roadmap: moving search counting off the request path, a health endpoint, and CI.

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB.