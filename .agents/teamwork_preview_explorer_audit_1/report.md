# Security & Route Integration Audit Report

## 1. Executive Summary
This report presents a read-only audit of Spacejam CRM's routing configuration, frontend-to-backend integration status, and NestJS backend robustness.
- **Route Mappings**: Of the 7 configured sidebar navigation routes in the frontend, only **2 routes (CRM - Leads and Revenue)** are actively wired to backend GraphQL endpoints with partial integration (hybrid demo-fallback mode). The remaining routes either utilize client-side mock arrays directly or render placeholder templates with no active backend queries.
- **Backend Robustness**:
  - **Strengths**: The authentication and core security layers are highly robust. The system features a sophisticated brute-force lockout service (IP rate-limiting, exponential delays, anti-enumeration tracking), a rigorous password policy (HaveIBeenPwned k-anonymity validation, password history limits), and secure TypeORM parameterized queries that prevent SQL injection.
  - **Vulnerabilities**: Input validation is entirely missing for all GraphQL inputs (except the auth module), leaving core entities exposed to malformed or malicious data. Additionally, GraphQL resolvers rely on generic JavaScript `Error` objects and fail to check if entities exist before returning them from mutations, resulting in poor error formatting and unhandled GraphQL execution errors. Test coverage is also extremely low, and the test runner configuration is currently broken.

---

## 2. Sidebar Routes Mapping Table
The left sidebar is defined in `apps/web/src/components/ui/sidebar.tsx`. Below is the complete mapping of each navigation route to its frontend page, target NestJS GraphQL resolvers, and current connection status:

| Sidebar Route | Mapped Frontend Page | Mapped Backend Endpoints (Resolvers / Entities) | Integration Connection Status |
| :--- | :--- | :--- | :--- |
| **Dashboard** (`/dashboard`) | `apps/web/src/app/dashboard/page.tsx` | - Queries: `dashboardMetrics`, `revenueReport` (in `analytics.resolver.ts`) | **Broken / Missing**<br>The page imports and renders static demo cards (e.g. `TotalLeadCardDemo`, `PaymentHealthCardDemo`) and does not call any GraphQL/API queries. |
| **CRM - Leads** (`/dashboard/crm/leads`) | `apps/web/src/app/dashboard/crm/leads/page.tsx` | - Queries: `leads`, `leadCount`<br>- Mutations: `createLead`, `convertLead`, `updateLead` (in `crm.resolver.ts`) | **Partially Implemented (Hybrid)**<br>Calls Apollo query `GET_LEADS`. Automatically falls back to local `MOCK_LEADS` if empty. Mutating is blocked via alerts in demo mode. |
| **CRM - Customers** (`/dashboard/crm/customers`) | `apps/web/src/app/dashboard/crm/customers/page.tsx` | - None. (An unused `GET_CUSTOMERS` query is defined in `operations.ts` but is not implemented in any backend resolver). | **Broken / Missing**<br>Renders local mock data array (`customersData`) directly. Forms (like Add Client) are non-interactive mockup views. |
| **Revenue** (`/dashboard/revenue`) | `apps/web/src/app/dashboard/revenue/page.tsx` | - Queries: `invoices`, `deposits`, `contracts`, `invoiceCount`<br>- Mutations: `markInvoicePaid`, `deleteInvoice`, `releaseDeposit`, `terminateContract` (in `revenue.resolver.ts`) | **Partially Implemented (Hybrid)**<br>Queries Apollo endpoints and binds list views. Gracefully falls back to mock constants (e.g., `MOCK_INVOICES`) if backend query is empty/unreachable. |
| **Operations** (`/dashboard/operations`) | `apps/web/src/app/dashboard/operations/page.tsx`<br>*Tabs/Sub-routes:*<br>- `/meeting-room`<br>- `/events`<br>- `/request` | - Queries: `meetingRooms`, `events`, `requests` etc. (in `meeting-room.resolver.ts`, `event.resolver.ts`, `request.resolver.ts`) | **Partially Implemented (Hybrid)**<br>- Main index `/dashboard/operations` uses local `mockBookings` directly (**Broken/Missing**).<br>- Sub-routes `/meeting-room`, `/events`, and `/request` query Apollo with a mock fallback. |
| **Report** (`/dashboard/report`) | `apps/web/src/app/dashboard/report/page.tsx` | - Queries: `revenueReport`, `occupancyReport` (in `analytics.resolver.ts` but NOT called by the frontend) | **Broken / Missing**<br>Uses client-side local arrays and static markups; no active query hook is registered in the page component. |
| **Settings** (`/dashboard/settings`) | `apps/web/src/app/dashboard/settings/page.tsx`<br>- `/security/page.tsx` | - Queries: standard user profile mutations (in `user.resolver.ts` but NOT used for forms) | **Broken / Missing**<br>Renders local lists (e.g. `DUMMY_USERS`). Security actions (like password change) are UI mocks. |

