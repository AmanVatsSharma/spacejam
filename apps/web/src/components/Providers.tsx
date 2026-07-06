/**
 * File:        apps/web/src/components/Providers.tsx
 * Module:      Web · Components · Providers
 * Purpose:     Client-only wrapper that defers Apollo + Auth providers
 *              until the browser is available. Prevents SSR hook errors
 *              ("Cannot read properties of null") when the server
 *              renders the root layout.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
'use client';

import { useEffect, useState } from 'react';
import { ApolloProvider } from '@apollo/client';

import { getApolloClient } from '@/lib/apollo/client';
import { AuthProvider } from '@/contexts/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  // ApolloProvider is always present — getApolloClient() returns a
  // server-side client during SSR and a browser client after hydration.
  const client = getApolloClient();

  return (
    <AuthProvider>
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </AuthProvider>
  );
}
