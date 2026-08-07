import { ApolloClient, InMemoryCache, HttpLink, from, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../auth/storage';
import { REFRESH_TOKENS_MUTATION } from './operations';

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

// ─── Silent token refresh ─────────────────────────────────────────────────────
// On UNAUTHENTICATED, attempt a single-flight refresh using the stored refresh
// token. If refresh succeeds, save the new token pair and retry the original
// operation. Concurrent failed requests share one in-flight refresh. If refresh
// fails, clear tokens so the auth context bounces the user to login.
let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

const resolvePending = (token: string | null) => {
  pendingRequests.forEach(cb => cb(token));
  pendingRequests = [];
};

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    const unauthenticated = graphQLErrors.some(
      e => e.extensions?.code === 'UNAUTHENTICATED',
    );

    if (unauthenticated) {
      // Single-flight: if a refresh is already in flight, queue this operation.
      if (isRefreshing) {
        return new Observable(observer => {
          pendingRequests.push(token => {
            if (!token) {
              observer.error(new Error('Session expired'));
              return;
            }
            operation.setContext(({ headers = {} }) => ({
              headers: { ...headers, authorization: `Bearer ${token}` },
            }));
            forward(operation).subscribe(observer);
          });
        });
      }

      return new Observable(observer => {
        (async () => {
          isRefreshing = true;
          try {
            const refreshToken = await getRefreshToken();
            if (!refreshToken) {
              await clearTokens();
              resolvePending(null);
              observer.error(new Error('No refresh token'));
              return;
            }
            const res = await fetch(SPACEJAM_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: REFRESH_TOKENS_MUTATION.loc!.source.body,
                variables: { refreshToken },
              }),
            });
            const json = await res.json();
            const accessToken = json?.data?.refreshTokens?.accessToken;
            const newRefresh = json?.data?.refreshTokens?.refreshToken;
            if (!accessToken || !newRefresh) {
              await clearTokens();
              resolvePending(null);
              observer.error(new Error('Refresh failed'));
              return;
            }
            await saveTokens(accessToken, newRefresh);
            isRefreshing = false;
            resolvePending(accessToken);
            operation.setContext(({ headers = {} }) => ({
              headers: { ...headers, authorization: `Bearer ${accessToken}` },
            }));
            forward(operation).subscribe(observer);
          } catch (err) {
            isRefreshing = false;
            await clearTokens();
            resolvePending(null);
            observer.error(err);
          }
        })();
      });
    }

    // Non-auth GraphQL errors: surface via toast.
    for (const err of graphQLErrors) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
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
