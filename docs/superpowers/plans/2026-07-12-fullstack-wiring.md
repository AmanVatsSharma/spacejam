# SpaceJam Full-Stack Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate ALL mock/hardcoded data from the frontend and wire every page to live GraphQL, plus add missing backend operations for features that exist in UI but have no backend support.

**Architecture:** This is a wiring-only plan — no new features, no refactoring. Each task: (1) identify the gap, (2) wire the frontend to existing GraphQL ops, (3) if the backend op doesn't exist, add it first, then wire frontend. Prioritized by severity: High (broken/broken UI) → Medium (unwired but functional) → Low (cosmetic).

**Tech Stack:** NestJS/TypeORM/GraphQL (backend), Next.js 16/Apollo Client/React 19 (frontend), TypeScript throughout.

---

## AUDIT SUMMARY (Source of Truth for This Plan)

| Domain | Status | Mock Data | Wiring Gaps | Backend Gaps |
|--------|--------|-----------|-------------|-------------|
| **Revenue** | ❌ Needs Work | ✅ Discounts hardcoded | ❌ AddContractModal, 6 deposit mutations | None |
| **Settings** | ❌ Needs Work | ❌ All form fields static | ❌ 40+ form fields unwired | Missing: device/session ops |
| **Inventory** | ⚠️ Partial | ✅ None | ❌ CREATE_FLOOR, per-seat bookings | None |
| **Operations** | ⚠️ Partial | ✅ None | ❌ meetingRoom in GET_BOOKINGS, stats hardcoded | None |
| **CRM** | ✅ Mostly Done | ✅ None | ⚠️ Customer tabs, onboarding draft | None |
| **Dashboard Home** | ✅ Mostly Done | ✅ None | ⚠️ Trend % hardcoded | None |
| **Backend** | ⚠️ Schema drift | N/A | N/A | ❌ 30+ ops missing from schema |

---

## PRIORITY ORDER

- **P1 (Critical):** Revenue Discounts mock data, Settings form fields (broken UI), Operations meetingRoom field (undefined data)
- **P2 (High):** Settings tabs (notifications/security/center), Inventory CREATE_FLOOR, Revenue unwired mutations
- **P3 (Medium):** Operations stats, CRM customer detail tabs, Operations events stats, Customer internal notes
- **P4 (Low):** Dashboard trend percentages, schema.graphql sync

---

## PHASE 1: P1 — CRITICAL WIRING (Broken UI / Hardcoded Mock Data)

### Task 1.1: Revenue — Wire Discounts Tab to Backend

**Why this matters:** The Discounts tab in `revenue/invoices/page.tsx` renders 3 hardcoded `discounts[]` items. There is NO backend Discount entity or GraphQL ops for discounts.

**Files:**
- Modify: `apps/api/src/graphql/schema.graphql` (add Discount type + CRUD)
- Create: `apps/api/src/graphql/types/discount.type.ts`
- Create: `apps/api/src/graphql/inputs/discount.input.ts`
- Create: `apps/api/src/graphql/resolvers/discount.resolver.ts`
- Create: `apps/api/src/typeorm/entities/discount.entity.ts`
- Create: `apps/api/src/typeorm/migrations/XXXXXX_create_discount_table.ts`
- Modify: `apps/web/src/lib/apollo/operations.ts` (add GET_DISCOUNTS, CREATE_DISCOUNT, UPDATE_DISCOUNT, DELETE_DISCOUNT)
- Modify: `apps/web/src/app/dashboard/revenue/invoices/page.tsx` (wire discounts tab)

- [ ] **Step 1: Create Discount TypeORM entity**

