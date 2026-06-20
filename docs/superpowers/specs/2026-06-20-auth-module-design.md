# Auth Module — Complete Design Spec

**Date:** 2026-06-20
**Status:** Approved
**Scope:** Backend wiring + Frontend integration + Next.js middleware

---

## 1. Goals

Make SpaceJam authentication work end-to-end:

1. Backend: complete the partially-built auth module (missing `JwtStrategy`, guards, register, password reset, 2FA stub, RBAC decorators) and verify the existing login/refresh/logout flow actually functions.
2. Frontend: replace the inert signin/signup pages with forms that call the backend, mount an `AuthProvider` that exposes `useAuth()`, and protect `/dashboard/*` via Next.js middleware.
3. Transport: GraphQL via Apollo Client (with `graphql-codegen` skipped in favor of hand-written typed operations — see §5).
4. Token strategy: httpOnly cookies for access + refresh tokens, edge-decodable JWT so middleware can verify without a DB call.

## 2. Architecture

### 2.1 Request lifecycle (authenticated)

```
Browser  ──── GET /dashboard/anything ────►  Next.js middleware
                                                │
                                                ▼
                                  read sj_access cookie
                                                │
                                                ▼
                                  verify signature with jose (JWT_SECRET)
                                                │
                                ┌───────────────┴───────────────┐
                                ▼                               ▼
                        valid → pass-through             invalid/expired →
                                                                  │
                                                                  ▼
                                                  redirect /signin?from=<path>
                                                  (no DB call, no backend hit)

Browser  ──── GET /dashboard/anything (with cookie) ────►  Next.js
                                                                │
                                                                ▼
                                              React tree mounts, AuthProvider
                                                                │
                                                                ▼
                                              ApolloProvider → me query
                                                                │
                                                                ▼
                                        GraphQL POST /api/graphql
                                        (credentials: 'include' → cookie sent)
                                                                │
                                                                ▼
                                              NestJS GraphQL resolver
                                                                │
                                                                ▼
                                        @UseGuards(GqlAuthGuard)
                                                                │
                                                                ▼
                                        JwtStrategy.validate() →
                                          - verify signature (passport-jwt)
                                          - check Redis session exists
                                          - return UserEntity (no password)
                                                                │
                                                                ▼
                                        @CurrentUser() → context.req.user
```

### 2.2 Login flow

```
User submits signin form
        │
        ▼
useAuth().login(email, password)
        │
        ▼
Apollo mutation LOGIN
        │
        ▼
AuthResolver.login() [marked @Public()]
        │
        ▼
AuthService.login() →
  - bcrypt.compare(passwordHash)
  - generate access (15m) + refresh (7d) tokens
  - write Redis session: sj:session:<userId> = { jti, ua, ip }
  - res.cookie('sj_access', token, { httpOnly, secure, sameSite: 'lax' })
  - res.cookie('sj_refresh', token, { httpOnly, secure, sameSite: 'lax' })
  - return AuthPayload { accessToken, refreshToken, user, expiresIn }
        │
        ▼
AuthProvider updates context state
        │
        ▼
router.push('/dashboard/inventory')
```

### 2.3 Token refresh flow

```
Any Apollo request returns 401 UNAUTHENTICATED
        │
        ▼
refreshLink intercepts
        │
        ▼
Calls REFRESH_TOKEN mutation with sj_refresh cookie
        │
        ▼
AuthResolver.refreshToken() [marked @Public(), @UseGuards(GqlRefreshAuthGuard)]
        │
        ▼
JwtRefreshStrategy.validate() →
  - verify refresh signature
  - check Redis session match
  - return user
        │
        ▼
AuthService.refreshToken() →
  - rotate: delete old session, write new
  - issue new access + refresh, set new cookies
        │
        ▼
refreshLink retries original request with new cookies
```

## 3. Token Strategy

| Token        | Lifetime | Secret                  | Storage                         | Sent via                              |
|--------------|----------|-------------------------|---------------------------------|---------------------------------------|
| Access       | 15 min   | `JWT_SECRET`            | httpOnly cookie `sj_access`     | Cookie (auto) + Authorization header  |
| Refresh      | 7 days   | `REFRESH_TOKEN_SECRET`  | httpOnly cookie `sj_refresh`    | Cookie only                           |
| Password reset | 1 hour | `JWT_SECRET`            | None (in email URL)             | URL param `?token=...`                |
| 2FA temp     | 5 min    | `JWT_SECRET`            | httpOnly cookie `sj_2fa`         | Cookie                                |
| 2FA backup   | n/a      | bcrypt hash in DB       | DB column `twoFactorBackupCodes` | User enters manually                  |

Cookie attributes (all cookies):

```
{
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  path: '/',
  domain: process.env.COOKIE_DOMAIN || undefined,
  maxAge: <token lifetime in ms>
}
```

