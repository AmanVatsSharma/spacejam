/**
 * File:        apps/web/src/app/global-error.tsx
 * Module:      Web · Root · Global Error Boundary
 * Purpose:     Next.js App Router global error boundary. Replaces the root
 *              layout entirely — must include <html> and <body> tags.
 *              This file is NOT a route; Next.js renders it automatically
 *              when an uncaught error bubbles past all segment error.tsx files.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-09-30
 */
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui',
          }}
        >
          <h2>Something went wrong!</h2>
          {error?.digest && (
            <p style={{ color: '#666', fontSize: '0.875rem' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#FF6A2F',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
