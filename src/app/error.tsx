'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-rose-500 text-4xl">error</span>
        </div>
        <h1 className="font-heading text-2xl font-extrabold text-[#0f2e23] mb-3 tracking-tight">Something went wrong</h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          An unexpected error has occurred. Our team has been notified. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="px-8 py-4 bg-[#0f2e23] text-white rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
