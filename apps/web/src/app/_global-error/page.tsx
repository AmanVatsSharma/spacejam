export const dynamic = 'force-dynamic';

import GlobalErrorClient from './GlobalErrorClient';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  // Ensure error is available for client component
  if (!error) {
    return <div>Loading...</div>;
  }

  return <GlobalErrorClient error={error} />;
}
