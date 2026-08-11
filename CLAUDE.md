# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpaceJam is a coworking space management system built as an Nx 22 monorepo.

| App | Project | Tech |
|-----|---------|------|
| Web | `web` | Next.js 16 (React 19), Apollo GraphQL, Tailwind v4, CSS Modules |
| API | `api` | NestJS 11, GraphQL (code-first), TypeORM, PostgreSQL, Redis |
| Mobile | `mobile` | Expo SDK 57 (~54), React Native |
| E2E | `web-e2e` | Playwright against the web app |

Shared libraries live under `libs/`:
- `libs/shared` — cross-app TS types
- `libs/ui` — cross-app UI primitives

Package manager: npm workspaces (a `pnpm-lock.yaml` exists but `pnpm` may not be on PATH — use `npx nx`). Nx commands use `npx nx` (Nx is a devDependency, not globally installed).

See `AGENTS.md` for Nx workspace rules (scaffolding, generators, Beads integration) — load it for any task that touches Nx config, generators, or `nx-workspace` / `nx-generate` skills.

## Development Commands

### Running Apps

```sh
npx nx dev web          # Next.js dev server (port 3000)
npx nx serve api        # NestJS dev server (port from apps/api/.env, currently 3100 dev / 4000 prod)
npx nx start mobile     # Expo dev server
```

The API can also be run directly after a build (faster iteration, avoids the `nx serve` webpack watch): `cd apps/api && npx nx build api --configuration=development && node dist/main.js`. It reads `apps/api/.env`. For a dev schema bootstrap, prefix with `DATABASE_SYNCHRONIZE=true` once (see Migration section).

### Building

```sh
npx nx build web        # Next.js production build (webpack, standalone output)
npx nx build api        # NestJS production build (webpack-cli, not tsc)
```

Note: `npx nx build web` fails on the `_global-error` page prerendering — a persistent Next.js 16 issue. **Ignore it**; `next start` and the dev server still work.

### Tests

```sh
# Web unit tests (Vitest)
npx nx test web
npx nx test web -- --run path/to/file.test.ts    # single file, CI mode

# API tests — run directly via vitest (no nx target exists):
cd apps/api && npx vitest run src/path/to.spec.ts
# The full auth + subscription + customer-employee suite:
cd apps/api && npx vitest run src/auth/services/ src/subscription/ src/graphql/resolvers/customer-employee.resolver.spec.ts

# Playwright E2E (web + api-e2e)
npx nx e2e web
npx nx e2e api-e2e
npx nx e2e web -- --grep="test name"             # single test by name
```

### Formatting

```sh
npx nx format:check      # Prettier dry-run across workspace
npx nx format:write      # Prettier fix across workspace
```

### Nx Utilities

```sh
npx nx show projects             # list all projects
npx nx graph                     # visual project dependency graph
npx nx sync                      # sync TypeScript project references
npx nx sync:check                # verify references (for CI)
npx nx affected:test --base=main # run tests affected by changes
```

## Architecture

### Frontend (`apps/web`)

**App router structure** (`apps/web/src/app/`):
- `(auth)` — login/register flows
- `dashboard/` — main authenticated app (home, settings, meeting-room, events, etc.)
- `set-up-new-center/` — onboarding wizard
- `api/` — Next.js route handlers (REST global prefix)
- `_global-error`, `error.tsx`, `not-found.tsx`, `layout.tsx`, `page.tsx` — root/error pages

