import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { ErrorState } from './ErrorState';

const _FALLBACK_MESSAGE = 'Something went wrong. Please reload the page.';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render(): ReactNode {
    let result: ReactNode;

    if (this.state.hasError) {
      result = (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
          <ErrorState message={_FALLBACK_MESSAGE} />
        </div>
      );
    } else {
      result = this.props.children;
    }

    return result;
  }
}
