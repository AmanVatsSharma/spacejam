# CRM, Operations, Inventory, and Settings Analysis

## 1. Frontend Inspection (Pages, Forms, and Mock Arrays)

### 1.1 CRM Pages
* **Customers Route** (`apps/web/src/app/dashboard/crm/customers/page.tsx`):
  * **Mock Arrays**: 
    * `statsData`: Static KPIs (Total Customer, Active Members, 1 Expiring Soon, etc.).
    * `customersData`: Table rows representing clients with fields `id`, `name`, `teamSize`, `location`, `joinDate`, `billing`, `lastInvoice`, `status`.
    * `recentActivities`: List of activity objects (Payment Failed, Printer Booked Today).
  * **Forms**:
    * `ExportToExcelDialog` (internal to page): Lets user select export type (`all` | `filtered`) and format (`excel` | `csv`).
    * `AddClientModal` (`apps/web/src/components/ui/dashboard/add-client-modal.tsx`): Uncontrolled form allowing client creation. Fields:
      * **Basic Info**: Full Name, Phone Number, Email Address, Company Name.
      * **Client Details**: Client Type (Enterprise/Startup/Freelancer), Assigned Plan (Hot Desk/Dedicated Desk/Private Office), Team Size, Contract Start Date.
      * **Location**: Base Center (empty dropdown options), Allocated Space.
      * **Notes**: Additional Information.
      * *Note: No API submission or logic is wired for "Create Client" or "Save as Draft" buttons.*
* **Lead Detail Route** (`apps/web/src/app/dashboard/crm/[id]/page.tsx`):
  * **Mock Arrays**: `leadsData` containing dynamic lookup mappings for mock lead objects (`rahul-sharma`, `startupx`, `ankit`, `techcorp`, `priya-singh`).
  * **Forms**:
    * `EditLeadModal` (`apps/web/src/components/crm/EditLeadModal`): Form displaying lead fields for modification.
    * Buttons for *Convert to Client*, *Update Status*, *Schedule Visit*, *Send Proposal*, and quick actions (*Call*, *Send WhatsApp*, *Send Email*, *Add Note*) are purely visual and trigger no API mutations.

### 1.2 Operations Pages
* **Operations Route** (`apps/web/src/app/dashboard/operations/page.tsx`):
  * **Mock Arrays**:
    * `mockBookings`: Reservation rows with fields `id`, `guest`, `space`, `checkIn`, `checkOut`, `status`.
    * Timeline items: Lists rooms on the 1st/2nd floor (Boardroom A, Meeting Room 1, Conference 1, etc.) along with their schedules.
    * Active Add-ons & Requests: Projector Setup, Catering Service, Extra WiFi Access.
  * **Forms**:
    * `BookRoomModal` (`apps/web/src/components/ui/dashboard/book-room-modal.tsx`): Room booking form. Fields:
      * Room Selection, Date, Start Time, End Time, Meeting Title / Purpose, Attendees (number), Special Requirements (projector, whiteboard, etc.).
      * *Note: No API mutation hooks are wired for form submission.*

### 1.3 Inventory Pages
* **Inventory Route** (`apps/web/src/app/dashboard/inventory/page.tsx`):
  * **Mock Arrays**: 
    * `mockLocations`: Chandigarh (IT Park, Sector 17, Industrial Area), Mohali, Jalandhar.
    * `mockFloors`: Floor 1-4 metrics (total seats, status, open seats, occupancy).
  * **Forms / Modals**:
    * `SetUpCenterModal` (`apps/web/src/components/ui/dashboard/set-up-center-modal.tsx`): 5-step modal wizard. Fields:
      * **Step 1 (Center Info)**: Location details (City, Branch, Address, State, Country, Timezone), Business/Tax details (Legal Name, Trade Name, GSTIN, PAN, Type, State Code, GST toggle), Billing Defaults (Prefix, Currency).
      * **Step 2 (Product Types & Pricing)**: Dynamic pricing table (Base Price, GST %, Token Included count, Token Value).
      * **Step 3 (Floor Setup)**: Floor details, Product distribution config (count, space code format, amenities, availability).
      * **Step 4 (Space Setup)**: Floor map layout upload, Seat list edit panel (overriding price, status, amenities, notes for individual seats).
      * **Step 5 (Review)**: Final confirmation review.
    * `FloorSetupModal` (`apps/web/src/components/ui/dashboard/floor-setup-modal.tsx`): Similar multi-step wizard focused specifically on floor and seat/cabin distributions.
    * *Note: Form submission triggers no backend actions; it merely resets local component state.*

