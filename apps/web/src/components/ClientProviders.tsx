'use client';

import { ApolloProvider } from '@apollo/client';
import { getApolloClient } from '@/lib/apollo/client';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from 'sonner';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const client = getApolloClient();

  return (
    <AuthProvider>
      <ApolloProvider client={client}>
        {children}
        <Toaster richColors />
      </ApolloProvider>
    </AuthProvider>
  );
}
