'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="h-16 w-16 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-[var(--destructive)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Что-то пошло не так</h2>
          <p className="text-sm text-[var(--muted-foreground)] text-center max-w-md mb-6">
            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
          </p>
          {this.state.error && (
            <details className="mb-4 w-full max-w-md">
              <summary className="text-xs text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)]">
                Подробности ошибки
              </summary>
              <pre className="mt-2 p-3 bg-[var(--muted)] rounded-lg text-xs text-[var(--muted-foreground)] overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
