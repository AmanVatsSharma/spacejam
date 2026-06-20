/**
 * File:        apps/web/src/lib/apollo/token-storage.ts
 * Module:      Web · Apollo · Token Storage
 * Purpose:     Persist access/refresh tokens in localStorage with SSR safety
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

const ACCESS_KEY = 'spacejam.access';
const REFRESH_KEY = 'spacejam.refresh';
const ACCESS_EXP_KEY = 'spacejam.access.exp';
const REFRESH_EXP_KEY = 'spacejam.refresh.exp';
const ACCESS_COOKIE = 'spacejam_access';
const REFRESH_COOKIE = 'spacejam_refresh';

const hasWindow = () => typeof window !== 'undefined' && !!window.localStorage;
const hasDocument = () => typeof document !== 'undefined';

const writeCookie = (name: string, value: string, maxAgeSeconds: number) => {
  if (!hasDocument()) return;
  // Read by both client code and Next.js middleware (which uses the request cookies).
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
};
const clearCookie = (name: string) => {
  if (!hasDocument()) return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
};

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string | number | Date;
  refreshTokenExpiresAt: string | number | Date;
}

export const setTokens = (t: TokenSet): void => {
  if (hasWindow()) {
    window.localStorage.setItem(ACCESS_KEY, t.accessToken);
    window.localStorage.setItem(REFRESH_KEY, t.refreshToken);
    window.localStorage.setItem(ACCESS_EXP_KEY, new Date(t.accessTokenExpiresAt).toISOString());
    window.localStorage.setItem(REFRESH_EXP_KEY, new Date(t.refreshTokenExpiresAt).toISOString());
  }
  const accessMaxAge = Math.max(
    0,
    Math.floor((new Date(t.accessTokenExpiresAt).getTime() - Date.now()) / 1000),
  );
  const refreshMaxAge = Math.max(
    0,
    Math.floor((new Date(t.refreshTokenExpiresAt).getTime() - Date.now()) / 1000),
  );
  writeCookie(ACCESS_COOKIE, t.accessToken, accessMaxAge);
  writeCookie(REFRESH_COOKIE, t.refreshToken, refreshMaxAge);
};

export const clearTokens = (): void => {
  if (hasWindow()) {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(ACCESS_EXP_KEY);
    window.localStorage.removeItem(REFRESH_EXP_KEY);
  }
  clearCookie(ACCESS_COOKIE);
  clearCookie(REFRESH_COOKIE);
};

export const getAccessToken = (): string | null => {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(ACCESS_KEY);
};

export const getRefreshToken = (): string | null => {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(REFRESH_KEY);
};

export const isAccessTokenExpired = (): boolean => {
  if (!hasWindow()) return true;
  const exp = window.localStorage.getItem(ACCESS_EXP_KEY);
  if (!exp) return true;
  return new Date(exp).getTime() <= Date.now();
};
