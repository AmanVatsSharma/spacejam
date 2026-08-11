# Settings Auth & Permission Foundation — Design

**Date:** 2026-08-10
**Status:** Draft, awaiting review
**Sub-project:** A of 5 (Auth & permission foundation)
**Approach:** 2 — Hardening + ownership-scoped enforcement

---

## 1. Problem statement

The admin panel has two real user types — `SUPER_ADMIN` (onboards admins, assigns centers) and `CENTER_MANAGER` (logs in, manages their assigned center) — and eight settings modules that already branch on role at the UI level. But the **backend that backs those settings is not enforced**, so "enterprise-grade settings that actually work" is currently false. Four critical defects make the whole system unsafe to rely on:

1. **`centerScope()` is dead code.** The JWT carries `centerId` (signed at `auth.service.ts:366`), but both `req.user` hydration paths — `jwt.strategy.ts:46-51` and `graphql.config.ts:190-195` — strip it, returning only `{ id, email, role, sessionId }`. Every resolver that calls `centerScope(caller)` reads `caller.centerId`, which is always `undefined`. **Result: a CENTER_MANAGER currently sees every center's users, centers, seats, and audit logs.** Their data isolation is illusory.
2. **`updateCenterSettings` has zero authorization.** No `@Roles`, no `@Public`, no ownership check (`center.resolver.ts:199-223`). Any authenticated `MEMBER` can read and overwrite **any** center's entire `settings` JSONB blob, including centers they don't belong to. Same for the `centerSettings` read query.
3. **`setUserRole` silently demotes CENTER_MANAGER → STAFF.** `toEntityRole()` (`user.resolver.ts:38-42`) maps `CENTER_MANAGER` to `STAFF`. Promoting a user to center manager through the UI stores them as staff. The capability cannot be granted via the API.
4. **`AuditService` is registered nowhere.** Not in `AuthModule` providers, not in any `@Module()`. The `AuditLog` entity is in `TypeOrmModule.forFeature([...])`, but the service that writes to it is never constructed by Nest's DI. `AuthService` doesn't even inject it (constructor at `auth.service.ts:59` has no audit param). So `audit.service.ts` is dead code; no settings/user action is recorded.

Two secondary issues sit just below the critical line:

5. **`updateCenterSettings` accepts unbounded JSON.** No key whitelist, no size cap, no shape validation. `deepMergeSettings` recurses without depth limit. A buggy or hostile client can stash arbitrary keys or bloat the row.
6. **`req.user` field names don't match the `JwtPayload` type resolvers rely on.** Resolvers are typed `@CurrentUser() current: JwtPayload` and read `current.sub` / `current.sid` (e.g. `user.resolver.ts:72`, `user.resolver.ts:194-195`), but at runtime `req.user` has `id` / `sessionId`. This currently "works" only because those code paths return a wrong-but-non-crashing result (e.g. `userRepo.findById(undefined)` resolves to null → NotFoundException, not the intended user). It is a latent correctness bug that fixing #1 must not worsen.

## 2. Goal

Make the backend that backs the settings system **enforced, scoped, audited, and bounded** — so that a CENTER_MANAGER can only read and write their own center's settings, a SUPER_ADMIN can do everything, and every privileged action is recorded. No data migrations, no frontend behavior changes, no new permissions tables. This is the foundation sub-project; later sub-projects (B: schema unification, C: onboarding, D: per-module polish, E: per-feature RBAC) build on it.

## 3. Non-goals (explicitly deferred)

- **Per-user granular permissions** (a `UserPermission` table). Decision recorded: role-based + per-center scope is sufficient for the two-type model. The Teams page's per-user toggles become a later sub-project's concern (C).
- **Unifying the two persistence patterns** (`useSettingsGroup` vs `managerConfig.*`). That is sub-project B.
- **Adding role gates to the ~35 unguarded resolvers** (booking, revenue, crm, wallet, …). That is sub-project E. This spec only hardens the **settings and user-management surface**: `center.resolver` (settings queries/mutations), `user.resolver`, and the audit log.
- **Moving Notification secrets out of plaintext JSONB.** Deferred to sub-project D.
- **Fixing the stale `CLAUDE.md` claim** about there being no client-side role gate. That is a doc fix, tracked separately at the end.
- **Adding a center picker** for multi-center super-admins. Deferred to sub-project B.

