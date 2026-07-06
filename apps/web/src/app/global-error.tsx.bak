'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
          <h2>Something went wrong!</h2>
          <button onClick={() => reset()} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