## 4. Backend

### 4.1 New files

```
apps/api/src/auth/
├── strategies/
│   ├── jwt.strategy.ts              # passport-jwt for access tokens
│   └── jwt-refresh.strategy.ts      # passport-jwt for refresh tokens
├── guards/
│   ├── gql-auth.guard.ts            # @UseGuards wrapper for GraphQL
│   ├── gql-refresh-auth.guard.ts    # for refresh mutation
│   └── roles.guard.ts               # reads @Roles() metadata
├── decorators/
│   ├── current-user.decorator.ts    # @CurrentUser() param decorator
│   ├── public.decorator.ts          # @Public() metadata marker
│   └── roles.decorator.ts           # @Roles(UserRole.X) metadata
├── dto/
│   └── auth.dto.ts                  # LoginInput, RegisterInput, RefreshInput,
│                                    # ForgotPasswordInput, ResetPasswordInput,
│                                    # ChangePasswordInput, Verify2FAInput,
│                                    # Enable2FAInput (all class-validator)
├── email/
│   └── email.service.ts             # SMTP sender, stubbed in dev (console.log)
├── two-factor/
│   └── two-factor.service.ts        # TOTP using otpauth + 10 backup codes
└── auth.service.spec.ts             # unit tests
```

### 4.2 Modified files

- `auth.module.ts` — register `JwtStrategy`, `JwtRefreshStrategy`, `EmailService`, `TwoFactorService` as providers
- `auth.service.ts` — add `register`, `forgotPassword`, `resetPassword`, `changePassword`, `enable2FA`, `verify2FA`. Use `REFRESH_TOKEN_SECRET`. Use `Response` from context to set cookies.
- `auth.resolver.ts` — add mutations, apply `@Public()` to login/register/forgot/reset/refresh/verify2FA, apply `@UseGuards(GqlAuthGuard)` to logout/changePassword/enable2FA/me, return `AuthPayload` from register too
- `user.resolver.ts` — replace inline `context.req.user?.id` with `@UseGuards(GqlAuthGuard, RolesGuard)` + `@CurrentUser()`. Apply `@Roles(UserRole.ADMIN)` to `deleteUser` and `users` query.
- `app.module.ts` — no change (AuthModule re-exports its providers)
- `main.ts` — add `app.use(cookieParser())`
- `.env.example` — uncomment `REFRESH_TOKEN_SECRET`, add `COOKIE_DOMAIN`, `COOKIE_SECURE`, `TWO_FACTOR_ISSUER`, `SMTP_FROM`
- `package.json` — add `cookie-parser`, `jose` (frontend only), `@types/cookie-parser`, `otplib`, `qrcode`

### 4.3 DTOs (all class-validator)

```typescript
LoginInput            { email: string; password: string; }
RegisterInput         { email: string; password: string; firstName: string; lastName: string; phone?: string; }
RefreshInput          { token?: string; }   // optional, defaults to cookie
ForgotPasswordInput   { email: string; }
ResetPasswordInput    { token: string; newPassword: string; }
ChangePasswordInput   { oldPassword: string; newPassword: string; }
Enable2FAInput        { }                   // server generates secret
Verify2FAInput        { code: string; }
```

Password rule: minimum 8 chars, at least one letter, one number. Enforced via `@Matches` regex.

### 4.4 RBAC

```typescript
@Roles(UserRole.ADMIN)          // only admins
@Roles(UserRole.ADMIN, UserRole.CENTER_MANAGER)  // either
@Public()                       // skip auth entirely
@CurrentUser() user: UserEntity // inject user from context
```

`RolesGuard` reads metadata via `Reflector`, throws `ForbiddenException` if user role not in allowed list.

### 4.5 Error responses

- `UnauthorizedException` → GraphQL error with `extensions.code = 'UNAUTHENTICATED'`
- `ForbiddenException` → `extensions.code = 'FORBIDDEN'`
- `ConflictException` (duplicate email) → `extensions.code = 'EMAIL_TAKEN'`
- `BadRequestException` (validation) → `extensions.code = 'VALIDATION_FAILED'` with field details
- Generic → `extensions.code = 'INTERNAL_SERVER_ERROR'`

### 4.6 Email service

`EmailService.send(to, subject, body)` — uses nodemailer with SMTP env vars. In dev (`NODE_ENV !== 'production'`), logs to console instead of actually sending. Template helpers: `forgotPassword(token)`, `verifyEmail(token)`.

### 4.7 2FA

`TwoFactorService.enable(user)` — generates TOTP secret via `otplib`, returns `{ secret, qrCodeUrl, backupCodes[] }`. User scans QR, calls `verify2FA(code)` to confirm. After confirmation, `user.twoFactorEnabled = true`, codes stored.

