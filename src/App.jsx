
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import SlowLoadingMessage from "./components/SlowLoadingMessage";
import MovieCard from "./components/MovieCard";

import { useEffect, useState } from "react";
import { useDebounce } from "react-use";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const [movieList, setMovieList] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingTrendingMovies, setIsLoadingTrendingMovies] =
        useState(false);
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

    async function fetchMovies(query = "") {
        const endpoint = query.trim()
            ? `${API_BASE_URL}/api/movies?query=${encodeURIComponent(query.trim())}`
            : `${API_BASE_URL}/api/movies/popular`;

        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await fetch(endpoint);

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(
                        "Too many requests. Please wait a moment before searching again."
                    );
                }

                throw new Error(`Movie request failed (${response.status}).`);
            }

            const data = await response.json();
            setMovieList(data.movies || []);
        } catch (error) {
            setErrorMessage(
                error instanceof TypeError
                    ? "Unable to reach the movie service. It may be waking up or temporarily unavailable. Please try again shortly."
                    : error.message
            );
        } finally {
            setIsLoading(false);
        }
    }

    async function loadTrendingMovies() {
        setIsLoadingTrendingMovies(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/trending`);

            if (!response.ok) {
                throw new Error("Unable to load trending movies.");
            }

            const data = await response.json();
            setTrendingMovies(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Unable to load trending movies:", error);
            setTrendingMovies([]);
        } finally {
            setIsLoadingTrendingMovies(false);
        }
    }

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return (
        <main>
            <div className="pattern" />

            <div className="wrapper">
                <header>
                    <h1>
                        Find <span className="text-gradient">Movies</span> You'll Love
                    </h1>
                </header>

                <Search
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />

                <section className="trending">
                    <h2>Trending Searches</h2>

                    {isLoadingTrendingMovies ? (
                        <Spinner />
                    ) : trendingMovies.length > 0 ? (
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
                    ) : (
                        <p>No trending searches yet.</p>
                    )}
                </section>

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
