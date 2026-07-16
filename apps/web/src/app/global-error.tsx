'use client';

/**
 * File:        apps/web/src/app/global-error.tsx
 * Module:      Web · Error Handling
 * Purpose:     Global error boundary for uncaught errors at the root level.
 *
 * NOTE: In Next.js 16, global-error.tsx must be a Client Component. It does
 * NOT need <html>/<body> wrappers — those are implicit. We use inline styles
 * only (no styled-jsx) to avoid context reads during static prerender.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-15
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
    <html>
      <body>
        <div
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '2rem',
            maxWidth: '600px',
            margin: '0 auto',
            background: '#fafafa',
            minHeight: '100vh',
          }}
        >
      <h2 style={{ color: '#101828', marginBottom: '0.5rem' }}>
        Something went wrong!
      </h2>
      <p style={{ color: '#6A7282', marginBottom: '1rem' }}>
        An unexpected error occurred. Please try again.
      </p>
      {error?.digest ? (
        <p style={{ color: '#6A7282', marginBottom: '1rem' }}>
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
          padding: '10px 20px',
          background: '#FF6A2F',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        Try again
      </button>
    </div>
      </body>
    </html>
  );
}
