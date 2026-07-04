# Spacejam CRM Backend Audit & Route Verification Report

## 1. Executive Summary
This audit evaluated the frontend dashboard sidebar navigation integration and NestJS backend robustness for the Spacejam CRM application.
- **Route Integration**: Of the 7 top-level navigation routes configured in the sidebar, only **2 routes (CRM and Revenue)** have active backend query integration (specifically the Leads sub-page under CRM, and the Revenue page, utilizing client-side fallback logic). The remaining 5 routes render mock views entirely on the client side.
- **Backend Robustness**:
  - *Strengths*: Highly secure authentication guard structure, advanced brute-force lockout service (IP-level and key-based), custom HaveIBeenPwned range check validation for password rotation, and safe parameterized TypeORM queries.
  - *Vulnerabilities*: A complete lack of `class-validator` annotations across all GraphQL input DTOs, improper exception throwing (generic `Error` instances instead of NestJS/Apollo exception types) masking user errors as internal server errors, non-nullable resolver fields risking server crashes on empty results, and a broken Vitest configuration preventing backend tests from compiling due to decorator metadata parsing issues.

---

## 2. Route Verification & Backend Mapping (R1)
Frontend sidebar navigation definitions are located in `apps/web/src/components/ui/sidebar.tsx`. Below is the mapping of each route to its corresponding pages, backend NestJS resolvers/controllers, and integration status:

| Route Name | Frontend Route Path | Mapped Backend Endpoints (Resolvers / Controllers) | Connection Status |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `/dashboard` | Queries: `dashboardMetrics`, `revenueReport` (in `analytics.resolver.ts`) | **Broken / Missing**<br>Renders static dashboard components (`TotalLeadCardDemo`, `PaymentHealthCardDemo`) and registers no active API queries. |
| **CRM** | `/dashboard/crm`<br>*Sub-pages:*<br>- **Leads** (`/dashboard/crm/leads`)<br>- **Customers** (`/dashboard/crm/customers`) | **Leads Sub-page**:<br>- Queries: `leads`, `leadCount`<br>- Mutations: `createLead`, `convertLead`, `updateLead` (in `crm.resolver.ts`) <br>**Customers Sub-page**:<br>- None (unused query `GET_CUSTOMERS` in frontend has no resolver) | **Partially Implemented (Hybrid)**<br>- CRM page root redirects to `/dashboard/crm/customers`.<br>- **Leads sub-page**: Partially implemented. Calls Apollo `GET_LEADS` query with mock fallback. Mutations blocked.<br>- **Customers sub-page**: Broken/Missing. Renders mock array directly. |
| **Revenue** | `/dashboard/revenue` | Queries: `invoices`, `deposits`, `contracts`, `invoiceCount`<br>Mutations: `markInvoicePaid`, `deleteInvoice`, `releaseDeposit`, `terminateContract` (in `revenue.resolver.ts`) | **Partially Implemented (Hybrid)**<br>Executes active Apollo queries. Renders mock lists if backend response is empty. |
| **Operations** | `/dashboard/operations` | Queries: `meetingRooms`, `events`, `requests` (in `meeting-room.resolver.ts`, `event.resolver.ts`, `request.resolver.ts`) | **Partially Implemented (Hybrid)**<br>Main route uses local mock data directly. Sub-routes (`/meeting-room`, `/events`, `/request`) fetch GraphQL queries with mock fallbacks. |
| **Report** | `/dashboard/report` | Queries: `revenueReport`, `occupancyReport` (in `analytics.resolver.ts`) | **Broken / Missing**<br>Purely client-side mock data dashboard; no Apollo hooks or HTTP queries are registered. |
| **Inventory** | `/dashboard/inventory` | Queries: `centers`, `locations`, `floors`<br>Mutations: `createCenter`, `updateCenter` (in `center.resolver.ts`) | **Broken / Missing**<br>Uses client-side local lists (`mockLocations`, `mockFloors`) directly and has no Apollo hooks or queries registered. |
| **Settings** | `/dashboard/settings` | Mutations: profile updates (in `user.resolver.ts`) | **Broken / Missing**<br>Displays dummy list data. User settings forms are mockup only. |

