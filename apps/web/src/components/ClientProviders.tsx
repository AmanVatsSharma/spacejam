'use client';

import { ApolloProvider } from '@apollo/client';
import { getApolloClient } from '@/lib/apollo/client';
import { AuthProvider } from '@/contexts/auth-context';
import { ActiveCenterProvider } from '@/contexts/active-center-context';
import { Toaster } from 'sonner';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const client = getApolloClient();

  return (
    <AuthProvider>
      <ApolloProvider client={client}>
        <ActiveCenterProvider>{children}</ActiveCenterProvider>
        <Toaster richColors />
      </ApolloProvider>
    </AuthProvider>
  );
}
