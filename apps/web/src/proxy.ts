/**
 * File:        apps/web/src/proxy.ts
 * Module:      Web · Proxy (formerly Middleware)
 * Purpose:     Route guard — keep authenticated and unauthenticated users
 *              on the correct side of the gate, and bounce mismatched roles
 *              out of admin-only areas. In Next.js 16, the `middleware`
 *              file convention was renamed to `proxy`; the runtime behavior
 *              is unchanged.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
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
 *
 * NOTE: Dashboard auth checks are intentionally REMOVED from the proxy.
 * Auth tokens live in localStorage (client-side only) and are NOT visible
 * to the Edge proxy. Dashboard access control is handled entirely by the
 * client-side useAuth() context. The proxy only handles redirecting
 * already-authenticated users away from auth pages.
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

  // Only redirect already-authenticated users away from auth pages (signin/signup)
  if (PUBLIC_ROUTES.has(pathname) && accessToken && !isExpired) {
    return { pathname, search, redirectTo: '/dashboard', reason: 'already-signed-in' };
  }

  return null;
};

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // The dashboard auth check is handled entirely client-side via useAuth()
  // and the Apollo token in localStorage. The proxy (Edge) cannot read
  // localStorage, so checking cookies here causes false 307 redirects on
  // client-side RSC navigation. Only redirect for the initial full-page
  // load (non-RSC document requests).
  const isRscRequest =
    req.headers.get('RSC') === '1' ||
    req.headers.get('accept')?.includes('text/x-component') ||
    !!req.headers.get('next-router-state-tree');

  if (isRscRequest) {
    return NextResponse.next();
  }

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