
const MovieCard = ({
                       movie: {
                           title,
                           voteAverage,
                           posterUrl,
                           releaseYear,
                           originalLanguage
                       }
                   }) => {

    return (
        <div className="movie-card">
            <img
                src={posterUrl || '/no-movie.png'}
                alt={title}
            />

            <div className="mt-4">
                <h3>{title}</h3>

                <div className="content">
                    <div className="rating">
                        <img src="star.svg" alt="Star Icon" />
                        <p>
                            {typeof voteAverage === 'number'
                                ? voteAverage.toFixed(1)
                                : 'N/A'}
                        </p>
                    </div>

                    <span>•</span>
                    <p className="lang">{originalLanguage || 'N/A'}</p>

                    <span>•</span>
                    <p className="year">
                        {releaseYear || 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
