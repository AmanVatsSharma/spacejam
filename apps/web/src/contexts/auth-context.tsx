/**
 * File:        apps/web/src/contexts/auth-context.tsx
 * Module:      Web · Contexts
 * Purpose:     Authentication context (user, tokens, signin/signup/logout)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
'use client';

import { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from 'react';

import {
  getApolloClient,
  setMemoryAccessToken,
} from '@/lib/apollo/client';
import {
  clearTokens,
  getAccessToken,
  setTokens,
} from '@/lib/apollo/token-storage';
import {
  CHANGE_PASSWORD,
  LOGOUT_MUTATION,
  ME_QUERY,
  RECOVERY_CODES_REMAINING,
  REGENERATE_RECOVERY_CODES,
  REQUEST_MAGIC_LINK,
  REQUEST_PASSWORD_RESET,
  RESET_PASSWORD,
  SIGNIN_MUTATION,
  SIGNUP_MUTATION,
  VERIFY_MAGIC_LINK,
  VERIFY_TWO_FACTOR,
} from '@/lib/apollo/operations';

export type UserRole = 'ADMIN' | 'CENTER_MANAGER' | 'MEMBER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  emailVerified: boolean;
  avatar?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface SigninInput {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface SignupInput {
  email: string;
  password: string;
  name?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasToken: boolean;
  signin: (input: SigninInput) => Promise<{ twoFactorRequired: boolean; challengeToken?: string | null }>;
  signup: (input: SignupInput) => Promise<void>;
  verifyTwoFactor: (code: string, challengeToken: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;
  requestMagicLink: (email: string) => Promise<{ ok: boolean; message: string }>;
  verifyMagicLink: (token: string) => Promise<void>;
  recoveryCodesRemaining: () => Promise<number>;
  regenerateRecoveryCodes: () => Promise<string[]>;
  refresh: () => Promise<void>;
  /**
   * Dev-only: install a fake auth session without contacting the backend.
   * Hidden behind NEXT_PUBLIC_ENABLE_DEV_LOGIN so it never ships to production.
   */
  devSignIn: (role?: UserRole) => void;
  isDevLoginAvailable: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Safe SSR default — returned when <AuthProvider> is not yet mounted
// (e.g. during server rendering or before client hydration).
// All consumers already guard on isLoading / user === null for redirects.
const SSR_AUTH_DEFAULT: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasToken: false,
  signin: async () => { throw new Error('AuthProvider not mounted'); },
  signup: async () => { throw new Error('AuthProvider not mounted'); },
  verifyTwoFactor: async () => { throw new Error('AuthProvider not mounted'); },
  logout: async () => { throw new Error('AuthProvider not mounted'); },
  requestPasswordReset: async () => false,
  resetPassword: async () => false,
  changePassword: async () => ({ ok: false, message: 'AuthProvider not mounted' }),
  requestMagicLink: async () => ({ ok: false, message: 'AuthProvider not mounted' }),
  verifyMagicLink: async () => { throw new Error('AuthProvider not mounted'); },
  recoveryCodesRemaining: async () => 0,
  regenerateRecoveryCodes: async () => [],
  refresh: async () => {},
  devSignIn: () => {},
  isDevLoginAvailable: false,
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  // Return safe SSR default instead of throwing — components already
  // handle isLoading / user === null for login redirects.
  return ctx ?? SSR_AUTH_DEFAULT;
};

interface AuthPayloadShape {
  signin?: AuthPayloadResult;
  signup?: AuthPayloadResult;
  verifyTwoFactor?: AuthPayloadResult;
  verifyMagicLink?: AuthPayloadResult;
}

interface AuthPayloadResult {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  twoFactorRequired: boolean;
  challengeToken?: string | null;
  user: AuthUser | null;
}

const applyAuthPayload = (payload: AuthPayloadResult) => {
  if (!payload.accessToken || !payload.refreshToken) return payload;
  setTokens({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    accessTokenExpiresAt: payload.accessTokenExpiresAt,
    refreshTokenExpiresAt: payload.refreshTokenExpiresAt,
  });
  setMemoryAccessToken(payload.accessToken);
  return payload;
};

// ---- dev-mode helpers --------------------------------------------------------

const DEV_USERS: Record<UserRole, AuthUser> = {
  ADMIN: {
    id: 'dev-admin', email: 'admin@dev.local', name: 'Dev Admin',
    role: 'ADMIN', active: true, emailVerified: true,
    createdAt: new Date().toISOString(),
  },
  CENTER_MANAGER: {
    id: 'dev-manager', email: 'manager@dev.local', name: 'Dev Manager',
    role: 'CENTER_MANAGER', active: true, emailVerified: true,
    createdAt: new Date().toISOString(),
  },
  MEMBER: {
    id: 'dev-member', email: 'member@dev.local', name: 'Dev Member',
    role: 'MEMBER', active: true, emailVerified: true,
    createdAt: new Date().toISOString(),
  },
};

const DEV_TOKEN = 'dev-mode-fake-token';