`TwoFactorService.verify(user, code)` — checks TOTP (allows ±1 window). If TOTP fails, checks against bcrypt-hashed backup codes (one-time use).

Login with 2FA: first call returns `AuthPayload { requires2FA: true, twoFactorToken: <5min jwt> }`. User submits `verify2FA(twoFactorToken, code)`, server issues real tokens.

## 5. Frontend

### 5.1 New files

```
apps/web/
├── .env.example                            # NEXT_PUBLIC_GRAPHQL_URL, JWT_SECRET
├── src/
│   ├── middleware.ts                       # /dashboard/* protection
│   ├── lib/
│   │   ├── apollo/
│   │   │   ├── client.ts                   # ApolloClient factory
│   │   │   ├── refresh-link.ts             # 401 → refresh → retry
│   │   │   └── error-link.ts               # log + format
│   │   ├── graphql/
│   │   │   ├── operations.ts               # all GQL strings
│   │   │   └── types.ts                    # TS types matching responses
│   │   └── auth/
│   │       └── cookie.ts                   # parseCookie (server), clearAuthCookies (server)
│   ├── context/
│   │   └── AuthProvider.tsx                # context, mounts me query
│   ├── hooks/
│   │   ├── useAuth.ts                      # useContext wrapper
│   │   └── useAuth.test.ts
│   ├── components/
│   │   └── auth/
│   │       ├── SigninForm.tsx              # uses @spacejam/ui
│   │       ├── SignupForm.tsx
│   │       ├── ForgotPasswordForm.tsx
│   │       ├── ResetPasswordForm.tsx
│   │       └── TwoFactorPrompt.tsx         # 6-digit input
│   └── app/
│       └── (auth)/
│           ├── signin/page.tsx             # thin shell, renders SigninForm
│           ├── signup/page.tsx
│           ├── forgot-password/page.tsx
│           └── reset-password/page.tsx
└── src/middleware.test.ts
```

### 5.2 Modified files

- `src/app/layout.tsx` — wrap children in `<ApolloProvider><AuthProvider>...</AuthProvider></ApolloProvider>`
- `src/app/(auth)/signin/page.tsx` — strip out the inline form, render `<SigninForm />`
- `src/app/(auth)/signup/page.tsx` — same
- `src/app/dashboard/layout.tsx` — call `useAuth()`, render loading skeleton until `!loading`
- `src/components/...` logout button (wherever it lives) — replace with `useAuth().logout()`

