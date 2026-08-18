# Fix Settings System (Super Admin + Center Manager) — Robustness Overhaul

## Root Causes Found (all reproduced)

**RC1 (critical, API):** `Center.settings` is `@Field(() => String)` but the jsonb column returns an object → GraphQL serialization **crashes** on `myCenters { settings }` for every user once any setting is saved. Confirmed in browser network log: `String cannot represent value: { finance: ... }`. With `errorPolicy: 'all'`, settings silently becomes `null` in the UI.

**RC2 (API):** Data-destroying chain — because saved settings always read as `null` (RC1), the 3 `CenterManager*Config` pages hydrate with **defaults**, then their auto-save `useEffect` fires on mount and **overwrites real saved settings with defaults**. Auto-save also fires on every keystroke and on server-load events.

**RC3 (API/web):** Teams page Permissions/Security/Notifications are stored per-CENTER but the UI shows them per-USER — editing one user changes all users (one shared blob).

**RC4 (web):** Super admin settings save to `myCenters[0]` — arbitrary center when multiple exist; no center picker.

**RC5 (web):** `MeQueryClient` skips `ME_QUERY` when dev-login is available → after a page reload the user object is lost ("Guest Member") → role-based tabs/pages render the wrong variant.

**RC6 (API):** DB role enums missing `SUPER_ADMIN`/`CENTER_OWNER`/`EMPLOYEE`/`COMPANY_ADMIN` on migration-bootstrapped DBs (align migration targets the wrong enum name `user_role_enum` vs `users_role_enum`).

**RC7 (API hardening):** `myCenters` has no `@Roles` (any MEMBER can list all centers incl. settings); `centerSettings`/`updateCenterSettings` omit the legacy `ADMIN` role that other resolvers accept.

## Changes

### API (`apps/api`)

1. **New JSON scalar** `src/graphql/scalars/json.scalar.ts` (identity passthrough, name `JSON`). Change `center.entity.ts` settings field to `@Field(() => JsonScalar, { nullable: true })`. Frontend components already treat `settings` as an object — no frontend change needed.
2. **Migration** `20260814100000-AddUserSettingsAndRoleEnums.ts` (idempotent):
   - `ALTER TABLE users ADD COLUMN IF NOT EXISTS "settings" jsonb NULL`
   - `DO $$ ALTER TYPE users_role_enum ADD VALUE ...` for the 4 missing roles (same for `user_role_enum`), duplicate-safe.
3. **`user.entity.ts`**: add `settings` jsonb column + JSON scalar field.
4. **`settings.util.ts`**: add `USER_SETTINGS_WHITELIST` (`permissions`, `permissionsSecurity`, `permissionsNotifications`) + `sanitizeUserSettings()`.
5. **`user.resolver.ts`**: new `userSettings(userId): String` and `updateUserSettings(userId, settings): String` — caller must be the target user OR staff role; CENTER_MANAGER restricted to target users in their own center (inline scope check like the existing `user()` query). Deep-merge + sanitize + audit `USER_SETTINGS_UPDATE`.
6. **Hardening**: `@Roles(ADMIN, SUPER_ADMIN, CENTER_OWNER, CENTER_MANAGER)` on `myCenters`; add `ADMIN` to `centerSettings`/`updateCenterSettings` role lists.

### Web (`apps/web`)

7. **`operations.ts`**: add `GET_USER_SETTINGS` / `UPDATE_USER_SETTINGS` operations.
8. **`use-settings.ts`**:
   - `useSettingsGroup` resolves centerId from a new shared active-center context instead of `myCenters[0]`.
   - New `useUserSettingsGroup(userId, group, defaults)` — same draft/save pattern against user settings.
   - New `useManagerCenterConfig(path, defaults)` — hydrates once from center settings, debounced auto-save **only when values differ from the last saved snapshot**, patches the `GET_MY_CENTERS` cache after save, toast feedback.
9. **New `active-center-context.tsx`** — loads `GET_MY_CENTERS`, persists selection in localStorage, exposes `{centers, activeCenter, setActiveCenter}`; registered in Providers. `ClientLayout` renders a compact center dropdown on `/dashboard/settings/*` when the user has >1 center.
10. **Rewrite 3 `CenterManager*Config` components** (finance, notification, operations) to use `useManagerCenterConfig` — identical UI, correct save semantics.
11. **Teams page** (`settings/page.tsx`): bind Permissions/Security/Notifications to the **selected user** via `useUserSettingsGroup`; seed from legacy center-level group when a user has no saved settings (data continuity).
12. **`auth-context.tsx`**: `MeQueryClient` runs `ME_QUERY` whenever a token exists (drop the dev-login skip) so role/tabs survive reloads.

## Verification

1. `vitest run` in apps/api (extend `center.resolver.spec.ts` + user settings specs).
2. Re-run the API repro script → no serialization error, whitelist still drops unknown keys, manager read/write own center works, cross-center blocked.
3. `nx build web` for type safety.
4. Browser E2E as SUPER_ADMIN (8 tabs, save/reload each, per-user permissions differ between two users) and CENTER_MANAGER (5 tabs, save/reload persists, auto-save no longer clobbers).
5. Remove temp repro folder afterward.

Notes: existing `Center.settings` legacy groups (`permissions*`) remain readable for seeding; the local dev DB already has the 4 role enum values added manually (the new migration makes that durable). Local test users `test@spacejam.com` (SUPER_ADMIN) / `manager@spacejam.com` (CENTER_MANAGER), password `Test@12345` — dev only.