import { ApolloClient, InMemoryCache, HttpLink, from, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../auth/storage';

// NOTE: The NestJS backend sets a global REST prefix (`api`) but does NOT set
// `useGlobalPrefix: true` on the GraphQL module, so GraphQL is served at
// `/graphql` (NOT `/api/graphql`). Verified via the web proxy at
// apps/web/src/app/api/[...graphql]/route.ts which forwards to
// `${API_SERVER_URL}/graphql`. The previous `/api/graphql` paths 404'd every
// mobile GraphQL call.
const SPACEJAM_API_URL = __DEV__
  ? 'http://localhost:3001/graphql'
  : 'https://spacejam.vedpragya.com/graphql';

// Base URL for non-GraphQL REST endpoints (e.g. /print/upload file uploads).
// The REST API DOES use the `api` global prefix.
export const SPACEJAM_REST_BASE = __DEV__
  ? 'http://localhost:3001'
  : 'https://spacejam.vedpragya.com';

const httpLink = new HttpLink({ uri: SPACEJAM_API_URL });

const authLink = setContext(async (_, { headers }) => {
  const token = await getAccessToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (let err of graphQLErrors) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message,
      });
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        clearTokens();
        return new Observable(observer => observer.error(err));
      }
    }
  }
  if (networkError) {
    Toast.show({
      type: 'error',
      text1: 'Network Error',
      text2: 'Please check your internet connection.',
    });
    console.error(`[Network error]: ${networkError}`);
  }
});

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {},
    },
  },
});

// Setup persistence
persistCache({
  cache,
  storage: new AsyncStorageWrapper(AsyncStorage),
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
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
