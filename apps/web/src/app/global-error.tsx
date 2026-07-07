'use client';

/**
 * Global error boundary for the entire app.
 * Rendered when an unhandled error occurs at the root level.
 *
 * NOTE: Next.js 16 (Turbopack) has a known issue with prerendering
 * global-error.tsx where `useContext` returns null. We work around
 * this by using a minimal component with no React context dependencies.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-07
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // During static prerendering, `reset` may be undefined.
  // Use a form submit as fallback which triggers a full page reload.
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
        <style jsx>{`
          body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 2rem;
            max-width: 600px;
            margin: 0 auto;
            background: #fafafa;
          }
          h2 { color: #101828; margin-bottom: 0.5rem; }
          p { color: #666; margin-bottom: 1rem; }
          code { background: #f0f0f0; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-size: 0.85rem; }
          button {
            padding: 0.5rem 1rem;
            background: #FF7847;
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 0.9rem;
          }
          button:hover { background: #FF6A3D; }
        `}</style>
      </head>
      <body>
        <h2>Something went wrong!</h2>
        <p>An unexpected error occurred. Please try again.</p>
        {error?.digest ? (
          <p>Error reference: <code>{error.digest}</code></p>
        ) : null}
        <button onClick={handleReset}>Try again</button>
      </body>
    </html>
  );
}