---

## 3. Backend Robustness Audit

### A. Error Handling
- **Resolver-level Exceptions**: Resolvers consistently throw generic JavaScript `Error` instances instead of structured NestJS or Apollo-specific user input/authentication exceptions. For example:
  - `apps/api/src/graphql/resolvers/booking.resolver.ts` line 115:
    ```typescript
    if (!userId) throw new Error('Unauthorized');
    ```
  - `apps/api/src/graphql/resolvers/booking.resolver.ts` line 124:
    ```typescript
    throw new Error('Seat is not available');
    ```
  - `apps/api/src/graphql/resolvers/user.resolver.ts` line 74:
    ```typescript
    if (!user) throw new Error('User not found');
    ```
- **Error Masking Side-Effects**: In production, the backend configures `formatError` to mask all unhandled errors as a generic `"Internal server error"` (see `apps/api/src/graphql/graphql.config.ts` line 88). Because generic `Error` objects do not carry safe error codes (like `BAD_USER_INPUT` or `UNAUTHENTICATED`), normal user errors (such as selecting an occupied seat) will be masked in production, degrading user experience.
- **Null-return Crash Risk**: Multiple resolvers perform repository updates and lookups without checking if the target entity exists. For example, `updateInvoice` in `apps/api/src/graphql/resolvers/revenue.resolver.ts` (line 101) updates and returns the result of `findOne`. If the invoice does not exist, it returns `null`. Since the GraphQL mutation is non-nullable, this triggers a GraphQL schema execution panic on the server instead of throwing a clean `"Invoice not found"` HTTP/GraphQL exception.

### B. Input Validation
- **Global Pipes**: A global `ValidationPipe` is registered in `apps/api/src/main.ts` (line 29) to automatically filter payloads and enforce DTO schemas.
- **DTO Validation Gap**: There is a severe validation gap. None of the GraphQL input objects under `apps/api/src/graphql/inputs/` import or use the `class-validator` package. For example, in `crm.input.ts`:
  - `CreateLeadInput` (lines 13-52) has no validation annotations on fields like `email`, `phone`, or `name`.
  - `UpdateLeadInput` (lines 55-94) has no checks.
  - Because no validation decorators are present, the global `ValidationPipe` has nothing to validate. Thus, any payload—including malformed emails, massive strings, or invalid enum values—will pass unchecked into NestJS controllers and database repositories.
- **Contrast with Auth**: The authentication module DTOs (`apps/api/src/auth/dto/`) correctly enforce inputs using validation decorators (e.g. `@IsEmail()`, `@MinLength(8)` in `signup.input.ts`).

### C. Security Practices
- **JWT Verification & Role Guards**: The application uses a secure authentication chain. Access tokens are validated with a standard passport-jwt strategy (`apps/api/src/auth/strategies/jwt.strategy.ts`) and active user checks. Route access is controlled via a custom `@Roles()` decorator and `RolesGuard` (`apps/api/src/auth/guards/roles.guard.ts`) which properly parses the NestJS GraphQL execution context.
- **Brute-Force Lockout Protection**: The lockout mechanism implemented in `LockoutService` (`apps/api/src/auth/services/lockout.service.ts`) is highly robust:
  - It tracks consecutive failures per account, triggering progressive lockout stages capped at 24 hours (`LOCKOUT_STAGES_MS` array).
  - It implements a Redis-backed per-IP rolling window limit (default 30 failures / 5 minutes) to mitigate distributed dictionary attacks.
  - It uses an anti-enumeration defense by writing failure increments to a shared key (`lockout:unknown`) for unregistered emails.
- **Password Policy**: The password validation rules in `PasswordPolicyService` (`apps/api/src/auth/services/password-policy.service.ts`) are extremely strong:
  - Enforces minimum length of 12, case mixing, numbers, and symbols.
  - Performs a HaveIBeenPwned range check using secure k-anonymity (transmits only the first 5 characters of the SHA-1 hash).
  - Maintains password history tracking (preventing reuse of the last 5 passwords) and enforces a 90-day password rotation schedule.
