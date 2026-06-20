/**
 * File:        apps/web/src/lib/apollo/token-storage.test.ts
 * Module:      Web · Apollo · Tests
 * Purpose:     Pure-logic tests for token storage helpers (no React, no DOM).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';

// Stub the storage layer before importing the module.
const memory = new Map<string, string>();
const localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => {
    memory.set(k, v);
  },
  removeItem: (k: string) => {
    memory.delete(k);
  },
  clear: () => memory.clear(),
  key: () => null,
  length: 0,
};

vi.stubGlobal('window', { localStorage });
vi.stubGlobal('localStorage', localStorage);

// Provide a minimal document.cookie implementation. Tests inspect the most
// recently written cookie value via a getter.
let _cookie = '';
vi.stubGlobal('document', {
  get cookie() {
    return _cookie;
  },
  set cookie(v: string) {
    _cookie = v;
  },
});

const { setTokens, clearTokens, getAccessToken, getRefreshToken, isAccessTokenExpired } =
  await import('./token-storage');

describe('token-storage', () => {
  beforeEach(() => {
    memory.clear();
    _cookie = '';
  });

  it('persists access and refresh tokens to localStorage', () => {
    const now = Date.now();
    setTokens({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      accessTokenExpiresAt: new Date(now + 60_000).toISOString(),
      refreshTokenExpiresAt: new Date(now + 120_000).toISOString(),
    });

    expect(getAccessToken()).toBe('access-1');
    expect(getRefreshToken()).toBe('refresh-1');
    expect(_cookie).toMatch(/spacejam_access=access-1/);
    expect(_cookie).toMatch(/spacejam_refresh=refresh-1/);
  });

  it('clears localStorage AND cookies', () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'b',
      accessTokenExpiresAt: new Date(Date.now() + 1000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + 1000).toISOString(),
    });
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(_cookie).toMatch(/spacejam_access=;/);
    expect(_cookie).toMatch(/spacejam_refresh=;/);
  });

  it('reports expired tokens', () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'b',
      accessTokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(isAccessTokenExpired()).toBe(true);
  });

  it('reports valid tokens', () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'b',
      accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + 120_000).toISOString(),
    });
    expect(isAccessTokenExpired()).toBe(false);
  });
});
