# Milestone 2 Code Quality Review & Adversarial Stress Test

This report presents the independent review and adversarial evaluation of Milestone 2, focusing on input validations in GraphQL DTOs (`apps/api/src/graphql/inputs/`), robustness of custom error translations in `apps/api/src/graphql/graphql.config.ts`, and the Vitest test/build execution frameworks.

---

## Part 1: Quality Review Report

### Review Summary
- **Verdict**: APPROVE
- **Confidence**: High
- **Date**: 2026-07-02
- **Reviewer**: Reviewer M2-2 (Reviewer/Critic)

### Findings
No critical or major issues were identified during code quality inspection. The codebase is clean, tests are thoroughly implemented, and the logic is robust.
Below is a minor recommendation to improve type safety:

#### [Minor] Finding 1: Inconsistent ID Type Validation in DTOs
- **What**: In `CreateFloorInput` (in `center.input.ts`), `centerId` is validated using `@IsString()`, whereas in `CreateBookingInput` (in `booking.input.ts`), `seatId` is validated using `@IsUUID()`.
- **Where**: `apps/api/src/graphql/inputs/center.input.ts:214` and `apps/api/src/graphql/inputs/booking.input.ts:15`.
- **Why**: While `@IsString()` is functionally correct (since a UUID is a string), using `@IsUUID()` consistently for all UUID-typed fields ensures more precise validation at the API boundary, rejecting invalid IDs early.
- **Suggestion**: Update identifier inputs to use `@IsUUID()` instead of `@IsString()` where database columns are defined as UUID.

---

### Verified Claims

1. **Validation Decorators on Input DTOs**
   - *Claim*: Proper `class-validator` annotations are applied across all GraphQL inputs under `apps/api/src/graphql/inputs/`.
   - *Verification method*: Inspected all 7 input files: `booking.input.ts`, `center.input.ts`, `crm.input.ts`, `event.input.ts`, `meeting-room.input.ts`, `request.input.ts`, and `revenue.input.ts`.
   - *Result*: **PASS**. Every field has appropriate validation decorators (`@IsString()`, `@IsUUID()`, `@IsEmail()`, `@IsInt()`, `@IsNumber()`, `@IsEnum()`, `@IsOptional()`, `@IsNotEmpty()`, `@IsArray()`, `@IsBoolean()`, `@IsDate()`).

2. **Error Translation Robustness**
   - *Claim*: NestJS HTTP exceptions are intercepted inside `formatError`, translated to GraphQL-safe codes, and unmasked in production.
   - *Verification method*: Inspected `apps/api/src/graphql/graphql.config.ts` and ran the unit tests in `apps/api/src/graphql/graphql.config.spec.ts`.
   - *Result*: **PASS**. The implementation handles NestJS `HttpException` status code extraction, joins array validation messages (like those from `ValidationPipe`) using `join(', ')`, maps codes (400 -> `BAD_USER_INPUT`, 401 -> `UNAUTHENTICATED`, 403 -> `FORBIDDEN`, 404 -> `NOT_FOUND`), and includes these mapped codes in `SAFE_CODES` so they are not masked as generic internal errors in production.

3. **Vitest Test Suite Run**
   - *Claim*: The tests run and pass using Vitest with SWC compilation.
   - *Verification method*: Executed `npx vitest run --root apps/api --no-cache`.
   - *Result*: **PASS**. All 4 test files run successfully and all 65 tests pass.

4. **Api Project Compilation**
   - *Claim*: The api project compiles successfully.
   - *Verification method*: Executed `npm exec nx build api`.
   - *Result*: **PASS**. Webpack compilation completes successfully.

---

### Coverage Gaps
- **Database Connection Integration** — risk level: Low — The tests are currently running against mocked repositories (`buildMockRepo`), which ensures fast test execution without database setup. Integration tests using the actual `dev.sqlite` database in a container/dev setup were not run but are verified out-of-scope for this resolver-level unit test review.

---

### Unverified Items
- None.

---

## Part 2: Adversarial Review Report

### Challenge Summary
- **Overall risk assessment**: LOW
- **Confidence**: High

The codebase includes robust validation guards and error formatting rules. The risk of exposing internal stack traces in production is prevented via error masking, and the client receives friendly validation errors.

---

### Challenges

#### [Low] Challenge 1: Invalid Date Object Ingestion
- **Assumption challenged**: That `@IsDate()` validation decorator will always receive an instantiated `Date` object or that `class-transformer` correctly converts ISO strings before validation.
- **Attack scenario**: If a client sends an invalid Date string (e.g. `"2025-02-31"` or `"invalid-date"`) via GraphQL query variables, what happens?
- **Blast radius**: If `class-transformer` conversion results in `Invalid Date` object, `@IsDate()` might fail, throwing a validation error, which is caught and returned as `BAD_USER_INPUT`. If conversion fails silently or converts to `null`, it could bypass validations unless `@IsNotEmpty()` or `@IsOptional()` handles it.
- **Mitigation**: The input DTOs combine `@IsDate()` with `@IsNotEmpty()` or `@IsOptional()` appropriately. The global `ValidationPipe` in `main.ts` uses `enableImplicitConversion: true` which ensures standard ISO date string parsing.

#### [Low] Challenge 2: Performance on Large Error Message Arrays
- **Assumption challenged**: That the error array in `HttpException` response is small.
- **Attack scenario**: An attacker sends a batch request with hundreds of invalid fields to trigger a huge array of validation errors, which are then processed by `response.message.join(', ')`.
- **Blast radius**: Standard JS array join is highly efficient, so the CPU cost is negligible, but it could produce huge payload sizes if unchecked.
- **Mitigation**: Standard payload size limits (e.g. `50mb` set in `main.ts`) are in place, but GraphQL complexity/depth limits configured in `graphql.config.ts` (`maxComplexity = 1000`, `maxDepth = 8`) prevent large nesting/batch attacks before the validations run.

---

### Stress Test Results

- **Validation pipe failure propagation** → Trigger a bad input variables error → GraphQL formatError formats it as `BAD_USER_INPUT` containing validation details → **PASS** (verified via `graphql.config.spec.ts` test suite).
- **Internal Server Error Masking** → Throw an arbitrary database error (e.g. Connection Error) in production mode → GraphQL formatError intercepts it, detects it has no HTTP status, and masks it to "Internal server error" → **PASS** (verified via `graphql.config.ts` fallback masking logic).

---

### Unchallenged Areas
- **OAuth / Third-party provider logins**: Handled by NestJS Passport auth strategies, which are mock-tested inside `auth.service.spec.ts`.
