/**
 * File:        apps/web/src/components/ui/query-status.tsx
 * Module:      Web · UI · Query Status
 * Purpose:     Shared loading/error/empty states for Apollo-backed pages
 *
 * Exports:
 *   - QueryLoading   — centered spinner + label
 *   - QueryError     — centered error message + retry button
 *   - QueryEmpty     — centered empty state with optional message
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-15
 */

'use client';

import React from 'react';

interface QueryLoadingProps {
  message?: string;
}

export function QueryLoading({ message = 'Loading…' }: QueryLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
      <svg
        className="h-6 w-6 animate-spin text-[#FF6A2F]"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
        <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-sm">{message}</span>
    </div>
  );
}

interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function QueryError({
  message = 'Something went wrong. Please try again.',
  onRetry,
  retryLabel = 'Retry',
}: QueryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <svg
        className="h-8 w-8 text-red-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
      </svg>
      <span className="text-sm text-red-500">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 px-4 py-2 rounded-lg text-sm font-medium text-[#FF6A2F] border border-[#FF6A2F]/20 hover:bg-orange-50 transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

interface QueryEmptyProps {
  message?: string;
  hint?: string;
}

export function QueryEmpty({ message = 'No records found', hint }: QueryEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
      <svg
        className="h-8 w-8 text-gray-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <span className="text-sm text-gray-500">{message}</span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
}
