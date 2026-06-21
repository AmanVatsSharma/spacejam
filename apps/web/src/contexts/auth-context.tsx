/**
 * File:        apps/web/src/contexts/auth-context.tsx
 * Module:      Web · Contexts
 * Purpose:     Authentication context (user, tokens, signin/signup/logout)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';

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
import {
  clearTokens,
  getAccessToken,
  setTokens,
} from '@/lib/apollo/token-storage';
import { getApolloClient, setMemoryAccessToken } from '@/lib/apollo/client';

export type UserRole = 'ADMIN' | 'CENTER_MANAGER' | 'MEMBER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
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

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const apolloClient = useApolloClient();

  useEffect(() => {
    setHasToken(!!getAccessToken());
  }, []);

  // Single useQuery to keep the user in sync with the backend.
  const { data, loading, refetch, error } = useQuery<{ me: AuthUser | null }>(ME_QUERY, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    skip: !hasToken,
  });

  useEffect(() => {
    if (data?.me) setUser(data.me);
  }, [data]);

  // If the backend rejects the token (e.g. 401 after refresh failure), drop
  // the user and clear tokens.
  useEffect(() => {
    if (error) {
      setUser(null);
      setHasToken(false);
      clearTokens();
    }
  }, [error]);

  const [signinMutation] = useMutation<AuthPayloadShape>(SIGNIN_MUTATION);
  const [signupMutation] = useMutation<AuthPayloadShape>(SIGNUP_MUTATION);
  const [verifyTwoFactorMutation] = useMutation<AuthPayloadShape>(VERIFY_TWO_FACTOR);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);
  const [requestResetMutation] = useMutation(REQUEST_PASSWORD_RESET);
  const [resetMutation] = useMutation(RESET_PASSWORD);
  const [changePasswordMutation] = useMutation(CHANGE_PASSWORD);
  const [requestMagicLinkMutation] = useMutation(REQUEST_MAGIC_LINK);
  const [verifyMagicLinkMutation] = useMutation<AuthPayloadShape>(VERIFY_MAGIC_LINK);
  const [regenerateRecoveryCodesMutation] = useMutation(REGENERATE_RECOVERY_CODES);

  const signin = useCallback(
    async (input: SigninInput) => {
      const res = await signinMutation({ variables: { input } });
      const payload = res.data?.signin;
      if (!payload) throw new Error('Signin failed');
      if (payload.twoFactorRequired) {
        return {
          twoFactorRequired: true,
          challengeToken: payload.challengeToken ?? null,
        };
      }
      const result = applyAuthPayload(payload);
      if (result.user) setUser(result.user);
      setHasToken(true);
      return { twoFactorRequired: false };
    },
    [signinMutation],
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      const res = await signupMutation({ variables: { input } });
      const payload = res.data?.signup;
      if (!payload) throw new Error('Signup failed');
      if (payload.twoFactorRequired) {
        // New accounts don't enable 2FA by default, but defend anyway.
        throw new Error('2FA challenge is not expected on signup');
      }
      const result = applyAuthPayload(payload);
      if (result.user) setUser(result.user);
      setHasToken(true);
    },
    [signupMutation],
  );

  const verifyTwoFactor = useCallback(
    async (code: string, challengeToken: string) => {
      const res = await verifyTwoFactorMutation({
        variables: { input: { code, challengeToken } },
      });
      const payload = res.data?.verifyTwoFactor;
      if (!payload) throw new Error('2FA verification failed');
      const result = applyAuthPayload(payload);
      if (result.user) setUser(result.user);
      setHasToken(true);
    },
    [verifyTwoFactorMutation],
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation();
    } finally {
      clearTokens();
      setUser(null);
      setHasToken(false);
      await apolloClient.clearStore();
    }
  }, [apolloClient, logoutMutation]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      const res = await requestResetMutation({ variables: { input: { email } } });
      return !!res.data?.requestPasswordReset;
    },
    [requestResetMutation],
  );

  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      const res = await resetMutation({ variables: { input: { token, newPassword } } });
      return !!res.data?.resetPassword;
    },
    [resetMutation],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const res = await changePasswordMutation({
        variables: { currentPassword, newPassword },
      });
      const result = res.data?.changePassword ?? { ok: false, message: 'Network error' };
      return { ok: !!result.ok, message: result.message ?? '' };
    },
    [changePasswordMutation],
  );

  const requestMagicLink = useCallback(
    async (email: string) => {
      const res = await requestMagicLinkMutation({ variables: { email } });
      const result = res.data?.requestMagicLink ?? { ok: true, message: 'If an account exists, a link has been sent' };
      return { ok: !!result.ok, message: result.message ?? '' };
    },
    [requestMagicLinkMutation],
  );

  const verifyMagicLink = useCallback(
    async (token: string) => {
      const res = await verifyMagicLinkMutation({ variables: { token } });
      const payload = res.data?.verifyMagicLink;
      if (!payload) throw new Error('Magic link verification failed');
      if (payload.twoFactorRequired) {
        throw new Error('2FA required for this signin');
      }
      const result = applyAuthPayload(payload);
      if (result.user) setUser(result.user);
      setHasToken(true);
    },
    [verifyMagicLinkMutation],
  );

  const recoveryCodesRemaining = useCallback(async (): Promise<number> => {
    // Issue a single-field query on demand. Apollo caches it briefly.
    const { data } = await apolloClient.query<{ recoveryCodesRemaining: number }>({
      query: RECOVERY_CODES_REMAINING,
      fetchPolicy: 'network-only',
    });
    return data?.recoveryCodesRemaining ?? 0;
  }, [apolloClient]);

  const regenerateRecoveryCodes = useCallback(async (): Promise<string[]> => {
    const res = await regenerateRecoveryCodesMutation();
    return (res.data?.regenerateRecoveryCodes as string[] | undefined) ?? [];
  }, [regenerateRecoveryCodesMutation]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const isDevLoginAvailable = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const { hostname } = window.location;
    const flagEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';
    // Visible automatically on localhost / 127.0.0.1 / ::1, even without the
    // env flag. Anywhere else, the env flag is required.
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname.endsWith('.localhost');
    return isLocalhost || flagEnabled;
  }, []);

  /**
   * Mints a fake JWT-shaped access + refresh token locally so the middleware
   * (which only inspects the cookie) lets the developer into /dashboard
   * without any DB. The middleware only checks the cookie existence + role
   * claim, and the dashboard pages render mock data, so this is enough for
   * a full UI walkthrough.
   */
  const devSignIn = useCallback(
    (role: UserRole = 'ADMIN') => {
      if (!isDevLoginAvailable) {
        // Silent no-op in production so we never accidentally enable it.
        return;
      }
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiresIn = 60 * 60 * 24; // 24h
      const makeToken = (typ: 'access' | 'refresh') => {
        const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
        const payload = btoa(
          JSON.stringify({
            sub: `dev-${role.toLowerCase()}`,
            email: `${role.toLowerCase()}@spacejam.dev`,
            role,
            sid: `dev-session-${nowSeconds}`,
            typ,
            iat: nowSeconds,
            exp: nowSeconds + expiresIn,
          }),
        )
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
        return `${header}.${payload}.dev-signature`;
      };
      const accessToken = makeToken('access');
      const refreshToken = makeToken('refresh');
      setTokens({
        accessToken,
        refreshToken,
        accessTokenExpiresAt: new Date((nowSeconds + expiresIn) * 1000).toISOString(),
        refreshTokenExpiresAt: new Date((nowSeconds + expiresIn) * 1000).toISOString(),
      });
      setMemoryAccessToken(accessToken);
      const devUser: AuthUser = {
        id: `dev-${role.toLowerCase()}`,
        email: `${role.toLowerCase()}@spacejam.dev`,
        name: `Dev ${role}`,
        role,
        active: true,
        emailVerified: true,
        twoFactorEnabled: false,
        avatar: null,
        createdAt: new Date().toISOString(),
      };
      setUser(devUser);
      setHasToken(true);
    },
    [isDevLoginAvailable],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user && hasToken,
      isLoading: loading && hasToken,
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
    }),
    [
      user,
      hasToken,
      loading,
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
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// re-export the apollo client getter so other modules can use it without
// importing the path again.
export { getApolloClient as getApolloClientInstance };
