
function SlowLoadingMessage() {
    return (
        <div className="slow-loading-message" role="status">
            <p className="slow-loading-message__title">
                The movie engine is waking up!
            </p>

            <p className="slow-loading-message__text">
                Our free hosting may take up to a minute to start
                responding after a period of inactivity. Thanks for
                your patience!
            </p>
        </div>
    );
}

export default SlowLoadingMessage;