## 4. Decisions (all recorded, none pending)

| # | Decision | Rationale |
|---|---|---|
| D1 | **Permission model = role-based + per-center ownership scope.** SUPER_ADMIN = all centers; CENTER_MANAGER = their assigned center only. No per-user toggles in this sub-project. | Matches the two-type model the user described. Avoids a new table and data migration. The code already half-implements this via `centerScope`; we make it work. |
| D2 | **Add `centerId` to the runtime `req.user` object** in both hydration paths, sourced from the JWT claim. One-line additions in two files. | The claim already exists (`jwt-payload.type.ts:19`, signed at `auth.service.ts:366`). We stop stripping it. |
| D3 | **Standardize `req.user` on `JwtPayload` field names** (`sub`, `sid`) — but **do this by widening, not renaming**: populate both `sub`/`id` and `sid`/`sessionId` on `req.user`, and update `AuthenticatedUser` / resolver reads to prefer the canonical `sub`/`sid`. | Avoids a flag-day rename across ~35 resolvers while making the typed access (`current.sub`) correct. Both names present = nothing breaks during the transition; later sub-projects can drop the aliases. |
| D4 | **Add a `@CenterScoped('centerIdArg')` guard** that auto-checks "if the caller is a CENTER_MANAGER, the centerId arg must equal `caller.centerId`." SUPER_ADMIN bypasses. | Centralizes the ownership check so every settings mutation gets it without bespoke logic per resolver. |
| D5 | **Enforce settings-mutation authorization** via `@Roles(SUPER_ADMIN, CENTER_OWNER, CENTER_MANAGER)` + `@CenterScoped()` on `updateCenterSettings` and `centerSettings`. Read-only center queries (`centers`, `center`, `myCenters`) already scope via `centerScope` and just need fix #1. | Smallest change that closes the hole. CENTER_MANAGER can manage their own center; SUPER_ADMIN can manage any; everyone else is denied. |
| D6 | **Fix `setUserRole` to store the role verbatim**, removing the `toEntityRole()` indirection. | `DashboardAdminRole` values already match `EntityUserRole` values (the `createAdminUser` path relies on this at `user.resolver.ts:159`). The mapping is both wrong and unnecessary. |
| D7 | **Register `AuditService` in a new tiny `AuditModule`** (depends only on `TypeOrmModule.forFeature([AuditLog])`, no auth dep — avoids DI cycles), export it, and import that module where `UserResolver` and `CenterResolver` live; inject `AuditService` into both; record audit entries on settings mutations, role changes, activate/deactivate, create/delete user. | The infrastructure (`AuditLog` entity, audit-log resolver, `AuditService.record`) already exists and is wired for reads. We close the write side. A dedicated `AuditModule` is the conventional Nest shape and avoids a circular import with `AuthModule`. |
| D8 | **Add a settings key whitelist + size cap** to `deepMergeSettings`. Whitelist is the known set consumed by today's frontend: `bookingDefaults, workspaceDefaults, operations, managerConfig, finance, notifications, security, bookingRules, roomDefaults, maintenance, permissions, permissionsSecurity, permissionsNotifications`. Cap payload at 64 KB and recursion depth at 5. | Bounds the unbounded JSON without a typed-entities rewrite (deferred to B). The whitelist is additive — new keys require an explicit spec change, which is the intended friction. |
| D9 | **No DB migration.** All fixes are code-only. `AuditLog.centerId` column already exists (migration `20260809300000`). `User.centerId` already exists. | Keeps the change reversible and low-risk. |

## 5. Design

### 5.1 Fix the `req.user` shape (defects #1, #6)

**Files:** `apps/api/src/auth/strategies/jwt.strategy.ts`, `apps/api/src/graphql/graphql.config.ts`, `apps/api/src/auth/decorators/current-user.decorator.ts`