**Data flow**:
1. **GraphQL-first**: Pages consume data via `useQuery`/`useMutation` from domain hook files under `apps/web/src/hooks/` (e.g., `use-operations.ts`, `use-inventory.ts`, `use-crm.ts`). All operations are defined in `apps/web/src/lib/apollo/operations.ts`.
2. **Auth**: JWT access + refresh tokens stored in cookies. `contexts/auth-context.tsx` manages user state. Apollo client attaches access tokens and refreshes silently on 401.
3. **Route guard**: `proxy.ts` (Next.js 16) redirects authenticated users away from auth pages only. Dashboard auth is handled entirely client-side via the auth context — the Edge proxy cannot read localStorage. **Client-side RBAC**: `ClientLayout.tsx` (lines 148-173) redirects non-staff roles away from `/dashboard/settings/*`, `crm`, `revenue`, `inventory`, `report`, `audit`, `equipment`, `scheduled-reports`, `calendar-sync`, and `notifications`. This is UX routing only — the backend enforces real authorization via `@Roles` + `@CenterScoped` (see settings-auth-foundation spec). The Integrations settings page additionally self-gates with an in-component role check.
4. **Apollo client**: `apps/web/src/lib/apollo/client.ts` — attaches access tokens, handles 401 → refresh → retry via `refreshTokensOnce()`. Uses memory token cache + cookie persistence. Server-side (SSR) client skips the refresh link.

**Next.js config** (`apps/web/next.config.ts`):
- `output: 'standalone'` — required for production deploy workflow
- Rewrite: `/api/graphql` → `http://localhost:4000/graphql` (prod) or `NEXT_PUBLIC_API_URL` (dev)
- The `/api/graphql` path is handled by Next.js rewrites, NOT the NestJS API directly

### Backend (`apps/api`)

**Module layout** (`apps/api/src/`): one folder per domain — `auth`, `user`, `center`, `booking`, `meeting-room`, `event`, `crm`, `revenue`, `enterprise`, `wallet`, `notification`, `offer`, `referral`, `request`, `statement`, `support`, `print`, `analytics`, `observability`, `health`, `cache`, `config`, `graphql`, `typeorm`, `common`, `types`, `assets`, `app`, plus the newer `subscription` (Plans/Subscriptions/billing) and `integrations` (SMS + Razorpay config).

- **GraphQL schema**: generated code-first (`autoSchemaFile: true` in `apps/api/src/graphql/graphql.config.ts`). The hand-written `apps/api/src/graphql/schema.graphql` is **stale** — do NOT treat it as authoritative; introspect the live endpoint instead.
- **Entities & migrations**: TypeORM entities in `apps/api/src/typeorm/entities/`. Migrations in `apps/api/src/typeorm/migrations/`. **Every entity MUST be registered in BOTH `ALL_ENTITIES` (`typeorm/typeorm.module.ts`) and the `data-source.ts` entities array**, or TypeORM metadata/synchronize breaks. Run via the migration scripts in `scripts/` (see Migrations below).
  - **Prod PostgreSQL is < v11** (no `CREATE TYPE IF NOT EXISTS`) — migrations must use `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;` blocks
  - Prod runs with `synchronize: false`, so any new entity requires an explicit `CREATE TABLE` migration
- **Auth**: Passport + JWT strategy. Access tokens (15 min) + refresh tokens (7 days). **A global `APP_GUARD` (`GqlAuthGuard`) is registered in `app.module.ts`** — every resolver requires a valid JWT unless marked `@Public()`. `@CurrentUser()` injects the `JwtPayload` (`sub`, `email`, `role`, `centerId`, `sid`). Role-based authz via `@Roles(...)` + `RolesGuard` (reads `req.user.role`).
  - **Phone OTP login** (M1): `requestOtp` / `verifyOtp` mutations provision `EMPLOYEE` / `COMPANY_ADMIN` / `MEMBER` users on first login. `OTP_DEV_BYPASS=true` returns a fixed dev code `000000` server-side; the mobile client has NO client-side bypass in release builds (only a `__DEV__`-gated dev shortcut).
  - **Center scoping**: `centerScope(caller)` (`auth/helpers/center-scope.helper.ts`) returns a CENTER_MANAGER's `centerId`; resolvers apply it as `effectiveCenterId = scope ?? clientCenterId` so managers can't read cross-center data.
