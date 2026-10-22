# Movie App

A React app for discovering movies. Search the TMDB catalog, browse movie cards with ratings, language and release year, and see which movies are trending based on what people search for.

**Live demo:** https://movie-radar-beryl.vercel.app

> Based on the [JavaScript Mastery React tutorial](https://www.youtube.com/watch?v=dCLhUialKPQ). See [what I changed from the tutorial](#what-i-changed-from-the-tutorial) for my additions.

## Features

- Search movies by title with a 500 ms debounce, so a request is only sent after the user stops typing
- Popular movies shown by default (TMDB `discover` endpoint)
- Movie cards with poster, rating, original language and release year, with a fallback image when a poster is missing
- Trending section: the top 5 searched movies, ranked by how many times they were searched
- Loading spinners for both the movie list and the trending section, and an error message if the request fails

## Tech Stack

- React 19 + Vite
- Tailwind CSS 4
- [TMDB API](https://www.themoviedb.org/documentation/api) for movie data
- [Appwrite](https://appwrite.io) (TablesDB) to store search counts
- `react-use` for the `useDebounce` hook

## How trending works

When a search returns results, the search term is normalized (trimmed and lowercased, minimum 3 characters) and looked up in an Appwrite table. If it exists, its `count` goes up by one. If not, a new row is created with the term, the first result's movie id and poster URL, and a count of 1. The trending section reads the 5 rows with the highest `count`.

## What I changed from the tutorial

- Used the current Appwrite `TablesDB` API (`listRows`, `createRow`, `updateRow`) instead of the older `Databases` calls
- Normalized search terms and skipped very short ones, so "Venom", "venom " and "VENOM" count as one search and half-typed searches are not recorded
- Added a loading spinner for the trending section, and hid the section when there are no trending movies
- Moved the Appwrite endpoint into an environment variable, since projects are served from a regional endpoint
- Locked down the Appwrite table permissions to what the app needs (delete is disabled)

## Getting Started

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/tchiwara/movie-app.git
   cd movie-app
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your values:

   ```
   VITE_TMDB_API_KEY=your TMDB API Read Access Token
   VITE_APPWRITE_PROJECT_ID=
   VITE_APPWRITE_DATABASE_ID=
   VITE_APPWRITE_TABLE_ID=
   VITE_APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
   ```

3. Set up Appwrite: create a database and a table with these columns, using the endpoint shown in your project settings:

   | Column | Type |
      | --- | --- |
   | `searchTerm` | string (size 1000) |
   | `count` | integer (bigint) |
   | `movie_id` | integer (bigint) |
   | `poster_url` | URL |

   Add an index on `count` (descending) so the trending query can sort, and give the table create, read and update permissions. Leave delete off, since the app never deletes rows. Register `localhost` (and your deployed domain) as a Web platform in the project.

4. Start the dev server:

   ```bash
   npm run dev
   ```

## Known limitations

- The TMDB token is used directly from the browser, so it is visible in the network tab. It is a free, read-only token, but the fix is to move the TMDB calls behind a small backend proxy that holds the token.
- Search counts are written from the browser, so the Appwrite table allows public create, read and update (delete is disabled). Someone with a script could inflate the counts or change a row's poster URL. Moving the counting into the backend would let the table be read-only for the public.
- The Appwrite Web platform is currently set to a wildcard hostname, so any site could use the project ID from a browser. It should be restricted to the deployed domain.

## Roadmap

- Spring Boot backend-for-frontend (BFF) for the TMDB calls, so no token is shipped to the browser
- Move search counting into the BFF
- Response caching, rate limiting, and usage metrics on the BFF

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB.