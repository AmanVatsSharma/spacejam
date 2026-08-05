## Root cause

The operations/request page's list query fails, and create is also broken, because the frontend GraphQL documents and the backend schema are out of sync. Static evidence across `request.entity.ts`, `request.input.ts`, `request.resolver.ts`, and `use-operations.ts` confirms 5 distinct bugs. Bug 1 is the cause of the "query can't fetch data" error; the others are on the same feature and were chosen for a full sweep.

## Fix 1 — List query fails on nullable relation (the reported "can't fetch data" error)

**File:** `apps/api/src/typeorm/entities/request.entity.ts` (lines 108–121)

The `center` and `requestedBy` relations are declared **non-nullable** in the GraphQL schema, but their FK columns (`centerId?`, `requestedById?`) are nullable — and `createRequest` routinely saves rows with `centerId = null` because `AddRequestModal` doesn't send one (and sets `requestedById: user?.id`, which is undefined when unauth'd). So when `GET_REQUESTS` selects `center { id name }`, GraphQL errors: *"Cannot return null for non-nullable field `Request.center`"*, failing the whole list query.

**Edit:** make both relations nullable to match the data reality.
- Line 108: `@Field(() => Center)` → `@Field(() => Center, { nullable: true })`
- Line 113: `@Field(() => User)` → `@Field(() => User, { nullable: true })`

`assignedTo` is already nullable — no change. Page already null-guards with `r.requestedBy?.name ?? "Unknown"`.

## Fix 2 — CREATE_REQUEST selects non-existent fields

**File:** `apps/web/src/hooks/use-operations.ts` (lines 407–420)

`CREATE_REQUEST` selects `type` (should be `requestType`) and `priority` (doesn't exist — entity uses `urgency`). The selection set is rejected by schema validation before the resolver runs, so the row is never saved.

**Edit:** replace the selection set with `id title description requestType status urgency createdAt`.

## Fix 3 — UPDATE_REQUEST selects non-existent `priority`

**File:** `apps/web/src/hooks/use-operations.ts` (lines 393–405)

`UPDATE_REQUEST` selects `priority`. Same failure mode as Fix 2 (errors when the inline status dropdown calls `update(...)`).

**Edit:** remove the `priority` line; keep `urgency`.

## Fix 4 — ASSIGN_REQUEST selects non-existent `assignedToName`

**File:** `apps/web/src/hooks/use-operations.ts` (lines 374–385)

`ASSIGN_REQUEST` selects `assignedToName`, which is not a field on the `Request` object type and has no field resolver. Same validation failure.

**Edit:** remove the `assignedToName` line (keep `assignedToId`).

## Fix 5 — Dormant filter column mismatch

**File:** `apps/api/src/graphql/resolvers/request.resolver.ts` (lines 33–34, 133)

The resolver maps `filters.type → where.type` and `requestsByType` builds `where = { type }`, but the entity column is `requestType` (there is no `type` column). Currently dormant because the page filters client-side, but will throw a TypeORM error the moment server-side type filtering is wired up.

**Edit:**
- Line 34: `if (filters.type) where.type = filters.type;` → `where.requestType = filters.type;`
- Line 133: `const where: any = { type };` → `const where: any = { requestType: type };`

## Verification

After edits:
1. `pnpm nx build api` — confirm API still compiles (schema change is additive/nullable, non-breaking).
2. `pnpm nx build web` — confirm web compiles (GraphQL is string-typed to Apollo, so this just checks no TS regressions).
3. Manual (you): load `/dashboard/operations/request` — table should populate instead of showing the "Error loading requests" row; submit a new request via the modal — should create and the new row should appear in the list after refetch.

## Files changed

- `apps/api/src/typeorm/entities/request.entity.ts` (2 lines)
- `apps/api/src/graphql/resolvers/request.resolver.ts` (2 lines)
- `apps/web/src/hooks/use-operations.ts` (3 documents)

No data migrations, no UI/UX changes, no new dependencies. All changes align the contract with what already exists.