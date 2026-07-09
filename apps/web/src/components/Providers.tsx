'use client';

import ClientProviders from './ClientProviders';

/**
 * Root providers wrapper.
 *
 * Always renders <ClientProviders> (Apollo + Auth) around children, including
 * during SSR. This is required because:
 *   - Many pages call `useAuth()` / Apollo hooks during server rendering.
 *   - `getApolloClient()` is SSR-safe (returns a server client on the server).
 *   - `AuthProvider` guards all browser-only side effects inside `useEffect`,
 *     which never run on the server.
 * Previously a `mounted` gate deferred the providers to client-only, which
 * caused "useAuth must be used within AuthProvider" and Apollo's
 * "Could not find a client in the context" (err #78) errors during SSR.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}
