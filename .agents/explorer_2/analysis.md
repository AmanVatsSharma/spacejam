# GraphQL Dashboard Integration Analysis

## 1. Mock Data Rendering Map

Below is a detailed mapping of the mock data rendered on both the home dashboard page and reports page:

### A. Dashboard Home Page (`apps/web/src/app/dashboard/page.tsx`)

| UI Component | Data Elements Rendered | Default Mock Value | Suggested GraphQL Field Source |
| :--- | :--- | :--- | :--- |
| **KPI Stat Card 1** | Revenue (MTD) + change direction | "₹9.8L", +12% up | `dashboardMetrics.totalRevenue` + growth |
| **KPI Stat Card 2** | Active Customer + change direction | "20", +5% up | `dashboardMetrics.activeBookings` |
| **KPI Stat Card 3** | Outstanding Dues + change direction | "₹6.2L", -8% down | `dashboardMetrics.pendingPayments` |
| **KPI Stat Card 4** | Booking Today + change direction | "3", +5% up | *TBD* (Need `bookingsToday` field) |
| **Total Lead Card** | Total leads + trend, subcategories: Visited, Inquiry, Converted | Total: 1349 (+1.6%), Visited: 459, Inquiry: 350, Converted: 215 | `leadCount` query grouped by status, or new `leadMetrics` query |
| **Deposit Held Card** | Deposits held + trend | "₹3.8L", +5% | *TBD* (Need `totalDeposits` or custom sum) |
| **Event Today Card** | Event today count + trend | "6", +5% | `eventStatistics.totalEvents` for today |
| **Payment Health Card**| Payment categories breakdown (Paid, Overdue, Partial) | Total: "₹39.0L", Paid: 73% ("₹28.5L"), Overdue: 16% ("₹6.2L"), Partial: 11% ("₹4.3L") | `invoiceCount` or extended `dashboardMetrics` / custom query |
| **Tasks & Compliance** | Compliance list (Missing KYC, Deposit Pending, Overdue Invoices, Lease Renewal) + Urgency level | Count: 8. Missing KYC: 3 members (Red), Deposit Pending: 2 (Orange), Overdue Invoices: ₹84,500 (Red), Lease Renewal: 4 (Orange) | Custom operational query (e.g. `complianceIssues` / `activeRequests`) |
| **Room Availability** | Available/booked ratio, progress by seat type | Total: 355/500 (+3.4%). Hot Desks: 45/60, Cabins: 8/12, Meeting Rooms: 3/5, Event Space: 1/2, Cabin (2s): 3/5, Cabin (6s): 3/5 | `dashboardMetrics.availableSeats` & `dashboardMetrics.totalSeats` + `occupancyReport.bySeatType` |
| **Meeting Room Grid** | Room status (Available, Occupied, Booked, Maintenance) and capacity | Boardroom A (12, Occupied), Meeting 1 (6, Available), Conference 1 (20, Booked), Meeting 2 (4, Available), Boardroom B (10, Occupied), Conference 2 (20, Maintenance) | `meetingRooms` query (returns `capacity` and `status`) |
| **Approvals Queue** | Request type, requester details, timing | Count: 5. Plan Upgrade: Priya Mehta (2h), Cancellation: Amit Kumar (4h), Plan Downgrade: Sarah Tech Solutions (1d) | `requests(filters: { status: PENDING })` |

### B. Reports Page (`apps/web/src/app/dashboard/report/page.tsx`)

