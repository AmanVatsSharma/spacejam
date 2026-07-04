# Handoff Report — Security and Route Audit

## 1. Observation
- **Sidebar Navigation Configuration**:
  - In `apps/web/src/components/ui/sidebar.tsx` (lines 139-147), 7 nav items are configured:
    ```typescript
    const navItems: NavItem[] = [
      { id: "dashboard", label: "Dashboard", icon: DashboardIcon, href: "/dashboard" },
      { id: "crm", label: "CRM", icon: CRMIcon, href: "/dashboard/crm" },
      { id: "revenue", label: "Revenue", icon: RevenueIcon, href: "/dashboard/revenue" },
      { id: "operations", label: "Operations", icon: OperationsIcon, href: "/dashboard/operations" },
      { id: "report", label: "Report", icon: ReportIcon, href: "/dashboard/report" },
      { id: "inventory", label: "Inventory", icon: InventoryIcon, href: "/dashboard/inventory" },
      { id: "settings", label: "Settings", icon: SettingsIcon, href: "/dashboard/settings" },
    ];
    ```
- **GraphQL Inputs lack Class-Validator Decorators**:
  - In `apps/api/src/graphql/inputs/crm.input.ts` (lines 13-52), `CreateLeadInput` is defined without validation decorators:
    ```typescript
    export class CreateLeadInput {
      @Field()
      name!: string;
      @Field()
      email!: string;
      ...
    }
    ```
  - Similar omissions occur in `booking.input.ts`, `center.input.ts`, `event.input.ts`, `meeting-room.input.ts`, `request.input.ts`, and `revenue.input.ts`.
- **Generic Errors in GraphQL Resolvers**:
  - In `apps/api/src/graphql/resolvers/booking.resolver.ts` (lines 115, 124, 158, 166) and `user.resolver.ts` (lines 74, 92, 102), generic `Error` instances are thrown instead of specific NestJS/Apollo exceptions:
    ```typescript
    if (!userId) throw new Error('Unauthorized');
    ```
- **Vitest Runner Failures**:
  - Running `npx vitest run` in the backend root `apps/api` resulted in exit code 1 with:
    ```
    FAIL  src/crm/crm.resolver.spec.ts [ src/crm/crm.resolver.spec.ts ]
    Error: Failed to load url ./crm.resolver (resolved id: ./crm.resolver) ... Does the file exist?

    FAIL  src/auth/services/auth.service.spec.ts [ src/auth/services/auth.service.spec.ts ]
    FAIL  src/graphql/resolvers/crm.resolver.spec.ts [ src/graphql/resolvers/crm.resolver.spec.ts ]
    ColumnTypeUndefinedError: Column type for Location#fullAddress is not defined and cannot be guessed. Make sure you have turned on an "emitDecoratorMetadata": true option in tsconfig.json.
    ```
- **Brute-Force & Lockout Strengths**:
  - In `apps/api/src/auth/services/lockout.service.ts` (lines 61-69), IP-level rate limit checks are enforced using Redis cache keys (`lockout:ip:${ipAddress}`) before accounts are modified.

---

## 2. Logic Chain
1. **Sidebar Integration**:
   - *Observation*: Analysis of `sidebar.tsx` lists 7 sidebar routes.
   - *Observation*: We inspected the page source files for all these routes.
   - *Observation*: We found that pages like `/dashboard/page.tsx`, `/dashboard/crm/customers/page.tsx`, `/dashboard/report/page.tsx`, `/dashboard/inventory/page.tsx`, and `/dashboard/settings/page.tsx` contain only mock constants (e.g. `stats`, `customersData`, `mockFloors`, `DUMMY_USERS`) and register no Apollo queries.
   - *Reasoning*: These routes are completely client-side UI mocks without functional API integrations (**Broken/Missing**).
   - *Observation*: Pages `/dashboard/crm/leads/page.tsx` and `/dashboard/revenue/page.tsx` register active Apollo queries (e.g. `GET_LEADS`, `GET_INVOICES`) but fall back to local constants when data is absent.
   - *Reasoning*: These are the only partially integrated routes (**Partially Implemented/Hybrid**).

2. **GraphQL Input Validation**:
   - *Observation*: Global `ValidationPipe` is registered in `main.ts` but DTO inputs in `inputs/` lack any `@IsString()`, `@IsEmail()`, etc. decorators.
   - *Reasoning*: If no validation annotations exist on input classes, NestJS's `ValidationPipe` cannot process or validate incoming JSON request payloads. Thus, malformed or hostile input properties bypass the validation layer and directly hit resolvers and database repositories.

3. **Resolver Error Handling**:
   - *Observation*: Resolvers throw generic `Error` objects instead of structured exceptions.
   - *Observation*: `graphql.config.ts` masks non-safe code errors as generic "Internal server error" in production.
   - *Reasoning*: Because generic errors lack safe codes (like `BAD_USER_INPUT`), simple user actions (e.g. booking an occupied seat) trigger masked "Internal server error" responses in production instead of clean validation errors, degrading UX.
   - *Observation*: Mutations in `revenue.resolver.ts` return results from `findOne` without verifying record existence.
   - *Reasoning*: If a record is missing, returning `null` from a non-nullable resolver mutation triggers unhandled schema execution panics on the server.

4. **Vitest Failure**:
   - *Observation*: Running `npx vitest run` crashed with a `ColumnTypeUndefinedError` during decorator parsing.
   - *Observation*: `vitest.config.ts` doesn't define any SWC plugins or SWC configurations.
   - *Reasoning*: Without an active compiler plugin that emits decorator metadata (e.g. `unplugin-swc`), TypeORM decorators fail to compile during Vitest compilation, leading to crash failures in all entity-dependent tests.

---

## 3. Caveats
- Since this is a read-only audit, we did not verify if the runtime behavior of the frontend changes when a live backend is fully connected (we only analyzed the offline fallback mechanisms in the source code).
- We assumed that the local SQLite database in `dev.sqlite` or Redis container instances are running with correct schemas for the queries, which was not independently tested.

---

## 4. Conclusion
The audit reveals that Spacejam CRM's frontend-to-backend routing is heavily client-mocked, with only Leads and Revenue pages making active GraphQL requests. The backend core security controls (lockout service and password policies) are implemented at a very high standard. However, the backend suffers from substantial robustness issues: a complete lack of input validation across all GraphQL inputs, improper resolver error handling (which masks user input errors or causes schema crashes), extremely low test coverage, and a broken Vitest configuration.

---

## 5. Verification Method
- **Routing & Connection Verification**:
  - Inspect `apps/web/src/components/ui/sidebar.tsx` and verify the `navItems` array matching the table.
  - Review `apps/web/src/app/dashboard/crm/customers/page.tsx` and confirm it does not import `useQuery` or reference any Apollo operation.
- **Input Validation Verification**:
  - View `apps/api/src/graphql/inputs/crm.input.ts` to confirm the absolute absence of `class-validator` decorator imports.
- **Error Handling Verification**:
  - Open `apps/api/src/graphql/resolvers/booking.resolver.ts` to inspect generic `throw new Error()` usages.
- **Test Runner Verification**:
  - Execute `npx vitest run` in `apps/api` (ensure dependencies are installed) to reproduce the `ColumnTypeUndefinedError` and import errors.
