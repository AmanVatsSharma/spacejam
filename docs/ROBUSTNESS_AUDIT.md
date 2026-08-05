# SpaceJam — Robustness Audit & Remediation Plan

**Date:** 2026-08-02
**Scope:** NestJS API (`apps/api`), Next.js admin web (`apps/web`), DB/migrations/seed, infra/deploy. Mobile (`apps/mobile`) is intentionally mock-only per product direction and is *not* in scope for hardening.
**Method:** Findings below were each verified firsthand against the current `main` (commit `e23349b`) — file:line references point to that revision. Where an explorer's claim did not match the code, it is corrected and marked **[corrected]**.
**No code was changed for this report.** This is a plan + evidence document.

---

## 0. Executive summary

SpaceJam is a **multi-center coworking management platform** with three actor types: end-user members (mobile app, intentionally mocked), center managers / staff (web admin), and super admins (web admin). The domain model (33 entities) is broad and internally coherent, and the codebase has genuine strengths: code-first GraphQL with a centralized error formatter, a global `ValidationPipe` with `whitelist + forbidNonWhitelisted + transform`, per-request DataLoader construction, a Redis-backed cache with read-through/write-invalidate, hashed reset/magic-link tokens, and rate limiting on auth mutations.

However, the application is **not production-robust** today. The dominant problems, in order of severity:

1. **Authorization is almost entirely absent at the resolver layer.** 21 of 24 resolvers have no guard. Anonymous callers can read and write bookings, customers, invoices, deposits, events, equipment, and analytics.
2. **Multi-center tenancy exists in the schema but is never enforced in queries.** No center-scoping; `centerId` is nullable on most entities. Any user can pass any `centerId`.
3. **The database has no usable seed and migrations never run automatically**, so a fresh deploy renders an empty admin UI. This is the primary blocker for UI review.
4. **Several latent data-integrity bugs:** `softDelete()` on entities with no `@DeleteDateColumn` (will throw), transactions absent on most multi-write flows (corrected: *one* flow uses them), hard deletes on financial records with no audit trail.
5. **No frontend auth/RBAC guard** — unauthenticated users see the dashboard shell; no nav item is role-gated.

The plan below is organized by severity tier. Each item states the problem, the evidence, the fix, the affected files, and an effort estimate (S/M/L). Existing beads issues that overlap are cross-referenced as `(see bd: <id>)`.

---

## 1. 🔴 CRITICAL — Security

### C1. Most resolvers are unauthenticated
**Evidence (verified):** Per-resolver count of `@UseGuards` across `apps/api/src/graphql/resolvers/*.ts`:

```
11  auth.resolver.ts              ← guarded (GqlAuthGuard / @Public / FieldRateLimitGuard)
 2  user.resolver.ts              ← guarded (GqlAuthGuard + RolesGuard, @Roles on admin ops)
 2  recurring-booking.resolver.ts ← guarded (GqlAuthGuard)
 0  … the other 21 resolvers …    ← NO guard
```

Unguarded resolvers include: `center`, `booking`, `crm`, `customer`, `customer-employee`, `customer-document`, `revenue`, `discount`, `event`, `event-attendee`, `event-ticket-tier`, `meeting-room`, `request`, `notification`, `notification-automation`, `equipment`, `analytics`, `audit-log`, `onboarding`, `scheduled-report`, `calendar-sync`.

No `APP_GUARD` provider is registered in `app.module.ts` (verified — none present) or `main.ts`. Auth is therefore **opt-in per resolver**, and most resolvers never opt in. `graphql.config.ts` has a `hydrateUserFromToken` step that decodes the JWT into `req.user` when a token is present, but it does **not** reject anonymous requests — so resolvers that read `context.req.user?.id` tolerate `undefined` and proceed.

**Impact:** An anonymous caller hitting `/api/graphql` can list and mutate bookings, leads, customers, invoices, deposits, contracts, events, requests, discounts, equipment, and read analytics + audit logs. `createCenter` (`center.resolver.ts:101`) sets `owner = userId` even when `userId` is undefined.

**Fix:**
- Register a global guard: provide `{ provide: APP_GUARD, useClass: GqlAuthGuard }` in `app.module.ts`. This flips the default to "auth required everywhere."
- Mark genuinely public operations with `@Public()`: `signin`, `signup`, `requestPasswordReset`, `resetPassword`, `verifyEmail`, `requestMagicLink`, `verifyMagicLink`, `refreshTokens`, and read-only public content (e.g. `floors` if it is meant to be public).
- Audit each currently-unguarded resolver and add the appropriate `@Roles(...)` where only certain roles may act (see C2).
- Keep `DevAuthGuard` strictly gated behind `APP_ENV !== 'production'` and ideally behind an explicit `ENABLE_DEV_AUTH` flag; it currently accepts a hardcoded `dev-mode-fake-token`.

