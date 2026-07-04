# Explorer 3 Handoff Report

## 1. Observation

### 1.1 Frontend Pages & Forms
* **CRM Route (Customers)** (`apps/web/src/app/dashboard/crm/customers/page.tsx`):
  * Verbatim mock arrays (lines 80-96):
    ```typescript
    const statsData = [
      { label: "Total Customer", value: 20, icon: "users" },
      ...
    ];
    const customersData: Customer[] = [
      { id: "1", name: "Technova solution", teamSize: "25 seats", location: "Ch-Hub", joinDate: "Jan 15, 2025", billing: "Paid", lastInvoice: "12 Mar", status: "Upgrade" },
      ...
    ];
    ```
  * Modal form imported (lines 313):
    ```tsx
    <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} />
    ```
* **Add Client Modal** (`apps/web/src/components/ui/dashboard/add-client-modal.tsx`):
  * Defines fields on lines 35-141: Full Name, Phone Number, Email Address, Company Name, Client Type, Assigned Plan, Team Size, Contract Start Date, Base Center, Allocated Space, and Additional Information notes.
  * Form actions on lines 145-158: "Cancel" (calls `onClose`), "Save as Draft", and "Create Client" buttons have no handlers attached.
* **Operations Route** (`apps/web/src/app/dashboard/operations/page.tsx`):
  * Verbatim mock arrays (lines 27-32):
    ```typescript
    const mockBookings: Booking[] = [
      { id: "BK-001", guest: "Priya Sharma", space: "Cabin A1", checkIn: "9:00 AM", checkOut: "6:00 PM", status: "checked-in" },
      ...
    ];
    ```
  * Modal form imported (line 597):
    ```tsx
    <BookRoomModal open={showBookRoom} onClose={() => setShowBookRoom(false)} />
    ```
* **Book Room Modal** (`apps/web/src/components/ui/dashboard/book-room-modal.tsx`):
  * Defines fields on lines 23-76: Select Room, Date, Start/End Time, Meeting Title / Purpose, Attendees count, and Special Requirements.
  * Actions on lines 78-89: "Confirm Booking" button has no form handler or API mutation.
* **Inventory Route** (`apps/web/src/app/dashboard/inventory/page.tsx`):
  * Verbatim mock arrays (lines 21-77): `mockLocations` and `mockFloors`.
  * Modal wizards imported on lines 147-155: `<SetUpCenterModal isOpen={showSetupModal} onClose={...} />` and `<FloorSetupModal isOpen={showFloorModal} onClose={...} />`.
* **SetUp Center Modal** (`apps/web/src/components/ui/dashboard/set-up-center-modal.tsx`):
  * Defines a 5-step wizard setup containing location form inputs, business tax inputs (GSTIN, PAN), billing preferences, catalog item tables, and seat distribution layout configurations.
  * Action buttons ("Create center") on lines 783-797 do not call any API or submit the structured state to the backend.
* **Settings Route** (`apps/web/src/app/dashboard/settings/page.tsx`):
  * Verbatim mock arrays (lines 57-65):
    ```typescript
    const DUMMY_USERS = [
      { id: 1, name: "Sarah Johnson", group: "FRANCHISE OWNERS", role: "Franchise Owner", sub: "All Centers", status: "Active" },
      ...
    ];
    ```
  * Forms for "Profile" (lines 153-178), "Permissions" toggles (lines 200-302), "Centers" branch checklist (lines 305-348), "Security" options (lines 349-405), and "Notifications" toggles (lines 406-472) are all controlled by local component states with no GraphQL mutation bindings.

### 1.2 Backend Resolvers
* Backend resolvers are located in `apps/api/src/graphql/resolvers/`.
  * `crm.resolver.ts`: Defines `CrmResolver` resolving `Lead` entities (queries: `leads`, `lead`, `leadCount`; mutations: `createLead`, `updateLead`, `convertLead`, `deleteLead`).
  * `booking.resolver.ts`: Defines `BookingResolver` (queries: `bookings`, `myBookings`, `booking`; mutations: `createBooking`, `cancelBooking`, `processPayment`).
  * `meeting-room.resolver.ts`: Defines `MeetingRoomResolver` (mutations: `bookRoom`, `cancelBooking`, `createMeetingRoom`, `updateRoomStatus`, etc.).
  * `revenue.resolver.ts`: Defines `InvoiceResolver` (invoice queries/mutations), `DepositResolver` (deposit queries/mutations), and `ContractResolver` (contract queries/mutations).
  * `user.resolver.ts`: Defines `UserResolver` resolving profiles and base roles.