- **SQL Injection Prevention**: The application is secure against SQL injection. TypeORM repositories use parametrized options and query builder parameters (e.g. `user.repository.ts` line 76: `ILIKE :search` and `{ search: ... }`) instead of raw string concatenation.

### D. Test Coverage & Quality
- **Test Gaps**: There are only 3 unit test files (`.spec.ts`) in the entire backend workspace:
  - `auth.service.spec.ts` (covers auth flows).
  - `crm.resolver.spec.ts` (covers CRM leads resolver logic).
  - The remaining 90%+ of the backend codebase—including resolvers for Revenue (invoices, deposits, contracts), Bookings, Centers, Requests, Events, and corresponding TypeORM repository classes—has **0% test coverage**.
- **Orphaned Test File**: The file `apps/api/src/crm/crm.resolver.spec.ts` contains a broken relative import:
  ```typescript
  import { CrmResolver } from './crm.resolver';
  ```
  This file fails to load because the actual `crm.resolver.ts` was relocated to `src/graphql/resolvers/crm.resolver.ts`.
- **Broken Test Configuration**: Executing the backend test runner (`npx vitest run`) fails completely on test suite load. The configuration file `apps/api/vitest.config.ts` does not integrate compiler support (like SWC or decorator plug-ins) to process TypeORM decorators. This causes the runner to crash immediately with a `ColumnTypeUndefinedError` when loading TypeORM entities:
  ```
  ColumnTypeUndefinedError: Column type for Location#fullAddress is not defined and cannot be guessed. Make sure you have turned on an "emitDecoratorMetadata": true option in tsconfig.json.
  ```

---

## 4. Specific Examples of Strengths and Vulnerabilities

### Key Strengths
1. **IP Lockout Implementation** (`apps/api/src/auth/services/lockout.service.ts` lines 61-69):
   ```typescript
   async enforceIpLimit(ipAddress: string | undefined): Promise<void> {
     if (!ipAddress) return;
     const key = `lockout:ip:${ipAddress}`;
     const count = await this.cache.increment(key, 1, Math.ceil(this.ipWindowMs / 1000));
     if (count > this.ipLimit) {
       this.logger.warn(`IP rate-limit hit for ${ipAddress} (count=${count})`);
       throw new UnauthorizedException('Too many failed attempts. Try again later.');
     }
   }
   ```
   *Rationale*: Prevents distributed brute force spraying by leveraging Redis caches to block offending IPs before query lookup.
2. **K-Anonymity Breach Verification** (`apps/api/src/auth/services/password-policy.service.ts` lines 127-147):
   Sends only the SHA-1 hash prefix (`prefix = sha1.slice(0, 5)`) to the HaveIBeenPwned API, ensuring user password privacy is maintained while checking leak status.
3. **Safe Parameter Binding** (`apps/api/src/typeorm/repositories/user.repository.ts` lines 74-79):
   ```typescript
   if (filters?.search) {
     queryBuilder.andWhere(
       '(user.name ILIKE :search OR user.email ILIKE :search)',
       { search: `%${filters.search}%` }
     );
   }
   ```
   *Rationale*: Sanitizes database query variables, preventing raw input injection.

### Key Vulnerabilities
1. **Unprotected CRM Lead Input DTO** (`apps/api/src/graphql/inputs/crm.input.ts` lines 13-52):
   ```typescript
   export class CreateLeadInput {
     @Field()
     name!: string;
     @Field()
     email!: string;
     ...
   }
   ```
   *Rationale*: No validation decorators (`@IsString()`, `@IsEmail()`, etc.) are attached, meaning the global `ValidationPipe` is bypassed.
2. **Improper GraphQL Exception Handling** (`apps/api/src/graphql/resolvers/booking.resolver.ts` line 124):
   ```typescript
   throw new Error('Seat is not available');
   ```
   *Rationale*: Generic `Error` throws are used instead of structured NestJS/GraphQL HTTP exceptions. This causes the errors to be incorrectly formatted or masked as `Internal server error` in production environments.
3. **Crashing Resolver Mutation** (`apps/api/src/graphql/resolvers/revenue.resolver.ts` lines 104-112):
   ```typescript
   const invoice = await this.invoiceRepo.findOne({
     where: { id },
     relations: ['customer', 'center'],
   });
   return invoice as unknown as Invoice;
   ```
   *Rationale*: If the record is missing, it returns `null` for a non-nullable field, leading to server-side GraphQL execution failure.