**Files:** `apps/api/src/app/app.module.ts`, every resolver under `apps/api/src/graphql/resolvers/` except the 3 already guarded, `apps/api/src/auth/guards/dev-auth.guard.ts`.
**Effort:** M (mechanical but touches ~21 files; needs a careful per-method `@Public()` pass).

### C2. No center-level (multi-tenant) authorization
**Evidence (verified):** `RolesGuard` (`auth/guards/roles.guard.ts`) only checks `required.includes(user.role)` — pure role-name membership. There is **no** query interceptor, policy guard, or `where centerId = user.centerId` injection anywhere. The `centerId` column is **nullable** on Customer (`customer.entity.ts:75`), Lead (`lead.entity.ts:78`), Booking (`booking.entity.ts:55`), Deposit, Invoice, Contract, Notification, Discount, etc. `User.centerId` is typed `varchar` (`user.entity.ts:47`) rather than a uuid FK with no `JoinColumn`.

**Smoking gun:** `myCenters` (`center.resolver.ts:82-98`):
```ts
async myCenters(@Context() context): Promise<CenterEntity[]> {
  const userId = context.req.user?.id;
  if (!userId) {
    // No auth guard applied — return all centers instead of empty list
    const centers = await this.centerRepo.find({ relations: ['location','floors','floors.seats'] });
    return centers;            // ← returns ALL centers to anonymous callers
  }
  const centers = await this.centerRepo.find({ where: { owner: userId } as any, ... });
  return centers;              // ← only centers the user *owns*
}
```
Center scoping today relies on `Center.owner = userId`. `CENTER_MANAGER`/`STAFF` are **not** represented in Center ownership, so `myCenters` returns empty for them — and the unauthenticated branch leaks everything.

**Impact:** Tenancy leak. Any authenticated user can pass any `centerId` filter and read/write any center's data. A center manager has no enforced view restriction.

**Fix (design — tenancy model is deferred per your direction, but the shape is):**
- Decide the ownership model (see **Open decision** below). Recommended minimal option: a manager/staff user carries a single `centerId`; super admins have `centerId = null` and see all.
- Introduce a `CenterScopeGuard` / query-helper that, for non-admin roles, injects `{ centerId: user.centerId }` into list queries and rejects mutations whose target `centerId ≠ user.centerId`.
- Make `centerId` **non-null** on genuinely center-owned entities (Customer, Lead, Booking, Deposit, Invoice, Contract, Event, Request, Equipment, etc.) via a migration — nullable centerId defeats scoping. (Backfill existing rows first.)
- Fix `myCenters`: for admins return all; for managers return their assigned center(s); for anonymous throw `UnauthorizedException` (do not return all).
- Type `User.centerId` as uuid with a real FK.

**Open decision (deferred per your answer):** one-center-per-manager vs. many-centers-per-manager. The simpler one-center model is reversible and I'd build the guard so it can later read from a join table. Flagged for a later session.

**Files:** new `auth/guards/center-scope.guard.ts` + a `withCenterScope(...)` query helper; `auth/guards/roles.guard.ts`; `center.resolver.ts`; every list/mutation resolver; entities with nullable `centerId`; a new migration.
**Effort:** L (cross-cutting; touches nearly every resolver + a migration + backfill). This is the single biggest piece of work.

### C3. 2FA disabled + magic-link/recovery-code methods called via `as any`
**Evidence (verified via prior session + resolver):** Every 2FA method in `auth.service.ts` throws `BadRequestException('Two-factor authentication is temporarily disabled')`, and signin hard-fails for `twoFactorEnabled` users (`auth.service.ts:110-112`). `auth.resolver.ts` invokes magic-link/recovery-code flows via `(this.authService as any).requestMagicLink(...)` casts (lines ~105,129,138,179,204) — meaning those methods are not on the public service type and will throw at runtime. `regenerateRecoveryCodes` returns hardcoded mock values (`['RC-1234','RC-5678','RC-9012']`).

**Fix:** Either complete the 2FA/magic-link/recovery-code implementation or remove the endpoints and stop persisting `twoFactorEnabled` until it works. The `as any` casts must be replaced by real service methods. (Overlaps `bd: spacejam-voe` security-settings backend.)

**Files:** `apps/api/src/auth/services/auth.service.ts`, `apps/api/src/graphql/resolvers/auth.resolver.ts`.
**Effort:** M to complete; S to cleanly disable.

