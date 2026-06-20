/**
 * File:        apps/web/src/lib/apollo/client.ts
 * Module:      Web · Apollo Client
 * Purpose:     Browser/SSR-safe Apollo client with auth token + refresh handling
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  Observable,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from './token-storage';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

let memoryAccessToken: string | null | undefined;
let isRefreshing = false;
let refreshWaiters: Array<(t: string | null) => void> = [];

export const setMemoryAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

const authLink = setContext((_op, prev) => {
  const token = memoryAccessToken ?? getAccessToken();
  return {
    ...prev,
    headers: {
      ...(prev.headers as Record<string, string> | undefined),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

async function refreshTokensOnce(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise<string | null>((resolve) => refreshWaiters.push(resolve));
  }
  isRefreshing = true;
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    isRefreshing = false;
    return null;
  }
  try {
    const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/graphql`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation Refresh($token: String!) {
          refreshTokens(refreshToken: $token) {
            accessToken
            refreshToken
            accessTokenExpiresAt
            refreshTokenExpiresAt
          }
        }`,
        variables: { token: refreshToken },
      }),
    });
    const json = await res.json();
    const payload = json?.data?.refreshTokens;
    if (!payload?.accessToken) throw new Error('refresh failed');
    setTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      accessTokenExpiresAt: payload.accessTokenExpiresAt,
      refreshTokenExpiresAt: payload.refreshTokenExpiresAt,
    });
    setMemoryAccessToken(payload.accessToken);
    refreshWaiters.forEach((resolve) => resolve(payload.accessToken));
    refreshWaiters = [];
    return payload.accessToken;
  } catch {
    clearTokens();
    refreshWaiters.forEach((resolve) => resolve(null));
    refreshWaiters = [];
    if (typeof window !== 'undefined') {
      window.location.assign('/signin');
    }
    return null;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Refresh-on-401 link. When the backend rejects an access token, we attempt
 * a single `refreshTokens` mutation. If it succeeds we replay the original
 * request with the new access token; otherwise we clear tokens and bounce.
 */
const refreshLink = onError(({ graphQLErrors, operation, forward }) => {
  if (!graphQLErrors) return;
  const unauth = graphQLErrors.some(
    (e) =>
      e.extensions?.code === 'UNAUTHENTICATED' || /unauthor/i.test(e.message),
  );
  if (!unauth) return;
  if (operation.operationName === 'Refresh') return;

  return new Observable((observer) => {
    void (async () => {
      const newToken = await refreshTokensOnce();
      if (!newToken) {
        observer.error(new Error('unauthorized'));
        return;
      }
      const opHeaders = (operation.getContext().headers ?? {}) as Record<string, string>;
      operation.setContext({
        headers: { ...opHeaders, authorization: `Bearer ${newToken}` },
      });
      const sub = forward(operation).subscribe({
        next: (v) => observer.next(v),
        error: (e) => observer.error(e),
        complete: () => observer.complete(),
      });
      return () => sub.unsubscribe();
    })();
  });
});

const httpLink = new HttpLink({
  uri: `${API_BASE_URL.replace(/\/$/, '')}/graphql`,
  credentials: 'include',
});

const link = from([refreshLink, authLink, httpLink]);

let browserClient: ApolloClient<unknown> | undefined;

export const getApolloClient = () => {
  if (typeof window === 'undefined') return createServerClient();
  if (!browserClient) browserClient = createBrowserClient();
  return browserClient;
};

const createBrowserClient = () =>
  new ApolloClient({
    link,
    cache: new InMemoryCache(),
    connectToDevTools: process.env.NODE_ENV === 'development',
  });

const createServerClient = () =>
  new ApolloClient({
    ssrMode: true,
    link: from([authLink, httpLink]),
    cache: new InMemoryCache(),
  });
