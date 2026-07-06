'use client';

export default function GlobalErrorClient({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
          Something went wrong
        </h1>
        <p style={{ color: '#666', marginBottom: 16 }}>
          {error.message || 'An unexpected error occurred'}
        </p>
      </div>
    </div>
  );
}