### C4. Committed production secrets
**Evidence (verified):** `docker-compose.yml:15-17` and `deploy.sh:41-44` both contain literal `JWT_SECRET=super-secret-production-jwt-key-change-me` and `REFRESH_TOKEN_SECRET=...`. `jwt.strategy.ts:37` and `auth.service.ts:329,334` fall back to `'dev-jwt-secret'` / `'dev-refresh-secret'` when env unset.

**Fix:** Remove secrets from version control; rotate the exposed keys; load from env / secret manager only; fail-fast in production if `JWT_SECRET`/`REFRESH_TOKEN_SECRET` are unset or equal the dev defaults. Add a `.env.example` (none exists today).

**Files:** `docker-compose.yml`, `deploy.sh`, `apps/api/src/config/module.ts` (add joi schema validation — currently a no-op `validate: (env) => env`), `jwt.strategy.ts`, `auth.service.ts`.
**Effort:** S.

---

## 2. 🟠 HIGH — Data integrity & UI-review blocker

### H1. No usable seed data (UI-review blocker) — **#1 priority for reviewability**
**Evidence (verified):**
- `seed.js` (52 lines): creates/updates only `admin@spacejam.test` / `changeme-1234` and **6 demo notifications**. No customers, leads, bookings, payments, invoices, deposits, contracts, events, meeting rooms, equipment.
- `init-db.sql` (86 lines): creates 1 admin user with a **broken** bcrypt hash `$2b$10$your-hashed-password-here` (no real password matches it), 1 location, 1 center, 1 floor, 6 seats. Nothing else.

**Consequence:** Every admin page that powers off `GET_LEADS`, `GET_DEPOSITS`, `GET_INVOICES`, `useRequests`, `useMeetingRooms`, `useEvents`, `useCustomers`, `useEquipment`, etc. returns `[]`. The dashboard home, CRM, Revenue, Operations, Inventory, and Reports screens are all empty on a fresh deploy. This is the dominant blocker for UI review.

**Fix:** Write a single idempotent seed script (Node + `pg`, mirroring `seed.js`) that creates, for ≥2 centers:
- 2 locations, 3 centers, floors + seats (mix HOT_DESK/DEDICATED/CABIN/MEETING_ROOM) + MeetingRoom rows
- ~10 leads across statuses, ~6 customers (with employees + documents), ~3 onboarding records
- ~15 bookings across statuses + matching payments, ~8 invoices (mix Paid/Sent/Overdue), ~5 deposits (mix Held/Release-Requested/Frozen), ~3 contracts
- ~5 events + attendees + ticket tiers, ~1 recurring booking, ~6 service requests
- equipment, notifications, discounts, an audit-log sample
- 3 users: `admin@spacejam.test` (ADMIN), `manager-<center>@spacejam.test` (CENTER_MANAGER, scoped), `staff@spacejam.test` (STAFF) — so RBAC can be exercised once C2 lands
- Wire it as an npm script (`seed`) in `apps/api/package.json` and call it from `deploy.sh` behind a `SEED_ON_DEPLOY` flag (off by default in prod).

**Files:** new `apps/api/src/seed/seed.ts` (or extend root `seed.js`); `apps/api/package.json`; `deploy.sh`.
**Effort:** M (mostly data-shape wrangling; the entities already exist).

### H2. Migrations never run; no npm script; entity-list drift
**Evidence (verified):**
- `main.ts` (lines 17-79) only `app.listen()` — no `dataSource.runMigrations()`.
- `typeorm.module.ts:97,116` hardcodes `synchronize: false`.
- `deploy.sh` does not run migrations or seed.
- `apps/api/package.json` has **no** `migrate`/`seed` scripts.
- **`data-source.ts:41-63` registers only 21 entities**, missing 12 that the app module registers (Customer, CustomerEmployee, CustomerDocument, Onboarding, EventAttendee, EventTicketTier, RecurringBooking, Notification, NotificationAutomation, Equipment, ScheduledReport, CalendarConnection). Migrations run via this DataSource won't see those tables.
- `data-source.ts:65` sets `synchronize: NODE_ENV !== 'production'`, diverging from the app's `synchronize: false` → CLI use mutates schema in ways the app won't, causing drift. (Per beads memory `deploy-facts-2026-07-12`, prod is `synchronize:false` and **prod PostgreSQL is < v11** — no `CREATE TYPE IF NOT EXISTS` — so migrations must wrap enum creation in `DO $$ ... EXCEPTION` blocks. The existing `20260719000000_create_all_tables.ts` already does this.)

