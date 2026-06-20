/**
 * File:        apps/web/src/contexts/apollo-provider-wrapper.tsx
 * Module:      Web · Contexts
 * Purpose:     Wires ApolloProvider + AuthProvider into the React tree
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
'use client';

import { ApolloProvider } from '@apollo/client';
import { useMemo } from 'react';

import { getApolloClient } from '@/lib/apollo/client';
import { AuthProvider } from './auth-context';

export function ApolloProviderWrapper({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => getApolloClient(), []);
  return (
    <ApolloProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  );
}