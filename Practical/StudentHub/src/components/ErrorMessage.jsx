function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error">

      <h2>{message}</h2>

      <button onClick={onRetry}>
        Retry
      </button>

    </div>
  );
}

export default ErrorMessage;