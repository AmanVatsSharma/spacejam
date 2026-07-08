'use client';

/**
 * File:        apps/web/src/app/global-error.tsx
 * Module:      Web · Error Handling
 * Purpose:     Global error boundary for uncaught errors at the root level.
 *
 * NOTE: Next.js 16 (Turbopack) fails to prerender global-error.tsx when the
 * component depends on any React context — including styled-jsx's <style jsx>,
 * which reads an internal context that is null here because this boundary
 * renders OUTSIDE the root layout's provider tree. To stay build-safe, this
 * component uses ONLY inline styles and no hooks/contexts.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-08
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleReset = () => {
    if (typeof reset === 'function') {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - SpaceJam</title>
      </head>
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem',
          maxWidth: '600px',
          margin: '0 auto',
          background: '#fafafa',
        }}
      >
        <h2 style={{ color: '#101828', marginBottom: '0.5rem' }}>
          Something went wrong!
        </h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          An unexpected error occurred. Please try again.
        </p>
        {error?.digest ? (
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Error reference:{' '}
            <code
              style={{
                background: '#f0f0f0',
                padding: '0.1rem 0.3rem',
                borderRadius: '0.25rem',
                fontSize: '0.85rem',
              }}
            >
              {error.digest}
            </code>
          </p>
        ) : null}
        <button
          onClick={handleReset}
          style={{
            padding: '0.5rem 1rem',
            background: '#FF7847',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
