const _DEFAULT_MESSAGE = 'Something went wrong.';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded border border-red-900 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      <p>{message ?? _DEFAULT_MESSAGE}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
        >
          Retry
        </button>
      )}
    </div>
  );
}