| UI Component | Data Elements Rendered | Default Mock Value | Suggested GraphQL Field Source |
| :--- | :--- | :--- | :--- |
| **Metrics Grid** | Total Revenue, Outstanding Dues, Active Clients, Occupancy Rate | Rev: "₹9.8L" (+12%), Dues: "₹1.4L" (+5%), Clients: 320 (-8%), Occupancy: 78% (+5%) | `dashboardMetrics` or `revenueReport`/`occupancyReport` aggregates |
| **Payment Status** | Donut chart with Invoice Breakdown | Total: 142. Paid: 98, Overdue: 26, Partial: 18 | `invoiceCount` queries or `revenueReport` breakdown fields |
| **Mini Cards Stack** | Deposits Held, Booking Utilisation | Deposits: "₹5.2L" (+10%), Utilisation: 82% (+6%) | Custom aggregates |
| **Occupancy Trend** | Double line chart (Progression over Jan-Jun) | Progression line chart (Teal vs Orange lines) | `occupancyReport.byDay` progression |
| **Lead to Converted** | Monthly stacked bar chart (Jan-Jul) | Stacked bar chart (Lead vs Converted) | Custom monthly lead progression query |
| **Top Centers** | Rank, Center Name, Revenue, Occupancy, Growth | Chandigarh (₹4.2L, 85%, +15%), Mohali (₹3.8L, 72%, +8%), Jalandhar (₹1.8L, 68%, -5%) | Custom query grouping by center (e.g. `centerPerformanceReport`) |
| **Operational Insights**| Event notifications (growth, drop in occupancy, overdue payments) | Revenue +12%, Mohali Occupancy drop, Chandigarh overdue payments | Front-end rules based on center-specific query results |

---

## 2. Backend Resolver Identification & Needed Extensions

### A. Existing Resolvers (`apps/api/src/graphql/resolvers/analytics.resolver.ts`)
The backend defines three queries:
1. `dashboardMetrics(centerId?: string): Promise<DashboardMetrics>`
2. `revenueReport(centerId?: string, period?: 'month' | 'quarter' | 'year'): Promise<RevenueReport>`
3. `occupancyReport(centerId: string, period?: 'week' | 'month'): Promise<OccupancyReport>`

### B. Issues and Bugs Identified in Backend Code
1. **Broken TypeORM Query Syntax (PostgreSQL Mismatch)**:
   In `analytics.resolver.ts`, the database queries use MongoDB query object operators (like `$gte` and `$lte`) which will crash on a SQL database like PostgreSQL:
   - Line 58: `createdAt: { $gte: thirtyDaysAgo }`
   - Line 152: `createdAt: { $gte: dateRange.since, $lte: dateRange.until }`
   - Line 190: `createdAt: { $gte: prevPeriodStart, $lte: prevPeriodEnd }`
   - Line 208: `createdAt: { $gte: dateRange.since, $lte: dateRange.until }`
   - Line 244: `createdAt: { $gte: dateRange.since, $lte: dateRange.until }`
   
   *Fix Required*: Replace with TypeORM query builder or native operators:
   `createdAt: MoreThanOrEqual(thirtyDaysAgo)` or `Between(dateRange.since, dateRange.until)` imported from `typeorm`.

2. **Empty Global `byMonth` Breakdown**:
   In `revenueReport` (lines 205-219), if `centerId` is null (global query), the resolver returns `byMonth: []`. This results in empty revenue charts on the Reports page.
   *Fix Required*: Implement the monthly grouping breakdown logic for the global payments route just as it is implemented for center-specific bookings.

3. **`occupancyReport` Non-nullable `centerId`**:
   The Reports page defaults to "All centers" (global view). However, `occupancyReport` (line 225) makes `centerId` non-nullable.
   *Fix Required*: Make `centerId` nullable in `occupancyReport` to return system-wide aggregate occupancy rates.

### C. Suggested Modifications/Extensions
- **Expose Growth Rates in `DashboardMetrics`**: Expose fields `revenueGrowth`, `occupancyGrowth`, `bookingsGrowth`, `duesGrowth` so the KPI cards' percentage change numbers can be dynamically rendered.
- **Add `bookingsToday` and `totalDeposits` to `DashboardMetrics`**: Expose these count fields to cover the "Booking Today" and "Deposit Held" cards.
- **Add a `leadReport` or `leadAnalytics` resolver**: Returns monthly progression of leads (Visited, Inquiry, Converted) to power the Lead card and Lead-to-Converted bar chart.
- **Add a `centerPerformanceReport` query**: Returns center-by-center list ranking for the Top Performing Centers card.

