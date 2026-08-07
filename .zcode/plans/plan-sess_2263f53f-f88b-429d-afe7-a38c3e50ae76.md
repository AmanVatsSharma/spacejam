# Mobile App Full Wiring Remediation — Enterprise-Grade

## Goal
Transform the SpaceJam mobile app from its current state (~40% wired, heavy mock data, 8 broken GraphQL operations, 6 features with no backend) into a fully production-wired app: every screen fetches real data from the API, every mutation persists, no mock data, no non-functional UI.

## Scope Summary
- **Fix 8 broken GraphQL operations** in `operations.ts` (field renames, arg shapes, dropped non-existent relations).
- **Rewire ~15 mock screens** to real queries/mutations.
- **Build 6 new backend modules** for features with no current backend surface (wallet transactions, print jobs, offers, support tickets, statements, referral program).
- **Wire booking flow** to submit real selected values instead of `// Mock` data.
- **Wire real file upload** to the existing `/print/upload` endpoint.
- **Build verification** at each milestone.

---

## Milestone 1 — Fix broken GraphQL operations (mobile-only, highest ROI)

**File:** `apps/mobile/src/lib/apollo/operations.ts`

Rewrite each broken operation to match the live NestJS schema (verified against entity `@Field` decorators and resolver `@Args`). Correct selections sourced from the web app's `operations.ts` (the production-proven reference):

