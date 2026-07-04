# Handoff Report - Explorer 2

## 1. Observation
The following file paths, lines, and configurations were observed:

- **Frontend Dashboard Screens**:
  - `apps/web/src/app/dashboard/page.tsx`
  - `apps/web/src/app/dashboard/report/page.tsx`
  Both pages render hardcoded values and visual elements (such as custom SVGs for line/bar charts and progress grids) with no backend integration hooks implemented.
  
- **Backend Analytics Resolver**:
  - `apps/api/src/graphql/resolvers/analytics.resolver.ts`
  This resolver defines `dashboardMetrics`, `revenueReport`, and `occupancyReport` queries.
  However, MongoDB operators are used inside the PostgreSQL-bound TypeORM find queries:
    - Line 58: `createdAt: { $gte: thirtyDaysAgo }`
    - Line 152: `createdAt: { $gte: dateRange.since, $lte: dateRange.until }`
    - Line 190: `createdAt: { $gte: prevPeriodStart, $lte: prevPeriodEnd }`
    - Line 208: `createdAt: { $gte: dateRange.since, $lte: dateRange.until }`
    - Line 244: `createdAt: { $gte: dateRange.since, $lte: dateRange.until }`
  
  Additionally, for global (non-center specific) queries in `revenueReport` (lines 205-219):
  ```typescript
  return {
    total: totalRevenue,
    byMonth: [],
    growth: 0,
  };
  ```
  And in `occupancyReport` (line 225), `centerId` is marked as a required argument:
  ```typescript
  @Query(() => OccupancyReport)
  async occupancyReport(
    @Args('centerId') centerId: string,
  ```

- **Frontend GraphQL Layer**:
  - `apps/web/src/lib/apollo/operations.ts`
  - `apps/web/src/hooks/use-operations.ts`
  These files do not contain any operations or custom React hooks for dashboard metrics, revenue, or occupancy reports.

---

## 2. Logic Chain
1. **Frontend Mock Rendering**: We observed that the dashboard pages use hardcoded arrays (e.g. `stats` in `page.tsx`) or mock variables for card values, progress bars, and SVG chart geometry.
2. **Backend Resolver Intention**: The NestJS server defines resolvers designed specifically to support dashboard analytics (MTD revenue, occupancy rates, active bookings, monthly aggregates).
3. **Database Framework Constraint**: The database configuration (`apps/api/src/typeorm/data-source.ts`) specifies PostgreSQL (`type: 'postgres'`). In TypeORM, querying SQL databases with MongoDB object structures (`{ $gte: ... }`) fails at runtime, as the SQL compiler expects TypeORM operators like `MoreThanOrEqual`.
4. **Resolver Implementation Gaps**:
   - `revenueReport` defaults to `byMonth: []` for global requests, which will result in empty charts when center filters are cleared.
   - `occupancyReport` forces `centerId` to be provided, preventing the frontend from querying global occupancy statistics.
5. **Data Layer Gap**: The frontend does not declare Apollo operations or custom React hooks to query these analytics endpoints.
6. **Integration Goal**: By creating GQL query strings, defining reusable custom hooks, applying fallback-to-mock rendering patterns, and applying the backend fixes, the dashboard pages will seamlessly display real-time metrics.

---

## 3. Caveats
- No code was executed or modified since this is a read-only investigation.
- Compilation and runtime execution of the PostgreSQL database and TypeORM entities were not tested locally, but standard TypeORM Postgres behavior dictates that MongoDB syntax query objects cause runtime query failures.

---

## 4. Conclusion
The frontend dashboard pages can be successfully integrated by implementing the following steps:
1. **Fix Backend Bugs**: Replace MongoDB syntax in `analytics.resolver.ts` with standard TypeORM operators (e.g., `MoreThanOrEqual(thirtyDaysAgo)`). Make `centerId` nullable in `occupancyReport` and implement the global `byMonth` grouping in `revenueReport`.
2. **Expose Missing Fields**: Extend `DashboardMetrics` to support bookings today and growth calculations, and add a center performance grouping resolver.
3. **Frontend Implementation**: Declare the `GET_DASHBOARD_METRICS`, `GET_REVENUE_REPORT`, and `GET_OCCUPANCY_REPORT` GraphQL documents in `operations.ts`, export corresponding query hooks in `use-operations.ts`, and update the page files to render dynamic content with safe fallback to mock constants.

---

## 5. Verification Method
1. **Compilation Check**: Run `npx nx build api` to verify that any changes to NestJS compile successfully.
2. **Schema Introspection**: Run the API server and inspect the generated schema at the GraphQL playground to confirm the fields are correctly registered.
3. **Query Inspection**: Execute queries directly in the Playground (e.g. `query { dashboardMetrics { totalRevenue } }`) to verify response shapes.
4. **Mock Fallback Verification**: Temporarily disable the API server or inject invalid tokens to verify that the UI falls back gracefully using `DEMO_BADGE` without crashing.
