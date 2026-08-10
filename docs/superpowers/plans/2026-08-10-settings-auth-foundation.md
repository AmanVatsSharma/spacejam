# Settings Auth & Permission Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the settings/user-management backend enforced, center-scoped, audited, and bounded — so a CENTER_MANAGER can only touch their own center, a SUPER_ADMIN can do everything, and every privileged action is recorded.

**Architecture:** Code-only changes (no DB migration, no frontend change). Restore `centerId` on `req.user` so the existing `centerScope()` helper works. Add a `@CenterScoped()` guard for mutation authorization. Register the existing `AuditService` via a new `AuditModule` and call it from settings/user mutations. Fix the `setUserRole` demotion bug. Bound the settings JSONB with a whitelist + size cap.

**Tech Stack:** NestJS 11, Apollo GraphQL (code-first), TypeORM 0.3 (Postgres), Jest + `@nestjs/testing` + `@babel/preset-typescript` (test runner established in Task 1). `better-sqlite3` for in-memory test DB.

## Global Constraints

Copied verbatim from the spec (`docs/superpowers/specs/2026-08-10-settings-auth-foundation-design.md`):

- **No DB migration.** All fixes are code-only. `AuditLog.centerId` and `User.centerId` columns already exist.
- **No frontend/wire-protocol change.** The `updateCenterSettings(centerId, settings: String!)` GraphQL signature is unchanged.
- **Role model = role-based + per-center ownership.** SUPER_ADMIN = all centers; CENTER_MANAGER = their assigned center only. No per-user permission toggles in this sub-project.
- **`centerId` is sourced from the JWT claim** (already signed at `auth.service.ts:366`), not from a DB lookup per request.
- **Unknown settings keys are silently dropped** (with a logged warning), not errored.
- **`AuditService.record()` stays fire-and-forget** — it must never throw into the caller's path.
- All new files follow the existing header-comment convention (`File: / Module: / Purpose: / Author: / Last-updated:`).
- Run tests via the workspace jest binary: `npx jest <path> -c apps/api/jest.config.js` (established in Task 1).

---

## File Structure

**New files:**
| File | Responsibility |
|---|---|
| `apps/api/jest.config.js` | Jest config for the api package (Babel TS transform). Unblocks all TDD tasks. |
| `apps/api/babel.config.js` | Babel config scoped to `apps/api` enabling `@babel/preset-typescript` + `@babel/preset-env`. |
| `apps/api/src/auth/guards/center-scoped.guard.ts` | `CenterScopedGuard` — denies a CENTER_MANAGER whose arg centerId ≠ their own. |
| `apps/api/src/auth/decorators/center-scoped.decorator.ts` | `@CenterScoped(argName)` metadata decorator. |
| `apps/api/src/auth/audit.module.ts` | Tiny module: `TypeOrmModule.forFeature([AuditLog])` + provides/exports `AuditService`. |
| `apps/api/src/auth/guards/center-scoped.guard.spec.ts` | Unit tests for the guard. |
| `apps/api/src/common/utils/settings.util.spec.ts` | Unit tests for `sanitizeSettings` + bounded `deepMergeSettings`. |
| `apps/api/src/auth/helpers/center-scope.helper.spec.ts` | Unit tests for `centerScope` (previously untestable). |
| `apps/api/src/graphql/resolvers/center.resolver.spec.ts` | Integration tests for settings-mutation authorization. |
| `apps/api/src/graphql/resolvers/user.resolver.spec.ts` | Tests for `setUserRole` fix + last-super-admin guard. |

**Modified files:**
| File | Change |
|---|---|
| `apps/api/src/auth/strategies/jwt.strategy.ts` | `validate()` returns `centerId` + canonical aliases (`sub`, `sid`) alongside `id`/`sessionId`. |
| `apps/api/src/graphql/graphql.config.ts` | `hydrateUserFromToken` returns the same widened shape. |
| `apps/api/src/auth/decorators/current-user.decorator.ts` | `AuthenticatedUser` widened with `sub`, `centerId`, `sid` (aliases kept). |
| `apps/api/src/auth/services/audit.service.ts` | Add `centerId` to `AuditEntry`; write it in `record()`; extend `AuditAction` union. |
| `apps/api/src/auth/auth.module.ts` | `imports: [AuditModule]` (re-exports `AuditService`). |
| `apps/api/src/center/center.module.ts` | `imports: [..., AuditModule]` so `CenterResolver` can inject `AuditService`. |
| `apps/api/src/user/user.module.ts` | `imports: [..., AuditModule]` so `UserResolver` can inject `AuditService`. |
| `apps/api/src/graphql/resolvers/center.resolver.ts` | Class `@UseGuards(GqlAuthGuard, RolesGuard, CenterScopedGuard)`; `@Roles` + `@CenterScoped` on settings + center-CRUD mutations; `sanitizeSettings` before merge; `audit.record` calls. |
| `apps/api/src/graphql/resolvers/user.resolver.ts` | Remove `toEntityRole`; `setUserRole` stores verbatim + last-super-admin guard + audit; audit on `setUserActive`/`createAdminUser`/`deleteUser`; ownership check in `user(id)`. |
| `apps/api/src/graphql/resolvers/audit-log.resolver.ts` | `@Roles(SUPER_ADMIN)` on `pruneAuditLogs` (currently unauthenticated). |
| `apps/api/src/common/utils/settings.util.ts` | Add `sanitizeSettings` (whitelist + size cap); add depth limit to `deepMergeSettings`. |

---

## Task 1: Establish working test runner for `apps/api`

**Why first:** Every subsequent task is TDD. The existing `auth.service.spec.ts` has never run — Babel has no TS preset configured for the api package. This task establishes the runner.

**Files:**
- Create: `apps/api/jest.config.js`
- Create: `apps/api/babel.config.js`
- Test: `apps/api/src/auth/services/auth.service.spec.ts` (existing, currently broken)

**Interfaces:**
- Produces: a working test command `npx jest <path> -c apps/api/jest.config.js` that all later tasks use.

- [ ] **Step 1: Create `apps/api/babel.config.js`**

