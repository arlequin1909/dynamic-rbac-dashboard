const _DEFAULT_MESSAGE = 'Nothing to show yet.';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return <p className="text-sm text-slate-500">{message ?? _DEFAULT_MESSAGE}</p>;
}
