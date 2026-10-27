import Search from "./components/Search";
import Spinner from "./components/Spinner";
import SlowLoadingMessage from "./components/SlowLoadingMessage";
import MovieCard from "./components/MovieCard";

import { useEffect, useState } from "react";
import { useDebounce } from "react-use";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RETRYABLE_STATUSES = [502, 503, 504];
const MAX_ATTEMPTS = 12;
const RETRY_DELAY_MS = 5000;

function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        signal.addEventListener(
            "abort",
            () => {
                clearTimeout(timer);
                reject(new DOMException("Aborted", "AbortError"));
            },
            { once: true }
        );
    });
}

// Retries on network errors and 502/503/504 so a sleeping backend has time to wake up.
async function fetchWithRetry(url, signal) {
    for (let attempt = 1; ; attempt++) {
        try {
            const response = await fetch(url, { signal });

            if (
                !RETRYABLE_STATUSES.includes(response.status) ||
                attempt >= MAX_ATTEMPTS
            ) {
                return response;
            }
        } catch (error) {
            if (
                error.name === "AbortError" ||
                !(error instanceof TypeError) ||
                attempt >= MAX_ATTEMPTS
            ) {
                throw error;
            }
        }

        await sleep(RETRY_DELAY_MS, signal);
    }
}

function App() {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const [movieList, setMovieList] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingTrendingMovies, setIsLoadingTrendingMovies] =
        useState(true);
    const [showSlowLoadingMessage, setShowSlowLoadingMessage] =
        useState(false);

    useDebounce(
        () => setDebouncedSearchTerm(searchTerm),
        500,
        [searchTerm]
    );

    // Show the cold-start message only if loading lasts longer than 5 seconds.
    useEffect(() => {
        if (!isLoading) {
            setShowSlowLoadingMessage(false);
            return;
        }

        setShowSlowLoadingMessage(false);

        const timer = setTimeout(() => {
            setShowSlowLoadingMessage(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, [isLoading, debouncedSearchTerm]);

    async function fetchMovies(query = "", signal) {
        const endpoint = query.trim()
            ? `${API_BASE_URL}/api/movies?query=${encodeURIComponent(query.trim())}`
            : `${API_BASE_URL}/api/movies/popular`;

        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await fetchWithRetry(endpoint, signal);

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(
                        "Too many requests. Please wait a moment before searching again."
                    );
                }

                throw new Error(`Movie request failed (${response.status}).`);
            }

            const data = await response.json();

            if (signal.aborted) return;

            setMovieList(data.movies || []);
        } catch (error) {
            if (error.name === "AbortError") return;

            setErrorMessage(
                error instanceof TypeError
                    ? "Unable to reach the movie service. It may be waking up or temporarily unavailable. Please try again shortly."
                    : error.message
            );
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }

    async function loadTrendingMovies(signal) {
        setIsLoadingTrendingMovies(true);

        try {
            const response = await fetchWithRetry(
                `${API_BASE_URL}/api/trending`,
                signal
            );

            if (!response.ok) {
                throw new Error("Unable to load trending movies.");
            }

            const data = await response.json();

            if (signal.aborted) return;

            setTrendingMovies(Array.isArray(data) ? data : []);
        } catch (error) {
            if (error.name === "AbortError") return;

            console.error("Unable to load trending movies:", error);
            setTrendingMovies([]);
        } finally {
            if (!signal.aborted) setIsLoadingTrendingMovies(false);
        }
    }

    useEffect(() => {
        const controller = new AbortController();
        fetchMovies(debouncedSearchTerm, controller.signal);
        return () => controller.abort();
    }, [debouncedSearchTerm]);

    useEffect(() => {
        const controller = new AbortController();
        loadTrendingMovies(controller.signal);
        return () => controller.abort();
    }, []);

    return (
        <main>
            <div className="pattern" />

            <div className="wrapper">
                <header>
                    <h1>
                        Find <span className="text-gradient">Movies</span> You'll Love Without The Hassle
                    </h1>
                </header>

                <Search
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />

                {(isLoadingTrendingMovies || trendingMovies.length > 0) && (
                    <section className="trending">
                        <h2>Trending Searches</h2>

                        {isLoadingTrendingMovies ? (
                            <Spinner />
                        ) : (
                            <ul>
                                {trendingMovies.map((movie, index) => (
                                    <li key={movie.movieId ?? movie.searchTerm ?? index}>
                                        <p>{index + 1}</p>
                                        <img
                                            src={movie.posterUrl}
                                            alt={movie.searchTerm || "Trending movie"}
                                            loading="lazy"
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                <section className="all-movies">
                    <h2>All Movies</h2>

                    {isLoading ? (
                        <div className="movie-loading-container">
                            <Spinner />

                            {showSlowLoadingMessage && (
                                <SlowLoadingMessage />
                            )}
                        </div>
                    ) : errorMessage ? (
                        <div className="movie-error-message" role="alert">
                            <p>{errorMessage}</p>
                        </div>
                    ) : movieList.length > 0 ? (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </ul>
                    ) : (
                        <p className="empty-movies-message">
                            No movies found. Try another search.
                        </p>
                    )}
                </section>
            </div>
        </main>
    );
}

export default App;