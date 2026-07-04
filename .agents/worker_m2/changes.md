# Summary of Changes - Milestone 2 (Robustness Upgrades)

1. **Center Entity Syntax Error Fix**:
   - Fixed the missing closing brace `}` at the end of `apps/api/src/typeorm/entities/center.entity.ts`.

2. **Vitest SWC Setup**:
   - Installed `unplugin-swc` as a devDependency in the workspace root.
   - Updated `apps/api/vitest.config.ts` to load `unplugin-swc` mapping to `./tsconfig.app.json` and set `globals: true`.
   - Created `apps/api/vitest.setup.ts` to import `reflect-metadata` and map `globalThis.jest = vi` for Jest compatibility.
   - Configured `vitest.config.ts` to reference `./vitest.setup.ts` in `setupFiles`.

3. **Relative Import Path Fixes**:
   - Resolved broken relative import path for `RoomType` and `RoomStatus` in `apps/api/src/typeorm/entities/meeting-room.entity.ts`.
   - Fixed broken relative imports from `../entities/` to `../../typeorm/entities/` in `event.input.ts`, `request.input.ts`, `event.resolver.ts`, `meeting-room.resolver.ts`, and `request.resolver.ts`.
   - Resolved a mock database lookup bug and `FindOperator` name search type issue in `apps/api/src/crm/crm.resolver.spec.ts` and `apps/api/src/graphql/resolvers/crm.resolver.spec.ts`.
   - Resolved missing/incorrect imports of NestJS HTTP exceptions in `auth.service.spec.ts` and mocked `sendEmailVerification` on `EmailService` mock.
   - Resolved missing `sendEmailVerification` on `EmailService` class in `email.service.ts` to match `auth.service.ts` usage.
   - Re-defined/aliased `RoomFiltersInput` with pagination (limit and offset) in `meeting-room.input.ts` to fix compile errors in `meeting-room.resolver.ts`.

4. **GraphQL Inputs class-validator Annotations**:
   - Added appropriate `class-validator` decorators (such as `@IsString()`, `@IsUUID()`, `@IsEmail()`, `@IsInt()`, `@IsNumber()`, `@IsEnum()`, `@IsOptional()`, `@IsNotEmpty()`, and `@IsArray()`) across all inputs:
     - `booking.input.ts`
     - `center.input.ts`
     - `crm.input.ts`
     - `event.input.ts`
     - `meeting-room.input.ts`
     - `request.input.ts`
     - `revenue.input.ts`
   - Fixed missing `Float` imports from `@nestjs/graphql` in `event.input.ts` and `request.input.ts`.

5. **Resolver Exception Upgrades**:
   - Replaced generic JavaScript `Error` objects with standard NestJS exceptions (`UnauthorizedException`, `BadRequestException`, `NotFoundException`) in `booking.resolver.ts`, `center.resolver.ts`, and `user.resolver.ts`.
   - Ensured all update/conversion mutations in `center.resolver.ts`, `crm.resolver.ts`, and `revenue.resolver.ts` handle null/empty database lookups safely by throwing a specific `NotFoundException` when target records do not exist.

6. **Global Error Formatter Update**:
   - Updated `formatError` in `apps/api/src/graphql/graphql.config.ts` to intercept NestJS HttpExceptions (such as `BadRequestException` and `UnauthorizedException`), extract status codes/validation failure arrays, and format them with safe codes like `BAD_USER_INPUT` or `UNAUTHENTICATED` instead of masking them as generic "Internal server error" in production.
   - Added `'NOT_FOUND'` to `SAFE_CODES`.

7. **Verification**:
   - Checked that `npm exec nx build api` compiles successfully.
   - Checked that all 59 tests pass successfully via `npx vitest run --root apps/api`.
