'use client';

import { useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default function ErrorBoundary({ children, fallback }: Props) {
  const [state, setState] = useState<State>({ hasError: false, error: null });

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      setState({ hasError: true, error: new Error(event.message) });
    }
    function handleRejection(event: PromiseRejectionEvent) {
      setState({ hasError: true, error: new Error(String(event.reason)) });
    }
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (state.hasError) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-rose-500 text-3xl">error</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-primary mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-400 mb-6">
            {state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <button
            onClick={() => {
              setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-all"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
