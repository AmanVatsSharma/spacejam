"use client";
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


let memoryAccessToken: string | null | undefined;
let isRefreshing = false;
let refreshRetryCount = 0;
let refreshWaiters: Array<(t: string | null) => void> = [];

export const setMemoryAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

/**
 * Proactive refresh: schedule a token refresh 5 minutes before the access
 * token expires, so the user never sees a 401 mid-session. Runs once per
 * page load; the scheduler re-arms itself after each refresh.
 */
let proactiveTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleProactiveRefresh(): void {
  if (typeof window === 'undefined') return;
  if (proactiveTimer) clearTimeout(proactiveTimer);
  const expStr = window.localStorage.getItem('spacejam.access.exp');
  if (!expStr) return;
  const msLeft = new Date(expStr).getTime() - Date.now();
  const REFRESH_AHEAD_MS = 5 * 60 * 1000; // 5 minutes before expiry
  const delay = Math.max(0, msLeft - REFRESH_AHEAD_MS);
  if (delay <= 0) return; // already expired — the 401 link will handle it
  proactiveTimer = setTimeout(() => {
    void refreshTokensOnce().then((t) => {
      if (t) scheduleProactiveRefresh(); // re-arm with the new expiry
    });
  }, delay);
}

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
  if (!refreshToken || refreshToken === 'dev-mode-fake-token') {
    // Dev-mode fake token: don't try to refresh it — the 401 link already
    // skips auth-error dispatch for dev sessions.
    isRefreshing = false;
    return null;
  }
  try {
    // The server GqlRefreshAuthGuard reads the refresh token from the
    // Authorization header (Bearer), while the resolver also gets it as a
    // variable. Without the header, EVERY refresh failed with Unauthorized
    // which cleared tokens and logged the user out after 15 minutes.
    const res = await fetch('/api/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${refreshToken}`,
      },
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
    refreshRetryCount = 0;
    refreshWaiters.forEach((resolve) => resolve(payload.accessToken));
    refreshWaiters = [];
    return payload.accessToken;
  } catch (err) {
    // Don't hard-redirect on the first failure — a transient network error
    // shouldn't log the user out. Only clear + redirect after a retry.
    if (refreshRetryCount < 1) {
      refreshRetryCount++;
      isRefreshing = false;
      await new Promise((r) => setTimeout(r, 1500));
      return refreshTokensOnce();
    }
    refreshRetryCount = 0;
    clearTokens();
    refreshWaiters.forEach((resolve) => resolve(null));
    refreshWaiters = [];
    if (typeof window !== 'undefined') {
      // Soft logout: dispatch the event the auth context listens to instead
      // of a hard redirect (preserves the user's page for manual re-login).
      window.dispatchEvent(new CustomEvent('auth-error', { detail: { message: 'Session expired' } }));
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
  // Dev-mode fake token: never attempt a real refresh or logout redirect.
  const currentToken = memoryAccessToken ?? getAccessToken();
  if (currentToken === 'dev-mode-fake-token') return;

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

const API_BASE = process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL ?? '/api/graphql';

const httpLink = new HttpLink({
  uri: API_BASE,
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

