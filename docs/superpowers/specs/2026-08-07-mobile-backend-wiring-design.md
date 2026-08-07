# Mobile ↔ Backend Full Wiring — Design Spec

**Date:** 2026-08-07
**Status:** Pending approval
**Goal:** Make the SpaceJam mobile app fully wired to the live backend — no mock data, no broken/non-functional UI, enterprise-grade. Login is real with a real OTP flow where the code is hardcoded to `000000` (no real sender for now). Silent token refresh so users aren't bounced to login every 15 minutes.

---

## Current State (audit findings)

The backend (NestJS, code-first GraphQL) is complete and correct — every operation the mobile app calls is schema-valid and resolves to a real resolver. The mobile app's foundation is also solid: `ApolloProvider` + `AuthProvider` wired in `index.js`, SecureStore token storage, `authLink` attaching the bearer token.

**The problem is the mobile UI layer.** Of ~28 screens:

- **6 crash/broken** (LoginScreen, HomeScreen, EventsScreen, MyBookingsScreen, OffersScreen, PrintProcessingScreen) — undefined variable refs, missing imports, buttons that call non-existent handlers. The app cannot even log in.
- **13 render mock/hardcoded data** instead of calling the backend (QuickBooking, BookingDetails, EventDetails, MyEventDetails, Wallet history, PrintPreview, MyPrintDetails, MyRoomDetails, ReferAndEarn, Support, NotificationSettings, Payment, AddTokensPayment). ~25 GraphQL operations are defined but never used.
- **6 are properly wired** (EditProfile, RechargeTokens, Profile, MyInvoices, AvailableRooms, Notifications) — though Notifications has a field-name bug (`body` vs `message`) and MyInvoices' tab filter is inert.

**Two assumptions contradicted by the code:**
1. There is **no OTP system at all** on the backend. Login is plain email + bcrypt password. `TwoFactorService` exists with real TOTP (otplib) logic but is fully commented out / disabled; any user with `twoFactorEnabled=true` is locked out of signin (`auth.service.ts:112` throws). The mobile LoginScreen has a 6-digit OTP UI wired to nothing.
2. **No silent token refresh** on mobile. Access token TTL is 15 min; refresh token (7-30d) sits unused in SecureStore. `getRefreshToken` is imported but never called. After 15 min, every request fails `UNAUTHENTICATED`, tokens get wiped, user is bounced to login.

---

## Design

### 1. OTP flow (two-step, hardcoded `000000`)