### 1.4 Settings Pages
* **Settings Route** (`apps/web/src/app/dashboard/settings/page.tsx`):
  * **Mock Arrays**: `DUMMY_USERS` representing owners, center managers, and support staff.
  * **Forms**:
    * **Profile Tab**: Fields (Full Name, Email, Phone, Role, Assigned Centers, Reporting Manager), toggle for Account Status (Active/Inactive), and actions (Save, Suspend, Delete).
    * **Permissions Tab**: Multi-category permission toggles (Booking, Financial, Marketing, User permissions).
    * **Centers Tab**: Multi-level checklist for center/branch access control.
    * **Security Tab**: Toggles for OTP, Biometric Login, session timeout limit, list of connected devices, and "Logout All Devices" action.
    * **Notifications Tab**: WhatsApp, Email, Push toggle channels, and alert types subscriptions.
    * *Note: All inputs/actions exist strictly as React states without API integration.*

---

## 2. Backend Resolver Mapping (Existing vs. Missing)

Resolvers are housed in `apps/api/src/graphql/resolvers/`.

| Route Feature / UI | Resolver File | Existing Resolvers | Missing Resolvers / API |
| :--- | :--- | :--- | :--- |
| **CRM (Leads)** | `crm.resolver.ts` | `leads`, `lead`, `leadCount`, `createLead`, `updateLead`, `convertLead`, `deleteLead` | Lead conversion flows into `User` or `Client` tables need proper mapping. |
| **CRM (Customers & Onboarding)** | None | None | **Missing entirely**: No queries or mutations exist for managing Onboarded Customers, Customer details/status, or Onboarding workflows. |
| **CRM (Deposits)** | `revenue.resolver.ts` | `deposits`, `deposit`, `createDeposit`, `updateDeposit`, `releaseDeposit`, `deleteDeposit` | Queries/mutations for deposits exist, but are not wired to the UI. |
| **Operations (Bookings)** | `booking.resolver.ts` | `bookings`, `myBookings`, `booking`, `createBooking`, `cancelBooking`, `processPayment` | **Missing Check-in/Out API**: There are no resolver methods for checking in or checking out of a space (only booking cancellation/refund). |
| **Operations (Meeting Rooms)** | `meeting-room.resolver.ts` | `meetingRooms`, `meetingRoom`, `availableRooms`, `roomAvailability`, `createMeetingRoom`, `updateMeetingRoom`, `updateRoomStatus`, `deleteMeetingRoom`, `bulkUpdateStatus`, `bookRoom`, `cancelBooking` | Full feature set is backend-complete. |
| **Operations (Requests / Tasks)** | `request.resolver.ts` | `requests`, `request`, `requestStats`, `myRequests`, `createRequest`, `updateRequest`, `assignRequest`, `approveRequest`, `rejectRequest`, `completeRequest`, `cancelRequest`, `deleteRequest`, `escalateRequest` | Full feature set is backend-complete. |
| **Operations (Events)** | `event.resolver.ts` | `events`, `event`, `todayEvents`, `upcomingEvents`, `pastEvents`, `eventStatistics`, `availableRoomsForEvent`, `createEvent`, `updateEvent`, `updateEventStatus`, `cancelEvent`, `deleteEvent`, `myEvents` | Full feature set is backend-complete. |
| **Inventory (Locations/Centers/Floors/Seats)** | `center.resolver.ts` | `centers`, `center`, `myCenters`, `createCenter`, `updateCenter`, `deleteCenter`<br>`locations`, `location`, `createLocation`, `updateLocation`<br>`floors`, `createFloor`<br>`seats`, `seat`, `createSeat`, `updateSeat` | **Missing Bulk Auto-Generation**: No resolver or mutation exists to bulk auto-generate floors and seats based on Step 3/4 setup configurations. |
| **Settings (User Profile)** | `user.resolver.ts` | `me`, `users`, `user`, `updateProfile`, `deleteUser`, `setUserRole` | Full basic profiles are supported. |
| **Settings (Permissions & Security)** | None | None | **Missing entirely**: No queries or mutations exist to read/write granular role permissions, toggle security policies (OTP/Biometrics/Timeout), or list/revoke device sessions. |
| **Settings (Notifications)** | None | None | **Missing entirely**: No queries or mutations exist to manage user notification channels or alerts configuration. |