Create: `apps/api/src/typeorm/entities/discount.entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('discounts')
export class Discount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column('decimal', { precision: 5, scale: 2 })
  percentage: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maxAmount: number;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  validFrom: Date;

  @Column({ type: 'timestamp', nullable: true })
  validUntil: Date;

  @Column({ nullable: true })
  minOrderAmount: number;

  @Column({ nullable: true })
  usageLimit: number;

  @Column({ default: 0 })
  usedCount: number;

  @Column({ nullable: true })
  applicableTo: string; // 'MEMBER' | 'CORPORATE' | 'ALL'

  @Column({ nullable: true })
  centerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

- [ ] **Step 2: Create migration for discounts table**

Create: `apps/api/src/typeorm/migrations/XXXXXX_create_discount_table.ts`
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDiscountTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "discounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(50) UNIQUE NOT NULL,
        "percentage" decimal(5,2) NOT NULL,
        "maxAmount" decimal(10,2),
        "description" varchar(500),
        "isActive" boolean DEFAULT true,
        "validFrom" timestamp,
        "validUntil" timestamp,
        "minOrderAmount" decimal(10,2),
        "usageLimit" integer,
        "usedCount" integer DEFAULT 0,
        "applicableTo" varchar(50),
        "centerId" uuid,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_discounts_code" ON "discounts"("code")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_discounts_centerId" ON "discounts"("centerId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "discounts" CASCADE`);
  }
}
```

- [ ] **Step 3: Add Discount to AppModule**

Modify: `apps/api/src/app/app.module.ts` — add `Discount` entity to TypeORM `entities` array.

- [ ] **Step 4: Create GraphQL Discount type**

Create: `apps/api/src/graphql/types/discount.type.ts`
```typescript
import { ObjectType, Field, Float, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class Discount {
  @Field(() => ID)
  id: string;

  @Field()
  code: string;

  @Field(() => Float)
  percentage: number;

  @Field(() => Float, { nullable: true })
  maxAmount: number;

  @Field({ nullable: true })
  description: string;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  validFrom: Date;

  @Field({ nullable: true })
  validUntil: Date;

  @Field(() => Float, { nullable: true })
  minOrderAmount: number;

  @Field(() => Int, { nullable: true })
  usageLimit: number;

  @Field(() => Int)
  usedCount: number;

  @Field({ nullable: true })
  applicableTo: string;

  @Field({ nullable: true })
  centerId: string;

  @Field()
  createdAt: Date;
}
```

- [ ] **Step 5: Create GraphQL input types**

Create: `apps/api/src/graphql/inputs/discount.input.ts`
```typescript
import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class CreateDiscountInput {
  @Field()
  code: string;

  @Field(() => Float)
  percentage: number;

  @Field(() => Float, { nullable: true })
  maxAmount?: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  validFrom?: Date;

  @Field({ nullable: true })
  validUntil?: Date;

  @Field(() => Float, { nullable: true })
  minOrderAmount?: number;

  @Field(() => Int, { nullable: true })
  usageLimit?: number;

  @Field({ nullable: true })
  applicableTo?: string;
}

@InputType()
export class UpdateDiscountInput {
  @Field({ nullable: true })
  code?: string;

  @Field(() => Float, { nullable: true })
  percentage?: number;

  @Field(() => Float, { nullable: true })
  maxAmount?: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  validFrom?: Date;

  @Field({ nullable: true })
  validUntil?: Date;

  @Field(() => Float, { nullable: true })
  minOrderAmount?: number;

  @Field(() => Int, { nullable: true })
  usageLimit?: number;

  @Field({ nullable: true })
  applicableTo?: string;
}

@InputType()
export class DiscountFiltersInput {
  @Field({ nullable: true })
  centerId?: string;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  search?: string;
}
```

- [ ] **Step 6: Create Discount resolver**

Create: `apps/api/src/graphql/resolvers/discount.resolver.ts`
```typescript
import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Discount } from '../types/discount.type';
import { CreateDiscountInput, UpdateDiscountInput, DiscountFiltersInput } from '../inputs/discount.input';

@Resolver(() => Discount)
@UseGuards(GqlAuthGuard)
export class DiscountResolver {
  constructor(
    @InjectRepository(Discount)
    private readonly discountRepo: Repository<Discount>,
  ) {}

  @Query(() => [Discount], { name: 'discounts' })
  async getDiscounts(
    @Args('filters', { nullable: true }) filters?: DiscountFiltersInput,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ) {
    const query = this.discountRepo.createQueryBuilder('d');
    if (filters?.centerId) query.andWhere('d.centerId = :centerId', { centerId: filters.centerId });
    if (filters?.isActive !== undefined) query.andWhere('d.isActive = :isActive', { isActive: filters.isActive });
    if (filters?.search) query.andWhere('LOWER(d.code) LIKE LOWER(:search)', { search: `%${filters.search}%` });
    query.orderBy('d.createdAt', 'DESC');
    if (limit) query.take(limit);
    if (offset) query.skip(offset);
    return query.getMany();
  }

