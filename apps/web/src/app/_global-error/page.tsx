/**
 * File:        apps/web/src/app/_global-error/page.tsx
 * Module:      Web · Error Handling
 * Purpose:     Global error boundary for handling uncaught errors
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */

'use client';

import React, { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-4">We apologize for the inconvenience. Please try refreshing the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}