---

## 3. Database Schema and Entity Structures

All TypeORM entities are imported and registered in `apps/api/src/typeorm/data-source.ts`.

### 3.1 Key Entity Layouts

#### 3.1.1 Lead (`apps/api/src/typeorm/entities/lead.entity.ts`)
* Represents a CRM lead.
* **Fields**: `id` (UUID), `name`, `email`, `phone`, `company`, `status` (Enum: `New`, `Visited`, `Negotiation`, `Converted`, `Cold`), `source` (Enum: `Website`, `Referral`, `Walk-in`, `Social`, `Email`), `requirement`, `budget`, `location`, `notes`, `assignedToId` (FK to User), `centerId` (FK to Center), `lastContact`, timestamps.
* **Relations**: `assignedTo` (User), `center` (Center).

#### 3.1.2 Invoice (`apps/api/src/typeorm/entities/invoice.entity.ts`)
* Represents financial invoices for customers.
* **Fields**: `id` (UUID), `invoiceNumber`, `customerId` (FK to User), `customerName`, `customerEmail`, `centerId` (FK to Center), `planName`, `amount` (Decimal), `tax` (Decimal), `totalAmount` (Decimal), `status` (Enum: `Draft`, `Sent`, `Paid`, `Overdue`, `Cancelled`), `issueDate`, `dueDate`, `paidDate`, `paymentMethod`, `notes`, timestamps.
* **Relations**: `customer` (User), `center` (Center).

#### 3.1.3 Deposit (`apps/api/src/typeorm/entities/deposit.entity.ts`)
* Represents customer security deposits or advances.
* **Fields**: `id` (UUID), `customerId` (FK to User), `customerName`, `centerId` (FK to Center), `amount` (Decimal), `type` (Enum: `Security`, `Advance`, `Other`), `status` (Enum: `Held`, `Released`, `Refunded`), `referenceNumber`, `receivedDate`, `releasedDate`, `notes`, timestamps.
* **Relations**: `customer` (User), `center` (Center).

#### 3.1.4 Contract (`apps/api/src/typeorm/entities/contract.entity.ts`)
* Represents active customer agreements.
* **Fields**: `id` (UUID), `contractNumber`, `customerId` (FK to User), `customerName`, `centerId` (FK to Center), `planName`, `startDate`, `endDate`, `status` (Enum: `Active`, `Expiring Soon`, `Expired`, `Terminated`), `amount` (Decimal), `paymentFrequency` (Enum: `Monthly`, `Quarterly`, `Half-Yearly`, `Yearly`), `autoRenew` (Boolean), `terms`, timestamps.
* **Relations**: `customer` (User), `center` (Center).

#### 3.1.5 Seat, Floor, Center, and Location (Inventory Entities)
* **Location** (`location.entity.ts`): City, State, Country, Full Address, Timezone, relations to Centers.
* **Center** (`center.entity.ts`): Name, Location relation, floors list relation, owner, status.
* **Floor** (`floor.entity.ts`): Center relation, Name, layout plan, total seats count, list of seats relation.
* **Seat** (`seat.entity.ts`): Floor relation, Number/label, Seat Type (Enum: `HOT_DESK`, `DEDICATED`, `CABIN`), features, price, Status (Enum: `AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `RESERVED`).

### 3.2 Verification of Tables and Database Seeds
* **Table Creation**: The database tables are handled dynamically in non-production environments using TypeORM schema synchronization (`synchronize: process.env.NODE_ENV !== 'production'`). No SQL migrations currently exist under `apps/api/src/typeorm/migrations/` (the directory is missing).
* **Seeds Status**: Only a single script exists: `apps/api/src/auth/scripts/seed-admin.ts`.
* **Action Item**: We **must create a database seeding system** to populate Locations, Centers, Floors, Seats, dummy Leads, dummy Customers, dummy Invoices/Deposits, and sample Bookings. Without this seed data, the front-end dashboard displays empty views because the tables contain no data, and there is no simple way to run end-to-end user path validation.
