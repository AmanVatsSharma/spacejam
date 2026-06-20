/**
 * File:        apps/web/src/middleware.test.ts
 * Module:      Web · Middleware · Tests
 * Purpose:     Unit tests for the pure `decide` function (no Next runtime).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { describe, expect, it } from 'vitest';

import { decide } from './middleware';

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.`;
}

describe('middleware.decide', () => {
  describe('dashboard routes', () => {
    it('redirects unauthenticated users to /signin with `next` preserved', () => {
      const d = decide({ pathname: '/dashboard/inventory', search: '' });
      expect(d?.reason).toBe('unauth-dashboard');
      expect(d?.redirectTo).toContain('/signin');
      expect(decodeURIComponent(d!.redirectTo!)).toContain('next=/dashboard/inventory');
    });

    it('redirects when only an expired access token is present', () => {
      const exp = Math.floor(Date.now() / 1000) - 60;
      const token = makeJwt({ sub: 'u', exp, role: 'MEMBER' });
      const d = decide({
        pathname: '/dashboard',
        accessToken: token,
        accessExp: exp,
      });
      expect(d?.reason).toBe('no-refresh');
    });

    it('allows a valid access token through', () => {
      const exp = Math.floor(Date.now() / 1000) + 60;
      const token = makeJwt({ sub: 'u', exp, role: 'MEMBER' });
      expect(decide({ pathname: '/dashboard', accessToken: token, accessExp: exp })).toBeNull();
    });

    it('blocks non-admin roles from admin-only routes', () => {
      const exp = Math.floor(Date.now() / 1000) + 60;
      const token = makeJwt({ sub: 'u', exp, role: 'MEMBER' });
      const d = decide({
        pathname: '/dashboard/settings',
        accessToken: token,
        accessExp: exp,
      });
      expect(d?.reason).toBe('role-mismatch');
      expect(d?.redirectTo).toBe('/dashboard');
    });

    it('allows admins into admin-only routes', () => {
      const exp = Math.floor(Date.now() / 1000) + 60;
      const token = makeJwt({ sub: 'u', exp, role: 'ADMIN' });
      expect(
        decide({
          pathname: '/dashboard/settings',
          accessToken: token,
          accessExp: exp,
        }),
      ).toBeNull();
    });

    it('allows SUPER_ADMIN role into admin-only routes', () => {
      const exp = Math.floor(Date.now() / 1000) + 60;
      const token = makeJwt({ sub: 'u', exp, role: 'SUPER_ADMIN' });
      expect(
        decide({
          pathname: '/dashboard/crm',
          accessToken: token,
          accessExp: exp,
        }),
      ).toBeNull();
    });

    it('keeps an expired-but-refreshable user on the page', () => {
      const exp = Math.floor(Date.now() / 1000) - 60;
      const token = makeJwt({ sub: 'u', exp, role: 'MEMBER' });
      expect(
        decide({
          pathname: '/dashboard/inventory',
          accessToken: token,
          refreshToken: 'r',
          accessExp: exp,
        }),
      ).toBeNull();
    });
  });

  describe('public routes', () => {
    it('sends authenticated users away from /signin', () => {
      const exp = Math.floor(Date.now() / 1000) + 60;
      const token = makeJwt({ sub: 'u', exp, role: 'MEMBER' });
      const d = decide({
        pathname: '/signin',
        accessToken: token,
        accessExp: exp,
      });
      expect(d?.reason).toBe('already-signed-in');
      expect(d?.redirectTo).toBe('/dashboard');
    });

    it('lets anonymous users see /signin', () => {
      expect(decide({ pathname: '/signin' })).toBeNull();
    });

    it('lets anonymous users see /forgot-password', () => {
      expect(decide({ pathname: '/forgot-password' })).toBeNull();
    });

    it('lets anonymous users see /reset-password with token', () => {
      const d = decide({ pathname: '/reset-password', search: '?token=abc' });
      expect(d).toBeNull();
    });
  });
});