**Fix:**
- Run migrations on bootstrap: in `main.ts`, resolve the DataSource and call `runMigrations()` before `app.listen()` (guarded so a failed migration fails fast).
- Add npm scripts: `"migrate": "ts-node ... migration:run"`, `"migrate:generate"`, `"seed"`.
- Derive the `data-source.ts` entity list from the **same source** as `typeorm.module.ts` (e.g. export an `entities: [...]` array from one place and import in both), or maintain both with a unit test asserting equality.
- Set `synchronize: false` in `data-source.ts` unconditionally.
- Call migrations from `deploy.sh`.

**Files:** `apps/api/src/main.ts`, `apps/api/src/typeorm/data-source.ts`, `apps/api/src/typeorm/typeorm.module.ts`, `apps/api/package.json`, `deploy.sh`.
**Effort:** M.

### H3. `softDelete` on entities with no `@DeleteDateColumn`
**Evidence (verified):**
- `center.resolver.ts:303` `await this.floorRepo.softDelete(id);`
- `center.resolver.ts:397` `await this.seatRepo.softDelete(id);`
- `floor.entity.ts`, `seat.entity.ts`, `user.entity.ts` each have `@CreateDateColumn` + `@UpdateDateColumn` but **no `@DeleteDateColumn`** (zero matches across all entities). TypeORM's `softDelete` requires a `@DeleteDateColumn` (`deletedAt`); without it the call throws `EntityColumnNotFound` at runtime (or silently no-ops in older versions) — a latent bug triggered the first time an admin deletes a floor or seat.

**Fix:** Either (a) add `@DeleteDateColumn({ name: 'deletedAt', nullable: true }) deletedAt: Date | null;` to Floor, Seat, User (+ migration to add the column), and ensure queries that should exclude soft-deleted rows use `find({ withDeleted: false })` (default); or (b) if soft delete is not actually wanted, replace `softDelete` with `delete` and a status flag. Recommend (a) for recoverability.

**Files:** `apps/api/src/typeorm/entities/floor.entity.ts`, `seat.entity.ts`, `user.entity.ts`; a new migration; verify resolver queries.
**Effort:** S.

### H4. Transactions absent on most multi-write flows **[corrected]**
**Evidence (corrected):** An earlier explorer draft claimed "zero transactions." That is **inaccurate** — `recurring-booking.resolver.ts:114` **does** wrap its create in `dataSource.transaction(async (manager) => {...})`, and `typeorm.service.ts:99` exposes `createQueryRunner()`. So the primitive is available and used in one place. The gap is that **other** multi-write flows do not use it:

- `convertLead` / `convertLeadWithOnboarding` (`crm.resolver.ts:117-302`): writes Customer + Lead + Onboarding across 3 separate saves.
- `createBooking` (`booking.resolver.ts:89-174`): creates the booking, then updates seat status in a second write — if the seat update fails you get a dangling booking.
- `cancelBooking`: updates booking, seat, and payment independently.
- `createSeat` (`center.resolver.ts:338-368`): writes Seat then a MeetingRoom via `seatRepo.manager.getRepository('MeetingRoom')` (also bypasses DI).

**Fix:** Wrap each multi-write flow in `dataSource.transaction(async (manager) => { ... })` using the transaction-scoped repos (`manager.getRepository(X)`). On any throw, the whole operation rolls back.

**Files:** `crm.resolver.ts`, `booking.resolver.ts`, `center.resolver.ts`, `revenue.resolver.ts` (deposit release/freeze side-effects).
**Effort:** M.

### H5. Hard deletes on financial records with no audit trail
**Evidence:** `deleteInvoice`, `deleteDeposit`, `deleteLead`, `deleteCustomer` are hard deletes (`DELETE`). `AuditLog` exists and is append-only, but **nothing writes to it** from these flows — the write side is essentially absent. This is problematic for accounting/CRM compliance and for any "undo" need.

**Fix:** Switch financial records (Invoice, Deposit, Contract, Payment) to soft-delete + status flags (e.g. `CANCELLED`); keep `delete*` only for non-financial cleanup. Wire an `AuditService.log({ userId, action, entity, entityId, changes })` call into every mutating resolver. (Partially tracked by existing audit-log resolver; needs the write side.)

**Files:** `revenue.resolver.ts`, `crm.resolver.ts`, new `apps/api/src/audit/audit.service.ts`.
**Effort:** M.

