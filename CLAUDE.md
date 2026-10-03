# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

_Last audited against the code: 2026-10-02. Anything about the production server (paths, which `deploy.sh` copy is installed) cannot be verified from the repo — check before relying on it._

## Project Overview

SpaceJam is a coworking space management system built as an Nx 22 monorepo.

| App | Project | Tech |
|-----|---------|------|
| Web | `web` | Next.js 16 (React 19), Apollo Client, Tailwind v4, CSS Modules |
| API | `api` | NestJS 11, GraphQL (code-first, Apollo), TypeORM, PostgreSQL, Redis |
| Mobile | `mobile` | Expo + React Native — **SDK version is inconsistent, see [Mobile](#mobile-appsmobile)** |
| E2E | `web-e2e`, `api-e2e` | Playwright (web), Jest (api) |

Libraries under `libs/`: `libs/ui` (`@spacejam/ui`, consumed by web through a `file:../../libs/ui` dependency + `transpilePackages`) and `libs/shared` (`@spacejam/shared`, cross-app TS types — nothing imports it yet). Neither is in the root `workspaces` (`packages/*`, which is an empty dir, and `apps/*`).

Package manager: npm workspaces (CI uses `npm ci`, `deploy.sh` uses `npm install`). A `pnpm-lock.yaml` also exists but pnpm may not be on PATH. Nx is a devDependency, not global — always `npx nx …`.

Nx rules live in `AGENTS.md` (run tasks through `nx`, never guess CLI flags — check `--help`, use the `nx-generate` skill before scaffolding). Mobile has its own `apps/mobile/AGENTS.md`.

### What to ignore

- The repo root is littered with screenshots, tarballs, logs and scratch scripts (`*.png`, `*.tar.gz`, `*.log`, `req*.network-*`, `add_*.sql`, `fix_*.py`, `patch_*.py`, …). They are not source.
- `.claude/worktrees/` holds full copies of the repo from past agent runs (gitignored). Exclude it from greps/globs or every hit appears twice.
- `apps/design/` is a pile of Figma-comparison screenshots (no code). `deploy/` is a legacy PM2/standalone bundle that `deploy.sh` does not use.
- Stale docs: `apps/api/ARCHITECTURE.md` still describes **Prisma** (the API uses TypeORM); `apps/api/src/graphql/schema.graphql` is hand-written and stale; root `README.md` is the stock Nx template.
- `.bak*` files in `src/` (e.g. `onboarding.resolver.ts.bak3`) are leftovers.

## Development Commands

### Running

```sh
npx nx dev web          # Next dev server, port 3000
npx nx serve api        # webpack build, then runs dist/main.js
npx nx start mobile     # Expo dev server, port 8081
```

`.claude/launch.json` launches these three with ports 3000 / **3100** / 8081 — the API is on 3100 because `apps/api/.env` sets `PORT=3100`. The API's real default (`main.ts`) is **4000**, and the web side proxies to 4000 by default (`NEXT_PUBLIC_API_URL` for the dev rewrites in `next.config.js`, `INTERNAL_API_URL` for the `app/api/[...graphql]` route handler). If you run the API on another port, set both to match — the committed `apps/web/.env.local` currently has `INTERNAL_API_URL=http://localhost:4000` and `NEXT_PUBLIC_API_URL=/api`, so it does not point at a 3100 API as-is.

Faster API iteration (skips the `nx serve` watch): `cd apps/api && npx nx build api --configuration=development && node dist/main.js` (reads `apps/api/.env`; prefix `DATABASE_SYNCHRONIZE=true` once to bootstrap a dev schema).

First admin user: see the usage block in the header of `apps/api/src/auth/scripts/seed-admin.ts` (`ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME`, run with `ts-node` from the repo root).

### Building and type-checking

```sh
npx nx build api                       # webpack-cli (NOT tsc) → apps/api/dist/main.js
cd apps/web && npx next build --webpack   # what deploy.sh runs
npx tsc --noEmit -p apps/web/tsconfig.json   # web type-check
```

- `apps/web/next.config.js` sets `typescript.ignoreBuildErrors: true`, so **`next build` does not catch type errors** — run the `tsc` command above (clean as of 2026-10-02). Web has no Nx `typecheck` target; `api`, `mobile` and the e2e projects do (`npx nx typecheck api`).
- Historically `next build` failed prerendering `_global-error` (Next 16). `1bca817` (2026-10-01) made `global-error.tsx` a server component to fix it, and a full local `next build --webpack` passed on 2026-10-03 (static generation included); `deploy.sh` still tolerates a failing web build, so read the build output. Don't build in `apps/web` while `next dev` is running — both use `.next`; build a throwaway copy of `apps/web` (without its `package.json`, so Nx doesn't see a second project) instead.
- There is no ESLint setup: `web` and `api` have no `lint` target.

### Tests

There are **no `test` Nx targets** (so `nx test …` / `nx affected -t test` do nothing); run vitest directly:

```sh
# API — vitest (config: apps/api/vitest.config.ts)
cd apps/api && npx vitest run                                        # all specs
cd apps/api && npx vitest run src/auth/services/otp.service.spec.ts  # one file

# Web — vitest, no config file or Nx target (2 test files)
cd apps/web && npx vitest run src/proxy.test.ts

# E2E
npx nx e2e web-e2e                       # Playwright (project is web-e2e, not web)
npx nx e2e api-e2e                       # Jest
```