The `JwtStrategy.validate` return and the `hydrateUserFromToken` object both currently produce `{ id, email, role, sessionId }`. Change both to also carry `centerId` and the canonical aliases:

```ts
// jwt.strategy.ts validate() — returns the object Nest attaches to req.user
return {
  sub: payload.sub,
  id: payload.sub,        // alias, keep for transition (D3)
  email: payload.email,
  role: payload.role,
  centerId: payload.centerId ?? null,   // NEW — stops stripping the claim (D2)
  sid: payload.sid,
  sessionId: payload.sid,  // alias, keep for transition (D3)
};
```

Identical change in `graphql.config.ts` `hydrateUserFromToken` (lines 190-195), reading `payload.centerId` from the verified token. The `JwtStrategy.JwtPayload` interface (lines 18-26) already declares `sub`/`sid`/`typ` but **not** `centerId`; add `centerId?: string | null` to it so the strategy reads the claim it signs.

Update `AuthenticatedUser` (`current-user.decorator.ts:15-20`) to add `sub: string` and `centerId?: string | null` and `sid?: string`. Keep `id`/`sessionId` as aliases. Resolvers typed `@CurrentUser() current: JwtPayload` now read correct values whether they use `current.sub` or `current.centerId`.

**Risk:** `JwtStrategy.validate` does a DB lookup (`findByIdActive`) on every request already, so we could source `centerId` from the DB row instead of the claim. **Decision: source from the claim**, matching `auth.service.ts:366`, so role/centerId stay consistent within a token's lifetime and we don't add query surface. If a user's center is reassigned, they must re-login to pick up the new scope — acceptable and documented in the audit trail.

### 5.2 `@CenterScoped()` guard (decision D4)

**New file:** `apps/api/src/auth/guards/center-scoped.guard.ts`
**New decorator:** `apps/api/src/auth/decorators/center-scoped.decorator.ts`

A guard that, for a CENTER_MANAGER caller, asserts the resolver's named centerId arg equals `caller.centerId`. SUPER_ADMIN (and other unscoped roles) pass through. Usage:

```ts
@Mutation(() => String)
@Roles(UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
@CenterScoped('centerId')   // arg name to check against caller.centerId
async updateCenterSettings(@Args('centerId') centerId: string, …)
```

Semantics:
- Reads `@CenterScoped()` metadata → the arg name (string). Default `'centerId'`.
- Reads the arg from `GqlExecutionContext` `getArgs()`.
- If `caller.role === CENTER_MANAGER`:
  - If `caller.centerId` is missing → `ForbiddenException` (misconfigured manager; should never happen post-D2).
  - If `arg !== caller.centerId` → `ForbiddenException('Not allowed to access this center')`. Also records a `PERMISSION_DENIED` audit entry (D7).
  - Else pass.
- All other roles → pass (they're gated by `@Roles` for *what* they can do; center scoping doesn't apply to a SUPER_ADMIN who can touch any center).