  @Query(() => Discount, { name: 'discount', nullable: true })
  async getDiscount(@Args('id', { type: () => ID }) id: string) {
    return this.discountRepo.findOne({ where: { id } });
  }

  @Mutation(() => Discount)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CENTER_MANAGER')
  async createDiscount(@Args('input') input: CreateDiscountInput, @Args('centerId', { nullable: true }) centerId?: string) {
    const discount = this.discountRepo.create({ ...input, centerId });
    return this.discountRepo.save(discount);
  }

  @Mutation(() => Discount)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CENTER_MANAGER')
  async updateDiscount(@Args('id', { type: () => ID }) id: string, @Args('input') input: UpdateDiscountInput) {
    await this.discountRepo.update(id, input);
    return this.discountRepo.findOne({ where: { id } });
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CENTER_MANAGER')
  async deleteDiscount(@Args('id', { type: () => ID }) id: string) {
    const result = await this.discountRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
```

- [ ] **Step 7: Add Discount operations to frontend operations.ts**

Modify: `apps/web/src/lib/apollo/operations.ts` — add:
```typescript
export const GET_DISCOUNTS = gql`
  query GetDiscounts($filters: DiscountFiltersInput, $limit: Int, $offset: Int) {
    discounts(filters: $filters, limit: $limit, offset: $offset) {
      id code percentage maxAmount description isActive
      validFrom validUntil minOrderAmount usageLimit usedCount applicableTo
      centerId createdAt
    }
  }
`;

export const GET_DISCOUNT = gql`...`;

export const CREATE_DISCOUNT = gql`...`;

export const UPDATE_DISCOUNT = gql`...`;

export const DELETE_DISCOUNT = gql`...`;
```

- [ ] **Step 8: Wire Discounts tab in invoices page**

Modify: `apps/web/src/app/dashboard/revenue/invoices/page.tsx`:
- Remove the hardcoded `discounts[]` array (lines 58-62)
- Add `useQuery(GET_DISCOUNTS)` to fetch discounts
- Wire `CREATE_DISCOUNT`, `UPDATE_DISCOUNT`, `DELETE_DISCOUNT` mutations to the Discounts tab UI
- Show `isActive: false` discounts with strikethrough styling

---

### Task 1.2: Operations — Fix GET_BOOKINGS Missing meetingRoom Field

**Why this matters:** `GET_BOOKINGS` query in `operations.ts` doesn't request `meetingRoom` but the frontend renders `booking.meetingRoom?.name` — always `undefined`.

**Files:**
- Modify: `apps/web/src/lib/apollo/operations.ts` (fix GET_BOOKINGS query + CREATE_BOOKING mutation response)

- [ ] **Step 1: Fix GET_BOOKINGS query in operations.ts**

Read `apps/web/src/lib/apollo/operations.ts` and find the `GET_BOOKINGS` query definition. Add `meetingRoom { id name type }` to the booking selection set.

- [ ] **Step 2: Fix CREATE_BOOKING mutation response fragment**

Find the `CREATE_BOOKING` mutation and ensure its response fragment also includes `meetingRoom { id name type }`.

- [ ] **Step 3: Verify the fix compiles**

Run: `cd apps/web && npx tsc --noEmit` — confirm no new errors.

---

### Task 1.3: Settings — Wire ALL Form Fields to Backend (P1 Critical)

**Why this matters:** 40+ form fields across Settings/Center Defaults, Settings/Notifications, and Settings/Security pages are pure React `<input>` / `<select>` elements with no state management or mutation calls. Changes are silently lost on save.

**Files (all in `apps/web/src/app/dashboard/settings/`):**

- [ ] **Step 1: Center Defaults — Booking Defaults tab**

Modify: `settings/center/page.tsx`
- Add `useState` for each unwired field: `bookingCutoffTime`, `cancellationWindow`, `roomBufferDuration`, `maxBookingsPerDay`
- Add these fields to the `handleSave` function so they get included in the `updateCenter` mutation input (they should be stored in `center.settings.bookingDefaults` or similar sub-object)
- **Backend note:** `UPDATE_CENTER` accepts a `settings` JSONB blob. Add these as nested keys: `settings.bookingDefaults.bookingCutoffTime`, etc.

- [ ] **Step 2: Center Defaults — Workspace Defaults tab**

Modify: `settings/center/page.tsx`
- Add state + wiring for: `seatVisibility`, `roomNamingFormat`, `defaultAvailabilityStatus`
- Wire to `updateCenter` mutation with `settings.workspaceDefaults.*` keys

- [ ] **Step 3: Center Defaults — Operational Defaults tab**

Modify: `settings/center/page.tsx`
- Add state + wiring for: `openingTime`, `closingTime`, `workingDays[]`, `meetingRoomLimit`, `eventDurationLimit`, `maintenanceWindowStart`, `maintenanceWindowEnd`, `cleaningBufferDuration`
- Wire to `updateCenter` mutation with `settings.operationalDefaults.*` keys

- [ ] **Step 4: Notifications — Automations tab**

Modify: `settings/notification/page.tsx`
- Replace the hardcoded automation JSX array with a `useQuery(GET_AUTOMATIONS)` call (note: `GET_AUTOMATIONS` does not exist yet — create a placeholder structure first)
- For P1, at minimum wire the "Add Automation" button to show a proper modal instead of dead UI
- Wire the per-automation enable/disable toggle to an `UPDATE_AUTOMATION` mutation

- [ ] **Step 5: Notifications — Send Test buttons**

Modify: `settings/notification/page.tsx`
- Wire "Send Test" buttons to call `SEND_NOTIFICATION` mutation with `sendTo: "test"` and the appropriate channel type
- Show success/error toast with actual mutation result

- [ ] **Step 6: Security — Device Management tab**

Modify: `settings/security/page.tsx`
- Add `useQuery(GET_USER_SESSIONS)` to fetch active sessions (create this query + backend support first — see Task 2.4)
- Wire "Logout All Devices" button to `LOGOUT_ALL_DEVICES` mutation (create if needed)
- Wire individual "Logout" buttons to `LOGOUT_DEVICE` mutation (create if needed)
- Show real device names, browsers, locations, and last-active timestamps from the query

---

### Task 1.4: Revenue — Wire AddContractModal and All Unwired Deposit Mutations

**Why this matters:** `AddContractModal` is rendered but `CREATE_CONTRACT` mutation is not connected. 6 deposit mutations exist in `operations.ts` but aren't wired to the UI buttons.

**Files:**
- Modify: `apps/web/src/app/dashboard/revenue/contracts/modals/add-contract-modal.tsx`
- Modify: `apps/web/src/app/dashboard/revenue/deposits/page.tsx`

- [ ] **Step 1: Wire CREATE_CONTRACT in AddContractModal**

Read: `apps/web/src/app/dashboard/revenue/contracts/modals/add-contract-modal.tsx`
- Import `useMutation(CREATE_CONTRACT)` from `@/lib/apollo/operations`
- Call `createContract` in the modal's submit handler with the form data
- Show loading state on the submit button during mutation
- Show success toast and close modal on success
- Show error toast on failure

- [ ] **Step 2: Replace window.prompt() in contracts page**

Modify: `apps/web/src/app/dashboard/revenue/contracts/page.tsx`
- Find the `handleRenew` function that uses `window.prompt()`
- Replace with a proper `<Dialog>` component that collects the new end date
- Wire to `RENEW_CONTRACT` mutation with the selected date

- [ ] **Step 3: Wire all unwired deposit mutations**

Modify: `apps/web/src/app/dashboard/revenue/deposits/page.tsx`
- Import unused mutations: `APPROVE_DEPOSIT_RELEASE`, `SEND_DEPOSIT_REMINDER`, `REQUEST_DEPOSIT_RELEASE`, `CREATE_DEPOSIT`, `UNFREEZE_DEPOSIT`
- Wire each to its corresponding modal/button in the quick-action sidebar
- Import and use `useMutation` for each
- Show loading/success/error states appropriately

- [ ] **Step 4: Wire Overdue Refunds stat**

Modify: `apps/web/src/app/dashboard/revenue/deposits/page.tsx`
- Replace hardcoded `0` for "Overdue Refunds" with a derived value from `GET_DEPOSITS`
- Filter deposits where `status === 'RELEASED' AND releasedDate > dueDate` or compute from backend `DEPOSIT_STATS` if that query exists

---

## PHASE 2: P2 — HIGH PRIORITY WIRING

### Task 2.1: Inventory — Wire CREATE_FLOOR Mutation

**Files:**
- Modify: `apps/web/src/app/dashboard/inventory/page.tsx` (FloorSetupModal)
- Modify: `apps/web/src/lib/apollo/operations.ts`

- [ ] **Step 1: Check if CREATE_FLOOR exists in operations.ts**

Grep `apps/web/src/lib/apollo/operations.ts` for `CREATE_FLOOR`. If it doesn't exist, add it:
```typescript
export const CREATE_FLOOR = gql`
  mutation CreateFloor($input: CreateFloorInput!) {
    createFloor(input: $input) { id name centerId createdAt }
  }
`;
```

- [ ] **Step 2: Wire FloorSetupModal**

Modify: `apps/web/src/app/dashboard/inventory/page.tsx`
- Import `useMutation(CREATE_FLOOR)` from operations
- In the "Add Floor" button handler, call `createFloor({ variables: { input: { name, centerId } } })`
- Show toast feedback and refresh the floors list on success

---

### Task 2.2: Inventory — Wire Per-Seat Booking Data for Table View

**Files:**
- Modify: `apps/web/src/app/dashboard/inventory/table-view/page.tsx`

- [ ] **Step 1: Add seat assignment query**

Add `useQuery(GET_BOOKINGS)` to fetch bookings, then derive `assignedTo`, `startDate`, `endDate` per seat by matching `booking.seatId === seat.id`.

- [ ] **Step 2: Show real data in table columns**

Modify the `assignedTo`, `startDate`, and `endDate` columns to display derived data instead of `"-"`.

---

### Task 2.3: Inventory — Wire Upcoming Bookings for Floor Map

**Files:**
- Modify: `apps/web/src/app/dashboard/inventory/floor-map/page.tsx`

- [ ] **Step 1: Fetch upcoming bookings per seat**

Add `useQuery(GET_BOOKINGS, { startDate: today, endDate: futureDate })` to get bookings for upcoming seats.
Use `useMemo` to compute per-seat upcoming counts and map to the seat legend (color-code seats with upcoming bookings differently).

---

### Task 2.4: Backend — Add User Session/Device Management GraphQL Ops

**Why this matters:** Settings/Security Device Management tab has no backend ops to list active sessions or log out devices.

**Files:**
- Create: `apps/api/src/typeorm/entities/user-session.entity.ts` (if not exists)
- Modify: `apps/api/src/graphql/resolvers/user.resolver.ts` or create `session.resolver.ts`
- Modify: `apps/web/src/lib/apollo/operations.ts`

- [ ] **Step 1: Check if UserSession entity exists**

Read `apps/api/src/typeorm/entities/user-session.entity.ts`. If it exists, use it. If not, create it with: `id`, `userId`, `deviceName`, `browser`, `os`, `ipAddress`, `location`, `lastActiveAt`, `createdAt`, `isActive`.

- [ ] **Step 2: Add session queries/mutations to resolver**

In `user.resolver.ts` (or a new `session.resolver.ts`), add:
```typescript
@Query(() => [UserSession])
@UseGuards(GqlAuthGuard)
async myActiveSessions(@CurrentUser() user: User) {
  return this.userSessionRepo.find({ where: { userId: user.id, isActive: true } });
}

@Mutation(() => Boolean)
@UseGuards(GqlAuthGuard)
async logoutDevice(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: User) {
  const session = await this.userSessionRepo.findOne({ where: { id, userId: user.id } });
  if (!session) throw new NotFoundException();
  session.isActive = false;
  await this.userSessionRepo.save(session);
  return true;
}

@Mutation(() => Int)
@UseGuards(GqlAuthGuard)
async logoutAllDevices(@CurrentUser() user: User) {
  const result = await this.userSessionRepo.update(
    { userId: user.id, isActive: true },
    { isActive: false }
  );
  return result.affected ?? 0;
}
```

- [ ] **Step 3: Add frontend operations and wire Security page**

Add `GET_USER_SESSIONS`, `LOGOUT_DEVICE`, `LOGOUT_ALL_DEVICES` to `operations.ts`.
Wire them in `settings/security/page.tsx` Device Management tab (see Task 1.3 Step 6).

---

### Task 2.5: Operations — Wire useEventStats Hook in Events Page

**Files:**
- Modify: `apps/web/src/app/dashboard/operations/events/page.tsx`

- [ ] **Step 1: Call the existing useEventStats hook**

Add `const { data: eventStats } = useEventStats(filter)` call and wire the stats section (Total Hours used, Upcoming Events count) to use `eventStats.totalEvents` and computed hours instead of hardcoded values.

- [ ] **Step 2: Remove dead useEvent call**

Remove the `_selectedEventDetail` dead code line where `useEvent(selectedId)` result is assigned but never used.

---

## PHASE 3: P3 — MEDIUM PRIORITY WIRING

### Task 3.1: CRM — Wire Customer Detail Tabs (Employees, Activity, Documents)

**Files:**
- Modify: `apps/web/src/app/dashboard/crm/customers/[id]/page.tsx`
- Modify: `apps/api/src/graphql/resolvers/customer.resolver.ts`
- Modify: `apps/web/src/lib/apollo/operations.ts`

- [ ] **Step 1: Add customer sub-entity queries to backend**

In `customer.resolver.ts`, add:
```typescript
@Query(() => [Employee], { name: 'customerEmployees' })
async getCustomerEmployees(@Args('customerId', { type: () => ID }) customerId: string) {
  // If Customer has a relation to employees, query it
  // For now, return [] as placeholder — needs entity relationship
  return [];
}

@Query(() => [Activity], { name: 'customerActivities' })
async getCustomerActivities(@Args('customerId', { type: () => ID }) customerId: string) {
  // Query audit logs filtered by customerId
  return [];
}

@Query(() => [Document], { name: 'customerDocuments' })
async getCustomerDocuments(@Args('customerId', { type: () => ID }) customerId: string) {
  return [];
}
```

- [ ] **Step 2: Add frontend operations**

In `operations.ts`, add: `GET_CUSTOMER_EMPLOYEES`, `GET_CUSTOMER_ACTIVITIES`, `GET_CUSTOMER_DOCUMENTS`.

- [ ] **Step 3: Wire the tabs**

Modify the Customer detail page:
- Employees tab: call `useQuery(GET_CUSTOMER_EMPLOYEES, { customerId })`
- Activity tab: call `useQuery(GET_CUSTOMER_ACTIVITIES, { customerId })`
- Documents tab: call `useQuery(GET_CUSTOMER_DOCUMENTS, { customerId })`

---

### Task 3.2: Operations — Wire Meeting Room Stats Properly

**Files:**
- Modify: `apps/web/src/app/dashboard/operations/meeting-room/page.tsx`

- [ ] **Step 1: Fix No. of Bookings stat**

Replace `displayRooms.length` with a real booking count:
```typescript
const { data: bookingsData } = useQuery(GET_BOOKINGS, {
  variables: { startDate: startOfMonth, endDate: endOfMonth }
});
const bookingCount = useMemo(() => {
  if (!bookingsData?.bookings) return 0;
  const roomIds = new Set(displayRooms.map(r => r.id));
  return bookingsData.bookings.filter(b => roomIds.has(b.meetingRoom?.id)).length;
}, [bookingsData, displayRooms]);
```

- [ ] **Step 2: Wire Total Hours used**

Compute from `GET_BOOKINGS` data: sum of `(endTime - startTime)` for all bookings in current period.

- [ ] **Step 3: Wire Peak usage Hours**

Derive from actual booking data: find the hour range with most bookings across all rooms.

---

### Task 3.3: CRM — Wire Customer Internal Notes

**Files:**
- Modify: `apps/web/src/app/dashboard/crm/customers/[id]/page.tsx`

- [ ] **Step 1: Add UPDATE_CUSTOMER mutation for notes**

Import `UPDATE_CUSTOMER` and call it when the notes textarea loses focus or has a save button. The `notes` field should be stored on the Customer entity.

---

### Task 3.4: Revenue — Wire GenerateInvoiceModal

**Files:**
- Audit: `apps/web/src/app/dashboard/revenue/invoices/modals/generate-invoice-modal.tsx`
- Modify: wire `CREATE_INVOICE` mutation

- [ ] **Step 1: Audit the GenerateInvoiceModal**

Read the modal file to check if `CREATE_INVOICE` is wired. If not, wire it with `useMutation(CREATE_INVOICE)` and proper form state management.

---

## PHASE 4: P4 — LOW PRIORITY / POLISH

### Task 4.1: Dashboard Home — Wire Trend Percentages

**Files:**
- Modify: `apps/web/src/app/dashboard/home/page.tsx`

- [ ] **Step 1: Derive trend percentages from historical data**

If `GET_DASHBOARD_METRICS` returns `previousPeriod` data, compute `changePercent = ((current - previous) / previous) * 100` for each metric.
If not available, these can be removed as cosmetic (or a follow-up task to add historical metrics to the backend).

---

### Task 4.2: Backend — Sync schema.graphql with Actual Resolver Code

**Files:**
- Modify: `apps/api/src/graphql/schema.graphql`

- [ ] **Step 1: Generate fresh schema**

Run: `cd apps/api && npx nx serve api &` (background) then introspect the running server for the actual schema, OR use the NestJS built-in `autoSchemaFile` approach to generate it.

The `schema.graphql` file is a reference document only — the actual schema is code-first. The priority is ensuring the schema file is in sync for API consumers (Postman, external tools).

---

## FILE INVENTORY

| Action | File | Phase |
|--------|------|-------|
| Create | `apps/api/src/typeorm/entities/discount.entity.ts` | 1 |
| Create | `apps/api/src/typeorm/migrations/XXXXXX_create_discount_table.ts` | 1 |
| Create | `apps/api/src/graphql/types/discount.type.ts` | 1 |
| Create | `apps/api/src/graphql/inputs/discount.input.ts` | 1 |
| Create | `apps/api/src/graphql/resolvers/discount.resolver.ts` | 1 |
| Modify | `apps/api/src/app/app.module.ts` | 1 |
| Modify | `apps/web/src/lib/apollo/operations.ts` | 1, 2, 3 |
| Modify | `apps/web/src/app/dashboard/revenue/invoices/page.tsx` | 1 |
| Modify | `apps/web/src/app/dashboard/revenue/contracts/page.tsx` | 1 |
| Modify | `apps/web/src/app/dashboard/revenue/contracts/modals/add-contract-modal.tsx` | 1 |
| Modify | `apps/web/src/app/dashboard/revenue/deposits/page.tsx` | 1 |
| Modify | `apps/web/src/app/dashboard/settings/center/page.tsx` | 1 |
| Modify | `apps/web/src/app/dashboard/settings/notification/page.tsx` | 1 |
| Modify | `apps/web/src/app/dashboard/settings/security/page.tsx` | 1 |
| Modify | `apps/web/src/app/dashboard/inventory/page.tsx` | 2 |
| Modify | `apps/web/src/app/dashboard/inventory/table-view/page.tsx` | 2 |
| Modify | `apps/web/src/app/dashboard/inventory/floor-map/page.tsx` | 2 |
| Modify | `apps/api/src/graphql/resolvers/user.resolver.ts` | 2 |
| Modify | `apps/web/src/app/dashboard/operations/events/page.tsx` | 2 |
| Modify | `apps/web/src/app/dashboard/operations/meeting-room/page.tsx` | 3 |
| Modify | `apps/web/src/app/dashboard/crm/customers/[id]/page.tsx` | 3 |
| Modify | `apps/web/src/app/dashboard/operations/page.tsx` | 1 |
| Modify | `apps/api/src/graphql/schema.graphql` | 4 |

---

## TESTING APPROACH

For each task:
1. Start the dev servers: `npx nx serve api` (port 4000) + `npx nx dev web` (port 3000)
2. Navigate to the page being wired
3. Perform the user action (submit form, click button, etc.)
4. Verify GraphQL network tab shows the mutation/query
5. Verify data persists (refetch or reload)
6. Verify toast feedback appears on success/error
7. For backend changes: run `npx nx test api` to check no regressions