- `apps/api/vitest.config.mts` is dead/broken (imports `vite-tsconfig-paths`, which is not installed; wrong `../src` path). `vitest.config.ts` is the live one. `vitest.setup.ts` aliases `globalThis.jest = vi`, so Jest-style `jest.fn()` works in specs.
- 3 tests in `apps/web/src/proxy.test.ts` (unauthenticated / expired-token redirects, non-admin role block) are **stale and fail**: `proxy.ts` deliberately stopped gating `/dashboard`. Fix the tests, not the proxy.
- Mobile has no tests.

### Formatting and Nx utilities

```sh
npx nx format:check          # Prettier dry-run (CI runs it with --base=origin/main)
npx nx format:write
npx nx show projects         # list projects
npx nx graph                 # dependency graph
npx nx sync / npx nx sync:check
```

CI (`.github/workflows/ci.yml`, push to `main` + PRs): `nx format:check`, then `nx run-many -t lint test build typecheck e2e-ci` with Nx Cloud task distribution.

## Architecture

### Request path

```
browser ─► nginx (prod) ─┬─ /api/graphql (exact) ─► API :4000 /graphql
                         ├─ /api/*, /graphql ─────► API :4000
                         └─ everything else ──────► Next.js :3000
dev: Next rewrites() proxy /api/graphql, /api/print/upload, /uploads/* ─► API
```

- GraphQL is served at **`/graphql`** on the API. `setGlobalPrefix('api')` applies only to REST controllers (`/api/health`, `/api/metrics`, `/api/print/upload`, `/api/payments/webhook`); `POST /api/graphql` directly on the API is a 404. `/api/graphql` exists only via the web rewrite / nginx. (The startup log line printing `/api/graphql` is misleading.)
- In prod nginx short-circuits `/api/*` and `/graphql` straight to the API, so Next's own `/api` handling only matters in dev or when hitting `next start` directly. `/uploads/*` has no nginx rule: it goes to Next, whose rewrite forwards it to the API (uploads are written to `<cwd>/uploads` and served at `/uploads/*`).
- `apps/web/src/app/api/[...graphql]/route.ts` is a second, fallback GraphQL proxy (target `INTERNAL_API_URL`); its header comments mention port 3001 and `/api/graphql` and are stale.

### Frontend (`apps/web`)

**App router** (`src/app/`): `(auth)` (login/register), `dashboard/` (home, crm, inventory, revenue, report, settings, `operations/{meeting-room,events,request,recurring-bookings}`, calendar, calendar-sync, audit, equipment, notifications, scheduled-reports), `set-up-new-center/` (onboarding wizard), `api/`, `global-error.tsx`, `error.tsx`, `not-found.tsx`, `layout.tsx`, `page.tsx`.

**Data flow**:
1. **GraphQL-first**: pages use `useQuery`/`useMutation` from domain hooks in `src/hooks/` (`use-operations.ts`, `use-inventory.ts`, `use-crm.ts`, …). Operations are hand-written in `src/lib/apollo/operations.ts` (+ `enterprise-operations.ts`). Web codegen is **not in use** — there is no generated file and `codegen.ts` points at a wrong relative path to the stale `schema.graphql`.
2. **Auth**: JWT access + refresh tokens live in `localStorage` (`spacejam.access` / `spacejam.refresh`) and are mirrored to non-HttpOnly cookies `spacejam_access` / `spacejam_refresh` (`lib/apollo/token-storage.ts`) so the Edge proxy can see them. `contexts/auth-context.tsx` manages user state.
3. **Apollo client** (`lib/apollo/client.ts`): attaches the access token; on 401 runs `refreshTokensOnce()` then retries. The SSR client skips the refresh link.
4. **Route guard**: `src/proxy.ts` (Next 16's renamed middleware) only bounces *already-authenticated* users away from public routes (`/`, `/signin`, `/signup`, …) to `/dashboard`, and skips RSC requests. Dashboard auth is entirely client-side via the auth context.
5. **Client-side RBAC**: the role-gate block in `app/dashboard/ClientLayout.tsx` redirects non-staff roles away from `settings/*`, `crm`, `revenue`, `inventory`, `report`, `audit`, `equipment`, `scheduled-reports`, `calendar-sync` and `notifications`, and trims the Settings tabs for `CENTER_MANAGER`. This is UX routing only — real authorization is the backend's `@Roles` + `@CenterScoped` (see `docs/superpowers/specs/2026-08-10-settings-auth-foundation-design.md`). The Integrations settings page additionally self-gates with an in-component role check.

**`apps/web/next.config.js`** (a `.js` file): `output: 'standalone'` (but `deploy.sh` runs `next start`, not the standalone server), timestamped `generateBuildId`, `ignoreBuildErrors: true`, and the three rewrites above (prod target `127.0.0.1:4000`).

**Frontend pitfalls (found 2026-10-03)**:
- `ClientLayout.tsx` must call **every hook before its early `return null`**. An effect sat after it, so any hard reload of a dashboard URL (auth: loading → loaded) crashed the whole dashboard with React error #310 ("Something went wrong"); client-side navigation after login hid it. Fixed — don't reintroduce hooks below the `isLoading`/`!user` returns.
- `isDevLoginAvailable` (auth-context) is true on `localhost` / `127.0.0.1` **regardless of** `NEXT_PUBLIC_ENABLE_DEV_LOGIN`. There a hard reload briefly sees `isLoading=false, user=null`, so the layout bounces through `/signin` and loses deep links, and the dev "Quick login" panel shows. To see production behavior, browse via the machine's LAN IP (e.g. `http://192.168.x.x:3000`). Production must have `NEXT_PUBLIC_ENABLE_DEV_LOGIN=false` (the server's `.env.local` once had `true`, shipped from the tracked dev file).
- `apps/web-e2e` is a **real tracked Nx project** (Playwright). Never reuse that name for a scratch copy of the web app — use a unique name (e.g. `apps/web-buildcheck`) with no `package.json`, and never run `next build` in `apps/web` while `next dev` is up.
- Browser-checking recipe: build the web copy, run the API bundle on **:4000** (the prod rewrite target) against a scratch DB, sign in, and drive the UI with Playwright; a real Razorpay Checkout can't load from a stub, so inject a fake `window.Razorpay` that records its options, register the payment in the stub, then call the recorded `handler` with a correctly signed result.

