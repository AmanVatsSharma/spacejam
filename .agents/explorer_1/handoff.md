# Handoff Report — Explorer 1

## 1. Observation
- **GraphQL Inputs**:
  - Found 7 files under `apps/api/src/graphql/inputs/`: `booking.input.ts`, `center.input.ts`, `crm.input.ts`, `event.input.ts`, `meeting-room.input.ts`, `request.input.ts`, and `revenue.input.ts`.
  - All input classes (such as `CreateLeadInput` in `crm.input.ts`) contain GraphQL decorators like `@InputType()` and `@Field()`, but completely lack `class-validator` decorators (e.g. `@IsEmail()`, `@IsString()`).
- **Vitest Run Errors**:
  - Running `npx vitest run apps/api` fails with exit code 1.
  - Observed error 1 (syntax error):
    ```
    Transform failed with 1 error:
    C:/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam/apps/api/src/typeorm/entities/center.entity.ts:77:31: ERROR: Expected identifier but found end of file
    ```
  - Observed error 2 (relative import error in test):
    ```
    Error: Failed to load url ./crm.resolver (resolved id: ./crm.resolver) in C:/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam/apps/api/src/crm/crm.resolver.spec.ts. Does the file exist?
    ```
  - Observed error 3 (metadata compilation crash in previous run):
    ```
    ColumnTypeUndefinedError: Column type for Location#fullAddress is not defined and cannot be guessed. Make sure you have turned on an "emitDecoratorMetadata": true option in tsconfig.json.
    ```
- **Decorator Settings**:
  - Observed `experimentalDecorators: true` and `emitDecoratorMetadata: true` in `apps/api/tsconfig.app.json` (lines 8-9).
  - Checked `apps/api/vitest.config.ts` (lines 1-19) and verified that there are no SWC plugins or SWC options configured.
- **Error Formatting**:
  - Checked `apps/api/src/graphql/graphql.config.ts` (lines 25-36) where a predefined set of `SAFE_CODES` is declared.
  - Observed `formatError` (lines 88-98) masking all exceptions whose error code is not in `SAFE_CODES` into a generic `"Internal server error"`.
  - Observed resolvers throwing generic `Error` (e.g., `throw new Error('Unauthorized')` at line 115 of `booking.resolver.ts`).

---

## 2. Logic Chain
1. **Vitest Crashing (Decorators & Metadata)**:
   - *Observation*: Vitest defaults to compiling TypeScript using Vite's `esbuild` service.
   - *Observation*: `esbuild` does not support emitting decorator metadata (`emitDecoratorMetadata`), despite the option being enabled in `tsconfig.app.json`.
   - *Reasoning*: Because TypeORM's decorators rely on this metadata to infer database columns, the lack of metadata causes TypeORM to throw a `ColumnTypeUndefinedError`.
   - *Observation*: The `vitest.config.ts` has no SWC compiler plugin configured.
   - *Reasoning*: Swapping the compiler to SWC via `unplugin-swc` (and referencing `tsconfig.app.json`) will force the compiler to emit metadata tags, resolving the `ColumnTypeUndefinedError` during testing.
2. **Vitest Syntax & Import Crashes**:
   - *Observation*: `center.entity.ts` lacks a closing class brace `}`.
   - *Reasoning*: This makes the file syntactically invalid, causing the compiler to fail with `Expected identifier but found end of file` before any tests run.
   - *Observation*: `crm.resolver.spec.ts` attempts to import the resolver from `./crm.resolver`, but it was moved to `../graphql/resolvers/crm.resolver`.
   - *Reasoning*: This relative path resolution failure halts test loading. Correcting the relative path solves this import failure.
3. **Validation & Exception Masking**:
   - *Observation*: Resolvers throw generic `Error` objects instead of NestJS exception instances.
   - *Observation*: The custom `formatError` formatter in `graphql.config.ts` masks all errors with codes not in `SAFE_CODES` to `"Internal server error"` for production safety.
   - *Reasoning*: Since NestJS HTTP exceptions map to `INTERNAL_SERVER_ERROR` or lack standard Apollo codes, user input errors and validation errors are masked from clients.
   - *Reasoning*: Annotating GraphQL inputs with `class-validator` decorators activates NestJS's global `ValidationPipe` to catch malformed payloads. Translating NestJS exceptions into Apollo's `SAFE_CODES` inside `formatError` preserves client-side messages while keeping true server crashes securely masked.

---

## 3. Caveats
- We did not write or apply code changes directly to the source files since this is a read-only investigation.
- We assumed that `reflect-metadata` is installed in `node_modules` (confirmed in `package.json` dependencies).

---

## 4. Conclusion
The backend audit shows that:
1. The 7 GraphQL input files are completely unvalidated due to missing `class-validator` decorators.
2. The Vitest suite crashes during compilation due to:
   - Vite/esbuild not supporting `emitDecoratorMetadata`.
   - A missing closing brace `}` in `center.entity.ts`.
   - A broken import path in `crm.resolver.spec.ts`.
3. Resolvers throw generic `Error` instances which get masked as `"Internal server error"` in production.
We have formulated concrete configuration changes for `vitest.config.ts` using `unplugin-swc` to fix the test suite, and a mapping strategy inside `formatError` to enable robust user validation feedback.

---

## 5. Verification Method
- **Verify Input Files**: Open files in `apps/api/src/graphql/inputs/` (e.g. `crm.input.ts`) and confirm the absence of `class-validator` annotations.
- **Verify Syntax Error**: View the bottom of `apps/api/src/typeorm/entities/center.entity.ts` and verify the missing `}`.
- **Verify Vitest Error**: Run `npx vitest run apps/api` and confirm the compiler errors and relative import crash.
- **Verify Config Options**: View `apps/api/vitest.config.ts` and confirm the absence of compiler plugin configuration.
