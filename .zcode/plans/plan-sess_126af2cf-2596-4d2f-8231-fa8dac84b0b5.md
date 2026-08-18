## Calendar Feature — Design Plan

**Goal:** Replace the static calendar page with a robust, data-driven calendar where a center manager can see and manage all events, bookings, meeting-room reservations, scheduled visits, and birthdays — with Month/Week/Day views, prev/next navigation, a per-day popup with quick actions, and working create/edit/cancel modals.

**Decisions (confirmed with you):** New Visit entity; unified backend `calendarFeed` query; all four feature areas in v1 (Month nav, Day popup, working modals, Week/Day time-grids).

### Architecture (3 layers)

**Layer 1 — Backend: new Visit entity + resolver + unified calendar query**

1. **`Visit` entity** (`apps/api/src/typeorm/entities/visit.entity.ts`) — modeled on `Request`. Fields: `id, centerId, leadId? (nullable — links to CRM lead if known), requestedById, assignedToId?, visitorName, visitorPhone, visitorEmail?, company?, visitDate (timestamp), startTime, endTime, tourType (enum: `WALK_IN, SCHEDULED_TOUR, VIRTUAL, FOLLOW_UP`), interestedPlan?, partySize (int, default 1), status (enum: `SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW`), notes?, createdAt, updatedAt`. Relations: center, requestedBy, assignedTo, lead. Registered in `ALL_ENTITIES` + `data-source.ts`.
   - Migration: `20260813100000-CreateVisits.ts` (idempotent `CREATE TABLE` + `CREATE TYPE` per the prod-safe pattern CLAUDE.md mandates; prod PG < v11 so `DO $$ BEGIN ... EXCEPTION` blocks).

2. **`VisitResolver`** (`apps/api/src/graphql/resolvers/visit.resolver.ts`) — class-level `@UseGuards(GqlAuthGuard, RolesGuard)` + `@Roles(SUPER_ADMIN, CENTER_OWNER, CENTER_MANAGER)`. Queries: `visits(filters, caller)` (center-scoped), `visit(id)`. Mutations: `createVisit(input, caller)`, `updateVisit(id, input)`, `updateVisitStatus(id, status)`, `cancelVisit(id)`, `deleteVisit(id)`. Uses `centerScope` for read isolation; `@CurrentUser` for the creator. Inputs: `CreateVisitInput`, `UpdateVisitInput`, `VisitFiltersInput` (new file `visit.input.ts`).

3. **Unified `calendarFeed` query** — added to a new `CalendarResolver` (`apps/api/src/graphql/resolvers/calendar.resolver.ts`). Signature:
   ```
   calendarFeed(startDate: String!, endDate: String!, centerId: ID, types: [String!]): [CalendarItem!]!
   ```
   Returns a unified `CalendarItem` object type: `{ id, kind (EVENT|BOOKING|VISIT|BIRTHDAY), title, date, startTime, endTime, status, color, referenceId, meta }`. Server-side it calls the existing `eventsByDateRange` + `bookings` filters + the new `visits` query + a birthday query over `Customer.dob` (filtered by month/day within range), normalizes each into `CalendarItem`, and returns one merged array sorted by date+time. `types` arg lets the client filter (e.g. hide birthdays). Center-scoped via `centerScope`. This is the single network call the calendar page makes when changing months/weeks.

**Layer 2 — Web hooks + operations**

4. **New operations** in `apps/web/src/lib/apollo/operations.ts`: `GET_CALENDAR_FEED`, `GET_VISITS`, `CREATE_VISIT`, `UPDATE_VISIT`, `UPDATE_VISIT_STATUS`, `CANCEL_VISIT`, `DELETE_VISIT`. Mirrors the existing event operations.
5. **New hooks** in `apps/web/src/hooks/use-operations.ts`: `useCalendarFeed({startDate, endDate, centerId, types?})` (polling/refetch on month change), `useVisits(filters?)`, `useCreateVisit()`, `useUpdateVisit()`, `useCancelVisit()`, `useUpdateVisitStatus()`. Plus extend `useEvents` to accept a `types`/date-range filter. The existing `useCreateEvent`, `useCancelEvent`, `useBookRoom`, `useCreateBooking` are reused as-is.

**Layer 3 — Calendar UI (rewrite of the page)**