### Backend (`apps/api`)

- **Layout** (`src/`): one folder per domain (`auth`, `user`, `center`, `booking`, `meeting-room`, `event`, `crm`, `revenue`, `enterprise`, `wallet`, `notification`, `offer`, `referral`, `request`, `statement`, `support`, `print`, `analytics`, `calendar`, `subscription`, `integrations`) plus infra (`observability`, `health`, `cache`, `config`, `typeorm`, `common`, `types`, `assets`, `app`). **GraphQL resolvers are centralized** in `src/graphql/resolvers/*.resolver.ts` (~35 files) next to `dataloaders/`, `guards/`, `inputs/`, `types/`, `enums/`, `scalars/`; domain folders mostly hold services/modules. `integrations/` keeps its own resolvers. Role names are in `auth/roles.enum.ts`.
- **GraphQL schema**: code-first (`autoSchemaFile: true` in `graphql/graphql.config.ts`). **Introspection and the playground are disabled when `NODE_ENV=production`** — introspect a dev/local API, not prod. Complexity/depth limits via `GRAPHQL_MAX_COMPLEXITY` (default 1000) / `GRAPHQL_MAX_DEPTH`.
- **Entities & migrations**: entities in `typeorm/entities/`. **Every entity MUST be registered in BOTH `ALL_ENTITIES` (`typeorm/typeorm.module.ts`) and the `entities` array in `typeorm/data-source.ts`.** Prod runs `synchronize: false`, so new entities/columns need an explicit migration — see [Migrations](#migrations).
- **Auth**: Passport + JWT. **A global `APP_GUARD` (`GqlAuthGuard`) is registered in `app.module.ts`** — every resolver requires a valid JWT unless marked `@Public()`. `@CurrentUser()` injects `JwtPayload` (`sub`, `email`, `role`, `centerId`, `sid`). Roles via `@Roles(...)` + `RolesGuard`. Token lifetimes are **hard-coded** (access `15m` in `auth.module.ts`, refresh `7d`) — `JWT_ACCESS_EXPIRY` / `JWT_REFRESH_EXPIRY` / `JWT_EXPIRES_IN` are not read anywhere.
  - **Phone OTP login**: `requestOtp` / `verifyOtp` provision `EMPLOYEE` / `COMPANY_ADMIN` / `MEMBER` users on first login. `OTP_DEV_BYPASS=true` makes the server accept the fixed code `000000`.
  - **Center scoping**: `centerScope(caller)` (`auth/helpers/center-scope.helper.ts`) returns a CENTER_MANAGER's `centerId`; resolvers use `effectiveCenterId = scope ?? clientCenterId` so managers can't read cross-center data.
- **Subscriptions & billing**: `Plan` (a center's billable seat offering) → `Subscription` (customer commitment) → `BillingService.processSubscription` fans out into per-seat monthly Bookings (`Booking.planId` + `Booking.subscriptionId`) + an Invoice and advances `nextBillingDate`; idempotent per cycle. `BillingScheduler` (`subscription/billing-scheduler.ts`) sweeps `processDueSubscriptions` every 6 h with a plain `setInterval` (first run 60 s after boot) and has no distributed lock — single API instance only. The admin "Run all due cycles" button also works.
- **Integrations** (`integrations/`; config lives in the `app_settings` table, edited by a SUPER_ADMIN on the Integrations settings page — not env vars): `ConfigurableSmsProvider` (MSG91/Twilio, console fallback when unconfigured), `whatsapp.service.ts` (Twilio/MSG91; throws when unconfigured instead of silently succeeding), `RazorpayService`. `payment.resolver.ts` exposes `paymentConfig` / `createPaymentOrder` / `verifyPayment` (the invoice "mark paid" flow; marks the invoice PAID when an `invoiceId` is passed); `POST /api/payments/webhook` verifies `x-razorpay-signature` over the raw body (`rawBody: true` in `main.ts`) and settles through the same ledger as the browser path. SUPER_ADMIN-only settings mutations: `saveRazorpayConfig` (validates the key live), `testRazorpayConnection`, `saveBankAccountConfig`, `saveChequeConfig`.
- **Onboarding & payments** (`crm/onboarding.service.ts` is the authority; `onboarding.resolver.ts` is thin). The wizard makes ONE idempotent `submitOnboarding` call (client-generated `idempotencyKey`) instead of a browser-side chain of mutations, and **payment gates conversion**: *Razorpay* → application saved + server-created order recorded in the `payment_orders` ledger with a server-computed amount, client provisioned only after the payment is verified (browser `confirmOnboardingPayment` or the signed webhook — `PaymentOrdersService.settle` is idempotent and runs a per-purpose finalizer); *bank transfer* → UTR required and single-use, client provisioned immediately with a PAID invoice; *cheque* → the lead is saved **COLD** and the full application is parked in `onboardings.applicationData` — **no client, login, seats or invoice until staff `confirmChequeCleared`** (`markChequeBounced` keeps it cold; `assertLeadConvertible` makes `convertLead`, `convertLeadWithOnboarding` and `updateLead(status: Converted)` refuse while a cheque is clearing); *zero deposit* → provisioned immediately. Provisioning is a single DB transaction under a row lock (`provisionInTx`). GraphQL returns enum **names** (`PAID`, `SENT`) while the DB stores display values (`'Paid'`, `'Sent'`). Web side: `hooks/use-onboarding-payments.ts`, `components/ui/dashboard/onboarding-payment-ui.tsx`, `lib/razorpay-checkout.ts`, and the Pending payments page `/dashboard/crm/onboarding/pending`. API specs for this use `src/testing/fake-datasource.ts` (an in-memory DataSource with rollback and unique-constraint semantics).
- **Caching**: Redis (`REDIS_URL`) with in-memory fallback; DataLoader batching against N+1.
- **Observability**: Pino JSON logs, OpenTelemetry tracing, Prometheus metrics at `/api/metrics`.
- **Build**: webpack-cli via an Nx `run-commands` target (`apps/api/webpack.config.js`), not `tsc`. `optimization.usedExports: false` is load-bearing — without it webpack tree-shakes classes referenced only inside `@Query(() => X)` decorators and the app dies with "metatype is not a constructor". The `@enums` alias (→ `src/common/enums.ts`) is declared separately in `webpack.config.js`, `vitest.config.ts` and `tsconfig.base.json`; keep them in sync.
- **Startup guard** (`auth/helpers/secret-guard.ts`, called first in `main.ts`): with `NODE_ENV=production` the API refuses to start if `JWT_SECRET` is missing / shorter than 32 chars / a placeholder, `REFRESH_TOKEN_SECRET` (when set) is weak, or `OTP_DEV_BYPASS=true`. Keep it: the auth code still falls back to the hard-coded `'dev-jwt-secret'` when the variable is unset.
- **Env loading**: `ConfigModule` reads `.env` relative to the process cwd (`envFilePath: '.env'`). pm2 starts the API with cwd `/home/ubuntu/spacejam`, so on the server the file that matters is the **repo-root `.env`**, not `apps/api/.env`. `NODE_ENV=production` also turns GraphQL introspection/playground off, masks unexpected errors (HTTP-status exceptions such as 400/401/403/404/409 keep their message), enables helmet and restricts CORS to `CORS_ORIGIN`.
- `user.type.ts` ↔ `user.entity.ts` form a circular import; `AuthPayload.user` resolves lazily via `getUserType()` — do NOT re-add a top-level `import { User }`.

### Mobile (`apps/mobile`)

- **Expo SDK is inconsistent — resolve before upgrading anything.** `package.json` (root and `apps/mobile`) pins `expo ~54.0.0` / `react-native 0.81.5`, and the hoisted `node_modules/expo` is 54.0.37. But `apps/mobile/node_modules/expo` is **57.0.7** with `react-native` 0.86.0 (also recorded in `package-lock.json`), and `apps/mobile/AGENTS.md` says "this project uses Expo SDK 57" and forbids SDK 54 docs. Check what is actually installed (`node -p "require('./apps/mobile/node_modules/expo/package.json').version"`) and read the matching versioned docs: https://docs.expo.dev/versions/v57.0.0/ (nested install + AGENTS.md) or v54.0.0 (committed manifests).
- Structure under `src/`: `screens/` (one file per screen, ~40), `navigation/AppNavigator.tsx`, `components/`, `lib/` (auth context, apollo client), `theme/`.
- **Navigation / role-based tabs**: `AppNavigator` wraps a `Tab` navigator in a `Stack`. Role buckets `STAFF_ROLES` (ADMIN, SUPER_ADMIN, CENTER_OWNER, CENTER_MANAGER, FINANCE, SUPPORT, STAFF) and `COMPANY_ROLES` (EMPLOYEE, COMPANY_ADMIN); default role `MEMBER`. Everyone gets Home / Events / MyBookings / Profile; only `COMPANY_ROLES` also get a Plans tab (the staff bucket currently has no effect).
- **Login**: phone-number OTP (`REQUEST_OTP_MUTATION` / `VERIFY_OTP_MUTATION`). Release builds have no client-side bypass — only a `__DEV__`-gated shortcut that calls the real API with the server's dev code.
- **Apollo/codegen**: operations in `src/lib/apollo/operations.ts`; endpoint from `EXPO_PUBLIC_GRAPHQL_HTTP_URL`, REST base from `EXPO_PUBLIC_REST_BASE`. `codegen.ts` targets `http://localhost:4000/api/graphql`, which is the wrong path (the API serves `/graphql`) and needs a non-production API with introspection on.

**Mobile ↔ Web event mapping** (when adding event features on both surfaces):

| Mobile screen | Web counterpart |
|---|---|
| `EventsScreen` | `/dashboard/operations/events` |
| `EventDetailsScreen` | `/dashboard/operations/events/[id]` |
| `MyEventDetailsScreen` | `/dashboard/operations/events/my/[id]` |
| `EventSuccessScreen` | post-booking confirmation |

## Key Conventions

- **Path alias**: `@/*` → `apps/web/src/*`.
- **Styling**: Tailwind for layout/spacing; CSS Modules for component-specific styles, animations and complex selectors. Responsive breakpoint: `compact:` (max-width 1023.98px). Wrap tables in `overflow-x-auto` for horizontal scroll at compact widths.
- **Design tokens** (use consistently, don't hardcode alternatives):
  - Primary orange `#FF6A2F` / `#FE7A47` (mobile variant), background `#FBF6F4`, card `#FFFFFF`, border `#E5E7EB`
  - Text: `#1F1F1F` / `#1A1D1F` (dark), `#4A5565` (gray), `#6A7282` / `#6F767E` (muted)
  - Cards: `border-radius: 14px` / `16px`, `padding: 16px 24px`. Buttons: `border-radius: 10px` / `16px`, `padding: 10px 20px`.
- **Toasts**: `toast` from `sonner` (mounted in the dashboard layout).
- **Figma**: the meeting-room/events screen maps to Figma node `0:10554`; use `get_design_context` before UI changes there.
- **Mobile floating nav**: `FloatingNavBar` is rendered inside `TabNavigator` (in `AppNavigator.tsx`), not in individual tab screens; tab screens use `activeTab` via `useNavigation()` state.
- **Mobile animations**: `useFadeIn`, `useSlideIn`, `usePressFeedback`, `usePulse` from `apps/mobile/src/theme/animations.ts`; tokens (`palette`, `space`, `radius`, `elevation`, `duration`) from `theme/tokens.ts`.
- **Apollo operations** are centralized in `apps/web/src/lib/apollo/operations.ts` and `apps/mobile/src/lib/apollo/operations.ts` (hand-maintained; keep them in step with resolver changes).
- **Prettier**: `singleQuote: true` (`.prettierrc`).

## Known Limitations and Stubs (verified 2026-10-02)

- **Two parallel booking systems**: seat bookings → `bookings` table; meeting-room/event bookings → `events` table. Reporting (`dashboardMetrics` / `revenueReport` / `occupancyReport`) queries `bookings` only, so meeting-room revenue is invisible to reports.
- `/dashboard/page.tsx` redirects to `/dashboard/home`. Settings pages persist via `Center.settings` jsonb (`useSettingsGroup`); toggles are real but enforcement in other modules is partial.
- **Razorpay setup (Settings → Integrations, SUPER_ADMIN)**: enter key id / secret / webhook secret (saving verifies new keys with Razorpay first; "Test connection" checks without saving), and register `https://admin.spacejam.in/api/payments/webhook` in the Razorpay dashboard for `payment.captured`, `order.paid` and `payment.failed` (the page shows the URL with Copy and whether the webhook secret is saved). The same page holds the receiving bank account and the cheque payee shown to staff in the onboarding payment step. Payment is not verified by the browser alone — see *Onboarding & payments*.
- **Mobile**: seat-booking time slots are hardcoded `TIME_SLOTS` constants (`BookingDetailsScreen`, `FilterModal`, `MeetingRoomsScreen`), not real availability.
- **Stubs**: `processPayment` / `rechargeWallet` are balance bumps (the booking resolver only has a "would integrate Razorpay/Stripe" comment — Razorpay is wired for onboarding and invoices only); calendar-sync `fetchExternal` throws "not yet implemented" (`sync()` swallows it and returns `false`) and `upsertInternal` is a no-op; scheduled-reports has no scheduler (no `@Cron` / `@nestjs/schedule` anywhere); referral payouts have no transition logic; employee email invites are never sent; the `regenerateRecoveryCodes` **resolver** returns hard-coded codes even though `AuthService.regenerateRecoveryCodes` is a real implementation.

## Environment Variables

| Scope | File | Variables |
|-------|------|-----------|
| API | `apps/api/.env` | `DATABASE_URL` **or** `DATABASE_HOST/PORT/USER/PASSWORD/NAME` (+ `DATABASE_SSL`, `DATABASE_POOL_SIZE`), `DATABASE_SYNCHRONIZE`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `REDIS_URL`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`, `OTP_DEV_BYPASS`, `WEB_APP_URL`, `LOG_LEVEL`, `GRAPHQL_MAX_COMPLEXITY` / `GRAPHQL_MAX_DEPTH` / `GRAPHQL_DEBUG` / `GRAPHQL_MASK_ERRORS`, `OTEL_*`, `SMTP_*` / `EMAIL_FROM`, `PASSWORD_*` / `LOCKOUT_*` / `BCRYPT_ROUNDS` / `TWO_FACTOR_ISSUER` |
| Web | `apps/web/.env` / `.env.local` | `NEXT_PUBLIC_GRAPHQL_HTTP_URL`, `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`, `NEXT_PUBLIC_ENABLE_DEV_LOGIN` |
| Mobile | `apps/mobile/.env` | `EXPO_PUBLIC_GRAPHQL_HTTP_URL`, `EXPO_PUBLIC_REST_BASE` (+ Expo/EAS vars) |

The list above is what the code actually reads; `apps/api/.env.example` (and the tracked `.env` files below) are partly stale — `JWT_ACCESS_EXPIRY`, `JWT_EXPIRES_IN`, `REDIS_HOST/PORT`, `DATABASE_MIGRATION_AUTO_RUN`, `FRONTEND_URL`, … are not read by the API.

- **Tracked `.env` files**: `.env` (repo root), `apps/api/.env` and `apps/web/.env.local` are committed to git — they predate the `.gitignore` entry, which does not apply to already-tracked files. They hold local-dev values only; never put real or production secrets in them (`git archive HEAD` ships them; `deploy.sh` then overwrites the two `apps/*/.env` files, but the root `.env` is shipped as-is).

- `OTP_DEV_BYPASS=true` — dev only; the server accepts the fixed code `000000`. **Must be unset/`false` in production** or OTP login is open (`deploy.sh`'s `.env` template doesn't set it).
- `DATABASE_SYNCHRONIZE=true` — opt-in schema sync for a throwaway dev DB. Prod leaves it off; on real data it lets TypeORM alter/drop columns to match entities.
- `WEB_APP_URL` — base URL for emailed verify/reset/magic-link URLs; **defaults to `http://localhost:3000`**. `deploy.sh` sets `FRONTEND_URL`, which the API never reads, so prod email links will point at localhost unless `WEB_APP_URL` is set.
- `NEXT_PUBLIC_GRAPHQL_WS_URL` appears in env files but nothing in `apps/web/src` reads it.
- SMS, WhatsApp and Razorpay credentials are **not** env vars — they live in `app_settings` (SUPER_ADMIN → Settings → Integrations); OTP delivery and payments are no-ops until configured.

## Migrations

New entity ⇒ entity file in `typeorm/entities/`, register it in `ALL_ENTITIES` (`typeorm/typeorm.module.ts`) **and** `data-source.ts`, and add a migration in `typeorm/migrations/` (naming `YYYYMMDDHHMMSS-Description.ts`; newest: `20261003000000-BaselineIndexes`). Prod is `synchronize: false`. Older notes say prod PostgreSQL is **< 11**, but `SERVER-HANDOFF.md` (2026-10-02) reports **18.6** — keep migrations conservative anyway:

- no `CREATE TYPE IF NOT EXISTS` — use `DO $$ BEGIN CREATE TYPE …; EXCEPTION WHEN duplicate_object THEN null; END $$;` (and prefer `varchar` status columns validated in the app over new enum types — `ALTER TYPE … ADD VALUE` is awkward in a transaction)
- use `IF NOT EXISTS` on tables/columns/indexes so every migration is safe to re-run.

**Fresh database** (a new dev DB, or the production rebuild): boot the API once with `DATABASE_SYNCHRONIZE=true` on an **empty** database — the schema comes from the entities (this works since `Invoice.status`'s default was fixed to `InvoiceStatus.DRAFT`; it previously failed on any DB) — then apply `20261002100000-OnboardingPaymentLifecycle` and `20261003000000-BaselineIndexes` (idempotent; they add the indexes the entity decorators don't declare, notably `UQ_ONBOARDINGS_IDEMPOTENCY_KEY`). `scripts/baseline-schema.sql` is the schema-only dump of exactly that result (47 tables); restore it into an empty DB as the owner role. **Never run synchronize on a database that holds data** — it drops and re-adds columns whose type differs. Production's DB had no `migrations` table and had drifted months behind the entities (found 2026-10-03: ~17 tables and many columns missing, four tables owned by `postgres` so the app role got "permission denied"); the full-deploy script rebuilds it from the baseline (`db-build` + `switch`) rather than patching it.

To apply a migration without loading the entity graph: run its real `up()` against a stub `QueryRunner` that just records each `query(sql)` string, wrap the result in `BEGIN; … COMMIT;`, review it, and apply it with `psql -X -v ON_ERROR_STOP=1 -f file.sql`.

Nothing applies migrations automatically: there is no `migrationsRun`, and `deploy.sh` does not run them. After deploying a change that needs schema updates, run from the repo root on the server:

```sh
NODE_ENV=production npx tsx scripts/run-migrations.ts
```

`NODE_ENV=production` is mandatory — `typeorm/data-source.ts` sets `synchronize: NODE_ENV !== 'production'`, so without it the script would try to sync the schema. This loads the whole entity graph; it has not been re-verified against the current schema, so if it fails to load, apply the migration's `up()` SQL by hand. `scripts/apply-migrations-raw.ts` is a no-entity-graph fallback but replays **only the three M1–M3 migrations** (OTP, plans/subscriptions, booking `subscriptionId`), not later ones.

## Production

| Field | Value |
|-------|-------|
| Host | `145.223.22.72` (`srv2009485`, Hostinger VPS), Ubuntu 26.04.1 LTS |
| URL | `https://admin.spacejam.in` (Let's Encrypt) |
| SSH | `ssh -i "C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem" root@145.223.22.72` (user `root`; key fingerprint `SHA256:JA4HxvzAvWmbfhPDFxGFAJIk9gIcEy9OU41/PjNw57c`) |
| Node | v20.20.2 via NVM (`~/.nvm/versions/node/v20.20.2/`), npm 10.8.2 |
| Repo | `/home/ubuntu/spacejam`. Do not use `/home/ubuntu/deploy/` (stale web artifacts); `/root/spacejam/` does not exist. |

PM2 processes (run as root):

| Process | Command / path | Port |
|---------|----------------|------|
| `spacejam-web` | `npx next start` in `/home/ubuntu/spacejam/apps/web` (`HOSTNAME=0.0.0.0`) | 3000 |
| `spacejam-api` | `/home/ubuntu/spacejam/apps/api/dist/main.js` | 4000 |

Nginx config is the tracked `nginx.conf` at the repo root (80 → 301 to HTTPS; routing as in [Request path](#request-path)).

### Shared server — read before touching it

The VPS is **shared with another live project, `arb-monitor`** (pm2 apps `arb-monitor-api` / `arb-monitor-ui`, nginx site `arbitary-vedpragya`, DB `arb_monitor`) on the **same pm2 daemon, nginx, PostgreSQL 18.6 and Redis**. The rules are in `C:\Users\ASUS TUF A15\Desktop\DevOPS\Workspace\arbitary\SERVER-HANDOFF.md` (verified 2026-10-02). For SpaceJam that means:

- **Do NOT run `deploy.sh` as-is.** It starts with `pm2 delete all` (deletes the neighbour's apps), overwrites both `.env` files with placeholder secrets and ends with `pm2 save` (rewrites the resurrect dump for everyone). Use name-scoped pm2 only (`pm2 restart spacejam-api`, `pm2 stop spacejam-web`); never `all`, `pm2 save` / `flush`, `pkill node`, or `systemctl restart nginx|postgresql|redis-server`. Reload (never restart) nginx, and only after `nginx -t`. Use `scripts/shared-server-deploy.sh` instead (see *Deploy*).
- **`git archive HEAD` ships dev `.env` files** (`apps/api/.env` has `NODE_ENV=development`, `PORT=3100`). Extract with `--exclude='.env' --exclude='.env.*' --exclude='*/.env' --exclude='*/.env.*'` and keep a byte-for-byte copy to restore, or the API moves off port 4000 and nginx returns 502.
- Touch only SpaceJam's own resources: `/home/ubuntu/spacejam`, DB `spacejam`, `spacejam-*` pm2 apps, the `spacejam` nginx site. Build with `nice -n 19` (2 vCPU / 7.7 GB shared). Before and after any pm2/nginx change confirm the neighbour is unchanged: `curl -sk -o /dev/null -w '%{http_code}' --resolve arbitary.vedpragya.com:443:127.0.0.1 https://arbitary.vedpragya.com/` → `200` (and `admin.spacejam.in` → `307`).
- **SSH**: access is per-project keys that the server owner appends to `/root/.ssh/authorized_keys`. On 2026-10-03 the `Ap-south-2.pem` key above was **rejected** (`Permission denied (publickey,password)`, host key verified). The working key is `~/.ssh/spacejam_prod_ed25519` (comment `spacejam-prod-deploy-claude-20261003`, authorized by the owner; remove with `sed -i '/spacejam-prod-deploy-claude-20261003/d' /root/.ssh/authorized_keys` when no longer needed). Do not try other projects' keys, and avoid repeated failed logins (a security scanner runs on the box).
- `:3000` and `:4000` listen on `0.0.0.0` with `ufw` inactive, so both answer straight from the internet, bypassing nginx/TLS (pre-existing).

### PM2 / SSH quirks

1. **Prefix remote commands with `bash -lc`** — `pm2` and `node` are only on `$PATH` in a login shell: `ssh -i "…" root@145.223.22.72 'bash -lc "pm2 status"'`.
2. **PM2 v7 PID file** — the generated `pm2-root.service` uses `Type=forking` but PM2 v7 doesn't write the PID file. A drop-in at `/etc/systemd/system/pm2-root.service.d/override.conf` fixes it (`Type=oneshot`, `PIDFile=` cleared); it survives `pm2 startup`, verify with `systemctl cat pm2-root`.
3. **`next` is hoisted** to `/home/ubuntu/spacejam/node_modules/next/dist/bin/next` (not `apps/web/node_modules/…`); PM2 launches web with `--cwd /home/ubuntu/spacejam/apps/web`.

### Deploy

**Use `scripts/shared-server-deploy.sh`** (the shared-server-safe replacement for `deploy.sh`; locally rehearsed, first real run pending as of 2026-10-03). It only touches `/home/ubuntu/spacejam`, the `spacejam` database, `spacejam-*` pm2 apps (always by name) and our own nginx site file, and takes backups first. Stages, in order: `prepare` (backups of code/builds/env/nginx file + a verified `pg_dump`; extract with the `.env` excludes; harden env — `NODE_ENV=production`, `CORS_ORIGIN`/`WEB_APP_URL`, fresh random `JWT_SECRET`/`REFRESH_TOKEN_SECRET`, `NEXT_PUBLIC_ENABLE_DEV_LOGIN=false`; build the API) → `db-build` (create `spacejam_new` aside, restore the baseline schema as the app role, copy `users centers floors locations seats`, verify counts/FK integrity/ownership) → `web` (stop `spacejam-web`, build; the old `.next` is restored if the build fails) → `switch` (stop the API, swap the databases by `RENAME`, start API then web) → `nginx` (`client_max_body_size 20m` in our site file; `nginx -t`; reload) → `verify` → `finish` (drop `spacejam_old`). `update` is the later code-only deploy; `rollback` swaps the databases back and restores the code/env backup.

```sh
git archive --format=tar.gz HEAD -o spacejam-deploy.tar.gz     # commit first — only committed files ship
KEY=~/.ssh/spacejam_prod_ed25519
scp -i $KEY spacejam-deploy.tar.gz root@145.223.22.72:/root/spacejam-deploy.tar.gz
scp -i $KEY scripts/baseline-schema.sql root@145.223.22.72:/root/final-schema.sql      # first full deploy only
scp -i $KEY scripts/shared-server-deploy.sh root@145.223.22.72:/root/spacejam-deploy2.sh
# first full deploy (stops at the first failing stage):
ssh -i $KEY -o ServerAliveInterval=30 root@145.223.22.72 'S="bash -l /root/spacejam-deploy2.sh"; $S prepare && $S db-build && $S web && $S switch && $S nginx && $S verify'
# later code-only deploys:   ... '$S update && $S verify'
```

**Claude Code's auto-mode classifier refuses to launch this script on the production server** (denied twice on 2026-10-03, no reason given, and it says not to retry). Run the `ssh` line yourself with the `!` prefix, or change the permission mode first.

> **Legacy `deploy.sh` recipe below — unsafe on the shared server** (`pm2 delete all`, `.env` overwrite, `pm2 save`). Kept for reference only.

```sh
# 0. Commit first — `git archive HEAD` ships only committed files.
git archive --format=tar.gz HEAD -o update.tar.gz

# 1. Upload to the path deploy.sh extracts from.
scp -i "C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem" update.tar.gz root@145.223.22.72:/home/ubuntu/update.tar.gz

# 2. Run the deploy (this is what `npm run deploy:prod` does).
ssh -i "…Ap-south-2.pem" root@145.223.22.72 'bash -lc "/home/ubuntu/spacejam/deploy.sh"'

# 3. Apply any schema changes — see Migrations. deploy.sh does not.
```

**Verify first:** the repo's `deploy.sh` extracts `/home/ubuntu/update.tar.gz`; an earlier version of this doc said to upload to `/root/`. If the server's copy of `deploy.sh` differs from the repo's, check it before deploying — see the first gotcha below.

What `deploy.sh` does, in order: `pm2 delete all` → stop the Nx daemon → extract the archive over `/home/ubuntu/spacejam` (no wipe, `node_modules` preserved) → **overwrite `apps/web/.env` and `apps/api/.env`** → delete `apps/web/.next`, `apps/api/dist`, `.nx/cache` → `npm install` → `NX_DAEMON=false npx nx build api` → `npx next build --webpack || true` + a stub `prerender-manifest.json` → `pm2 start` both apps + `pm2 save` → curl checks of `:3000` and `:4000/api/health`.

Gotchas:
- `pm2 delete all` runs **before** extraction and the script has `set -e`, so a missing/misplaced archive aborts the deploy with **prod down**. It also kills every PM2 process on the box, not just SpaceJam's.
- The web build failure is swallowed (`|| true`) and a stub manifest lets `next start` boot, so a broken web build still "deploys" — read the build output and load the site.
- Both `.env` files are regenerated each run, so server-side `.env` edits don't survive. The template hard-codes **placeholder secrets** (`JWT_SECRET` / `REFRESH_TOKEN_SECRET` ending in `change-me`, DB password `spacejam`); move real secrets to a server-only file before treating prod as hardened.
- Line endings: `.gitattributes` is saved as UTF-16, which git ignores (`git check-attr eol -- deploy.sh` → `unspecified`), so the intended `*.sh text eol=lf` rule is not in effect. Shell scripts can pick up CRLF on Windows checkouts and fail on the server (`bash\r`). Check `grep -c $'\r' deploy.sh` is 0 before deploying (it is, as of 2026-10-02).
- `.github/workflows/deploy.yml` (push to `main`) SSHes in and runs `/home/ubuntu/spacejam/scripts/deploy.sh` — that file is **not in the repo** (the script is the root `deploy.sh`) and the workflow never uploads code. Treat it as non-functional until fixed.

## File Header Format

All TypeScript/TSX files should include this header:

```typescript
/**
 * File:        path/to/file.tsx
 * Module:      Web · Dashboard · PageName
 * Purpose:     Brief description
 *
 * Author:      AmanVatsSharma
 * Last-updated: YYYY-MM-DD
 */
```

## Commit Conventions

- No emoji in commit messages
- Use imperative mood: "Add feature" not "Added feature"
- Reference issue numbers if applicable

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` for the full workflow reference.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

- Use `bd` for ALL task tracking -- do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Use `bd remember` for persistent knowledge -- do NOT use MEMORY.md files
- Issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export
- Do not commit or push without clear authority from the user's current request (see `AGENTS.md` → Session Completion)