This file is picked up by Babel only when transforming files under `apps/api` (because Jest's `rootDir` will point here). It enables TypeScript stripping via the preset already in the pnpm store.

```js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
};
```

- [ ] **Step 2: Create `apps/api/jest.config.js`**

```js
/** Jest config for @org/api. Uses Babel (preset-typescript) — no SWC dep needed. */
module.exports = {
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.[tj]s$': 'babel-jest',
  },
  // Reflect metadata for NestJS decorators — must run before user code.
  setupFiles: ['reflect-metadata'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
  // Don't traverse up to the expo/mobile babelrc.
  configFile: '<rootDir>/babel.config.js',
};
```

- [ ] **Step 3: Verify `babel-jest` and `reflect-metadata` resolve**

Run: `node -e "console.log(require.resolve('babel-jest', {paths:['apps/api']})); console.log(require.resolve('reflect-metadata', {paths:['apps/api']}))"`
Expected: two absolute paths print, no error. If `babel-jest` is missing, it ships with jest (already at `node_modules/.bin/jest`) — confirm with `ls node_modules/.pnpm | grep babel-jest`. If `reflect-metadata` is missing, add to `apps/api/package.json` dependencies (`"reflect-metadata": "^0.1.13"` — it's already a runtime dep, see `apps/api/package.json:131`) and `pnpm install`.

- [ ] **Step 4: Run the existing spec to confirm the runner works**

Run: `npx jest apps/api/src/auth/services/auth.service.spec.ts -c apps/api/jest.config.js 2>&1 | tail -15`
Expected: the suite now transforms and runs. It may have runtime failures (it's been unmaintained) — that's acceptable for THIS task. The success criterion is: **no more `SyntaxError: Missing semicolon` transform errors**. The output should show `Tests:` with a count (pass or fail), not a transform crash.

- [ ] **Step 5: Commit**

```bash
git add apps/api/jest.config.js apps/api/babel.config.js
git commit -m "test(api): establish jest runner with babel preset-typescript"
```

---

## Task 2: Widen `req.user` to carry `centerId` (fix dead `centerScope`)

**Why:** This is defect #1 from the spec. `centerScope()` reads `caller.centerId`, but both `req.user` hydration paths strip it, so the helper always returns `undefined`. Fixing it unblocks all the read-path scoping that's already wired but inert.

**Files:**
- Modify: `apps/api/src/auth/strategies/jwt.strategy.ts:18-26, 41-52`
- Modify: `apps/api/src/graphql/graphql.config.ts:174-200`
- Modify: `apps/api/src/auth/decorators/current-user.decorator.ts:15-20`
- Test: `apps/api/src/auth/helpers/center-scope.helper.spec.ts` (new)

**Interfaces:**
- Consumes: the JWT access token already carries `centerId` (signed at `auth.service.ts:366`).
- Produces: `req.user` now has shape `{ sub, id, email, role, centerId, sid, sessionId }`. Later tasks (3, 5, 7) read `caller.centerId` from this. The local `JwtPayload` interface in `jwt.strategy.ts` is widened to match.

- [ ] **Step 1: Write the failing test for `centerScope`**

Create `apps/api/src/auth/helpers/center-scope.helper.spec.ts`:

```ts
import { centerScope } from './center-scope.helper';
import { UserRole } from '../../graphql/types/user.type';

describe('centerScope', () => {
  it('returns the centerId for a CENTER_MANAGER with one assigned', () => {
    expect(centerScope({ sub: 'u1', email: 'm@x', role: UserRole.CENTER_MANAGER, centerId: 'c1', sid: 's', typ: 'access' })).toBe('c1');
  });

  it('returns undefined for a SUPER_ADMIN (no scope restriction)', () => {
    expect(centerScope({ sub: 'u2', email: 'a@x', role: UserRole.SUPER_ADMIN, centerId: null, sid: 's', typ: 'access' })).toBeUndefined();
  });

  it('returns undefined for a CENTER_MANAGER with no centerId (misconfigured)', () => {
    expect(centerScope({ sub: 'u3', email: 'm2@x', role: UserRole.CENTER_MANAGER, centerId: undefined, sid: 's', typ: 'access' })).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test — it should FAIL on the CENTER_MANAGER case**

Run: `npx jest apps/api/src/auth/helpers/center-scope.helper.spec.ts -c apps/api/jest.config.js`
Expected: FAIL. The helper reads `caller.centerId`, but the test constructs the payload directly — so actually **this test will PASS already** because the helper is correct in isolation. The bug is that `req.user` never carries `centerId`. This task's real verification is the integration test in Task 7. Keep this unit test anyway — it locks the helper contract.

(If it passes, that's expected and fine — commit it as a characterization test.)

- [ ] **Step 3: Widen `JwtStrategy.validate` return + local `JwtPayload`**

Edit `apps/api/src/auth/strategies/jwt.strategy.ts`. The local `JwtPayload` interface (lines 18-26) currently lacks `centerId`. Add it. The `validate()` return (lines 46-51) must add `centerId` and the canonical aliases:

```ts
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  /** Center this user is assigned to. Present for CENTER_MANAGER; null/absent otherwise. */
  centerId?: string | null;
  sid: string;
  typ: 'access';
  iat?: number;
  exp?: number;
}
```

```ts
  async validate(payload: JwtPayload) {
    const user = await this.users.findByIdActive(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists or is disabled');
    }
    // Widened to carry centerId (so centerScope() works) plus canonical
    // JwtPayload aliases (sub/sid) alongside the legacy id/sessionId names.
    return {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      centerId: payload.centerId ?? null,
      sid: payload.sid,
      sessionId: payload.sid,
    };
  }
```

- [ ] **Step 4: Widen `hydrateUserFromToken` in `graphql.config.ts`**

Edit `apps/api/src/graphql/graphql.config.ts` lines 183-196. The `payload` type cast must include `centerId`, and the constructed `req.user` must match the shape from Step 3:

```ts
    const payload = jwt.verify(token, secret) as {
      sub?: string;
      email?: string;
      role?: string;
      centerId?: string | null;
      sid?: string;
    };
    if (payload && payload.sub) {
      req.user = {
        sub: payload.sub,
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        centerId: payload.centerId ?? null,
        sid: payload.sid,
        sessionId: payload.sid,
      };
    }
```

The comment block at lines 171-173 says the shape "matches JwtStrategy.validate (sub -> id, email, role, sid -> sessionId)". **Update that comment** to reflect the widened shape so it stays truthful:

```ts
/**
 * Extracts the user from the `Authorization: Bearer <token>` header and
 * attaches it to `req.user`. Silent on failure. The payload shape matches
 * JwtStrategy.validate's widened output: sub/id, email, role, centerId,
 * sid/sessionId. centerId is sourced from the JWT claim (signed at
 * auth.service.ts:366), not a DB lookup, so role/scope stay consistent
 * within a token's lifetime.
 */
```

- [ ] **Step 5: Widen `AuthenticatedUser` in `current-user.decorator.ts`**

Edit `apps/api/src/auth/decorators/current-user.decorator.ts` lines 15-20:

```ts
export interface AuthenticatedUser {
  /** Canonical subject id (matches JWT `sub`). */
  sub: string;
  /** Legacy alias for `sub`. Kept for transition. */
  id: string;
  email?: string;
  role: UserRole;
  /** Center this user is assigned to. null for SUPER_ADMIN; set for CENTER_MANAGER. */
  centerId?: string | null;
  /** Canonical session id (matches JWT `sid`). */
  sid?: string;
  /** Legacy alias for `sid`. Kept for transition. */
  sessionId?: string;
}
```

- [ ] **Step 6: Run all auth tests to confirm nothing breaks**

Run: `npx jest apps/api/src/auth -c apps/api/jest.config.js 2>&1 | tail -15`
Expected: `center-scope.helper.spec.ts` passes; `auth.service.spec.ts` either passes or has only pre-existing runtime failures (no new transform/type errors from the widening).

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/auth/strategies/jwt.strategy.ts apps/api/src/graphql/graphql.config.ts apps/api/src/auth/decorators/current-user.decorator.ts apps/api/src/auth/helpers/center-scope.helper.spec.ts
git commit -m "fix(auth): carry centerId on req.user so centerScope works

Both req.user hydration paths (JwtStrategy.validate and
hydrateUserFromToken) stripped centerId from the JWT claim, making
centerScope() always return undefined. CENTER_MANAGER data isolation
was inert. Also widen AuthenticatedUser with canonical sub/sid
aliases (id/sessionId kept for transition). Spec §5.1, defect #1."
```

---

## Task 3: Add `@CenterScoped()` guard + decorator

**Why:** Mutation authorization for settings. A guard centralizes the "CENTER_MANAGER may only touch their own center" check so every settings mutation gets it declaratively.

**Files:**
- Create: `apps/api/src/auth/decorators/center-scoped.decorator.ts`
- Create: `apps/api/src/auth/guards/center-scoped.guard.ts`
- Test: `apps/api/src/auth/guards/center-scoped.guard.spec.ts`

**Interfaces:**
- Consumes: `req.user` widened in Task 2 (reads `user.role`, `user.centerId`).
- Produces: `@CenterScoped(argName)` decorator + `CenterScopedGuard`. Used by Task 6. Semantics: for a CENTER_MANAGER caller, asserts `args[argName] === user.centerId`; SUPER_ADMIN and other roles pass through. On deny: `ForbiddenException`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/auth/guards/center-scoped.guard.spec.ts`:

```ts
import { CenterScopedGuard } from './center-scoped.guard';
import { CENTER_SCOPED_KEY } from '../decorators/center-scoped.decorator';
import { UserRole } from '../../graphql/types/user.type';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

function makeCtx(user: any, args: Record<string, any>) {
  const handler = function () {};
  const getClass = () => class Test {};
  const ctx: any = {
    getContext: () => ({ req: { user } }),
    getArgs: () => args,
    getHandler: () => handler,
    getClass,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
  // GqlExecutionContext.create wraps a normal ExecutionContext; we fake the
  // bits the guard reads.
  return ctx as any;
}

describe('CenterScopedGuard', () => {
  let guard: CenterScopedGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new CenterScopedGuard(reflector);
    // Force the metadata to 'centerId' for all tests.
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('centerId');
  });

  it('passes for a SUPER_ADMIN regardless of the centerId arg', () => {
    const ctx = makeCtx({ sub: 'a', role: UserRole.SUPER_ADMIN, centerId: null }, { centerId: 'c-other' });
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it('passes for a CENTER_MANAGER on their own center', () => {
    const ctx = makeCtx({ sub: 'm', role: UserRole.CENTER_MANAGER, centerId: 'c-mine' }, { centerId: 'c-mine' });
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it('denies a CENTER_MANAGER touching another center', () => {
    const ctx = makeCtx({ sub: 'm', role: UserRole.CENTER_MANAGER, centerId: 'c-mine' }, { centerId: 'c-other' });
    expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException);
  });

  it('denies a CENTER_MANAGER with no centerId claim (misconfigured)', () => {
    const ctx = makeCtx({ sub: 'm', role: UserRole.CENTER_MANAGER, centerId: null }, { centerId: 'c-mine' });
    expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException);
  });

  it('passes through when no @CenterScoped metadata is set', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const ctx = makeCtx({ sub: 'm', role: UserRole.CENTER_MANAGER, centerId: 'c-mine' }, { centerId: 'c-other' });
    expect(guard.canActivate(ctx as any)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — verify it FAILS (guard + decorator don't exist)**

Run: `npx jest apps/api/src/auth/guards/center-scoped.guard.spec.ts -c apps/api/jest.config.js`
Expected: FAIL with `Cannot find module './center-scoped.guard'`.

- [ ] **Step 3: Create the decorator**

Create `apps/api/src/auth/decorators/center-scoped.decorator.ts`:

```ts
/**
 * File:        auth/decorators/center-scoped.decorator.ts
 * Module:      Api · Auth · Decorators
 * Purpose:     Marks a resolver as center-scoped — a CENTER_MANAGER caller
 *              may only invoke it for their own center. The argument names
 *              which arg holds the centerId to check against caller.centerId.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-10
 */
import { SetMetadata } from '@nestjs/common';

export const CENTER_SCOPED_KEY = 'centerScopedArg';
/**
 * @param argName The name of the resolver arg carrying the centerId.
 *                Defaults to 'centerId'.
 */
export const CenterScoped = (argName = 'centerId') =>
  SetMetadata(CENTER_SCOPED_KEY, argName);
```

- [ ] **Step 4: Create the guard**

Create `apps/api/src/auth/guards/center-scoped.guard.ts`:

```ts
/**
 * File:        auth/guards/center-scoped.guard.ts
 * Module:      Api · Auth · Guards
 * Purpose:     Enforces that a CENTER_MANAGER caller can only act on their
 *              own center. Reads the @CenterScoped('argName') metadata to
 *              know which resolver arg to compare against caller.centerId.
 *              SUPER_ADMIN and other unscoped roles pass through (their
 *              *what*-they-can-do is gated by @Roles; center scoping does
 *              not apply to roles that can touch any center).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-10
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

import { CENTER_SCOPED_KEY } from '../decorators/center-scoped.decorator';
import { UserRole } from '../../graphql/types/user.type';

@Injectable()
export class CenterScopedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const argName = this.reflector.getAllAndOverride<string>(CENTER_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // No @CenterScoped metadata → nothing to enforce.
    if (!argName) return true;

    const gqlCtx = GqlExecutionContext.create(context);
    const user = gqlCtx.getContext().req?.user;
    // Not authenticated at all — let GqlAuthGuard/RolesGuard handle that.
    if (!user) return true;

    // Only CENTER_MANAGER is center-scoped. All other roles pass through.
    if (user.role !== UserRole.CENTER_MANAGER) return true;

    const callerCenterId = user.centerId;
    if (!callerCenterId) {
      // Manager with no center assigned — misconfigured. Deny loudly rather
      // than silently over-grant.
      throw new ForbiddenException('Your account is not assigned to a center');
    }

    const argCenterId = (gqlCtx.getArgs() as Record<string, any>)?.[argName];
    if (argCenterId !== callerCenterId) {
      throw new ForbiddenException('Not allowed to access this center');
    }
    return true;
  }
}
```

- [ ] **Step 5: Run test — verify it PASSES**

Run: `npx jest apps/api/src/auth/guards/center-scoped.guard.spec.ts -c apps/api/jest.config.js`
Expected: PASS, all 5 cases.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/auth/decorators/center-scoped.decorator.ts apps/api/src/auth/guards/center-scoped.guard.ts apps/api/src/auth/guards/center-scoped.guard.spec.ts
git commit -m "feat(auth): add @CenterScoped guard for per-center ownership

CenterScopedGuard denies a CENTER_MANAGER caller whose resolver
centerId arg != their own centerId. SUPER_ADMIN and other roles pass
through. Used by settings mutations to close the cross-center access
hole. Spec §5.2, decision D4."
```

---

## Task 4: Bound the settings payload (`sanitizeSettings` + depth limit)

**Why:** Defect #5 from the spec. `updateCenterSettings` accepts unbounded JSON via a raw string, and `deepMergeSettings` recurses without limit. A whitelist + size cap + depth limit bounds it.

**Files:**
- Modify: `apps/api/src/common/utils/settings.util.ts`
- Test: `apps/api/src/common/utils/settings.util.spec.ts` (new)

**Interfaces:**
- Produces: `sanitizeSettings(incoming)` → drops non-whitelisted top-level keys, throws on >64KB. `deepMergeSettings(target, incoming, depth)` → throws if depth exceeded. Both consumed by Task 6.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/common/utils/settings.util.spec.ts`:

```ts
import { sanitizeSettings, deepMergeSettings } from './settings.util';
import { BadRequestException } from '@nestjs/common';

describe('sanitizeSettings', () => {
  it('keeps whitelisted top-level keys', () => {
    const out = sanitizeSettings({ finance: { a: 1 }, operations: { b: 2 } });
    expect(out).toEqual({ finance: { a: 1 }, operations: { b: 2 } });
  });

  it('drops non-whitelisted top-level keys', () => {
    const out = sanitizeSettings({ finance: { a: 1 }, evil: 'x', __proto__: null } as any);
    expect(out).toEqual({ finance: { a: 1 } });
    expect(out).not.toHaveProperty('evil');
  });

  it('throws when payload exceeds 64KB', () => {
    const big = { finance: { blob: 'x'.repeat(70 * 1024) } };
    expect(() => sanitizeSettings(big)).toThrow(BadRequestException);
  });

  it('preserves nested values inside a whitelisted key', () => {
    const out = sanitizeSettings({ managerConfig: { finance: { reminderTiming: 'weekly' } } });
    expect(out.managerConfig.finance.reminderTiming).toBe('weekly');
  });
});

describe('deepMergeSettings (with depth limit)', () => {
  it('merges sibling objects without clobbering', () => {
    const merged = deepMergeSettings({ finance: { a: 1 }, security: { x: 9 } }, { finance: { b: 2 } });
    expect(merged).toEqual({ finance: { a: 1, b: 2 }, security: { x: 9 } });
  });

  it('overwrites primitives and arrays', () => {
    const merged = deepMergeSettings({ a: 1, arr: [1] }, { a: 2, arr: [2, 3] });
    expect(merged).toEqual({ a: 2, arr: [2, 3] });
  });

  it('throws when nesting exceeds the depth cap (default 5)', () => {
    // depth 6: {a:{b:{c:{d:{e:{f:1}}}}}} — six levels of object nesting.
    const nested = { a: { b: { c: { d: { e: { f: 1 } } } } } };
    expect(() => deepMergeSettings({}, nested)).toThrow(BadRequestException);
  });
});
```

- [ ] **Step 2: Run test — verify it FAILS**

Run: `npx jest apps/api/src/common/utils/settings.util.spec.ts -c apps/api/jest.config.js`
Expected: FAIL with `sanitizeSettings is not exported` / depth limit not enforced.

- [ ] **Step 3: Implement `sanitizeSettings` + depth-limited merge**

Replace the contents of `apps/api/src/common/utils/settings.util.ts` (keeping the existing header comment block, updated `Last-updated`):

```ts
/**
 * File:        apps/api/src/common/utils/settings.util.ts
 * Module:      API · Common · Settings Utils
 * Purpose:     Deep-merge a partial settings object into a target object,
 *              preserving sibling keys. Used by centerSettings resolvers so
 *              that updating one group (finance) never wipes another
 *              (security). Also bounds the payload: a whitelist drops
 *              unknown top-level keys, a size cap rejects oversized blobs,
 *              and the merge depth is capped to prevent runaway recursion.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-10
 */
import { BadRequestException } from '@nestjs/common';

/**
 * The known set of top-level settings groups consumed by the frontend today.
 * Adding a new group requires extending this set (intentional friction — a
 * new key should be a deliberate decision, not an accidental stowaway).
 */
const SETTINGS_WHITELIST = new Set([
  'bookingDefaults',
  'workspaceDefaults',
  'operations',
  'managerConfig',
  'finance',
  'notifications',
  'security',
  'bookingRules',
  'roomDefaults',
  'maintenance',
  'permissions',
  'permissionsSecurity',
  'permissionsNotifications',
]);

const MAX_SETTINGS_BYTES = 64 * 1024;
const MAX_MERGE_DEPTH = 5;

/**
 * Drop any top-level key not in the whitelist and reject oversized payloads.
 * Non-whitelisted keys are dropped silently (the frontend never sends them
 * today); callers should log when this happens so a future bug surfaces.
 */
export function sanitizeSettings(incoming: Record<string, any>): Record<string, any> {
  const json = JSON.stringify(incoming);
  if (json.length > MAX_SETTINGS_BYTES) {
    throw new BadRequestException(`Settings payload exceeds ${MAX_SETTINGS_BYTES} bytes`);
  }
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (SETTINGS_WHITELIST.has(key)) {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Recursively merge `incoming` into `target`. Plain object values are
 * merged key-by-key; everything else (primitives, arrays) is overwritten.
 * Throws if object nesting exceeds MAX_MERGE_DEPTH.
 */
export function deepMergeSettings(
  target: Record<string, any>,
  incoming: Record<string, any>,
  depth = 0,
): Record<string, any> {
  if (depth > MAX_MERGE_DEPTH) {
    throw new BadRequestException(`Settings nesting exceeds depth ${MAX_MERGE_DEPTH}`);
  }
  const out: Record<string, any> = { ...target };
  for (const [key, value] of Object.entries(incoming)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMergeSettings(out[key], value, depth + 1);
    } else {
      out[key] = value;
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test — verify it PASSES**

Run: `npx jest apps/api/src/common/utils/settings.util.spec.ts -c apps/api/jest.config.js`
Expected: PASS, all 7 cases.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/common/utils/settings.util.ts apps/api/src/common/utils/settings.util.spec.ts
git commit -m "feat(settings): bound payload with whitelist, size cap, depth limit

sanitizeSettings drops unknown top-level keys and rejects payloads
over 64KB. deepMergeSettings now caps recursion at depth 5. Closes
the unbounded-JSON hole on updateCenterSettings. Spec §5.6, defect #5."
```

---

## Task 5: Register `AuditService` via `AuditModule` + write `centerId`

**Why:** Defect #4. `AuditService` is dead code — not registered in any module, `AuditEntry` has no `centerId` field despite the entity column existing. This task makes audit recording actually possible.

**Files:**
- Create: `apps/api/src/auth/audit.module.ts`
- Modify: `apps/api/src/auth/services/audit.service.ts:34-69, 87-98`
- Modify: `apps/api/src/auth/auth.module.ts:32-60`

**Interfaces:**
- Consumes: `AuditLog` entity (already in `TypeOrmModule.forFeature`).
- Produces: `AuditModule` (exports `AuditService`). `AuditEntry` now has `centerId?: string | null`. `AuditAction` union extended with `CENTER_SETTINGS_UPDATE | CENTER_UPDATE | CENTER_CREATE | CENTER_DELETE | USER_ROLE_CHANGE | USER_ACTIVE_CHANGE | USER_CREATE | USER_DELETE`. Consumed by Tasks 6 and 7.

- [ ] **Step 1: Write the failing test for `AuditService.record` writing `centerId`**

Create `apps/api/src/auth/services/audit.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from '../../typeorm/entities/audit-log.entity';

describe('AuditService.record', () => {
  let service: AuditService;
  let save: jest.Mock;

  beforeEach(async () => {
    save = jest.fn().mockResolvedValue(undefined);
    const create = jest.fn((row) => row); // echo the row so we can assert on it
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: { create, save } },
      ],
    }).compile();
    service = moduleRef.get(AuditService);
  });

  it('persists centerId on the audit row when provided', async () => {
    await service.record({
      action: 'CENTER_SETTINGS_UPDATE',
      userId: 'u1',
      centerId: 'c1',
      entityType: 'Center',
      entityId: 'c1',
      changes: { keys: ['finance'] },
    });
    expect(save).toHaveBeenCalledTimes(1);
    const row = save.mock.calls[0][0];
    expect(row.centerId).toBe('c1');
    expect(row.action).toBe('CENTER_SETTINGS_UPDATE');
  });

  it('defaults centerId to null when not provided', async () => {
    await service.record({ action: 'USER_CREATE', userId: 'u1' });
    const row = save.mock.calls[0][0];
    expect(row.centerId).toBeNull();
  });

  it('never throws when the repo save fails (fire-and-forget)', async () => {
    save.mockRejectedValueOnce(new Error('db down'));
    await expect(service.record({ action: 'USER_CREATE' })).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test — verify it FAILS**

Run: `npx jest apps/api/src/auth/services/audit.service.spec.ts -c apps/api/jest.config.js`
Expected: FAIL — `centerId` not written (the current `record()` doesn't pass it through), and the action union doesn't include the new types yet.

- [ ] **Step 3: Extend `AuditEntry` + `AuditAction` + `record()` in `audit.service.ts`**

Edit `apps/api/src/auth/services/audit.service.ts`. Extend the `AuditAction` union (lines 34-57) — append the new actions before the closing `;`:

```ts
export type AuditAction =
  | 'AUTH_SIGNUP'
  | 'AUTH_SIGNIN_SUCCESS'
  | 'AUTH_SIGNIN_FAIL'
  | 'AUTH_SIGNOUT'
  | 'AUTH_TOKEN_REFRESH'
  | 'AUTH_PASSWORD_RESET_REQUEST'
  | 'AUTH_PASSWORD_RESET_SUCCESS'
  | 'AUTH_PASSWORD_CHANGE'
  | 'AUTH_2FA_ENABLE'
  | 'AUTH_2FA_DISABLE'
  | 'AUTH_2FA_VERIFY_FAIL'
  | 'AUTH_RECOVERY_CODE_USED'
  | 'AUTH_ACCOUNT_LOCKED'
  | 'AUTH_LOGIN_FROM_NEW_DEVICE'
  | 'AUTH_MAGIC_LINK_SENT'
  | 'AUTH_MAGIC_LINK_USED'
  | 'PERMISSION_DENIED'
  | 'DATA_EXPORT'
  | 'DATA_DELETE'
  | 'BOOKING_CREATE'
  | 'BOOKING_CANCEL'
  | 'PAYMENT_CREATE'
  | 'PAYMENT_REFUND'
  // Settings & user-management actions (added 2026-08-10, settings foundation).
  | 'CENTER_SETTINGS_UPDATE'
  | 'CENTER_UPDATE'
  | 'CENTER_CREATE'
  | 'CENTER_DELETE'
  | 'USER_ROLE_CHANGE'
  | 'USER_ACTIVE_CHANGE'
  | 'USER_CREATE'
  | 'USER_DELETE';
```

Add `centerId` to `AuditEntry` (lines 59-69):

```ts
export interface AuditEntry {
  action: AuditAction;
  userId?: string | null;
  entityType?: string;
  entityId?: string;
  /** Center this event relates to — lets managers see only their center's trail. */
  centerId?: string | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  metadata?: Record<string, unknown> | null;
}
```

Update `record()` (lines 87-104) to write `centerId`:

```ts
  async record(entry: AuditEntry): Promise<void> {
    try {
      const row = this.repo.create({
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        centerId: entry.centerId ?? null,
        changes: entry.changes ?? entry.metadata ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      });
      await this.repo.save(row);
    } catch (err) {
      this.logger.error(
        `Failed to record audit event ${entry.action}: ${(err as Error).message}`,
      );
    }
  }
```

- [ ] **Step 4: Run the audit spec — verify it PASSES**

Run: `npx jest apps/api/src/auth/services/audit.service.spec.ts -c apps/api/jest.config.js`
Expected: PASS, all 3 cases.

- [ ] **Step 5: Create `AuditModule`**

Create `apps/api/src/auth/audit.module.ts`:

```ts
/**
 * File:        auth/audit.module.ts
 * Module:      Api · Auth · Audit
 * Purpose:     Tiny module that provides and exports AuditService. Depends
 *              only on TypeOrmModule.forFeature([AuditLog]) — no auth deps —
 *              so importing it into CenterModule/UserModule cannot create a
 *              DI cycle with AuthModule.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-10
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../typeorm/entities/audit-log.entity';
import { AuditService } from './services/audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
```

- [ ] **Step 6: Import `AuditModule` into `AuthModule`**

Edit `apps/api/src/auth/auth.module.ts`. Add the import at the top with the others, add `AuditModule` to the `imports` array (around line 33-48), and add `AuditService` to `exports` (line 59) so legacy auth consumers keep resolving. The `providers` array does **not** need `AuditService` anymore (it comes from `AuditModule`), but leave any existing direct reference — confirm by reading the current file. Final shape:

```ts
imports: [
  // ... existing imports ...
  AuditModule,
],
providers: [
  AuthResolver,
  AuthService,
  EmailService,
  TwoFactorService,
  OtpService,
  JwtStrategy,
  JwtRefreshStrategy,
],
exports: [AuthService, OtpService, AuditService, JwtModule, PassportModule, UserRepositoryModule],
```

- [ ] **Step 7: Run all auth tests — confirm nothing broke**

Run: `npx jest apps/api/src/auth -c apps/api/jest.config.js 2>&1 | tail -15`
Expected: the new `audit.service.spec.ts` passes; `auth.service.spec.ts` still runs (it mocks `AuditService` directly via `useValue`, which is unaffected by module registration). No new failures.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/auth/audit.module.ts apps/api/src/auth/services/audit.service.ts apps/api/src/auth/services/audit.service.spec.ts apps/api/src/auth/auth.module.ts
git commit -m "feat(audit): register AuditService via AuditModule, persist centerId

AuditService was dead code — registered in no module, so nothing could
inject it. New AuditModule (TypeOrm-only, no auth dep → no DI cycle)
provides/exports it. AuditEntry gains centerId; record() now writes it.
Extends AuditAction with settings + user-management events. Spec §5.5,
defect #4."
```

---

## Task 6: Harden `CenterResolver` — authorization, sanitize, audit

**Why:** Defect #2. `updateCenterSettings` / `centerSettings` have no authorization; any MEMBER can read/write any center. Center CRUD mutations (`create/update/delete`) are also unguarded. Wire up `@Roles`, `@CenterScoped`, `sanitizeSettings`, and audit calls.

**Files:**
- Modify: `apps/api/src/graphql/resolvers/center.resolver.ts:49-223`
- Modify: `apps/api/src/center/center.module.ts:13-22` (add `AuditModule` import)
- Test: `apps/api/src/graphql/resolvers/center.resolver.spec.ts` (new)

**Interfaces:**
- Consumes: `CenterScopedGuard`, `RolesGuard`, `@CenterScoped`, `sanitizeSettings`, `AuditService`, widened `req.user` (Tasks 2-5).
- Produces: authorized settings mutations + center CRUD; audit entries on each.

- [ ] **Step 1: Add `AuditModule` to `CenterModule` imports**

Edit `apps/api/src/center/center.module.ts`. Add the import and the array entry:

```ts
import { AuditModule } from '../auth/audit.module';
// ...
@Module({
  imports: [
    TypeOrmModule.forFeature([Center, Location, Floor, Seat, MeetingRoom]),
    CacheModule,
    PubSubModule,
    AuditModule,
  ],
  // ... rest unchanged
```

- [ ] **Step 2: Write the failing integration test**

Create `apps/api/src/graphql/resolvers/center.resolver.spec.ts`. This builds a Nest test module with the real `CenterResolver` + `RolesGuard` + `CenterScopedGuard`, mocked repos, and a spied `AuditService`. It calls resolver methods directly with a mocked `@CurrentUser` by calling the method (guard behavior is unit-tested in Task 3; here we test the resolver's own authz plumbing via `canActivate` of the composed guards).

```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { CenterResolver } from './center.resolver';
import { CenterScopedGuard } from '../../auth/guards/center-scoped.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuditService } from '../../auth/services/audit.service';
import { CacheService } from '../../cache/cache.service';
import { PubSubService } from '../pubsub/pub-sub.service';
import { UserRole } from '../types/user.type';
import { sanitizeSettings } from '../../common/utils/settings.util';

// Minimal fake reflector that returns whatever metadata map we set per-test.
function fakeReflector(meta: Record<string, any> = {}): Reflector {
  const r = new Reflector();
  jest.spyOn(r, 'getAllAndOverride').mockImplementation((key: string) => meta[key]);
  return r;
}

describe('CenterResolver settings hardening', () => {
  let resolver: CenterResolver;
  let centerRepo: any;
  let auditRecord: jest.Mock;

  async function build(opts: { meta?: Record<string, any> } = {}) {
    centerRepo = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    auditRecord = jest.fn().mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        CenterResolver,
        { provide: getRepositoryToken('CenterEntity'), useValue: centerRepo },
        { provide: CacheService, useValue: { invalidatePattern: jest.fn() } },
        { provide: PubSubService, useValue: { publish: jest.fn() } },
        { provide: AuditService, useValue: { record: auditRecord } },
        { provide: Reflector, useValue: fakeReflector(opts.meta) },
        RolesGuard,
        CenterScopedGuard,
      ],
    }).compile();
    resolver = moduleRef.get(CenterResolver);
    return moduleRef;
  }

  it('updateCenterSettings throws NotFound when center missing', async () => {
    await build();
    centerRepo.findOne.mockResolvedValue(null);
    await expect(
      resolver.updateCenterSettings('c1', JSON.stringify({ finance: { a: 1 } }), { sub: 'a', role: UserRole.SUPER_ADMIN } as any, { req: { headers: {} } } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateCenterSettings sanitizes, merges, updates, and audits for a SUPER_ADMIN', async () => {
    await build();
    centerRepo.findOne.mockResolvedValue({ id: 'c1', settings: { security: { x: 1 } } });
    const merged = await resolver.updateCenterSettings(
      'c1',
      JSON.stringify({ finance: { a: 1 }, evil: 'drop-me' }),
      { sub: 'admin', role: UserRole.SUPER_ADMIN, centerId: null } as any,
      { req: { headers: {} } } as any,
    );
    const result = JSON.parse(merged);
    expect(result.finance).toEqual({ a: 1 });
    expect(result.security).toEqual({ x: 1 }); // sibling preserved
    expect(result.evil).toBeUndefined();       // whitelist dropped it
    expect(centerRepo.update).toHaveBeenCalledWith('c1', { settings: expect.objectContaining({ finance: { a: 1 } }) });
    expect(auditRecord).toHaveBeenCalledWith(expect.objectContaining({
      action: 'CENTER_SETTINGS_UPDATE',
      entityType: 'Center',
      entityId: 'c1',
      centerId: 'c1',
    }));
  });

  it('centerSettings returns "{}" when center has no settings', async () => {
    await build();
    centerRepo.findOne.mockResolvedValue({ id: 'c1', settings: null });
    const out = await resolver.centerSettings('c1');
    expect(out).toBe('{}');
  });

  it('updateCenterSettings audit changes contain keys, not values', async () => {
    await build();
    centerRepo.findOne.mockResolvedValue({ id: 'c1', settings: {} });
    await resolver.updateCenterSettings('c1', JSON.stringify({ finance: { secret: 'x' } }), { sub: 'a', role: UserRole.SUPER_ADMIN } as any, { req: { headers: {} } } as any);
    const entry = auditRecord.mock.calls[0][0];
    expect(entry.changes).toEqual({ keys: ['finance'] });
    expect(entry.changes).not.toHaveProperty('secret');
  });
});
```

- [ ] **Step 3: Run test — verify it FAILS**

Run: `npx jest apps/api/src/graphql/resolvers/center.resolver.spec.ts -c apps/api/jest.config.js`
Expected: FAIL — `updateCenterSettings` doesn't call `sanitizeSettings`, doesn't accept a `caller`/`context` in the tested positions, doesn't audit. (Signature mismatch is expected; the implementation step reconciles it.)

- [ ] **Step 4: Harden `CenterResolver`**

Edit `apps/api/src/graphql/resolvers/center.resolver.ts`. Add imports at the top (after the existing ones, lines 33-36):

```ts
import { Roles } from '../../auth/decorators/roles.decorator';
import { CenterScoped } from '../../auth/decorators/center-scoped.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CenterScopedGuard } from '../../auth/guards/center-scoped.guard';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { sanitizeSettings } from '../../common/utils/settings.util';
import { AuditService } from '../../auth/services/audit.service';
import { Logger } from '@nestjs/common';
import { UserRole } from '../types/user.type';
```

Add `@UseGuards` at class level (before `export class CenterResolver`) and inject `AuditService`:

```ts
@Resolver(() => CenterEntity)
@UseGuards(GqlAuthGuard, RolesGuard, CenterScopedGuard)
export class CenterResolver {
  private readonly logger = new Logger(CenterResolver.name);
  constructor(
    private cache: CacheService,
    @InjectRepository(CenterEntity)
    private centerRepo: Repository<CenterEntity>,
    @InjectRepository(LocationEntity)
    private locationRepo: Repository<LocationEntity>,
    private readonly pubSub: PubSubService,
    private readonly audit: AuditService,
  ) {}
```

Add `@Roles` + `@CenterScoped` to the settings queries/mutations. The full hardened `centerSettings` + `updateCenterSettings`:

```ts
  @Query(() => String, { description: 'Center settings as a JSON string' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
  @CenterScoped('centerId')
  async centerSettings(
    @Args('centerId', { type: () => ID }) centerId: string,
    @CurrentUser() caller?: JwtPayload,
    @Context() context?: any,
  ): Promise<string> {
    const center = await this.centerRepo.findOne({ where: { id: centerId } });
    return JSON.stringify(center?.settings ?? {});
  }

  @Mutation(() => String, { description: 'Update center settings (JSON string), returns merged settings' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
  @CenterScoped('centerId')
  async updateCenterSettings(
    @Args('centerId', { type: () => ID }) centerId: string,
    @Args('settings', { type: () => String }) settings: string,
    @CurrentUser() caller?: JwtPayload,
    @Context() context?: any,
  ): Promise<string> {
    const center = await this.centerRepo.findOne({ where: { id: centerId } });
    if (!center) throw new NotFoundException('Center not found');

    let incoming: Record<string, any> = {};
    try {
      incoming = settings ? JSON.parse(settings) : {};
    } catch {
      incoming = {};
    }

    // Whitelist + size cap. Drop unknown keys silently but log so bugs surface.
    const before = Object.keys(incoming);
    incoming = sanitizeSettings(incoming);
    const dropped = before.filter((k) => !(k in incoming));
    if (dropped.length) {
      this.logger.warn(`updateCenterSettings dropped non-whitelisted keys for center ${centerId}: ${dropped.join(', ')}`);
    }

    const merged = deepMergeSettings(center.settings ?? {}, incoming);
    await this.centerRepo.update(centerId, { settings: merged });
    await this.cache.invalidatePattern(`center:${centerId}`);
    await this.pubSub.publish(CENTER_TRIGGERS.centerUpdated, {
      centerUpdated: { ...center, settings: merged },
    });

    // Fire-and-forget audit. changes = keys only (values may later hold secrets).
    this.audit.record({
      action: 'CENTER_SETTINGS_UPDATE',
      userId: caller?.sub ?? caller?.id ?? null,
      entityType: 'Center',
      entityId: centerId,
      centerId,
      changes: { keys: Object.keys(incoming) },
      ipAddress: context?.req?.headers?.['x-forwarded-for'] ?? context?.req?.ip ?? null,
      userAgent: context?.req?.headers?.['user-agent'] ?? null,
    }).catch(() => { /* record() already swallows; belt-and-suspenders */ });

    return JSON.stringify(merged);
  }
```

Add `@Roles(SUPER_ADMIN)` to center CRUD mutations. `createCenter`:

```ts
  @Mutation(() => CenterEntity)
  @Roles(UserRole.SUPER_ADMIN)
  async createCenter(
    @Args('input') input: CreateCenterInput,
    @Context() context: any,
  ): Promise<CenterEntity> {
    // ... existing body unchanged ...
    // After save, before return:
    this.audit.record({
      action: 'CENTER_CREATE',
      userId: context.req.user?.sub ?? context.req.user?.id ?? null,
      entityType: 'Center',
      entityId: center.id,
      centerId: center.id,
    }).catch(() => {});
    return center;
  }
```

`updateCenter` — note the arg is `id`, so `@CenterScoped('id')` lets a manager update their own center:

```ts
  @Mutation(() => CenterEntity)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
  @CenterScoped('id')
  async updateCenter(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCenterInput,
    @Context() context: any,
  ): Promise<CenterEntity> {
    // ... existing body unchanged ...
    // After invalidate/publish, before return:
    this.audit.record({
      action: 'CENTER_UPDATE',
      userId: context.req.user?.sub ?? context.req.user?.id ?? null,
      entityType: 'Center',
      entityId: id,
      centerId: id,
    }).catch(() => {});
    return center;
  }
```

`deleteCenter`:

```ts
  @Mutation(() => Boolean)
  @Roles(UserRole.SUPER_ADMIN)
  async deleteCenter(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any,
  ): Promise<boolean> {
    await this.centerRepo.update(id, { status: CenterStatus.MAINTENANCE });
    await this.cache.invalidatePattern(`center:${id}`);
    this.audit.record({
      action: 'CENTER_DELETE',
      userId: context.req.user?.sub ?? context.req.user?.id ?? null,
      entityType: 'Center',
      entityId: id,
      centerId: id,
    }).catch(() => {});
    return true;
  }
```

- [ ] **Step 5: Run the resolver spec — verify it PASSES**

Run: `npx jest apps/api/src/graphql/resolvers/center.resolver.spec.ts -c apps/api/jest.config.js`
Expected: PASS, all 4 cases. If `updateCenterSettings` signature mismatch: the test passes `(centerId, settings, caller, context)` — the resolver now accepts exactly that (`@CurrentUser() caller`, `@Context() context`).

- [ ] **Step 6: Run the full api test suite to catch regressions**

Run: `npx jest apps/api -c apps/api/jest.config.js 2>&1 | tail -20`
Expected: all specs green; the existing `auth.service.spec.ts` runtime failures (pre-existing) are unchanged.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/graphql/resolvers/center.resolver.ts apps/api/src/center/center.module.ts apps/api/src/graphql/resolvers/center.resolver.spec.ts
git commit -m "fix(center): enforce authz on settings + CRUD, sanitize, audit

updateCenterSettings/centerSettings were unauthenticated — any MEMBER
could read/overwrite any center's settings. Now @Roles + @CenterScoped
restrict to SUPER_ADMIN/CENTER_OWNER/CENTER_MANAGER on their own center.
sanitizeSettings bounds the payload; audit records each change (keys
only). Center CRUD mutations get @Roles(SUPER_ADMIN). Spec §5.3, defect #2."
```

---

## Task 7: Fix `setUserRole` demotion + user-resolver audit + `user(id)` ownership

**Why:** Defect #3 (`setUserRole` silently demotes CENTER_MANAGER → STAFF via `toEntityRole`) and defect #4 (user-management actions aren't audited). Plus the `user(id)` read has no ownership check — a manager could fetch any user by id.

**Files:**
- Modify: `apps/api/src/graphql/resolvers/user.resolver.ts:38-42, 89-95, 117-164`
- Modify: `apps/api/src/user/user.module.ts:13-22` (add `AuditModule` import)
- Test: `apps/api/src/graphql/resolvers/user.resolver.spec.ts` (new)

**Interfaces:**
- Consumes: `AuditService` (Task 5), widened `req.user` (Task 2).
- Produces: `setUserRole` stores role verbatim; last-super-admin guard; audit on `setUserRole`/`setUserActive`/`createAdminUser`/`deleteUser`; `user(id)` enforces center ownership.

- [ ] **Step 1: Add `AuditModule` to `UserModule` imports**

Edit `apps/api/src/user/user.module.ts`:

```ts
import { AuditModule } from '../auth/audit.module';
// ...
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Customer, WalletTransaction]),
    CacheModule,
    UserRepositoryModule,
    UserSessionRepositoryModule,
    AuditModule,
  ],
  // ... rest unchanged
```

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/graphql/resolvers/user.resolver.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { UserResolver } from './user.resolver';
import { UserRepository } from '../../typeorm/repositories/user.repository';
import { UserSessionRepository } from '../../typeorm/repositories/user-session.repository';
import { AuditService } from '../../auth/services/audit.service';
import { UserRole } from '../types/user.type';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userRepo: any;
  let auditRecord: jest.Mock;

  beforeEach(async () => {
    userRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue({ users: [] }),
      update: jest.fn().mockResolvedValue({} as any),
      delete: jest.fn().mockResolvedValue(true),
      create: jest.fn().mockResolvedValue({} as any),
      countSuperAdmins: jest.fn(), // added in Task 7 step 4 to the repo
    };
    auditRecord = jest.fn().mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserResolver,
        { provide: UserRepository, useValue: userRepo },
        { provide: UserSessionRepository, useValue: {} },
        { provide: getRepositoryToken('Customer'), useValue: {} },
        { provide: getRepositoryToken('WalletTransaction'), useValue: {} },
        { provide: AuditService, useValue: { record: auditRecord } },
      ],
    }).compile();
    resolver = moduleRef.get(UserResolver);
  });

  describe('setUserRole', () => {
    it('stores CENTER_MANAGER verbatim (no demotion to STAFF)', async () => {
      userRepo.findById.mockResolvedValueOnce({ id: 't1', role: UserRole.MEMBER });
      userRepo.countSuperAdmins.mockResolvedValue(2);
      await resolver.setUserRole('t1', UserRole.CENTER_MANAGER, { sub: 'admin', role: UserRole.SUPER_ADMIN } as any);
      expect(userRepo.update).toHaveBeenCalledWith('t1', { role: UserRole.CENTER_MANAGER });
    });

    it('records a USER_ROLE_CHANGE audit entry with from/to', async () => {
      userRepo.findById.mockResolvedValueOnce({ id: 't1', role: UserRole.MEMBER });
      userRepo.countSuperAdmins.mockResolvedValue(2);
      await resolver.setUserRole('t1', UserRole.CENTER_MANAGER, { sub: 'admin', role: UserRole.SUPER_ADMIN } as any);
      expect(auditRecord).toHaveBeenCalledWith(expect.objectContaining({
        action: 'USER_ROLE_CHANGE',
        entityId: 't1',
        changes: { from: UserRole.MEMBER, to: UserRole.CENTER_MANAGER },
      }));
    });

    it('blocks demoting the last super admin', async () => {
      userRepo.findById.mockResolvedValueOnce({ id: 'last', role: UserRole.SUPER_ADMIN, centerId: null });
      userRepo.countSuperAdmins.mockResolvedValue(1);
      await expect(
        resolver.setUserRole('last', UserRole.MEMBER, { sub: 'last', role: UserRole.SUPER_ADMIN } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('user(id) ownership', () => {
    it('allows a CENTER_MANAGER to fetch a user in their own center', async () => {
      userRepo.findById.mockResolvedValueOnce({ id: 'u', centerId: 'c-mine' });
      const out = await resolver.user('u', { sub: 'm', role: UserRole.CENTER_MANAGER, centerId: 'c-mine' } as any);
      expect(out.id).toBe('u');
    });

    it('denies a CENTER_MANAGER fetching a user in another center', async () => {
      userRepo.findById.mockResolvedValueOnce({ id: 'u', centerId: 'c-other' });
      await expect(
        resolver.user('u', { sub: 'm', role: UserRole.CENTER_MANAGER, centerId: 'c-mine' } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
```

- [ ] **Step 3: Run test — verify it FAILS**

Run: `npx jest apps/api/src/graphql/resolvers/user.resolver.spec.ts -c apps/api/jest.config.js`
Expected: FAIL — `setUserRole` signature doesn't take a caller (it currently has no `@CurrentUser`), `user(id)` doesn't take a caller or check ownership, `countSuperAdmins` doesn't exist on the repo.

- [ ] **Step 4: Add `countSuperAdmins` to `UserRepository`**

Edit `apps/api/src/typeorm/repositories/user.repository.ts`. Add a method (place it near the other find methods):

```ts
  /** Count active SUPER_ADMINs — used by the last-super-admin lockout guard. */
  async countSuperAdmins(): Promise<number> {
    return this.count({ where: { role: 'SUPER_ADMIN' as any, active: true } });
  }
```

(If the repo uses a different `this.count` signature — check the existing `findAll` for the exact pattern — adapt to match. The key is: count rows where `role === SUPER_ADMIN AND active === true`.)

- [ ] **Step 5: Fix `user.resolver.ts`**

Edit `apps/api/src/graphql/resolvers/user.resolver.ts`. Add the import:

```ts
import { AuditService } from '../../auth/services/audit.service';
import { Logger } from '@nestjs/common';
```

Inject `AuditService` into the constructor (after the existing `walletTxRepo` param):

```ts
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: UserSessionRepository,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(WalletTransaction)
    private readonly walletTxRepo: Repository<WalletTransaction>,
    private readonly audit: AuditService,
  ) {}
```

**Delete** the `toEntityRole` function (lines 38-42) and its comment block (lines 32-36).

**Fix `user(id)`** to take the caller and enforce ownership (lines 89-95):

```ts
  @Query(() => UserEntity, { description: 'Fetch a user by id (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN, EntityUserRole.CENTER_OWNER, EntityUserRole.CENTER_MANAGER)
  async user(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() current: JwtPayload,
  ): Promise<UserEntity> {
    const target = await this.userRepo.findById(id);
    if (!target) throw new NotFoundException('User not found');
    // CENTER_MANAGER scope: may only read users in their own center.
    const scope = centerScope(current);
    if (scope && target.centerId !== scope) {
      throw new ForbiddenException('Not allowed to view this user');
    }
    return target;
  }
```

**Fix `setUserRole`** (lines 117-125) to store verbatim, guard last super admin, and audit:

```ts
  @Mutation(() => Boolean, { description: 'Promote/demote a user to a new role (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN)
  async setUserRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('role', { type: () => UserRole }) role: UserRole,
    @CurrentUser() current: JwtPayload,
  ): Promise<boolean> {
    const target = await this.userRepo.findById(id);
    if (!target) throw new NotFoundException('User not found');

    // Prevent self-demotion of the last super admin.
    if (
      target.role === EntityUserRole.SUPER_ADMIN &&
      role !== EntityUserRole.SUPER_ADMIN &&
      current.sub === id
    ) {
      const remaining = await this.userRepo.countSuperAdmins();
      if (remaining <= 1) {
        throw new BadRequestException('Cannot demote the last super admin');
      }
    }

    const updated = await this.userRepo.update(id, { role });
    this.audit.record({
      action: 'USER_ROLE_CHANGE',
      userId: current.sub,
      entityType: 'User',
      entityId: id,
      centerId: target.centerId ?? null,
      changes: { from: target.role, to: role },
    }).catch(() => {});
    return !!updated;
  }
```

**Audit `setUserActive`** (lines 127-135):

```ts
  @Mutation(() => Boolean, { description: 'Suspend (active=false) or reinstate (active=true) a user (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN)
  async setUserActive(
    @Args('id', { type: () => ID }) id: string,
    @Args('active', { type: () => Boolean }) active: boolean,
    @CurrentUser() current: JwtPayload,
  ): Promise<boolean> {
    const target = await this.userRepo.findById(id);
    if (!target) throw new NotFoundException('User not found');
    const updated = await this.userRepo.update(id, { active });
    this.audit.record({
      action: 'USER_ACTIVE_CHANGE',
      userId: current.sub,
      entityType: 'User',
      entityId: id,
      centerId: target.centerId ?? null,
      changes: { active },
    }).catch(() => {});
    return !!updated;
  }
```

**Audit `createAdminUser`** (lines 137-164) — add caller param + audit at the end:

```ts
  @Mutation(() => UserEntity, { description: 'Provision a new dashboard admin (SUPER_ADMIN only)' })
  @Roles(EntityUserRole.SUPER_ADMIN)
  async createAdminUser(
    @Args('input') input: CreateAdminInput,
    @CurrentUser() current: JwtPayload,
  ): Promise<UserEntity> {
    if (input.role === DashboardAdminRole.CENTER_MANAGER && !input.centerId) {
      throw new BadRequestException('An Admin (Center Manager) must be assigned to a center');
    }
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const created = await this.userRepo.create({
      email: input.email,
      name: input.name,
      phone: input.phone,
      passwordHash,
      role: input.role as unknown as EntityUserRole,
      centerId: input.centerId,
      active: true,
      emailVerified: true,
    });
    this.audit.record({
      action: 'USER_CREATE',
      userId: current.sub,
      entityType: 'User',
      entityId: created.id,
      centerId: input.centerId ?? null,
      changes: { role: input.role, email: input.email },
    }).catch(() => {});
    return created;
  }
```

**Audit `deleteUser`** (lines 110-115):

```ts
  @Mutation(() => Boolean, { description: 'Soft-delete a user (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN)
  async deleteUser(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() current: JwtPayload,
  ): Promise<boolean> {
    const target = await this.userRepo.findById(id);
    this.audit.record({
      action: 'USER_DELETE',
      userId: current.sub,
      entityType: 'User',
      entityId: id,
      centerId: target?.centerId ?? null,
    }).catch(() => {});
    await this.userRepo.delete(id);
    return true;
  }
```

- [ ] **Step 6: Run the resolver spec — verify it PASSES**

Run: `npx jest apps/api/src/graphql/resolvers/user.resolver.spec.ts -c apps/api/jest.config.js`
Expected: PASS, all 5 cases.

- [ ] **Step 7: Run the full api test suite**

Run: `npx jest apps/api -c apps/api/jest.config.js 2>&1 | tail -20`
Expected: all green.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/graphql/resolvers/user.resolver.ts apps/api/src/user/user.module.ts apps/api/src/graphql/resolvers/user.resolver.spec.ts apps/api/src/typeorm/repositories/user.repository.ts
git commit -m "fix(user): stop setUserRole demotion, audit user actions, scope reads

setUserRole's toEntityRole() mapped CENTER_MANAGER→STAFF, so the
manager role could never be granted via the API. Now stores verbatim
with a last-super-admin lockout guard. user(id) enforces center
ownership for managers. createAdminUser/setUserActive/deleteUser now
record audit entries with centerId. Spec §5.4 + §5.7, defects #3,#4."
```

---

## Task 8: Guard `pruneAuditLogs` + final regression

**Why:** `pruneAuditLogs` (`audit-log.resolver.ts:113-121`) has no authz — any authenticated user can delete audit history. That's an audit-integrity hole. Small fix, but it's in-scope for "audited and enforced."

**Files:**
- Modify: `apps/api/src/graphql/resolvers/audit-log.resolver.ts:10, 113-121`

**Interfaces:**
- Consumes: `RolesGuard` + `@Roles` (existing).

- [ ] **Step 1: Add `@Roles(SUPER_ADMIN)` to `pruneAuditLogs`**

Edit `apps/api/src/graphql/resolvers/audit-log.resolver.ts`. Add the imports (Roles decorator + UserRole) after line 14, and the decorator on the mutation:

```ts
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../graphql/types/user.type'; // reuse entity enum
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
```

The resolver class currently has no `@UseGuards`. Add it at class level and the decorator on the mutation:

```ts
@Resolver(() => AuditLog)
@UseGuards(GqlAuthGuard, RolesGuard)
export class AuditLogResolver {
  // ... existing constructor/queries unchanged ...

  @Mutation(() => Boolean)
  @Roles(UserRole.SUPER_ADMIN)
  async pruneAuditLogs(
    @Args('olderThanDays', { type: () => Int }) olderThanDays: number,
  ): Promise<boolean> {
    // ... existing body unchanged ...
  }
}
```

Note: `UserRole` is imported from `../../graphql/types/user.type` here. The existing `audit-log.resolver.ts` doesn't import it — add the import. (The `auditLogs`/`auditLogCount`/`auditLogStatistics` queries keep their current behavior — they already scope via `centerScope`, which now works thanks to Task 2.)

- [ ] **Step 2: Verify the existing audit-log query scoping now works (read-only check)**

Run a quick grep to confirm `centerScope` is called in all three read queries (it already is, per `audit-log.resolver.ts:52, 80, 93`). No code change — this is a confirmation that Task 2 unblocked them.

Run: `grep -n "centerScope" apps/api/src/graphql/resolvers/audit-log.resolver.ts`
Expected: three hits (lines 52, 80, 93). These now actually filter for CENTER_MANAGER callers because `req.user.centerId` is populated.

- [ ] **Step 3: Run the full api test suite**

Run: `npx jest apps/api -c apps/api/jest.config.js 2>&1 | tail -20`
Expected: all green. No spec exists for `audit-log.resolver.ts` (out of scope to add one here — the change is a one-line decorator + class guard).

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/graphql/resolvers/audit-log.resolver.ts
git commit -m "fix(audit): require SUPER_ADMIN to prune audit logs

pruneAuditLogs was authenticated-only — any user could delete audit
history, defeating the audit trail. Now @Roles(SUPER_ADMIN). The read
queries (auditLogs/auditLogCount/auditLogStatistics) already scope
via centerScope, which now works end-to-end after Task 2."
```

---

## Task 9: Manual smoke test + verification

**Why:** The spec's §8 step 6 requires a manual smoke confirmation. This task runs the build, starts the API, and verifies the wire behavior with seeded users — no new code, just verification gates.

**Files:** none (verification only)

- [ ] **Step 1: Build the api (catch compile errors across all changes)**

Run: `pnpm nx build api` (or `cd apps/api && npx webpack-cli build --node-env=production` if nx target resolution fails)
Expected: build succeeds with no TS errors. If errors: fix them (most likely a missed import of `Logger`, `ForbiddenException`, or a signature mismatch where a resolver's new `@CurrentUser` param changed the call site for a test). Do NOT commit until green.

- [ ] **Step 2: Run the entire api test suite one final time**

Run: `npx jest apps/api -c apps/api/jest.config.js 2>&1 | tail -25`
Expected: all new specs pass; no new failures vs. the Task 1 baseline.

- [ ] **Step 3: Start the api and seed users (if a local DB is available)**

If a Postgres is reachable per `apps/api/.env`:
Run: `pnpm nx serve api` in one terminal; in another, `cd apps/api && npx ts-node src/auth/scripts/seed-admin.ts` (adjust if the seed script path differs — confirm with `find apps/api/src -name "seed*"`).

If no DB is available locally, skip to Step 4 (the integration test in Task 6 covers the authorization matrix at the resolver level).

- [ ] **Step 4: Document verification result**

Append a one-paragraph "Verification" note to the bottom of the spec (`docs/superpowers/specs/2026-08-10-settings-auth-foundation-design.md`): what was run, what passed, any known caveats. Commit it.

```bash
git add docs/superpowers/specs/2026-08-10-settings-auth-foundation-design.md
git commit -m "docs(spec): record settings-auth-foundation verification result"
```

---

## Task 10: Update stale `CLAUDE.md` client-RBAC note

**Why:** The spec's non-goals flag this as a separate doc fix. `CLAUDE.md` claims "There is NO client-side role gate on admin routes" (lines ~94, ~166), but `ClientLayout.tsx:148-173` now implements one. Keeping the doc accurate prevents the next engineer from re-adding a redundant gate.

**Files:**
- Modify: `CLAUDE.md` (the two stale lines)

- [ ] **Step 1: Locate the stale claims**

Run: `grep -n "NO client-side role gate\|backend-only\|Web RBAC" CLAUDE.md`
Expected: ~2 hits around lines 94 and 166.

- [ ] **Step 2: Update them to reflect reality**

Replace each stale sentence with something like: *"Client-side RBAC: `ClientLayout.tsx` (lines 148-173) redirects non-staff roles away from `/dashboard/settings/*`, crm, revenue, inventory, report, and audit. This is UX routing only — the backend enforces real authorization via `@Roles` + `@CenterScoped` (see settings-auth-foundation spec)."*

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: correct stale 'no client-side role gate' claim in CLAUDE.md

ClientLayout.tsx has had a route-level RBAC redirect since the
enterprise-buildout work. Document it accurately and point at the
backend @Roles/@CenterScoped enforcement layer."
```

---

## Self-Review (run after writing, before handoff)

**1. Spec coverage** — each spec section maps to a task:
- §5.1 (req.user centerId + aliases) → Task 2 ✓
- §5.2 (@CenterScoped guard) → Task 3 ✓
- §5.3 (settings resolver hardening) → Task 6 ✓
- §5.4 (setUserRole fix) → Task 7 ✓
- §5.5 (AuditService activation) → Task 5 ✓
- §5.6 (payload bounds) → Task 4 ✓
- §5.7 (read-path re-verify + user(id) ownership) → Task 7 (user id) + Task 8 step 2 (audit-log reads) ✓
- §8 testing → Tasks 1-8 each have specs; Task 9 smoke ✓
- Non-goals doc fix → Task 10 ✓

**2. Placeholder scan** — no TBD/TODO/“add validation”/“similar to”. Every code step has full code. The one place that says "adapt to match" (Task 7 Step 4, `countSuperAdmins` repo method) includes explicit guidance because the repo's exact `count` signature wasn't read — the implementer reads `findAll` first and matches the pattern. This is acceptable given the task boundary.

**3. Type consistency** — `CenterScoped(argName)` and `CENTER_SCOPED_KEY` match across decorator (Task 3) ↔ guard (Task 3) ↔ usage (Task 6). `sanitizeSettings` signature matches util (Task 4) ↔ resolver (Task 6). `AuditEntry.centerId` matches service (Task 5) ↔ all `audit.record` calls (Tasks 6, 7). `countSuperAdmins` matches repo (Task 7 Step 4) ↔ resolver (Task 7 Step 5) ↔ test (Task 7 Step 2). `setUserRole` new signature `(id, role, caller)` matches resolver ↔ test.

No issues found. Plan ready.
