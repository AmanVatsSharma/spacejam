/**
 * File:        apps/mobile/src/lib/apollo/client.ts
 * Module:      Mobile · Infrastructure
 * Purpose:     Apollo Client configured for the SpaceJam GraphQL API
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const SPACEJAM_API_URL = __DEV__
  ? 'http://localhost:4000/graphql'
  : 'https://your-production-api.com/graphql';

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, new HttpLink({ uri: SPACEJAM_API_URL })]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {},
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