### 5.3 Middleware (`src/middleware.ts`)

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = 'sj_access';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const url = req.nextUrl;
  const from = encodeURIComponent(url.pathname + url.search);

  if (!token) {
    return NextResponse.redirect(new URL(`/signin?from=${from}`, req.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL(`/signin?from=${from}`, req.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

Server-side only — `JWT_SECRET` is read from `process.env` at the edge. `apps/web/.env.local` will need `JWT_SECRET` (the same value the backend uses).

### 5.4 Apollo Client

```typescript
// apps/web/src/lib/apollo/client.ts
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { refreshLink } from './refresh-link';
import { errorLink } from './error-link';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/api/graphql';

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include',  // critical: send httpOnly cookies
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, refreshLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
```

`refreshLink` (sketch — implementation will use a proper promise queue to handle concurrent requests during a refresh):

```typescript
// Refresh uses its own client instance (no refreshLink) to avoid recursion.
// All other requests go through the main client (which includes refreshLink).
const REFRESH_CLIENT = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URL, credentials: 'include' }),
  cache: new InMemoryCache(),
});

const REFRESH_MUTATION = gql`mutation Refresh { refreshToken { accessToken refreshToken user { id } } }`;

let inflightRefresh: Promise<void> | null = null;

function doRefresh(): Promise<void> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = REFRESH_CLIENT.mutate({ mutation: REFRESH_MUTATION })
    .then(() => { inflightRefresh = null; })
    .catch((err) => { inflightRefresh = null; throw err; });
  return inflightRefresh;
}

export const refreshLink = new ApolloLink((operation, forward) => {
  return new Observable(observer => {
    forward(operation).subscribe({
      next: (response) => {
        if (response.errors?.some(e => e.extensions?.code === 'UNAUTHENTICATED')) {
          doRefresh()
            .then(() => forward(operation).subscribe(observer))
            .catch(() => {
              window.location.href = `/signin?from=${encodeURIComponent(window.location.pathname)}`;
            });
        } else {
          observer.next(response);
        }
      },
      error: observer.error.bind(observer),
      complete: observer.complete.bind(observer),
    });
  });
});
```

Key points:
- `REFRESH_CLIENT` does NOT include `refreshLink` — prevents recursion.
- `inflightRefresh` deduplicates concurrent 401s — only one refresh request flies at a time, all other failed requests await its completion and then retry.

### 5.5 AuthProvider

```typescript
'use client';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  enable2FA: () => Promise<{ qrCodeUrl: string; backupCodes: string[] }>;
  verify2FA: (code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

On mount: skip the loading state if middleware already verified the token; otherwise call `me` query. If `me` fails with UNAUTHENTICATED, set `user = null`.

### 5.6 Form pages

All forms use `@spacejam/ui`:

```typescript
<Card variant="outlined" padding="lg">
  <form onSubmit={handleSubmit(onSubmit)}>
    <FormItem label="Email" error={errors.email?.message}>
      <Input type="email" {...register('email')} />
    </FormItem>
    <FormItem label="Password" error={errors.password?.message}>
      <Input type="password" {...register('password')} />
    </FormItem>
    <Button type="submit" loading={isSubmitting} fullWidth>
      Sign in
    </Button>
  </form>
</Card>
```

Forms use `react-hook-form` for validation (add to package.json). Errors surface via the existing `useToast` hook from `@spacejam/ui`.

### 5.7 Signin success: redirect to `from`

```typescript
const from = searchParams.get('from') || '/dashboard/inventory';
router.push(from);
```

## 6. Configuration

### 6.1 New env vars

**`apps/api/.env.example`** (additions):
```
REFRESH_TOKEN_SECRET=replace-with-a-different-32-byte-secret
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
TWO_FACTOR_ISSUER=SpaceJam
SMTP_FROM=noreply@spacejam.local
```

**`apps/web/.env.example`** (new file):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/api/graphql
# Server-side only — used by middleware to verify access tokens
JWT_SECRET=must-match-apps-api-JWT_SECRET
```

## 7. Testing

### 7.1 Backend

`apps/api/src/auth/auth.service.spec.ts` (Jest, NestJS testing module):
- `login()` with valid creds → returns tokens, sets Redis session
- `login()` with bad password → throws `UnauthorizedException`
- `login()` with inactive user → throws `ForbiddenException`
- `refreshToken()` with valid refresh → rotates tokens
- `refreshToken()` with expired refresh → throws
- `validateUser()` returns user without `passwordHash`
- `register()` with new email → creates user, returns tokens
- `register()` with duplicate email → throws `ConflictException`
- `forgotPassword()` → writes reset token, calls email service
- `resetPassword()` with valid token → updates hash, deletes session
- `changePassword()` with wrong old password → throws

### 7.2 Frontend

`apps/web/src/hooks/useAuth.test.ts` (Vitest + @testing-library/react):
- initial state: `user: null, loading: true`
- after `me` query resolves: `user: <User>, loading: false`
- after `me` query fails: `user: null, loading: false`
- `login()` sets `user` and calls `refetchQueries(['Me'])`
- `logout()` calls mutation and clears state

`apps/web/src/middleware.test.ts` (Vitest, node env):
- no cookie → redirect to `/signin?from=...`
- expired token → redirect
- valid token → `NextResponse.next()`

## 8. Out of scope (deferred)

- Email verification enforcement (the field exists, the mutation is a stub — full verification flow with token TTL is not in this scope)
- OAuth/SSO (Google, GitHub buttons removed from signin page; can re-add later)
- Account lockout after N failed logins (rate limiting per IP+email handles brute force, but no permanent lockout)
- Audit log wiring for auth events (the entity exists; not wired in this scope)
- Production secret management (assumed handled by deployment)

## 9. Rollout

1. Backend changes ship first — they don't break existing flows (refresh-secret change is backward compatible if env var matches).
2. Frontend changes ship second — gated behind the new env vars; old behavior is preserved if env vars are missing.
3. Deployment order: deploy backend, deploy frontend, populate `JWT_SECRET` in web env.
4. First-time admin: a seed script (`apps/api/src/scripts/seed-admin.ts`) creates an initial ADMIN user with email `admin@spacejam.local` and password from env (`SEED_ADMIN_PASSWORD`). Idempotent.

## 10. Risk

| Risk | Mitigation |
|------|------------|
| Frontend `jose` secret mismatch with backend `JWT_SECRET` | Document prominently; same secret value required in both envs |
| Apollo refresh loop (infinite refresh on bad token) | refreshLink guards with a single in-flight refresh promise + 5s timeout |
| Cookie domain mismatch in prod | Default to no domain (host-only) in dev; env-controlled in prod |
| GraphQL introspection leaking schema in prod | Already disabled in `app.module.ts` (`introspection: false` in prod) |
| Existing static signin/signup pages break for unauthenticated users | New pages gracefully degrade — if env vars missing, forms show "Auth not configured" banner instead of crashing |
| Bcrypt rounds (10) on low-RAM EC2 instance | 10 rounds = ~100ms hash, fine; do not increase without load testing |
