/**
 * File:        apps/web/src/contexts/apollo-provider-wrapper.tsx
 * Module:      Web · Contexts
 * Purpose:     Wires ApolloProvider + AuthProvider into the React tree
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */
'use client';

import { ApolloProvider } from '@apollo/client';
import { useEffect, useState } from 'react';

import { getApolloClient } from '@/lib/apollo/client';
import { AuthProvider } from './auth-context';

export function ApolloProviderWrapper({ children }: { children: React.ReactNode }) {
  // Defer Apollo + Auth to client-side only to avoid SSR hook errors.
  // On the server we render a bare fragment; the full tree mounts on hydration.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <>
        {typeof window !== 'undefined' && (
          <ApolloProvider client={getApolloClient()}>
            <AuthProvider>{children}</AuthProvider>
          </ApolloProvider>
        )}
      </>
    );
  }

  return (
    <ApolloProvider client={getApolloClient()}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  );
}