6. **Rewrite `apps/web/src/app/dashboard/calendar/page.tsx`** into focused components (not one 600-line file):
   - `page.tsx` — shell: header, view toggle (Month/Week/Day), date state (current month/week/day), prev/next/today navigation, center selector (from `useMyCenters` for multi-center super-admins). Calls `useCalendarFeed` for the visible range.
   - `MonthGrid.tsx` — 7-column calendar grid; renders color-coded pills per `CalendarItem.kind` (preserves the existing legend: orange=Meeting Room, blue=Visit, purple=Event, grey=Booking/Task, pink=Birthday). Click a day → opens `DayPopup`.
   - `WeekView.tsx` / `DayView.tsx` — time-slot grid (hourly rows, e.g. 8 AM–9 PM) showing items positioned by start/end time. Click empty slot → "Create" modal pre-filled with that time.
   - `DayPopup.tsx` — the per-day popup: lists all items for the clicked date with type badges, time, status; each row has quick actions (View/Edit/Cancel for events, Start/Cancel for visits, Check-in for bookings). Plus a "+ Add" row with the 4 create buttons.
   - `modals/CreateEventModal.tsx`, `ScheduleVisitModal.tsx`, `BlockTimeModal.tsx`, `BookRoomModal.tsx` — extracted from the current page's modal markup, now wired to real mutations (`useCreateEvent`, `useCreateVisit`, `useBookRoom`, `createRequest`). Keep the existing field layouts (they're well-designed) but bind to state + submit handlers + form validation.
   - `TodayScheduleRail.tsx` + `BirthdaysRail.tsx` — side rail components wired to `calendarFeed(today)` and the birthdays from the feed.
   - Shared types in `apps/web/src/app/dashboard/calendar/types.ts` mirroring `CalendarItem`.

   **Color/status mapping** preserves the existing CSS module classes (`eventPink/Orange/Blue/Purple/Grey`) — extended, not replaced, so the visual language stays consistent.

### What gets reused vs built new

**Reused (works today):** Events CRUD + `eventsByDateRange`, Bookings CRUD, `bookRoom` + meeting-room availability, Recurring bookings expansion, Attendees/tiers, `centerScope`, the existing event/booking web hooks, the existing CSS module + legend.

**Built new:** Visit entity + migration + resolver + inputs; `calendarFeed` query + `CalendarItem` type + `CalendarResolver`; birthday aggregation over `Customer.dob`; web operations + hooks for both; the calendar page rewrite (7 components) with functional views/navigation/modals.

### Out of scope (deferred)
- Member-facing event RSVP/ticket purchase flow (the `addAttendee` mutation exists; a full purchase txn is sub-project D).
- External calendar sync (Google/Outlook — the `calendar-sync` resolver already exists separately).
- Block-time as its own entity (v1 writes a `Request` of type MAINTENANCE/CLEANING — the closest existing model; a dedicated BlockTime entity can come later).
- Birthday "Wish" send (the modal stays UI-only; sending requires a notification channel decision).

### Migration & deploy safety
- New `visits` table via idempotent raw-SQL migration (prod-safe pattern). No changes to existing tables.
- The `calendarFeed` query is additive — nothing existing breaks.
- After implementation: build api + web, deploy via the established `git archive → SCP → deploy.sh` flow, run the migration SQL on the server, verify the calendar loads live data.

### Build sequence (implementation plan will have these as TDD tasks)
1. Backend: Visit entity + migration + registration
2. Backend: Visit input types + resolver (with tests, following the auth-foundation jest pattern)
3. Backend: CalendarResolver + `calendarFeed` + `CalendarItem` (with tests)
4. Web: operations + hooks (visit CRUD, calendar feed)
5. Web: calendar page rewrite — shell + MonthGrid + navigation (wired to feed)
6. Web: DayPopup + Week/Day views + TodayScheduleRail/BirthdaysRail
7. Web: the 4 create/edit modals wired to mutations
8. Build + deploy + verify on the live site

### Testing
- Backend: jest unit tests for `VisitResolver` (auth + scoping) and `CalendarResolver` (feed aggregation, date filtering, type filtering, birthday-by-month). Follows the `apps/api/jest.config.js` runner established in the auth foundation.
- Frontend: manual verification via the browser against live data after deploy (login as center manager, create event/visit/booking, confirm they appear on the right days, switch views, cancel an item).

This plan keeps the existing backend (events/bookings/rooms) as the source of truth, adds the missing Visit domain and a unified feed, and turns the static page into a real multi-view calendar. Ready to write the spec + implementation plan when you approve.