### 1.3 Database Schema & Seeds
* `apps/api/src/typeorm/data-source.ts` (lines 40-61): Registers TypeORM entities including `User`, `Center`, `Location`, `Floor`, `Seat`, `Booking`, `Payment`, `Lead`, `Invoice`, `Deposit`, `Contract`, `MeetingRoom`, `Event`, `Request`, and others.
* Directory `apps/api/src/typeorm/migrations/` was search-confirmed to be non-existent.
* In `apps/api/src/auth/scripts/`, only `seed-admin.ts` exists. No seeds exist for Location, Center, Floor, Seat, Bookings, Leads, or billing tables.

---

## 2. Logic Chain

1. **Frontend-to-Backend Gap**:
   * Inspecting `add-client-modal.tsx` and `book-room-modal.tsx` confirms they are purely visual React forms with no submission event handlers.
   * Reviewing the backend resolvers reveals that while meeting rooms (`MeetingRoomResolver`) and leads (`CrmResolver`) have resolvers, other key routes/features lack backend API mappings.
   * In CRM, there is no customer onboarding resolver (only lead resolvers exist in `crm.resolver.ts`).
   * In Operations, the UI shows check-in/out actions, but `booking.resolver.ts` lacks check-in/out mutations.
   * In Inventory, the `SetUpCenterModal` configures multiple entities (Location, Center, Floor, Seats) concurrently, but `center.resolver.ts` only exposes separate, single-entity creation mutations (`createCenter`, `createLocation`, `createFloor`, `createSeat`) rather than a bulk auto-generation transaction.
   * In Settings, permissions toggles, security configurations, and notifications preferences have no matching schema queries or mutations in `user.resolver.ts`.
2. **Database Schema & Testability**:
   * TypeORM is configured with `synchronize: true` in non-production environments inside `data-source.ts`, which automatically builds database tables.
   * However, there are no migrations (`migrations/` folder is absent) and no seed scripts (except `seed-admin.ts`).
   * Consequently, in a fresh local environment, the database tables will be created but remain completely empty. This results in empty dashboards and breaks frontend stats rendering unless we seed mock locations, centers, floors, seats, leads, customers, and bookings.

---

## 3. Caveats

* Granular subpages like `apps/web/src/app/dashboard/crm/onboarding/page.tsx` and `apps/web/src/app/dashboard/crm/onboarding-list/page.tsx` were identified but not deep-dived line-by-line as the general architecture of frontend routing and mock representation applies uniformly to them.
* Assumed TypeORM auto-synchronization behaves as expected in development without manual SQL migration configurations.

---

## 4. Conclusion

1. **Frontend Forms & Mock Data**: All pages (CRM, Operations, Inventory, Settings) and associated modal wizards (`AddClientModal`, `BookRoomModal`, `SetUpCenterModal`, `FloorSetupModal`) currently rely on hardcoded mockup arrays and have no active mutation submission handlers.
2. **Missing Resolvers**:
   * **CRM**: Missing Customer Accounts & Onboarding tracking resolvers.
   * **Operations**: Missing Booking Check-in and Check-out mutations.
   * **Inventory**: Missing bulk floor-space auto-generation transaction mutation.
   * **Settings**: Missing granular permissions updates, security configs updates, notification preferences, and active devices revoking resolvers.
3. **Database & Seeds**: Schema entities are fully defined and registered, but we lack database migration files and require a comprehensive seeding script to populate testing locations, centers, floors, seats, sample bookings, and leads.

---

## 5. Verification Method

* **Frontend Page Inspection**: Verify imports and state mapping in the following files:
  * `apps/web/src/app/dashboard/crm/customers/page.tsx`
  * `apps/web/src/components/ui/dashboard/add-client-modal.tsx`
  * `apps/web/src/app/dashboard/operations/page.tsx`
  * `apps/web/src/components/ui/dashboard/book-room-modal.tsx`
  * `apps/web/src/app/dashboard/inventory/page.tsx`
  * `apps/web/src/components/ui/dashboard/set-up-center-modal.tsx`
  * `apps/web/src/app/dashboard/settings/page.tsx`
* **Backend Resolvers & Entities Verification**: Inspect the resolver classes and `data-source.ts` config in:
  * `apps/api/src/graphql/resolvers/`
  * `apps/api/src/typeorm/data-source.ts`
  * `apps/api/src/auth/scripts/seed-admin.ts`