---

## 3. Frontend Apollo Integration Plan

### Step A: Define the GraphQL Operations
Add the following queries to `apps/web/src/lib/apollo/operations.ts`:

```typescript
export const GET_DASHBOARD_METRICS = gql`
  query GetDashboardMetrics($centerId: String) {
    dashboardMetrics(centerId: $centerId) {
      totalRevenue
      occupancyRate
      activeBookings
      pendingPayments
      totalSeats
      availableSeats
      upcomingMaintenance {
        id
        number
        status
        type
        price
      }
    }
  }
`;

export const GET_REVENUE_REPORT = gql`
  query GetRevenueReport($centerId: String, $period: String) {
    revenueReport(centerId: $centerId, period: $period) {
      total
      growth
      byMonth {
        month
        revenue
        target
      }
    }
  }
`;

export const GET_OCCUPANCY_REPORT = gql`
  query GetOccupancyReport($centerId: String, $period: String) {
    occupancyReport(centerId: $centerId, period: $period) {
      centerId
      averageRate
      byDay {
        date
        totalBookings
        occupancyRate
        revenue
      }
      bySeatType {
        type
        count
        occupancyRate
      }
    }
  }
`;
```

### Step B: Implement React Query Hooks
Add wrapper hooks inside `apps/web/src/hooks/use-operations.ts`:

```typescript
export function useDashboardMetrics(centerId?: string) {
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_METRICS, {
    variables: { centerId },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    metrics: data?.dashboardMetrics ?? null,
    loading,
    error,
    refetch,
  };
}

export function useRevenueReport(centerId?: string, period?: 'month' | 'quarter' | 'year') {
  const { data, loading, error, refetch } = useQuery(GET_REVENUE_REPORT, {
    variables: { centerId, period },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    report: data?.revenueReport ?? null,
    loading,
    error,
    refetch,
  };
}

export function useOccupancyReport(centerId?: string, period?: 'week' | 'month') {
  const { data, loading, error, refetch } = useQuery(GET_OCCUPANCY_REPORT, {
    variables: { centerId, period },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    report: data?.occupancyReport ?? null,
    loading,
    error,
    refetch,
  };
}
```

### Step C: Integrate into Frontend Pages with Fallback

Use a fallback-to-mock-data pattern within `apps/web/src/app/dashboard/page.tsx` and `apps/web/src/app/dashboard/report/page.tsx`:

```typescript
import { useDashboardMetrics } from "@/hooks/use-operations";
import { DEMO_BADGE } from "@/lib/mock-data/crm-mock-data";

export default function DashboardPage() {
  const { metrics, loading, error } = useDashboardMetrics();

  const stats = useMemo(() => {
    return [
      {
        label: "Revenue (MTD)",
        value: metrics ? `₹${(metrics.totalRevenue / 100000).toFixed(1)}L` : "₹9.8L",
        icon: <RevenueIcon />,
        changePercent: 12,
        changeDirection: "up" as const,
      },
      {
        label: "Active Customer",
        value: metrics ? String(metrics.activeBookings) : "20",
        icon: <CustomersIcon />,
        changePercent: 5,
        changeDirection: "up" as const,
      },
      {
        label: "Outstanding Dues",
        value: metrics ? `₹${(metrics.pendingPayments / 100000).toFixed(1)}L` : "₹6.2L",
        icon: <DuesIcon />,
        changePercent: 8,
        changeDirection: "down" as const,
      },
      {
        label: "Booking Today",
        value: "3", // fallback
        icon: <BookingsIcon />,
        changePercent: 5,
        changeDirection: "up" as const,
      },
    ];
  }, [metrics]);

  // Display DEMO_BADGE if error occurred or if data is not loaded yet
  const isDemo = !metrics;

  return (
    <div>
      {/* Header with Title */}
      <h2>Dashboard Overview {isDemo && DEMO_BADGE}</h2>
      {/* ... Render stats & cards ... */}
    </div>
  );
}
```