Reuses the existing half-built two-factor scaffold (web's `AuthPayload` already returns `twoFactorRequired` + `challengeToken`; `SigninInput` already has optional `twoFactorCode`; `verifyTwoFactor` resolver exists but throws).

**Flow:**
1. Mobile calls `signin(input: { email, password })` → backend returns `{ twoFactorRequired: true, challengeToken }` with **no** access/refresh tokens (forces OTP step). Persists the challenge (in-memory session map or signed challenge token).
2. Mobile shows the existing OTP screen (UI already present, currently unwired).
3. User enters any 6 digits; mobile calls `verifyTwoFactor(input: { challengeToken, code })`.
4. Backend accepts when `code === "000000"` — gated behind an env flag (`OTP_DEV_BYPASS=true`, default `false`) so the bypass cannot ship to prod by accident. Returns real `{ accessToken, refreshToken, user }`.
5. Mobile stores tokens via existing `authContext.login()` → enters app.

**Backend changes:**
- `auth.service.ts`: re-enable the `signin` 2FA branch — when password verifies, instead of issuing tokens, mint a short-lived `challengeToken` (signed JWT, ~5 min TTL) and return `twoFactorRequired: true`. Keep the existing `twoFactorEnabled` gate but make the dev flow apply to all users when `OTP_DEV_BYPASS=true`.
- `verifyTwoFactor(input: { challengeToken, code })`: verify the challenge JWT; if `OTP_DEV_BYPASS=true` accept `code === "000000"`, else throw (no real sender yet). On success, issue the real token pair.
- Re-inject `TwoFactorService` into `AuthService` (constructor line is commented out). Existing TOTP logic stays for the future real-sender path but is not the active path.
- `VerifyTwoFactorInput`: add `challengeToken: String!` if not present.

**Mobile changes:**
- LoginScreen: rewrite the broken component to implement the two-step flow using the existing `SIGNIN_MUTATION` (extended to select `twoFactorRequired` + `challengeToken`) and a new `VERIFY_TWO_FACTOR_MUTATION`. Remove the dev bypass and all undefined refs. Keep the existing visuals/animations.

### 2. Backend resolver verification + gaps

Before wiring each screen, verify the resolver's returned field shape matches what the screen renders. Adjust the mobile operation or the resolver — whichever is the smaller change. Known gaps to address:

- **Relation loading:** `myBookings` resolver loads `['seat','seat.floor','center','payment']` but not `meetingRoom` or `user`. `createBooking` returns the saved booking without reloading relations. Mobile requests `meetingRoom`/`seat`/`center`/`user` sub-selections — they'll come back null. Fix: add the missing relations to the resolver's `find`/save-and-reload calls.
- **`me.center` loading:** confirm `UserRepository.findById` joins `center`, else `center { id name }` resolves null. Join if missing.
- **Payment:** confirm a `processPayment`-style mutation exists. If present, use it. If not, build a minimal `processPayment(input) { ok invoiceId }` that marks the referenced invoice/booking paid (no real PSP — agreed dev path). Reuse for PaymentScreen + AddTokensPayment.
- **Extend booking time:** MyRoomDetails has an "Extend Time" button. If no `extendBooking` mutation exists, build a minimal one or hide the button with an honest "Coming soon" if the change is non-trivial. Decide during implementation.
- **Other resolvers** (wallet transactions, print jobs, offers, referrals, support tickets, notification preferences): verify they exist and match field shapes. If a resolver is genuinely missing and non-trivial, build the minimal resolver + service + input DTO.

### 3. Mobile infrastructure

- **Silent token refresh:** Add `REFRESH_TOKENS_MUTATION` to `operations.ts`. Rewrite the Apollo `errorLink` (`client.ts:37-59`) to: on `UNAUTHENTICATED`, read `getRefreshToken()`, call `refreshTokens`, `saveTokens()` the new pair, then `forward(operation)` to retry. Single-flight (concurrent failed requests share one in-flight refresh promise). Only clear tokens + bounce to login if the refresh itself fails. Backend `refreshTokens` resolver already exists and rotates sessions — client-only change.
- **`operations.ts` cleanup:** align every operation's selection set with the verified backend field shapes (e.g. Notifications `message` not `body`; ensure all relation sub-selections the backend actually loads).

### 4. Screen wiring map

**Crashing screens (fix first so the app boots and navigates):**
- **LoginScreen** — full rewrite per Section 1.
- **HomeScreen** — add missing `ImageBackground` + `useSpringEntrance` imports; wire `GET_HOME_DATA` to stats/token balance; real "nearest spaces" from `seats`/`myCenters`; real bell-button nav.
- **EventsScreen** — fix `FilterPill`/`Fp` name mismatch; fix `handleNavChange`; wire `GET_EVENTS` to the list.
- **MyBookingsScreen** — fix `handleNavChange`; wire `GET_MY_BOOKINGS` with working status tabs.
- **OffersScreen** — fix `OfferCard` props; wire `GET_ACTIVE_OFFERS`; real copy-code (`Clipboard`) + `REDEEM_OFFER`.
- **PrintProcessingScreen** — fix undefined `onNavigate`; wire to real print-job state (`GET_PRINT_JOB` polling or navigation param).

**Mock screens (replace fake data with real operations):**
- **QuickBookingScreen** — real seat/room + time selection → `bookRoom`/`createBooking`; real Confirm Booking.
- **BookingDetailsScreen** — wire selected date/time into the mutation; real balance from `GET_ME`; real recharge nav; fix the `BookingSuccess` route name.
- **EventDetailsScreen** — `GET_EVENT` data for venue/host; real booking mutation (not `alert`).
- **MyEventDetailsScreen** — `GET_EVENT` for all fields.
- **WalletScreen** — `myWalletTransactions` for history (balance already wired).
- **PrintPreviewScreen** — `CREATE_PRINT_JOB` (not the generic request); real page count from the uploaded file.
- **MyPrintDetailsScreen** — `GET_PRINT_JOB`.
- **MyRoomDetailsScreen** — real active booking via `myBookings`; extend-time mutation (or honest hide).
- **ReferAndEarnScreen** — `GET_MY_REFERRAL_STATS` + share code (`Share` API).
- **SupportScreen** — `CREATE_SUPPORT_TICKET`; keep FAQ static (legitimately static content).
- **NotificationSettingsScreen** — `GET_MY_NOTIFICATION_PREFERENCES` + `UPDATE_NOTIFICATION_PREFERENCES`; persist toggles.
- **PaymentScreen** — `processPayment` mutation (marks invoice/booking paid; no real PSP).
- **AddTokensPaymentScreen** — `rechargeWallet` on pay (not `goBack`).

**Polish (already-wired screens):**
- **MyInvoicesScreen** — make the tab filter actually filter by category.
- **NotificationsScreen** — fix `body`→`message` field; wire the filter pills.
- **AvailableRoomsScreen** — pull features from seat amenities instead of hardcoded array (or accept as acceptable static).

### 5. Verification

1. **TypeScript compiles** — `tsc --noEmit` across the mobile app; catches every undefined-ref crash before runtime.
2. **Backend boot + contract check** — start the API, run the exact mobile operations via curl (signin → verifyTwoFactor `000000` → me → myBookings → seats → events → rechargeWallet) and confirm real data returns. Proves contracts match, not just that TS compiles.
3. **Mobile build** — `pnpm nx build mobile` (or Expo equivalent) succeeds.
4. **Runtime smoke** (if device/emulator available) — launch, log in with a real seeded user (`000000` OTP), confirm Home/Bookings/Events/Wallet render live data.

Run continuously as work progresses, not only at the end.

### 6. Out of scope (scope discipline)

- No UI redesign — existing visuals stay; this is connecting UI to data.
- No real payment gateway or OTP email/SMS sender — agreed dev paths (`000000` OTP; payment mutation marks paid without a real PSP).
- No new test suites beyond what unblocks the work — wiring/fix effort; backend already has tests.

### 7. Build order (sequencing)

1. **Backend** — OTP flow + relation-loading fixes + missing/minimal resolvers. Verify with curl.
2. **Mobile infra** — token refresh link; `operations.ts` aligned to verified backend shapes.
3. **Crashing screens** — Login, Home, Events, MyBookings, Offers, PrintProcessing. App must boot and navigate.
4. **Mock screens** — wire each to its real operation, screen by screen.
5. **Polish passes** — MyInvoices filter, Notifications field fix, AvailableRooms amenities.
6. **Full verification pass** — tsc, backend boot, mobile build, smoke test.
