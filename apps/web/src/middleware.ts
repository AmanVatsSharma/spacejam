/**
 * File:        apps/web/src/middleware.ts
 * Module:      Web · Middleware
 * Purpose:     Route guard — keep authenticated and unauthenticated users
 *              on the correct side of the gate, and bounce mismatched roles
 *              out of admin-only areas.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { NextResponse, type NextRequest } from 'next/server';

const ACCESS_COOKIE = 'spacejam_access';
const REFRESH_COOKIE = 'spacejam_refresh';

const PUBLIC_ROUTES = new Set<string>([
  '/',
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]);

const ADMIN_ROUTES = ['/dashboard/settings', '/dashboard/crm'];

export interface RouteDecision {
  pathname: string;
  search: string;
  /** Where to redirect to. Null means "continue to the requested path". */
  redirectTo: string | null;
  /** Reason for the redirect — useful in logs and tests. */
  reason:
    | 'allow'
    | 'unauth-dashboard'
    | 'no-refresh'
    | 'role-mismatch'
    | 'already-signed-in';
}

export interface InspectInput {
  pathname: string;
  search?: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  /** Unix seconds (from `exp` claim). */
  accessExp?: number | null;
}

/** Base64url decoder sufficient for inspecting JWT claims. Edge runtime only. */
function decodeJwtClaims(
  token: string,
): { exp?: number; role?: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    // atob is provided by the Edge runtime.
    const json = JSON.parse(atob(padded)) as Record<string, unknown>;
    return {
      exp: typeof json.exp === 'number' ? json.exp : undefined,
      role: typeof json.role === 'string' ? json.role : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Pure route-decision function, exported for unit testing.
 * Returns null when the request should be allowed through.
 */
export const decide = ({
  pathname,
  search = '',
  accessToken = null,
  refreshToken = null,
  accessExp = null,
}: InspectInput): RouteDecision | null => {
  const isExpired =
    !accessToken || (typeof accessExp === 'number' && accessExp * 1000 <= Date.now());

  if (pathname.startsWith('/dashboard')) {
    if (!accessToken && !refreshToken) {
      return {
        pathname,
        search,
        redirectTo: `/signin?next=${encodeURIComponent(pathname + search)}`,
        reason: 'unauth-dashboard',
      };
    }
    if (isExpired && !refreshToken) {
      return {
        pathname,
        search,
        redirectTo: `/signin?next=${encodeURIComponent(pathname + search)}`,
        reason: 'no-refresh',
      };
    }
    if (ADMIN_ROUTES.some((p) => pathname.startsWith(p))) {
      const role = accessToken ? decodeJwtClaims(accessToken)?.role : undefined;
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return { pathname, search, redirectTo: '/dashboard', reason: 'role-mismatch' };
      }
    }
    return null;
  }

  if (PUBLIC_ROUTES.has(pathname) && accessToken && !isExpired) {
    return { pathname, search, redirectTo: '/dashboard', reason: 'already-signed-in' };
  }

  return null;
};

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value ?? null;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value ?? null;
  const accessExp = accessToken ? decodeJwtClaims(accessToken)?.exp ?? null : null;

  const decision = decide({ pathname, search, accessToken, refreshToken, accessExp });
  if (!decision) return NextResponse.next();

  const target = new URL(decision.redirectTo ?? '/', req.url);
  return NextResponse.redirect(target);
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     *   - /api (frontend internal API)
     *   - /_next (build assets)
     *   - /favicon.ico, /icon.png, /robots.txt, /sitemap.xml
     *   - anything containing a dot (static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};