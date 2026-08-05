import { ApolloClient, InMemoryCache, HttpLink, from, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../auth/storage';

const SPACEJAM_API_URL = __DEV__
  ? 'http://localhost:3001/api/graphql'
  : 'https://spacejam.vedpragya.com/api/graphql';

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