- **Subscriptions & billing** (M2/M3): `Plan` (center's billable seat offering) → `Subscription` (customer commitment) → `BillingService.processSubscription` fans out into per-seat monthly Bookings (`Booking.planId` + `Booking.subscriptionId`) + an Invoice + advances `nextBillingDate`. Idempotent per cycle. `processDueSubscriptions` sweeps due subs — **but there is no cron scheduler yet**; it only runs on the admin "Run all due cycles" button.
- **Integrations** (SMS + Razorpay): `app_settings` table holds platform config. `ConfigurableSmsProvider` routes OTP delivery to MSG91/Twilio based on config (console fallback when unconfigured). `RazorpayService` exposes `createOrder` + `verifyPayment`. Configured by a super-admin via the Integrations settings page (`@Roles(SUPER_ADMIN)`).
- **Caching**: Redis-backed with in-memory fallback. DataLoader batching for N+1 prevention.
- **Observability**: Pino logging (JSON), OpenTelemetry tracing, Prometheus metrics at `/api/metrics`.
- **Build**: uses webpack-cli (configured in `apps/api/package.json` nx targets), NOT `tsc`. NOTE: `user.type.ts` ↔ `user.entity.ts` form a circular import; the `User` reference in `AuthPayload.user` is resolved lazily via `getUserType()` (do NOT re-add a top-level `import { User }`).

### Mobile (`apps/mobile`)

Expo SDK 57 (~54). Structure under `apps/mobile/src/`:
- `screens/` — one file per screen (~31 screens: Login, Home, MyBookings, Events, Wallet, Profile, Plans, MeetingRooms, etc.)
- `navigation/AppNavigator.tsx` — single entry; `Stack` wraps a `Tab` whose set is **role-based** (EMPLOYEE/COMPANY_ADMIN get a Plans tab; staff/members get Home/Events/MyBookings/Profile) plus ~26 stack screens
- `components/`, `lib/` (auth context, apollo client), `theme/` (tokens, animations)
- Codegen via `codegen.ts` against the backend GraphQL schema

**Login (M1)**: phone-number OTP — `REQUEST_OTP_MUTATION` / `VERIFY_OTP_MUTATION` against the backend. Release builds have NO client-side bypass; a `__DEV__`-only dev shortcut calls the real API with the server's dev code.

**Role-based routing (M4)**: `AppNavigator` builds the tab set from `user.role` (`STAFF_ROLES` / `COMPANY_ROLES` buckets in the file).

Always check versioned Expo docs before writing mobile code: https://docs.expo.dev/versions/v57.0.0/

**Mobile ↔ Web event mapping** (when adding new event features on both surfaces):
| Mobile screen | Web counterpart |
|---|---|
| `EventsScreen` | `/dashboard/operations/events` |
| `EventDetailsScreen` | `/dashboard/operations/events/[id]` |
| `MyEventDetailsScreen` | `/dashboard/operations/events/my/[id]` |
| `EventSuccessScreen` | post-booking confirmation |

## Key Conventions

- **Path alias**: `@/*` maps to `apps/web/src/*`.
- **Styling**: Tailwind for layout/spacing; CSS Modules for component-specific styles, animations, and complex selectors. Responsive breakpoint: `compact:` (max-width 1023.98px).
- **Tables**: wrap in `overflow-x-auto` for horizontal scroll at compact widths.
- **Design tokens** (use consistently, don't hardcode alternatives):
  - Primary orange `#FF6A2F` / `#FE7A47` (mobile variant), background `#FBF6F4`, card `#FFFFFF`, border `#E5E7EB`
  - Text: `#1F1F1F` / `#1A1D1F` (dark), `#4A5565` (gray), `#6A7282` / `#6F767E` (muted)
  - Cards: `border-radius: 14px` / `16px`, `padding: 16px 24px`. Buttons: `border-radius: 10px` / `16px`, `padding: 10px 20px`.
- **File headers**: Every TS/TSX file should include the module/purpose/author/date header block.
- **Toasts**: use `toast` from `sonner` (mounted in dashboard layout).
- **Figma mappings**: meeting-room/events screen maps to Figma node `0:10554`; use `get_design_context` before making UI changes there.
- **Mobile floating nav**: `FloatingNavBar` is rendered inside `TabNavigator` (in `AppNavigator.tsx`), not inside individual tab screens. Tab screens must use `activeTab` via `useNavigation()` state, not render their own nav bar.
- **Mobile animations**: use `useFadeIn`, `useSlideIn`, `usePressFeedback`, `usePulse` from `apps/mobile/src/theme/animations.ts`; tokens from `theme/tokens.ts` (`palette`, `space`, `radius`, `elevation`, `duration`).
- **Apollo operations**: centralized in `apps/web/src/lib/apollo/operations.ts` (web) and `apps/mobile/src/lib/apollo/operations.ts` (mobile). Re-run codegen after schema changes.
- **Prettier**: `singleQuote: true` (`.prettierrc`).

### Mock-Fallback Convention

Most admin pages are now fully wired to live GraphQL data (no `MOCK_*` constants remain in `apps/web/src/app/dashboard/**`). The old mock-unwrap audit (2026-07-11) is stale.

**Known limitations (current)**:
- `npx nx build web` fails on `_global-error` page prerendering — **ignore**; dev server and `next start` still work.
- `/dashboard/page.tsx` redirects to `/dashboard/home` (no longer a demo duplicate).
- Settings pages persist via `Center.settings` jsonb (`useSettingsGroup`); toggles are real but behavior-enforcement in other modules is partial.
- **Client-side RBAC is UX routing, not security**: `ClientLayout.tsx` (lines 148-173) redirects non-staff roles away from `/dashboard/settings/*`, `crm`, `revenue`, `inventory`, `report`, `audit`, `equipment`, `scheduled-reports`, `calendar-sync`, and `notifications`. This keeps the UI honest, but the backend `@Roles` + `@CenterScoped` guards are the real authorization barrier (see settings-auth-foundation spec). The Integrations page additionally self-gates via a role check in-component.
- **Two parallel booking systems**: seat bookings → `bookings` table; meeting-room/event bookings → `events` table. Reporting (`dashboardMetrics`/`revenueReport`/`occupancyReport`) queries `bookings` only — meeting-room revenue is invisible to reports.
- **Mobile**: seat-booking time slots are hardcoded constants (not real availability); the Plans subscribe path requires a `customerId` that `GET_ME` doesn't currently select; event booking from mobile fails because `GET_EVENT` omits `centerId`. See the verification audit for the full mobile gap list.
- **Stubs (not yet wired)**: no billing cron scheduler; `processPayment`/`rechargeWallet` are balance bumps (Razorpay service exists but isn't called from checkout yet); calendar-sync `fetchExternal` returns `[]`; scheduled-reports has no `@Cron`; referral payouts never transition; employee email invites never sent; `regenerateRecoveryCodes` returns a mock array.

## Environment Variables

| Scope | File | Key vars |
|-------|------|----------|
| Backend | `apps/api/.env` | `DATABASE_*` (or `DATABASE_URL`), `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `REDIS_*`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`, `OTP_DEV_BYPASS`, `DATABASE_SYNCHRONIZE` |
| Frontend | `apps/web/.env.local` | `NEXT_PUBLIC_GRAPHQL_HTTP_URL`, `NEXT_PUBLIC_GRAPHQL_WS_URL` |
| Mobile | `apps/mobile/.env` | Expo/EAS vars |

Backend env notes:
- `OTP_DEV_BYPASS=true` — dev only. Makes `requestOtp` return the fixed code `000000` instead of sending SMS. **Must be `false` (unset) in production** or OTP login is open.
- `DATABASE_SYNCHRONIZE=true` — opt-in. Lets TypeORM create/alter tables from entities (used for a one-off dev bootstrap). Prod leaves it off (migrations are the source of truth). The app `TypeOrmConfigModule` defaults `synchronize=false`.
- SMS provider + Razorpay keys are **not** env vars — they live in the `app_settings` table, configured via the super-admin Integrations page.

A reference `docker-compose.yml` is committed for local Postgres/Redis/NGINX/Prometheus/Grafana — not the deploy stack, just for spinning up dependencies.

`pnpm-workspace.yaml` declares `allowBuilds` for native modules (`sharp`, `sqlite3`, `@swc/core`, `nx`, etc.) — required for pnpm to install these from source.

## Migrations

New entities require a migration AND registration in both `ALL_ENTITIES` (`typeorm/typeorm.module.ts`) and `data-source.ts`. Prod runs `synchronize: false`, so a missing migration means the table/column won't exist and the API errors on boot or first query.

The migration files are `.ts` and the entity graph pulls in GraphQL decorators that don't evaluate outside the Nest app context, so the TypeORM CLI DataSource can't always load cleanly. To apply migrations on the server, use the raw-SQL bootstrap script (idempotent — safe to re-run):

```sh
# On the server, from the repo root, after deploy.sh has built the API:
cd /home/ubuntu/spacejam
node apps/api/dist/main.js &   # boot once so synchronize creates tables, OR:
# Apply migrations manually via the raw SQL in each migration's up() method.
```

The current migration set (in `apps/api/src/typeorm/migrations/`):
- `20260719000000_create_all_tables` — base schema
- … additive migrations through `20260724010000-AddEmployeeSeatRelation`, `20260807000000-AddCustomerUserAndForeignKeys`
- `20260809000000-AddOtpAndEmployeeUser` — M1: `otp_requests` table + `customer_employees.userId`
- `20260809100000-AddPlansAndSubscriptions` — M2: `plans` + `subscriptions`
- `20260809200000-AddBookingSubscriptionId` — M3: `bookings.subscriptionId`
- `20260809300000-AddAuditLogCenterId` — hardening: `audit_logs.centerId`
- `20260809400000-CreateAppSettings` — integrations: `app_settings`

## Production Server

### SSH Access

```sh
ssh -i "C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem" ubuntu@ec2-18-60-107-5.ap-south-2.compute.amazonaws.com
```

| Field | Value |
|---|---|
| Region | `ap-south-2` |
| Public DNS | `ec2-18-60-107-5.ap-south-2.compute.amazonaws.com` |
| SSH user | `ubuntu` |
| Key | `C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem` |
| Production URL | `https://spacejam.vedpragya.com` |

Security group: inbound **22, 80, 443**. Outbound: default.

### Server Environment

| Component | Detail |
|---|---|
| PM2 process (frontend) | `spacejam-web` — port 3000, `HOSTNAME=0.0.0.0` |
| PM2 process (backend) | `spacejam-api` — port 4000 |
| Node version | v20.20.2 (NVM managed, path: `~/.nvm/versions/node/v20.20.2/`) |
| Repo path | `/home/ubuntu/spacejam` |
| Next.js binary | **Hoisted** to `/home/ubuntu/spacejam/node_modules/next/dist/bin/next` (NOT `apps/web/node_modules/next/...`) |
| Disk usage | **92% full** — clean before big uploads |

### PM2 Quirks (non-interactive SSH)

1. **Always prefix remote commands with `bash -lc`** — `pm2` and `node` are only on `$PATH` in a login shell that sources `~/.profile`:
   ```sh
   ssh -i "..." ubuntu@ec2-... 'bash -lc "pm2 status"'
   ```

2. **PM2 v7 PID file** — The auto-generated `pm2-ubuntu.service` uses `Type=forking` but PM2 v7 doesn't write the PID file. A drop-in override at `/etc/systemd/system/pm2-ubuntu.service.d/override.conf` fixes this (`Type=oneshot`, `PIDFile=` cleared). If you ever re-run `pm2 startup`, the override survives — verify with `systemctl cat pm2-ubuntu`.

3. **Hoisted `next` binary** — The correct path is `/home/ubuntu/spacejam/node_modules/next/dist/bin/next`. The PM2 process is launched with `--cwd /home/ubuntu/spacejam/apps/web` so Next's own resolution works. Do NOT use `apps/web/node_modules/next/dist/bin/next`.

### Deploy Workflow

> **Before deploying**, ensure the new migrations will be applied — the API now depends on `otp_requests`, `plans`, `subscriptions`, `bookings.subscriptionId`, `audit_logs.centerId`, and `app_settings`. With `synchronize=false` in prod, a missing table means boot/runtime failure. Either run `DATABASE_SYNCHRONIZE=true` once after deploy (simplest) or apply each migration's SQL manually.

```sh
# 1. Build locally
npx nx build web && npx nx build api

# 2. Archive and copy
cd <repo root>
git archive --format=tar.gz HEAD -o update.tar.gz
scp -i "C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem" update.tar.gz ubuntu@ec2-18-60-107-5.ap-south-2.compute.amazonaws.com:/home/ubuntu/

# 3. SSH in and deploy
ssh -i "C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem" ubuntu@ec2-18-60-107-5.ap-south-2.compute.amazonaws.com
# Then run:
bash /home/ubuntu/deploy.sh   # uses /home/ubuntu/deploy.sh, NOT scripts/deploy.sh (that path is broken in npm scripts)

# 4. Apply new schema (one-off) — boot the API once with synchronize on so the
#    new tables/columns are created, then restart normally:
DATABASE_SYNCHRONIZE=true pm2 restart spacejam-api --update-env
sleep 10   # let it create the schema
# Then edit apps/api/.env to remove DATABASE_SYNCHRONIZE (or set false) and restart:
pm2 restart spacejam-api --update-env

# 5. After first deploy with integrations: log in as SUPER_ADMIN and configure
#    Settings → Integrations (SMS provider + Razorpay). OTP delivery and
#    payments are no-ops until this is done.
```

The `deploy.sh` script:
- Extracts the archive to `/home/ubuntu/spacejam`
- Writes `.env` files for both `apps/web` and `apps/api`
- Runs `npx nx build web` (frontend) and `npx nx build api` (backend via webpack-cli)
- Starts/restarts PM2 processes: `spacejam-web` (frontend) and `spacejam-api` (backend)
- Uses `pm2 resurrect` to restore the process list

**`scripts/build_api.sh` and `scripts/rebuild_web.sh` have CRLF line-ending corruption** (Windows checkouts) — run their commands manually instead of invoking the scripts.

**IMPORTANT — `OTP_DEV_BYPASS`**: ensure prod `apps/api/.env` does NOT have `OTP_DEV_BYPASS=true`. If left on, any caller can log in with code `000000`. Set it `false` or remove the line in production.

### Production Runtime Facts (2026-07-12)

- API listens on **port 4000** (not 3001 — `deploy.sh` writes `PORT=3001` to `.env` but the app ignores `PORT` or defaults to 4000).
- GraphQL endpoint: `http://localhost:4000/graphql` (NOT `/api/graphql`; that path 404s on the API — `/api/*` is the Next.js REST global prefix, which rewrites `/api/graphql` to the backend).
- Web listens on port 3000. nginx on :80/:443 proxies to both.

### Environment Variables (Production)

Frontend (`apps/web/.env`):
- `NEXT_PUBLIC_GRAPHQL_HTTP_URL` — backend GraphQL endpoint (proxied by nginx)
- `NEXT_PUBLIC_GRAPHQL_WS_URL` — WebSocket endpoint for subscriptions

Backend (`apps/api/.env`):
- `DATABASE_URL` (or `DATABASE_HOST`/`PORT`/`USER`/`PASSWORD`/`NAME`) — PostgreSQL connection
- `JWT_SECRET` — JWT signing secret
- `REFRESH_TOKEN_SECRET` — Refresh token secret
- `REDIS_HOST` / `REDIS_PORT` — Redis connection
- `PORT=4000` — Backend port
- `CORS_ORIGIN` — Frontend origin for CORS
- `FRONTEND_URL` — Frontend URL
- `NODE_ENV=production`
- `OTP_DEV_BYPASS` — **must be `false`/unset in prod** (dev returns code `000000`)
- `DATABASE_SYNCHRONIZE` — leave unset/`false` in prod; set `true` only for a one-off schema bootstrap
- SMS provider + Razorpay keys are configured at runtime via the Integrations settings page (stored in `app_settings`, not env)

---

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

---

## Commit Conventions

- No emoji in commit messages
- Use imperative mood: "Add feature" not "Added feature"
- Reference issue numbers if applicable

---

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