**Why a guard and not inline checks:** the settings surface has two mutations now and will grow in sub-project B; a guard makes the check mandatory and declarative. The audit-log resolver already does inline `centerScope` filtering for reads — we leave its read-time filtering in place (that's data scoping, different concern from mutation authorization) and only add the guard to mutations.

### 5.3 Settings resolver hardening (defect #2, decision D5)

**File:** `apps/api/src/graphql/resolvers/center.resolver.ts`

```ts
@Query(() => String, { description: 'Center settings as a JSON string' })
@Roles(UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
@CenterScoped('centerId')
async centerSettings(@Args('centerId') centerId: string, …)

@Mutation(() => String, { description: 'Update center settings (JSON string), returns merged settings' })
@Roles(UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
@CenterScoped('centerId')
async updateCenterSettings(
  @Args('centerId') centerId: string,
  @Args('settings') settings: string,
  @CurrentUser() caller: JwtPayload,
  @Context() context: any,
): Promise<string> {
  // existing deep-merge logic, plus:
  //  - validate against whitelist + size cap (D8)
  //  - record audit entry (D7): action 'CENTER_SETTINGS_UPDATE',
  //    entityType 'Center', entityId centerId, changes = { keys: Object.keys(incoming) }
  //    (not the full payload — values may contain secrets later)
}
```

The class already lacks `@UseGuards`; the global `GqlAuthGuard` covers authentication. We add `@Roles` + `@CenterScoped`, which require `RolesGuard` and `CenterScopedGuard` to run. Register both guards at the class level on `CenterResolver`:

```ts
@Resolver(() => CenterEntity)
@UseGuards(GqlAuthGuard, RolesGuard, CenterScopedGuard)
export class CenterResolver { … }
```

(The global `GqlAuthGuard` still runs as `APP_GUARD`; listing it again on the class is harmless and makes the guard order explicit. `RolesGuard` and `CenterScopedGuard` are not global.)

`createCenter`, `updateCenter`, `deleteCenter` currently have no `@Roles` either. **Add `@Roles(SUPER_ADMIN)` to all three** — center lifecycle is a super-admin action (matches the onboarding model where the super admin creates centers and assigns managers). `updateCenter` takes `id`, not `centerId`, so for it `@CenterScoped('id')` lets a manager update their own center's non-settings fields.

### 5.4 Fix `setUserRole` (defect #3, decision D6)

**File:** `apps/api/src/graphql/resolvers/user.resolver.ts`

Delete `toEntityRole()` (lines 38-42) and the comment above it. Change `setUserRole` to store the role directly:

```ts
const updated = await this.userRepo.update(id, { role });
```

`UserRole` (the GraphQL/entity enum) is the same values as `EntityUserRole` — they're re-exports of the same enum (`roles.enum.ts:11` re-exports from `graphql/types/user.type.ts`). The mapping was always a no-op for ADMIN/MEMBER and a demotion for CENTER_MANAGER. Record a `ROLE_ESCALATION_BLOCKED`-style audit entry: action `'USER_ROLE_CHANGE'`, entityId the target user id, changes `{ from: oldRole, to: role }`.

**Guard against self-demotion of the last super admin:** before applying, if the target is the caller themselves and `role !== SUPER_ADMIN`, count remaining SUPER_ADMINs; if this would zero the count, throw `BadRequestException('Cannot demote the last super admin')`. Cheap (one `count` query), prevents lockout.

### 5.5 Activate `AuditService` (defect #4, decision D7)

**Files:** `apps/api/src/auth/auth.module.ts`, `apps/api/src/graphql/resolvers/center.resolver.ts`, `apps/api/src/graphql/resolvers/user.resolver.ts`, `apps/api/src/auth/services/audit.service.ts`

1. **Register the provider.** Add `AuditService` to `AuthModule` `providers` and `exports` (`auth.module.ts:50-59`). `AuditLog` entity is already registered in `TypeOrmModule.forFeature([...])` in `typeorm.module.ts`, so the repo injection in `AuditService` constructor resolves.
2. **Import `AuthModule`** wherever we inject `AuditService`. `CenterResolver` and `UserResolver` live in the GraphQL layer; confirm whether the GraphQL module already imports `AuthModule` (it imports `UserRepositoryModule` per the exports). If not, add `imports: [AuthModule]` to the resolver's module, or — simpler — re-export `AuditService` from a shared `AuditModule`. **Decision: put `AuditService` in a new tiny `AuditModule`** (`apps/api/src/auth/audit.module.ts`) that imports `TypeOrmModule.forFeature([AuditLog])` and exports `AuditService`. Then `CenterResolver`/`UserResolver`'s containing modules import `AuditModule`. This breaks the cycle cleanly (audit has no auth dependency) and is the conventional Nest shape.
3. **Inject and call.** In `CenterResolver` and `UserResolver` constructors, add `private readonly audit: AuditService`. Call `this.audit.record({...})` in:
   - `updateCenterSettings` → action `'CENTER_SETTINGS_UPDATE'`
   - `updateCenter` / `createCenter` / `deleteCenter` → `'CENTER_UPDATE'` / `'CENTER_CREATE'` / `'CENTER_DELETE'`
   - `setUserRole` → `'USER_ROLE_CHANGE'`
   - `setUserActive` → `'USER_ACTIVE_CHANGE'`
   - `createAdminUser` → `'USER_CREATE'`
   - `deleteUser` → `'USER_DELETE'`
4. **Extend the `AuditAction` union** (`audit.service.ts:34-57`) with the new actions: `'CENTER_SETTINGS_UPDATE' | 'CENTER_UPDATE' | 'CENTER_CREATE' | 'CENTER_DELETE' | 'USER_ROLE_CHANGE' | 'USER_ACTIVE_CHANGE' | 'USER_CREATE' | 'USER_DELETE'`. Also set `centerId` on each entry — but `AuditEntry` (`audit.service.ts:59-69`) currently has no `centerId` field, even though the `AuditLog` **entity** does (added by migration `20260809300000`). Add `centerId?: string | null` to `AuditEntry` and write it in `record()` (`this.repo.create({ ..., centerId: entry.centerId ?? null })`).
5. **Capture request metadata.** `ipAddress` and `userAgent` from `context.req.headers`; `userId` from `caller.sub`. Keep `record()` fire-and-forget (it already swallows errors — that contract is preserved).

The existing `GET_AUDIT_LOGS` query and the audit-log resolver (which already filters by `centerScope` — `audit-log.resolver.ts:53`) gain working scoping for free once D2 lands: a CENTER_MANAGER's audit log view will now correctly show only their center's entries.

### 5.6 Settings payload bounds (defect #5, decision D8)

**File:** `apps/api/src/common/utils/settings.util.ts`

Add two guards to `deepMergeSettings`, or a wrapping function `sanitizeSettings(incoming)` called before merge in `updateCenterSettings`:

```ts
const SETTINGS_WHITELIST = new Set([
  'bookingDefaults', 'workspaceDefaults', 'operations', 'managerConfig',
  'finance', 'notifications', 'security', 'bookingRules', 'roomDefaults',
  'maintenance', 'permissions', 'permissionsSecurity', 'permissionsNotifications',
]);
const MAX_SETTINGS_BYTES = 64 * 1024;
const MAX_MERGE_DEPTH = 5;

export function sanitizeSettings(incoming: Record<string, any>): Record<string, any> {
  const json = JSON.stringify(incoming);
  if (json.length > MAX_SETTINGS_BYTES) {
    throw new BadRequestException(`Settings payload exceeds ${MAX_SETTINGS_BYTES} bytes`);
  }
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (SETTINGS_WHITELIST.has(key)) out[key] = value;
  }
  return out;
}
```

`deepMergeSettings` gets a depth param to cap recursion at `MAX_MERGE_DEPTH` (throws otherwise). `updateCenterSettings` calls `sanitizeSettings(incoming)` before `deepMergeSettings`. **Non-whitelisted keys are silently dropped** (not errored) — the frontend never sends unknown keys today, and dropping is safer than 500-ing a valid save that happens to include a stray field. Log a warning via Nest `Logger` when keys are dropped, so a future frontend bug surfaces.

### 5.7 Read-path scoping re-verification (defect #1, downstream)

After D2, `centerScope()` works. Re-verify (no code change needed unless tests fail) that these read paths now actually scope a CENTER_MANAGER:
- `centers`, `center`, `myCenters` (`center.resolver.ts:62-121`) — already call `centerScope`.
- `users` (`user.resolver.ts:77-87`) — already calls `centerScope`.
- `seats` (`center.resolver.ts:342-356`) — already calls `centerScope`.
- `auditLogs` (`audit-log.resolver.ts:45-53`) — already calls `centerScope`.

The `user` query (`user.resolver.ts:89-95`, fetches by id) does **not** scope — a CENTER_MANAGER could fetch any user by id. **Add `@CenterScoped` is not applicable here (arg is `id`, not `centerId`)**; instead add an inline ownership check: after fetching the user, if `caller.role === CENTER_MANAGER && fetchedUser.centerId !== caller.centerId`, throw `ForbiddenException`. This is a new 4-line guard inside the resolver body, not a decorator change.

## 6. Data flow

```
Client (SUPER_ADMIN or CENTER_MANAGER)
  │  Authorization: Bearer <jwt with sub, role, centerId, sid>
  ▼
GqlAuthGuard (global) ── validates JWT ──▶ req.user = { sub, id, email, role, centerId, sid, sessionId }
  │                                            (D2: centerId now present)
  ▼
RolesGuard ── checks @Roles(...) against req.user.role
  │
  ▼
CenterScopedGuard ── if CENTER_MANAGER, asserts args.centerId === req.user.centerId (D4)
  │                   on deny: ForbiddenException + PERMISSION_DENIED audit (D7)
  ▼
Resolver method
  │  - sanitizeSettings(incoming)   ── whitelist + size cap (D8)
  │  - deepMergeSettings(depth≤5)   ── bounded recursion
  │  - repo.update(...)
  │  - audit.record({ action: 'CENTER_SETTINGS_UPDATE', centerId, ... })  (D7)
  ▼
Response (merged settings JSON string)
```

## 7. Affected files

| File | Change | Defect |
|---|---|---|
| `apps/api/src/auth/strategies/jwt.strategy.ts` | Return `centerId` + canonical aliases from `validate()`; add `centerId` to local `JwtPayload` | #1, #6 |
| `apps/api/src/graphql/graphql.config.ts` | `hydrateUserFromToken` returns `centerId` + aliases | #1, #6 |
| `apps/api/src/auth/decorators/current-user.decorator.ts` | Widen `AuthenticatedUser` (`sub`, `centerId`, `sid`; keep aliases) | #6 |
| `apps/api/src/auth/guards/center-scoped.guard.ts` | **NEW** — `CenterScopedGuard` | #2 |
| `apps/api/src/auth/decorators/center-scoped.decorator.ts` | **NEW** — `@CenterScoped(argName)` | #2 |
| `apps/api/src/auth/audit.module.ts` | **NEW** — tiny module exporting `AuditService` | #4 |
| `apps/api/src/auth/auth.module.ts` | Import or re-export `AuditModule`; (AuditService provider lives in AuditModule now) | #4 |
| `apps/api/src/auth/services/audit.service.ts` | Add `centerId` to `AuditEntry`; write it in `record()`; extend `AuditAction` union | #4 |
| `apps/api/src/graphql/resolvers/center.resolver.ts` | `@UseGuards(GqlAuthGuard, RolesGuard, CenterScopedGuard)`; `@Roles` + `@CenterScoped` on settings queries/mutations and center CRUD; call `audit.record`; `sanitizeSettings` before merge | #2, #4, #5 |
| `apps/api/src/graphql/resolvers/user.resolver.ts` | Remove `toEntityRole`; `setUserRole` stores verbatim + last-super-admin guard + audit; audit on `setUserActive`/`createAdminUser`/`deleteUser`; ownership check in `user(id)` | #3, #4 |
| `apps/api/src/common/utils/settings.util.ts` | `sanitizeSettings` whitelist + size cap; depth limit on `deepMergeSettings` | #5 |
| The resolver's containing module (`graphql.module.ts` or wherever resolvers are registered) | `imports: [AuditModule]` so `AuditService` injects | #4 |

No frontend changes. No migrations. No schema-breaking GraphQL changes (the `updateCenterSettings(centerId, settings)` signature is unchanged; only its authorization changes).

## 8. Testing

The workspace uses Jest. Existing API tests: `apps/api/src/auth/services/auth.service.spec.ts` (already mocks `AuditService`). Plan:

1. **Unit: `centerScope` + `CenterScopedGuard`.**
   - `centerScope` returns `centerId` for a CENTER_MANAGER payload (was previously untestable because no payload carried it).
   - `CenterScopedGuard` passes SUPER_ADMIN regardless of arg; denies CENTER_MANAGER with mismatched arg (assert `ForbiddenException`); passes CENTER_MANAGER with matching arg; denies CENTER_MANAGER with null `centerId`.
2. **Unit: `sanitizeSettings` + `deepMergeSettings`.**
   - Whitelist drops unknown top-level keys; keeps known; size cap throws on >64KB; depth cap throws at depth 6.
   - Existing deep-merge behavior preserved for whitelisted keys.
3. **Unit: `setUserRole` fix.**
   - Stores `CENTER_MANAGER` verbatim (regression test for the demotion bug). Last-super-admin guard throws when demoting the final one.
4. **Unit: `AuditService.record` writes `centerId`.**
   - Confirm the `AuditLog` row carries the passed `centerId` (the entity column exists; we're verifying the service now populates it).
5. **Integration: resolver authorization.** Use the existing `auth.service.spec.ts` `Test`-module pattern. Build a minimal `ApolloModule` test module with `CenterResolver` + mocked repos, and assert:
   - `updateCenterSettings` as MEMBER → `FORBIDDEN`.
   - `updateCenterSettings` as CENTER_MANAGER on own center → succeeds, audit entry written.
   - `updateCenterSettings` as CENTER_MANAGER on other center → `FORBIDDEN`, `PERMISSION_DENIED` audit written.
   - `updateCenterSettings` as SUPER_ADMIN on any center → succeeds.
   - `centerSettings` read as CENTER_MANAGER on other center → `FORBIDDEN`.
6. **Manual smoke (post-deploy).** With a seeded SUPER_ADMIN and CENTER_MANAGER (seed script exists at `apps/api/src/auth/scripts/seed-admin.ts`), confirm from the web UI that (a) saving any settings page as a manager still works, (b) the audit log page shows the new entries scoped to the manager's center, (c) a crafted GraphQL request to another center's settings as a manager returns `FORBIDDEN`.

No changes to existing tests are expected to break, because the only behavior changes are (a) adding authorization where there was none (no test asserted the open access), (b) adding a field to `req.user` (additive), and (c) fixing `setUserRole` (no test covered the demotion). The `auth.service.spec.ts` mock of `AuditService` (`useValue: { record: jest.fn() }`) continues to satisfy injection once `AuditService` is a real provider — but we add `AuditModule` to that test's imports so the provider resolves.

## 9. Rollout and reversibility

- **Pure code change, no migration.** Reverting any commit restores prior behavior.
- **No frontend coordination required.** The web already passes JWTs and centerId args; nothing about the wire protocol changes. The only user-visible change is that managers who previously could see other centers' data (a bug) now correctly cannot.
- **Backward compat of existing tokens.** Tokens issued before deploy don't carry `centerId` in `req.user`... wait — they *do* carry it in the signed claim (`auth.service.ts:366` has for a while); we only stop stripping it on read. So pre-deploy tokens work post-deploy. Post-deploy, behavior is correct immediately for all live tokens.
- **Feature-flag option (not chosen).** We could gate the new guards behind an env var (`ENFORCE_CENTER_SCOPE=true`) for a staged rollout. **Decision: don't.** The current behavior is a security hole, not a feature; shipping it flag-off defeats the purpose. If a manager is misconfigured (no centerId), the guard throws a clear `ForbiddenException` and surfaces the misconfig immediately — preferable to silent over-access.

## 10. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| A CENTER_MANAGER's JWT has no `centerId` (legacy data, user created before center assignment was mandatory). | Medium | The guard throws `ForbiddenException` with a clear message; the user re-logs in or a super-admin reassigns their center. Surfacing this is correct, not a regression. |
| An existing frontend save includes a settings key not in the whitelist (e.g. a future key added in sub-project B before this whitelist is updated). | Low | `sanitizeSettings` drops unknown keys silently and logs a warning; the save still succeeds for whitelisted keys. The whitelist is documented as additive and updated in the same PR that adds a key. |
| `AuditModule` import creates a DI cycle. | Low | `AuditModule` depends only on `TypeOrmModule.forFeature([AuditLog])` — no auth dep — so it cannot cycle with `AuthModule`. |
| Adding `@Roles(SUPER_ADMIN)` to `createCenter`/`updateCenter`/`deleteCenter` breaks an existing admin-script caller. | Low | The seed-admin script uses direct repo access, not the resolver. The dev `DEV_USERS` include `SUPER_ADMIN`. Documented in the spec. |
| Tests that relied on the open `updateCenterSettings` (if any exist) break. | Very low | Grep found none; the only settings-adjacent test is `auth.service.spec.ts`. |

## 11. Open questions for review

1. **`createCenter`/`updateCenter`/`deleteCenter` authorization.** I'm proposing `@Roles(SUPER_ADMIN)` — center lifecycle is a super-admin action in the onboarding model. If a `CENTER_OWNER` should also create centers, widen to `@Roles(SUPER_ADMIN, CENTER_OWNER)`. The enum has `CENTER_OWNER` but the frontend two-type model doesn't expose it. **Default: SUPER_ADMIN only; widen later if needed.**
2. **Audit payload granularity.** I'm recording `changes: { keys: [...] }` for settings updates (not the full values), because finance/security settings may later contain secrets (sub-project D will move Notification secrets out, but finance may add others). **Confirm:** is keys-only acceptable, or do you want full before/after diff for settings (richer audit, more PII/sensitive data in the log)?
3. **`@CenterScoped` vs inline ownership for `user(id)`.** I chose inline (4 lines) because the arg is `id`, not `centerId`, and the decorator would need a fetch-and-compare anyway. Acceptable, or prefer extending the decorator to take a callback?

## 12. Roadmap reminder (this is sub-project A of 5)

- **A (this spec):** Auth & permission foundation.
- **B:** Settings schema unification (one typed schema per module; center picker; drop the `managerConfig.*` split).
- **C:** Onboarding & user lifecycle (fix add-user wizard; per-user vs per-center perms; wire `Invitation`).
- **D:** Per-module polish (role-aware Security/Add-user views; kill mock data; move Notification secrets to masked store).
- **E:** Optional per-feature RBAC (`@RequiresCapability` on the ~35 unguarded resolvers).

## 13. Verification (Task 9, 2026-08-11)

**Build:** `npx nx build api` succeeds with no TypeScript compile errors (webpack compiled successfully; output `apps/api/dist/main.js`, ~1.1 MB). The Nx Cloud "workspace not connected" notice is a remote-cache no-op and does not affect the build.

**Tests:** `npx jest apps/api -c apps/api/jest.config.js` → **27/27 executing tests pass across 6 suites**, including every spec added by this plan (`center-scope.helper`, `center-scoped.guard`, `settings.util`, `audit.service`, `center.resolver`, `user.resolver`). 8 additional suites fail at module load because they `import ... from 'vitest'` under the Jest runner — these predate this plan (none were touched by Tasks 1–8) and are unchanged from the Task 1 baseline, so they are not regressions.

**Smoke (live API against local Postgres 17 on `localhost:5432`):** the API was started from the production webpack bundle and exercised over GraphQL. The smoke run surfaced one real runtime bug, which was fixed in commit `fff47a8` (`fix(auth): re-export AuditModule not AuditService in AuthModule`) — `AuthModule` had re-exported the `AuditService` *class*, which Nest's `Module.validateExportedProvider` rejects; re-exporting `AuditModule` instead is the canonical pattern and the API then booted (`Nest application successfully started`). After the fix, the verified live behaviors were: (1) `signin` issues real JWTs; (2) the global `GqlAuthGuard` rejects anonymous requests to protected resolvers with `UNAUTHENTICATED`; (3) `RolesGuard` returns `FORBIDDEN — Requires role: SUPER_ADMIN` when an ADMIN attempts `pruneAuditLogs` (Task 7's gate); (4) `setUserRole` succeeds for an ADMIN, the change persists, and a `USER_ROLE_CHANGE` row is written to `audit_logs` (with the Task 5 `centerId` column present) — proving the audit write path works end-to-end.

**Caveat:** the local dev database was missing the `audit_logs.centerId` column (the idempotent migration `20260809300000-AddAuditLogCenterId` exists in `apps/api/src/typeorm/migrations` but had not been applied to this DB instance; the Nest module gates `synchronize` behind `DATABASE_SYNCHRONIZE=true`, which is not set). The column was added via the migration's own idempotent DDL to complete the smoke; production deploys run migrations explicitly and are unaffected. No code change was needed for this — only DB-state alignment.
