'use client';

/**
 * File:        apps/web/src/app/dashboard/error.tsx
 * Module:      Web · Dashboard · Error Boundary
 * Purpose:     Route-level error boundary for /dashboard/* that catches
 *              unexpected errors WITHOUT destroying the shared dashboard
 *              layout (header/sidebar remain mounted). Provides a clean
 *              message and a "Try Again" button that re-runs the failed
 *              route segment via reset().
 *
 * NOTE: styled-jsx is intentionally avoided — it breaks inside Next.js 16
 * error boundaries. Only Tailwind utility classes are used here, which is
 * safe because route error boundaries render inside the layout's provider
 * tree (unlike global-error.tsx).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-09
 */

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Surface the error to the console / error reporting without crashing
  // the boundary itself. React calls this on every reset as well.
  useEffect(() => {
    console.error('[dashboard] route error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 text-center">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6A2F]/10">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF6A2F"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-[#101828]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[#4A5565]">
          An unexpected error occurred while loading this section. Please try
          again.
        </p>

        {error?.digest ? (
          <p className="mt-4 text-xs text-[#6A7282]">
            Error reference:{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[#101828]">
              {error.digest}
            </code>
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF6A2F] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#FF6A3D] focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:ring-offset-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
