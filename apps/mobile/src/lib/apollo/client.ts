/**
 * File:        apps/mobile/src/lib/apollo/client.ts
 * Module:      Mobile · Infrastructure
 * Purpose:     Apollo Client configured for the SpaceJam GraphQL API
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */
import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client';

const SPACEJAM_API_URL = __DEV__
  ? 'http://localhost:4000/api/graphql'
  : 'https://your-production-api.com/api/graphql';

export const apolloClient = new ApolloClient({
  link: ApolloLink.empty(),
  uri: SPACEJAM_API_URL,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Add per-field merge policies here
        },
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