### H6. Seat ↔ MeetingRoom dual source of truth
**Evidence:** `Seat` with `seatType=MEETING_ROOM` and the separate `MeetingRoom` entity overlap. `createSeat` (`center.resolver.ts:338-368`) keeps them in sync by reaching into `seatRepo.manager.getRepository('MeetingRoom')` — bypasses DI, no transaction, no sync on update/delete. `MeetingRoom.centerId` and `floorId` are both nullable; `Seat.centerId` is nullable and the booking resolver computes it from `seat.floor.centerId` (`booking.resolver.ts:152`), so the denormalized column is unreliable.

**Fix:** Pick one model. Recommended: make `Seat` the unified inventory entity (it already has `seatType=MEETING_ROOM`) and treat `MeetingRoom` as a legacy/deprecated table, or vice-versa. Whichever is chosen, remove the parallel writes and add a migration to reconcile existing rows. Short term (lower effort): at minimum add a transaction + DI-correct repo usage to `createSeat`, and keep `MeetingRoom` in sync on update/delete.

**Files:** `center.resolver.ts`, `meeting-room.resolver.ts`, `seat.entity.ts`, `meeting-room.entity.ts`, `booking.resolver.ts`.
**Effort:** L for the clean unification; M for the safe-sync stopgap.

### H7. `Deposit` redundant frozen flag
**Evidence:** `deposit.entity.ts` has both a `frozen` boolean (line ~51) and a `FROZEN` status (line ~75). `unfreezeDeposit` resets to `HELD` + `frozen=false` regardless of prior status — the two can drift.

**Fix:** Pick one representation (recommend the status enum; drop the boolean), add a migration, and update `freezeDeposit`/`unfreezeDeposit`.

**Files:** `deposit.entity.ts`, `revenue.resolver.ts`, migration.
**Effort:** S.

---

## 3. 🟡 MEDIUM — Frontend gaps, dead code, mismatches