| Operation | Fix |
|---|---|
| `GET_BOOKINGS` | Change `bookings(centerId, status)` → `bookings($filters: BookingFiltersInput)`. Replace `date startTime endTime` with `startDate endDate`. Keep `seat.floor.center.name` (Floor→Center chain valid). |
| `GET_MY_BOOKINGS` / `GET_HOME_DATA.myBookings` | Replace `date startTime endTime` → `startDate endDate`. |
| `CREATE_BOOKING` | Replace `date` → `startDate` in selection. (Input type already correct: `CreateBookingInput { seatId, startTime, endTime }`.) |
| `GET_MEETING_ROOMS` | Change `meetingRooms(centerId)` → `meetingRooms($filters: RoomFiltersInput)`. **Drop `floor { ... }`** — MeetingRoom has no `floor` relation, only `floorId` + `center`. Select `name capacity hourlyRate roomType status amenities` instead. |
| `GET_SEATS` | Replace `type` → `seatType`. **Drop `pricing { hourly daily monthly }`** (doesn't exist) — select flat `price` + `amenities status`. |
| `GET_INVOICES` | **Drop `booking { id seat { name } }`** — Invoice has no `booking` relation. Replace with real fields: `invoiceNumber customerName customerEmail amount tax totalAmount status issueDate dueDate paidDate paymentMethod`. |
| `GET_EVENTS` / `GET_EVENT` | Replace `date` → `eventDate`. Add real fields: `company eventType cost attendeesCount durationMinutes meetingRoom { id name }`. |
| `GET_NOTIFICATIONS` | Replace `body` → `message`. Add `priority actionUrl`. |
| `CREATE_REQUEST` (selection) | Replace `type` → `requestType` on returned object. |
| `RECHARGE_WALLET` / `REGISTER_DEVICE_TOKEN` / `SIGNIN` / `GET_ME` / `UPDATE_PROFILE` / `BOOK_ROOM` / `MARK_NOTIFICATION_READ` | Already correct — no change. |

**Also:** update `apps/api/src/graphql/schema.graphql` (the reference doc) to add the missing `rechargeWallet` and `registerDeviceToken` mutations so the doc matches the live schema.

**Validation:** `cd apps/mobile && npx tsc --noEmit` + run app in dev against `localhost:3001/api/graphql`, confirm `HomeScreen`, `MyBookingsScreen`, `EventsScreen`, `AvailableRoomsScreen`, `MyInvoicesScreen`, `NotificationsScreen` load real data without error toasts.

---

## Milestone 2 — Build new backend modules for missing features

Each module follows the existing `request.module.ts` / `request.resolver.ts` / `request.entity.ts` / `request.input.ts` convention. Register each in `apps/api/src/app/app.module.ts` imports array (alongside `MeetingRoomModule`, `RequestModule`).

### 2a. Wallet Transaction History (`apps/api/src/wallet/`)
- **Entity** `wallet-transaction.entity.ts`: `id`, `userId`, `type` (CREDIT/DEBIT), `amount` (Int tokens), `balanceAfter`, `reference` (booking id / invoice id / recharge id), `description`, `createdAt`.
- **Hook into existing `rechargeWallet`** in `user.resolver.ts`: insert a CREDIT row on recharge.
- **Resolver** `wallet.resolver.ts`: `@Query myWalletTransactions(limit, offset, type)` returns `[WalletTransaction]` scoped to current user (from `@Context`).
- **Module** `wallet.module.ts`. Register in app.module.
- **Migration:** TypeORM `synchronize: true` (verify in `app.module.ts` DataSource config — if false, add a migration).

### 2b. Print Jobs (`apps/api/src/print/`)
- **Reuse existing `/print/upload` REST endpoint** in `print.controller.ts` (already handles multer upload to `./uploads`).
- **Entity** `print-job.entity.ts`: `id`, `userId`, `fileUrl`, `fileName`, `pages` (Int), `copies` (Int), `color` (Boolean), `paperSize`, `sides`, `cost` (Float, computed server-side), `status` (PENDING/PROCESSING/COMPLETED/FAILED), `createdAt`, `updatedAt`.
- **Resolver** `print-job.resolver.ts`: `@Query myPrintJobs`, `@Mutation createPrintJob(input)` (creates row + returns cost from server pricing table, NOT client), `@Query printJob(id)`.
- **Cost logic moves server-side** — mobile sends `pages, copies, color`; server computes `cost` from a pricing config (fixes the `// Fake cost logic` in PrintPreviewScreen).
- **Module** `print.module.ts`, register in app.module.

### 2c. Offers / Promo Codes (`apps/api/src/offer/`)
- **Entity** `offer.entity.ts`: `id`, `code`, `title`, `description`, `type` (PERCENTAGE/FIXED/TOKENS), `value`, `minOrderAmount`, `maxDiscount`, `validFrom`, `validUntil`, `isActive`, `usageCount`, `usageLimit`, `createdAt`.
- **Entity** `offer-redemption.entity.ts`: `id`, `offerId`, `userId`, `bookingId`, `redeemedAt`.
- **Resolver** `offer.resolver.ts`: `@Query activeOffers` (returns offers valid now with `usageCount < usageLimit`), `@Query validateOffer(code, orderAmount)`, `@Mutation redeemOffer(code, bookingId)`.
- **Module** `offer.module.ts`, register.

### 2d. Support Tickets (`apps/api/src/support/`)
- **Entity** `support-ticket.entity.ts`: `id`, `userId`, `subject`, `description`, `category` (BOOKING/PAYMENT/PRINT/OTHER), `priority`, `status` (OPEN/IN_PROGRESS/RESOLVED/CLOSED), `createdAt`, `updatedAt`.
- **Entity** `support-message.entity.ts`: `id`, `ticketId`, `userId`, `isAdmin`, `message`, `createdAt`.
- **Resolver** `support.resolver.ts`: `@Query mySupportTickets`, `@Mutation createSupportTicket(input)`, `@Mutation addSupportMessage(ticketId, message)`.
- **Module** `support.module.ts`, register.

### 2e. Statements (`apps/api/src/statement/`)
- **No new entity** — statements are generated on-the-fly from existing `wallet_transactions`, `invoices`, `payments`, `bookings`.
- **Resolver** `statement.resolver.ts`: `@Query myStatement(fromDate, toDate)` returns aggregated object `{ totalCredits, totalDebits, openingBalance, closingBalance, transactions: [...] }`.
- **PDF generation**: use `pdfkit` (add to `apps/api/package.json`) in a `@Query statementPdf(fromDate, toDate)` returning a base64 PDF, OR a REST controller streaming the PDF.
- **Module** `statement.module.ts`, register.

### 2f. Referral Program (`apps/api/src/referral/`)
- **Entity** `referral.entity.ts`: `id`, `referrerId`, `referredEmail`, `referredUserId` (nullable), `code`, `status` (PENDING/SUCCESSFUL/REWARDED), `rewardAmount`, `rewardedAt`, `createdAt`.
- **Resolver** `referral.resolver.ts`: `@Query myReferrals`, `@Query myReferralStats` (returns `{ successful, pending, totalEarned, referralCode }`), `@Mutation generateReferralCode`, `@Mutation applyReferralCode(code)` (called at signup).
- **Hook into `signin`/`signup`**: if a pending referral matches the user's email, mark SUCCESSFUL and credit both wallets.
- **Module** `referral.module.ts`, register.

**Validation per module:** `nx build api` succeeds; GraphQL playground at `localhost:3001/api/graphql` executes each new query/mutation against a seeded dev DB; existing tests still pass (`nx test api`).

---

## Milestone 3 — Rewire mobile mock screens to real data

Add the new operations to `apps/mobile/src/lib/apollo/operations.ts` first, then rewire each screen:

| Screen | Current mock | Real wiring |
|---|---|---|
| `WalletScreen.tsx:39-72` | Hardcoded `history` array | `useQuery(MY_WALLET_TRANSACTIONS)`. Keep `GET_ME` for balance. Filter pills (All/Credit/Debit) filter the real list via `variables`. |
| `MyEventDetailsScreen.tsx` | All-static "Tech Summit 2026" | Accept route param `eventId`, `useQuery(GET_EVENT)` → render `title description eventDate startTime endTime company meetingRoom.name attendeesCount`. |
| `MyPrintDetailsScreen.tsx` | All-static "PR-134247" | Accept `printJobId`, `useQuery(MY_PRINT_JOBS)` filter by id, or new `GET_PRINT_JOB(id)`. |
| `MyRoomDetailsScreen.tsx` | All-static "Ocean View MR-201" | Accept `bookingId`, `useQuery(GET_MY_BOOKINGS)` filter, render real `seat.name startDate endDate center.name`. |
| `OffersScreen.tsx` | 4 hardcoded offers | `useQuery(ACTIVE_OFFERS)`. Copy button uses `expo-clipboard` (already a dep). |
| `ReferAndEarnScreen.tsx` | Hardcoded stats + "SPACE2025" | `useQuery(MY_REFERRAL_STATS)`. Share uses `expo-sharing` or `Linking`. |
| `QuickBookingScreen.tsx` | Hardcoded room + "Confirm Booking" no-op | Accept `roomId` from navigation params; pull room from `GET_MEETING_ROOMS` cache; "Confirm Booking" calls `BOOK_ROOM_MUTATION` with real values then navigates. |
| `SupportScreen.tsx:26-47` | 5 fake FAQs, no submit | Keep FAQs as static content (legitimate). Add `useMutation(CREATE_SUPPORT_TICKET)` to "Submit Feedback" with category + message. |
| `InvoicePreviewModal.tsx` | Ignores `invoice` prop, hardcoded "Dikshita Bansal" | Render fields from the `invoice` prop passed in (`invoiceNumber customerName customerEmail amount tax totalAmount dueDate paymentMethod`). Remove all hardcoded literals. |
| `BookingAgreementModal.tsx` | Hardcoded "Dikshita Bansal", GST, dates | Render from passed `invoice`/`booking` prop. |
| `ConfirmBookingModal.tsx` | Hardcoded "Ocean View MR-201", ₹270 | Render summary from the booking inputs passed via props/params. |
| `PaymentScreen.tsx` | "MockPay" setTimeout | Replace with `useMutation(PROCESS_PAYMENT)` (existing backend op — `paymentId + method`). For bookings: create payment after booking. Navigate to success only on real completion. |
| `AddTokensPaymentScreen.tsx` | Static ₹500, no-op button | Amount comes from route param (set by `RechargeTokensScreen`). On "Proceed to Pay", call `RECHARGE_WALLET` then navigate. |
| `PrintUploadModal.tsx:54-68` | Commented-out fetch, setTimeout fake | Uncomment + fix the `fetch` to hit `${API_BASE_URL}/print/upload` with `FormData` (file + userId). On success call `CREATE_PRINT_JOB` mutation. Real `PrintController` already exists at `/print/upload`. |
| `CalendarModal.tsx:19-26` | Static "January 2023" grid | Compute real month grid from `new Date()` (first weekday + days-in-month). Allow month navigation. |
| `LocationModal.tsx:20-25` | Fake centers | `useQuery(GET_MY_CENTERS)` (existing backend op). |
| `NotificationSettingsScreen.tsx:23-26` | Local-only toggles | New `@Mutation updateNotificationPreferences(input)` + `@Query myNotificationPreferences`. Persist on toggle. |
| `StatementModal.tsx` | Hardcoded dates, no-op download | Date range from a real date picker. `useQuery(MY_STATEMENT, { variables: { fromDate, toDate } })`. "Download PDF" triggers the statement PDF endpoint. |
| `DateTimeModal.tsx`, `FilterModal.tsx`, `CustomOfferModal.tsx` | Hardcoded arrays, discarded selections | Lift selected values to parent via `onApply` callbacks; real date/time/seat-filter values flow into the booking mutation. |
| `HomeScreen.tsx` (Tier 2) | Hardcoded stats + 2 fake "Nearest Spaces" cards | Render `data.me.tokenBalance` (already fetched). Replace fake stats with real data: `myBookings` count, `invoices` due total. Replace fake Nearest Spaces with `GET_MY_CENTERS` (real centers the user has access to). Wire `CustomOfferModal` + `PrintUploadModal` to actually open. |
| `EventDetailsScreen.tsx:102-142` | Hardcoded venue/host, `alert('Book event!')` | Render `event.company`, `event.meetingRoom.name`. "Book" button calls `BOOK_ROOM_MUTATION` with `roomId = event.meetingRoomId`, `eventDate = event.eventDate`, real times. |
| `EventsScreen.tsx`, `AvailableRoomsScreen.tsx` | Hardcoded Unsplash images, location, features | Use `event.company`/`meetingRoom.name` for location. Use `room.amenities` (real) for features. Status from real `status` field. Keep Unsplash images only as fallback when entity has none. |
| `NotificationsScreen.tsx:53` | Hardcoded "3" unread badge | `useQuery(NOTIFICATION_STATS)` → render `unread` count. Make filter pills actually filter via `variables`. |
| `MyInvoicesScreen.tsx` | Tabs don't filter | Wire tabs to `GET_INVOICES` `filters` — needs a new `category` field on `InvoiceFiltersInput` OR client-side filter on `planName`/source. Decide during impl. |
| `PrintPreviewScreen.tsx:32` | "Fake cost logic" | Cost computed server-side by `CREATE_PRINT_JOB`. Display returned `cost`. |

**AboutScreen.tsx** "User ID USR-2024-8745" / "Debug ID" — replace with real `user.id` from `useAuth()`.

**Validation:** `npx tsc --noEmit` in apps/mobile; manual smoke test of each screen against dev API; verify zero remaining `grep -r "mock\|Mock\|MOCK\|fake\|Fake\|placeholder-project"` matches in screens (excluding legitimate UI presets).

---

## Milestone 4 — Fix booking flow (critical correctness)

`BookingDetailsScreen.tsx:75-86` currently calls `BOOK_ROOM_MUTATION` with `eventDate: new Date().toISOString() // Mock`, `startTime: '10:00 AM' // Mock`, `endTime: '12:00 PM' // Mock`.

**Fix:**
- Lift `selectedDate`, `selectedTimeSlot`, `selectedDuration` from the (rewired) `DateTimeModal`/`CalendarModal`/time-grid into `BookingDetailsScreen` state.
- On "Confirm", pass real values: `eventDate: format(selectedDate, 'yyyy-MM-dd')`, `startTime`/`endTime` from selected slot.
- Use `availableRooms`/`roomAvailability` backend queries (existing — `meeting-room.resolver.ts:108,125`) to populate real slot availability instead of the hardcoded `TIME_SLOTS` with fake `status`.
- Remove the `// Toggle this for testing` `hasSufficientBalance` hack — derive from `data.me.tokenBalance >= cost`.

**Validation:** create a real booking end-to-end in dev, confirm it appears in `MyBookingsScreen` with correct date/time.

---

## Milestone 5 — Cleanup & verification

- Remove the `__DEV__` login bypass in `LoginScreen.tsx:273-282` OR gate it behind an explicit dev-only build flag (currently allows skipping auth in dev).
- Grep sweep: `grep -rn "mock\|Mock\|MOCK\|fake\|Fake\|placeholder-project-id\|Simulate\|MockPay\|// Mock" apps/mobile/src/` → expect zero matches outside comments explaining removed code.
- `cd apps/mobile && npx tsc --noEmit` clean.
- `nx run-many --target=build --projects=api,mobile` both succeed.
- `nx test api` passes (add tests for new resolvers).
- Manual end-to-end against `https://spacejam.vedpragya.com/api/graphql` (prod URL from `client.ts:11`) for a final smoke test of login → browse → book → pay → view history.

---

## Files touched (summary)

**Mobile (apps/mobile/src/):**
- `lib/apollo/operations.ts` — rewrite 8 ops, add ~12 new ops
- `lib/apollo/client.ts` — possibly add `API_BASE_URL` export for upload endpoint
- `screens/*.tsx` — ~20 files rewired
- `navigation/AppNavigator.tsx` — pass route params to detail screens

**API (apps/api/src/):**
- New: `wallet/`, `print/`, `offer/`, `support/`, `statement/`, `referral/` modules (entity + input + resolver + module each)
- Modified: `app/app.module.ts` (register 6 modules), `graphql/resolvers/user.resolver.ts` (hook wallet tx on recharge), `graphql/schema.graphql` (sync reference doc), `request/print.controller.ts` (add auth + return printJobId)
- Possibly: `apps/api/package.json` (add `pdfkit`)

**New mobile operations to add** (~12): `MY_WALLET_TRANSACTIONS`, `MY_PRINT_JOBS`, `GET_PRINT_JOB`, `CREATE_PRINT_JOB`, `ACTIVE_OFFERS`, `VALIDATE_OFFER`, `REDEEM_OFFER`, `MY_SUPPORT_TICKETS`, `CREATE_SUPPORT_TICKET`, `ADD_SUPPORT_MESSAGE`, `MY_STATEMENT`, `MY_REFERRALS`, `MY_REFERRAL_STATS`, `MY_NOTIFICATION_PREFERENCES`, `UPDATE_NOTIFICATION_PREFERENCES`, `GET_MY_CENTERS`, `PROCESS_PAYMENT`, `NOTIFICATION_STATS`.

## Build sequence
Milestone 1 → 2 (each sub-module independently) → 3 (screens depend on 2's new ops) → 4 → 5. Each milestone ends with a green build + manual smoke test before proceeding.

## Risk / notes
- DB migrations: if TypeORM `synchronize` is disabled in `app.module.ts`, each new entity needs a migration file. Will check and add accordingly.
- `PROCESS_PAYMENT` and several other web operations exist already — I'll reuse rather than duplicate.
- Pricing for print jobs and offers will need seed data in the DB.
- I will NOT commit or push without explicit approval (per AGENTS.md conservative profile). At the end I'll report changed files, validation results, and suggested next commands.