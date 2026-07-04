## 2026-07-02T17:42:04Z
You are the Worker for Milestone 2 (Robustness Upgrades). Your working directory is: c:\Users\ASUS TUF A15\Desktop\DevOPS\Workspace\spacejam\.agents\worker_m2.

Your mission is to implement all backend robustness upgrades requested in Milestone 2:
1. Fix the syntax error in `apps/api/src/typeorm/entities/center.entity.ts` by adding a missing closing brace `}` at the end of the file.
2. Install `unplugin-swc` as a devDependency in the root of the workspace if it's not present, or in `apps/api`.
3. Configure `apps/api/vitest.config.ts` to use `unplugin-swc` mapping to `./tsconfig.app.json`. Create `apps/api/vitest.setup.ts` to import `reflect-metadata` and add it to `setupFiles` in vitest config.
4. Relocate or correct any broken relative test imports (e.g. `apps/api/src/crm/crm.resolver.spec.ts` or `apps/api/src/graphql/resolvers/crm.resolver.spec.ts`).
5. Add appropriate `class-validator` annotations across all GraphQL input DTO files under `apps/api/src/graphql/inputs/` (e.g. `@IsString()`, `@IsEmail()`, `@IsOptional()`, `@IsNumber()`, `@IsNotEmpty()`, `@IsEnum()`, etc.).
6. Fix exception handling in resolvers (like booking, user, revenue, crm) by replacing generic JavaScript `Error` objects (e.g., `throw new Error('Seat is not available')`) with standard NestJS exceptions (e.g. `BadRequestException`, `UnauthorizedException`, `NotFoundException`).
7. Update the global error formatter `formatError` in `apps/api/src/graphql/graphql.config.ts` to:
   - Extract and check NestJS/HTTP exceptions or validation failures (like `BadRequestException`).
   - Translate them into GraphQL-friendly formats (e.g. using standard safe codes such as `BAD_USER_INPUT` or `UNAUTHENTICATED` instead of masking them as generic "Internal server error" in production).
8. Ensure all mutations in resolvers (e.g. CRM, Revenue) handle empty/null lookups safely by throwing a specific `NotFoundException` (or similar) when target records do not exist, rather than returning `null` (which causes GraphQL schema execution panics on non-nullable fields).
9. Run `npm exec nx build api` and `npm exec nx test api` (or `npx vitest run apps/api`) to verify all tests pass and the build succeeds.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your changes summary to `changes.md` and complete `handoff.md`.