---

## 3. Backend Robustness Audit (R2)

### A. Input Validation Vulnerabilities
- **Global Pipes vs. DTO Gaps**: NestJS defines a global validation pipe in `apps/api/src/main.ts` (`app.useGlobalPipes(new ValidationPipe(...))`). However, this pipe relies on class decorators to function.
- **Missing Validation Decorators**: All GraphQL input objects under `apps/api/src/graphql/inputs/` (including `crm.input.ts`, `booking.input.ts`, `revenue.input.ts`, `center.input.ts`, etc.) completely omit `class-validator` annotations (e.g., `@IsEmail()`, `@IsString()`, `@MinLength()`).
- **Impact**: Request payloads bypass NestJS validation, meaning malformed, overly large, or injection payload structures pass unvalidated into resolvers, services, and repositories.

### B. Error Handling & Exception Management
- **Generic Exception Usage**: Resolvers throw generic `Error` instances (e.g., `throw new Error('Seat is not available')` in `booking.resolver.ts`, `throw new Error('User not found')` in `user.resolver.ts`) rather than standard NestJS/Apollo exceptions (such as `BadRequestException` or `NotFoundException`).
- **Error Masking**: A custom error formatter in `apps/api/src/graphql/graphql.config.ts` masks all unhandled errors as a generic `"Internal server error"` for production safety. Since generic errors are not recognized as user input errors, normal client input failures are incorrectly masked, making troubleshooting difficult and degrading the user experience.
- **Null-return Crash Risk**: Resolvers such as `updateInvoice` in `revenue.resolver.ts` return the result of updates without checking if the entity exists first (returning `null` for a non-nullable GraphQL schema field). This causes schema execution panics on the server.

### C. Security Practices
- **Brute-Force Lockout**: The lockout service (`LockoutService` in `apps/api/src/auth/services/lockout.service.ts`) features strong consecutive failure tracking, IP lockout stages capped at 24 hours, Redis-backed rolling IP limits, and unknown-account lockout mitigation to prevent username enumeration.
- **Password Complexity & Protection**: `PasswordPolicyService` enforces strict requirements (length >= 12, character mix, password history check of last 5 passwords, 90-day expiry). It validates passwords against HaveIBeenPwned using k-anonymity (sending only the first 5 characters of SHA-1 hash to preserve privacy).
- **SQL Injection**: Database repositories (`apps/api/src/typeorm/repositories/`) construct queries using TypeORM query builder parameter binding rather than raw string concatenation.

### D. Test Coverage & Infrastructure
- **High Test Gaps**: 90%+ of the backend logic lacks unit tests. The only tests cover the auth service and a basic CRM resolver mock.
- **Broken Import**: `apps/api/src/crm/crm.resolver.spec.ts` has a broken relative import pointing to `crm.resolver.ts`, which was moved to the `graphql/resolvers/` folder.
- **Broken Runner Configuration**: Vitest execution fails at startup with `ColumnTypeUndefinedError` when importing TypeORM entities. The `vitest.config.ts` lacks SWC or decorator compilation plug-ins (like `unplugin-swc`) to preserve metadata tags required by TypeORM.

---

## 4. Recommendations
1. **Apply Input Validation**: Add `@IsString()`, `@IsEmail()`, `@IsOptional()`, and related `class-validator` decorators to all classes in `apps/api/src/graphql/inputs/`.
2. **Standardize Exceptions**: Replace `throw new Error(...)` calls in resolvers and services with NestJS built-in exceptions (`BadRequestException`, `NotFoundException`, `UnauthorizedException`).
3. **Fix Vitest Configuration**: Add the `unplugin-swc` compiler plugin to `apps/api/vitest.config.ts` and set up decorator compilation support to restore the test suite. Fix the broken relative import in `crm.resolver.spec.ts`.
4. **Wire Frontend Sidebar Pages**: Integrate Apollo query hooks into the dashboard, CRM customers, operations main page, report, inventory, and settings components using existing GraphQL queries/mutations.