const installDevAuth = (role: UserRole = 'ADMIN') => {
  localStorage.setItem('spacejam_dev_auth', JSON.stringify(DEV_USERS[role]));
  // Use the same keys as token-storage.ts so getAccessToken() finds them.
  const accessExpiry = new Date(Date.now() + 86400000).toISOString();
  const refreshExpiry = new Date(Date.now() + 86400000).toISOString();
  localStorage.setItem('spacejam.access', DEV_TOKEN);
  localStorage.setItem('spacejam.refresh', DEV_TOKEN);
  localStorage.setItem('spacejam.access.exp', accessExpiry);
  localStorage.setItem('spacejam.refresh.exp', refreshExpiry);
  // Also write cookies so the Next.js proxy middleware allows dashboard access.
  const maxAge = 86400;
  document.cookie = `spacejam_access=${DEV_TOKEN}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  document.cookie = `spacejam_refresh=${DEV_TOKEN}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
};


// ---- deferred Apollo hooks ---------------------------------------------------

// Component that only runs the me query after hydration
function MeQueryClient({ client, hasToken, isDevLoginAvailable }: {
  client: ReturnType<typeof getApolloClient> | null;
  hasToken: boolean;
  isDevLoginAvailable: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !client || !hasToken || isDevLoginAvailable) return;

    let cancelled = false;
    client
      .query<{ me: AuthUser | null }>({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
      })
      .then((res) => {
        if (!cancelled) {
          // Trigger parent re-render via stored state
          window.dispatchEvent(new CustomEvent('me-queried', { detail: res.data }));
        }
      })
      .catch(() => {
        // Token might be invalid. Still signal completion so the loading
        // state clears instead of hanging forever.
        if (!cancelled) {
          window.dispatchEvent(new CustomEvent('me-queried', { detail: { me: null } }));
        }
      });

    return () => { cancelled = true; };
  }, [mounted, client, hasToken, isDevLoginAvailable]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Lazy-init Apollo client on browser only
  const apolloClient = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return getApolloClient();
  }, []);

  // Detect dev-login availability (client-side only)
  const isDevLoginAvailable = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const { hostname } = window.location;
    const flagEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname.endsWith('.localhost');
    return isLocalhost || flagEnabled;
  }, []);

  // Handle custom event for me query result
  useEffect(() => {
    const handleMeQueried = (e: CustomEvent) => {
      const data = e.detail as { me: AuthUser | null };
      if (data.me) setUser(data.me);
      // Initial auth check is now complete — clear the loading state.
      setIsLoading(false);
    };
    window.addEventListener('me-queried', handleMeQueried as EventListener);
    return () => window.removeEventListener('me-queried', handleMeQueried as EventListener);
  }, []);

  // Handle global auth errors
  useEffect(() => {
    const handleAuthError = (e: CustomEvent) => {
      const error = e.detail as { message?: string };
      if (!isDevLoginAvailable) {
        setUser(null);
        setHasToken(false);
        clearTokens();
      }
    };
    window.addEventListener('auth-error', handleAuthError as EventListener);
    return () => window.removeEventListener('auth-error', handleAuthError as EventListener);
  }, [isDevLoginAvailable]);

  // Set initial auth state on mount.
  // - If there's no token, we're done immediately (not loading).
  // - If dev-login is available, MeQueryClient intentionally skips the
  //   ME_QUERY, so clear loading here — dev users are restored via the
  //   devSignIn flow / persisted dev auth, not the network query.
  // - Otherwise (real token), stay loading until the ME_QUERY resolves;
  //   the 'me-queried' event listener above clears it on completion.
  // The previous implementation flipped isLoading to false after an
  // arbitrary 100ms timer, racing the query and causing a flash of
  // unauthenticated state.
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    const hasTokenNow = !!getAccessToken();
    setHasToken(hasTokenNow);
    if (!hasTokenNow || isDevLoginAvailable) {
      setIsLoading(false);
    }
  }, [isDevLoginAvailable]);

  // Direct mutations are safe since they're only called by user actions
  const signin = useCallback(async (input: SigninInput) => {
    if (!apolloClient) throw new Error('Apollo not ready');
    const res = await apolloClient.mutate({
      mutation: SIGNIN_MUTATION,
      variables: { input }
    });
    const payload = res.data?.signin;
    if (!payload) throw new Error('Signin failed');
    if (payload.twoFactorRequired) {
      return { twoFactorRequired: true, challengeToken: payload.challengeToken ?? null };
    }
    const result = applyAuthPayload(payload);
    if (result.user) setUser(result.user);
    setHasToken(true);
    return { twoFactorRequired: false };
  }, [apolloClient]);

  const signup = useCallback(async (input: SignupInput) => {
    if (!apolloClient) throw new Error('Apollo not ready');
    const res = await apolloClient.mutate({
      mutation: SIGNUP_MUTATION,
      variables: { input }
    });
    const payload = res.data?.signup;
    if (!payload) throw new Error('Signup failed');
    if (payload.twoFactorRequired) {
      throw new Error('2FA challenge is not expected on signup');
    }
    const result = applyAuthPayload(payload);
    if (result.user) setUser(result.user);
    setHasToken(true);
  }, [apolloClient]);

  const verifyTwoFactor = useCallback(async (code: string, challengeToken: string) => {
    if (!apolloClient) throw new Error('Apollo not ready');
    const res = await apolloClient.mutate({
      mutation: VERIFY_TWO_FACTOR,
      variables: { input: { code, challengeToken } },
    });
    const payload = res.data?.verifyTwoFactor;
    if (!payload) throw new Error('2FA verification failed');
    const result = applyAuthPayload(payload);
    if (result.user) setUser(result.user);
    setHasToken(true);
  }, [apolloClient]);

  const logout = useCallback(async () => {
    try {
      if (apolloClient) await apolloClient.mutate({ mutation: LOGOUT_MUTATION });
    } finally {
      clearTokens();
      setUser(null);
      setHasToken(false);
      if (apolloClient) await apolloClient.clearStore();
    }
  }, [apolloClient]);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!apolloClient) throw new Error('Apollo not ready');
    const res = await apolloClient.mutate({
      mutation: REQUEST_PASSWORD_RESET,
      variables: { input: { email } },
    });
    return !!res.data?.requestPasswordReset;
  }, [apolloClient]);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    if (!apolloClient) throw new Error('Apollo not ready');
    const res = await apolloClient.mutate({
      mutation: RESET_PASSWORD,
      variables: { input: { token, newPassword } },
    });
    return !!res.data?.resetPassword;
  }, [apolloClient]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!apolloClient) throw new Error('Apollo not ready');
    const res = await apolloClient.mutate({
      mutation: CHANGE_PASSWORD,
      variables: { input: { currentPassword, newPassword } },
    });
    const ok = res.data?.changePassword === true;
    return { ok, message: ok ? 'Password changed' : 'Failed to change password' };
  }, [apolloClient]);

  const requestMagicLink = useCallback(async (email: string) => {
    if (!apolloClient) throw new Error('Apollo not ready');
    const res = await apolloClient.mutate({
      mutation: REQUEST_MAGIC_LINK,
      variables: { input: { email } },
    });
    const ok = res.data?.requestMagicLink === true;
    return { ok, message: ok ? 'Magic link sent' : 'Failed to send magic link' };
  }, [apolloClient]);

  const verifyMagicLink = useCallback(async (token: string) => {
    if (!apolloClient) throw new Error('Apollo not ready');
    const res = await apolloClient.mutate({
      mutation: VERIFY_MAGIC_LINK,
      variables: { input: { token } },
    });
    const payload = res.data?.verifyMagicLink;
    if (!payload) throw new Error('Magic link verification failed');
    const result = applyAuthPayload(payload);
    if (result.user) setUser(result.user);
    setHasToken(true);
  }, [apolloClient]);

  const recoveryCodesRemaining = useCallback(async (): Promise<number> => {
    if (!apolloClient) return 0;
    const { data } = await apolloClient.query<{ recoveryCodesRemaining: number }>({
      query: RECOVERY_CODES_REMAINING,
      fetchPolicy: 'network-only',
    });
    return data?.recoveryCodesRemaining ?? 0;
  }, [apolloClient]);

  const regenerateRecoveryCodes = useCallback(async (): Promise<string[]> => {
    if (!apolloClient) throw new Error('Apollo not ready');
    const res = await apolloClient.mutate({ mutation: REGENERATE_RECOVERY_CODES });
    return (res.data?.regenerateRecoveryCodes as string[] | undefined) ?? [];
  }, [apolloClient]);

  const refresh = useCallback(async () => {
    if (!apolloClient) return;
    setHasToken(!!getAccessToken());
    // Bypass the MeQueryClient/event-bus pattern and re-fetch the user
    // directly. (Previously dispatched a 'refresh-user' CustomEvent that
    // nothing listened to, so refresh was a silent no-op.)
    try {
      const res = await apolloClient.query<{ me: AuthUser | null }>({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
      });
      if (res.data?.me) {
        setUser(res.data.me);
      }
    } catch {
      // Token might be invalid — leave current user state untouched.
    }
  }, [apolloClient]);

  const devSignIn = useCallback((role: UserRole = 'ADMIN') => {
    if (!isDevLoginAvailable) return;
    installDevAuth(role);
    setUser(DEV_USERS[role]);
    setHasToken(true);
  }, [isDevLoginAvailable]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user?.active,
    isLoading,
    hasToken,
    signin,
    signup,
    verifyTwoFactor,
    logout,
    requestPasswordReset,
    resetPassword,
    changePassword,
    requestMagicLink,
    verifyMagicLink,
    recoveryCodesRemaining,
    regenerateRecoveryCodes,
    refresh,
    devSignIn,
    isDevLoginAvailable,
  }), [
    user, hasToken, isLoading,
    signin, signup, verifyTwoFactor, logout,
    requestPasswordReset, resetPassword, changePassword,
    requestMagicLink, verifyMagicLink,
    recoveryCodesRemaining, regenerateRecoveryCodes, refresh,
    devSignIn, isDevLoginAvailable,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {apolloClient && (
        <MeQueryClient
          client={apolloClient}
          hasToken={hasToken}
          isDevLoginAvailable={isDevLoginAvailable}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
}