### F1. No auth/RBAC guard on the dashboard (frontend)
**Evidence (verified):** `apps/web/src/proxy.ts` is the Next.js 16 route guard. `decide()` (lines 82-98) does **one** thing: redirect already-authenticated users *away from* public routes. The `ADMIN_ROUTES` constant (line 27) and `'unauth-dashboard' | 'role-mismatch'` reasons (lines 36-40) are **dead code** — never produced. The comment at lines 72-81 admits the dashboard auth check was removed because tokens live in localStorage (Edge can't read them). `ClientLayout.tsx:127-129` claims "the middleware blocks unauthenticated access" — **that is inaccurate**.

**Consequence:** An unauthenticated visitor to `/dashboard/*` sees the full shell render; Apollo queries then fail with `UNAUTHENTICATED`, the refresh link bounces to `/signin`. So it self-corrects on first query but with an ugly flash and no clean guard. There is also **zero** role-based hiding of nav/pages: a `MEMBER` sees Settings, Users, Audit.

**Fix:**
- Add a client-side guard in `ClientLayout`: `useEffect(() => { if (!isLoading && !isAuthenticated) router.replace('/signin?next=' + pathname); }, [...])`. Cookies (`spacejam_access`, `spacejam_refresh`) are already written (`token-storage.ts:14-15`) — if you want an Edge-level guard, re-enable a cookie-check in `proxy.ts` and stop persisting tokens *only* in localStorage.
- Introduce role gating: extend the `NavItem` interface (`components/ui/sidebar.tsx:19-24`) with `roles?: UserRole[]`; filter `NAV_ITEMS` by `useAuth().user.role`. Gate the Settings/Teams/Admin paths to `ADMIN`/`SUPER_ADMIN`. Add `SUPER_ADMIN` to the web `UserRole` type (`auth-context.tsx:37`) — it's referenced in `header.tsx:63 ROLE_LABEL` but absent from the type.
- Decide the admin-vs-center-manager surface: managers should see Operations/Inventory/CRM/Revenue for *their* center; admins see everything including Settings/Teams. (Depends on the C2 tenancy decision.)

**Files:** `apps/web/src/proxy.ts`, `apps/web/src/app/dashboard/ClientLayout.tsx`, `apps/web/src/components/ui/sidebar.tsx`, `apps/web/src/contexts/auth-context.tsx`, `apps/web/src/components/ui/header.tsx`.
**Effort:** M (guard is S; RBAC filtering is M once the role matrix is decided).

### F2. Orphan pages — built and wired but unreachable from nav
**Evidence (verified):** These pages exist, query live data, but have **no** sidebar/header entry:
- `/dashboard/operations/recurring-bookings` (uses `useRecurringBookings`)
- `/dashboard/equipment` (uses `useEquipmentList`)
- `/dashboard/scheduled-reports` (uses `useScheduledReports`)
- `/dashboard/audit` (uses `auditLog` query)
- `/dashboard/calendar-sync` (the one **mock-data** page — see F4)
- `/dashboard/notifications` (only reachable from the header bell "View all")
- `/dashboard/home` (canonical home; only reachable via the `/dashboard` redirect)

**Fix:** Add these to the relevant `SECTION_TABS` in `ClientLayout.tsx:31-92` (e.g. recurring-bookings + audit under Operations; equipment under Inventory; scheduled-reports + audit under Report or Settings). Confirm `/dashboard/home` is the default landing tab.

**Files:** `apps/web/src/app/dashboard/ClientLayout.tsx`, possibly `components/ui/sidebar.tsx`.
**Effort:** S. (Overlaps `bd: spacejam-1h6`.)

### F3. Type error in dashboard home (`web-tsc.log` is red)
**Evidence (verified):** `apps/web/src/app/dashboard/home/page.tsx:139` calls `useRequests({ pendingOnly: true })`, but the hook signature (`apps/web/src/hooks/use-operations.ts:930-936`) has no `pendingOnly` field — TS2353. The stray prop is silently dropped by the API's `whitelist:true` `ValidationPipe`, so the *behavior* is "shows all requests" not "pending only" — a silent functional bug behind the type error.

**Fix:** Either add a `pendingOnly` option to `useRequests` that maps to the backend `pendingRequests` query (the resolver exposes it: `request.resolver.ts` `pendingRequests`), or change the call site to use the existing pending query. Then `web-tsc.log` goes green.

**Files:** `apps/web/src/hooks/use-operations.ts`, `apps/web/src/app/dashboard/home/page.tsx`.
**Effort:** S.

### F4. `calendar-sync` page uses fabricated OAuth tokens (only real mock page)
**Evidence (verified):** `apps/web/src/app/dashboard/calendar-sync/page.tsx:119-131`:
```ts
const mockAccessToken = `mock_access_${provider}_${Date.now()}`;
const mockRefreshToken = `mock_refresh_${provider}_${Date.now()}`;
```
passed into `connectCalendar` as if real. The comment admits it. (Other "mock" grep hits across the app were false positives — `placeholder=` attributes, CSS classes.)

**Fix:** Either implement a real OAuth dance (Google/Outlook) — significant — or clearly mark the page as a preview/not-in-use and exclude it from nav until wired. Given your "robustness now" focus, recommend the latter; track the real OAuth as a separate feature.

**Files:** `apps/web/src/app/dashboard/calendar-sync/page.tsx`, backend `calendar-sync.resolver.ts` / `calendar-connection.entity.ts`.
**Effort:** L for real OAuth; S to mark as preview.

### F5. Duplicated GraphQL operations → drift risk
**Evidence (verified):** `apps/web/src/hooks/use-operations.ts` redeclares ~15 operations inline (lines 29-453: `GET_BOOKING_BY_ID`, `GET_EVENT_BY_ID`, `CREATE_EVENT`, `MEETING_ROOMS`, `CREATE_MEETING_ROOM`, `BOOK_ROOM`, request/event-status mutations, `PROCESS_PAYMENT` twice) that overlap with `apps/web/src/lib/apollo/operations.ts`. Schema changes require editing two places; they will drift.

**Fix:** Move all operations into `operations.ts` (+ `enterprise-operations.ts`) and import them in hooks. Add a lint/test guard against duplicate operation names if feasible.

**Files:** `apps/web/src/hooks/use-operations.ts`, `apps/web/src/lib/apollo/operations.ts`.
**Effort:** M.

### F6. Audit-log query-name mismatch
**Evidence (verified):** `operations.ts:1819` defines `GET_AUDIT_LOGS` querying `auditLogs(...)` (plural), while `enterprise-operations.ts:15` defines `AUDIT_LOG_QUERY` querying `auditLog(...)` (singular). `audit/page.tsx:14` uses the singular; `settings/page.tsx:291` uses the plural. If the backend only exposes one field name, one set of documents is broken. Needs verification against the live schema.

**Fix:** Confirm the actual backend field name in `schema.graphql`/resolvers; align both documents; remove the loser.

**Files:** `apps/web/src/lib/apollo/operations.ts`, `enterprise-operations.ts`, consuming pages.
**Effort:** S.

### F7. Settings/Notification/Audit pages have no backend
**Evidence (from beads memory `frontend-mock-unwired-audit-2026-07-11` + `bd ready`):** Finance/Notification/Security settings toggles and Save buttons are cosmetic — there is no settings entity/resolver. This is already tracked as a P0 epic (`bd: spacejam-oor`) plus child issues (`spacejam-4m2`, `spacejam-cv1`, `spacejam-voe`, `spacejam-vfx`, `spacejam-1wm`). No new bead needed; just note it as a robustness gap: the UI implies persistence that doesn't exist.

**Fix:** Tracked by the existing settings epic. Until it lands, mark these settings sections as "preview" to avoid implying persistence.

---

## 4. 🟢 LOW — Hygiene & polish

| # | Issue | Evidence | Fix | Effort |
|---|-------|----------|-----|--------|
| L1 | DataLoader is dead code | `graphql/dataloaders/index.ts` constructs batched loaders per-request; **zero** resolvers consume `context.loaders` — all use eager `find({ relations })` (N+1 risk). | Either wire `@Context() { loaders }` into resolvers' field/nested resolvers, or delete the class. | M |
| L2 | Broad cache invalidation | `booking.resolver.ts:223` invalidates `center:*` after one booking change → cache stampede. | Use targeted keys (`booking:center:<id>`, `metrics:dashboard:<id>`). | S |
| L3 | `synchronize: true` in `data-source.ts` | line 65. | Set `false` unconditionally (see H2). | S |
| L4 | `User.centerId` typed `varchar` | `user.entity.ts:47`, inconsistent with uuid FK elsewhere. | Type as uuid + `@JoinColumn`. | S |
| L5 | Hardcoded dev JWT secrets | `jwt.strategy.ts:37`, `auth.service.ts:329,334` default to `'dev-jwt-secret'`. | Fail-fast in prod (see C4). | S |
| L6 | `Payment`↔`Booking` typed `any` | `booking.entity.ts:138`, `payment.entity.ts:75` with eslint-disable. | Restore real typing. | S |
| L7 | `regenerateRecoveryCodes` returns hardcoded values | `auth.resolver.ts:186`. | Real generation or remove (see C3). | S |
| L8 | E2E is non-functional boilerplate | `api-e2e/api.spec.ts` asserts a non-existent `Hello API`; `web-e2e` only checks for "Welcome". | Replace with real smoke tests against auth + one CRUD flow each side. | M |
| L9 | `lib/api.ts` legacy wrapper | stale `RevenueData`/`OccupancyData` exports "kept for backward compatibility." | Verify no imports, then remove. | S |
| L10 | `app/test/page.tsx`, `app/set-up-new-center/page.tsx` ship in route tree | confirm intent; gate or remove for prod. | Remove or gate behind dev flag. | S |
| L11 | `MeQueryClient` uses `window.dispatchEvent` event bus | `auth-context.tsx:215` — fragile across multiple provider mounts. | Lift state into the provider. | S |
| L12 | Prod port discrepancy | `deploy.sh:96` health-checks **4000**; `main.ts:70` defaults to **3001**. Per beads memory `deploy-facts-2026-07-12`, the **actual runtime port is 4000** (the app ignores `PORT`/`main.ts` default in prod), so the health check is *right at runtime* but the `PORT=3001` written to `.env` is *wrong/ignored*. Reconcile: set `PORT=4000` explicitly and make `main.ts` honor it. | S |
| L13 | `web-build.log` green but `deploy.sh:69` uses `next build --webpack \|\| true` | A failing web build is masked as passing; a fake `prerender-manifest.json` is written (`deploy.sh:70`) to paper over the `_global-error` SSG crash. | Don't swallow build failure; fix the root cause (tracked `bd: spacejam-3jhf`). | M |
| L14 | Mobile latent bug | `HomeScreen.tsx:556,573` call `useSpringEntrance()` without importing it; mobile Apollo client points at wrong port. | Moot while mobile stays mock (per your direction), but fix before wiring. | S |

---

## 5. Verification log (what I personally confirmed)

Every CRITICAL and HIGH claim above was checked against the code on `main` (`e23349b`), not just taken from summaries:

- **C1 guard counts** — `command grep -c UseGuards` over all 24 resolvers: only `auth` (11), `user` (2), `recurring-booking` (2) have any; the other 21 have 0. No `APP_GUARD` in `app.module.ts` or `main.ts`.
- **C2 `myCenters`** — read `center.resolver.ts:82-98` directly; the `if (!userId) return all centers` branch and its comment are verbatim.
- **C4 secrets** — read `docker-compose.yml:15-17`, `deploy.sh:41-44`, `jwt.strategy.ts:37`, `auth.service.ts:329/334`.
- **H1 seed** — read `seed.js` (52 lines: admin + 6 notifications only) and `init-db.sql` (86 lines: admin w/ broken hash, 1 location/center/floor, 6 seats).
- **H2 migrations** — read `main.ts` (no `runMigrations`), `data-source.ts:41-63` (21 entities vs 33 in `typeorm.module.ts`), confirmed `synchronize: false`/`false` in module vs `NODE_ENV !== 'production'` in data-source.
- **H3 softDelete** — `softDelete` at `center.resolver.ts:303` and `:397`; `command grep DeleteDateColumn` across entities = **0** matches; Floor/Seat/User have only Create/UpdateDateColumn.
- **H4 transactions** — **[corrected the earlier draft]**: `recurring-booking.resolver.ts:114` *does* use `dataSource.transaction`; the gap is the *other* multi-write flows.
- **F1 proxy** — read `proxy.ts` fully; `decide()` only redirects authed users away from public routes; `ADMIN_ROUTES` is dead.
- **F3 type error** — `home/page.tsx:139` uses `{ pendingOnly: true }`; `use-operations.ts:930` hook has no such field.

---

## 6. Recommended sequence

A pragmatic order that front-loads reviewability and the cheapest critical wins, defers the largest design-dependent work, and respects that you haven't decided the tenancy model yet:

**Phase 0 — quick wins (S each, do first)**
- F3 fix the `pendingOnly` type error → green `web-tsc.log`
- C4 remove committed secrets + add `.env.example` + fail-fast in prod
- H3 add `@DeleteDateColumn` to Floor/Seat/User + migration (or switch to hard delete)

**Phase 1 — make it reviewable (the UI-review blocker)**
- H1 write the multi-entity seed script → admin UI renders realistic data across all centers
- H2 wire migrations-on-boot + npm scripts + fix `data-source.ts` entity drift + call from `deploy.sh`
- F2 surface orphan pages in nav

**Phase 2 — close the security holes**
- C1 global `APP_GUARD` + per-method `@Public()` pass
- C3 decide: complete or cleanly remove 2FA / magic-link / recovery-code
- *(C2 center-scoping is gated on your tenancy-model decision — build it once that's settled. The guard in C1 already stops anonymous access, which is the larger half of the risk.)*

**Phase 3 — integrity & cleanup**
- H4 wrap multi-write flows in transactions
- H5 audit-log write side + soft-delete financials
- F1 frontend auth guard + role-gated nav
- F4/F5/F6/F7 frontend cleanup
- L-series hygiene

**Deferred / decision needed**
- **C2 multi-center scoping** — needs your call: one-center-per-manager (simple, reversible) vs. many-centers (needs a join table). Recommend starting with the one-center model and designing the guard to read from a future join table.
- **H6 Seat↔MeetingRoom unification** — design decision; the safe-sync stopgap can land first.

---

## 7. Existing beads issues this relates to (do not duplicate)

The following open beads already track overlapping work — this audit **references** them rather than creating duplicates:

| Bead | Topic | Relates to |
|------|-------|------------|
| `spacejam-oor` (P0 epic) | Settings backend wiring | F7 |
| `spacejam-tyg` (P0) | `convertLead` auto-create Customer | H4 (wrap in transaction) |
| `spacejam-xte` (P0) | Verify frontend ops vs backend schema, auth guards | C1, F5, F6 |
| `spacejam-3jhf` (P1) | `_global-error` breaks prod build | L13 |
| `spacejam-4m2/cv1/voe/vfx/1wm` (P1/P2) | Settings backends (finance/notification/security/profile/center) | F7 |
| `spacejam-h97/vgg` (P1) | Add customerId to Booking/Lead | C2 (tenancy keys) |
| `spacejam-1h6` (P2) | Replace dead `/dashboard/page.tsx` | F2 |
| `spacejam-1hvp` (P2) | Meeting Room Extend dup event | H4/H6 |
| `spacejam-izb` (P3) | Onboarding route backend or remove | (none directly) |

**New gaps not yet tracked as beads** (candidates to file when you're ready to implement): C1, C2, C3, C4, H1, H2, H3, H4, H5, H6, H7, F1, F4 (real OAuth or mark preview). I have **not** created these beads, per the "audit only, no code changes" direction; say the word and I'll file them.

---

## 8. Open questions for you

1. **Tenancy model** (C2): one-center-per-manager vs. many? (You said "decide later" — I'll keep it flagged, not block on it.)
2. **2FA / magic-link** (C3): complete the implementation, or remove the endpoints cleanly for now?
3. **Seat ↔ MeetingRoom** (H6): unify on `Seat` (recommended), unify on `MeetingRoom`, or keep both with a proper sync layer?
4. **Financial deletes** (H5): switch to soft-delete + status (recommended for compliance), or keep hard delete with an audit-log side-write?
5. **Want me to file the new gaps as beads** and/or start executing Phase 0/1?
