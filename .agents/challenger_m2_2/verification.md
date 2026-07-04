# Milestone 2 Verification Findings

This document summarizes the empirical verification of the Milestone 2 changes in the SpaceJam repository.

## 1. Summary of Verification Results

| Verification Step | Status | Key Findings / Issues |
|---|---|---|
| **Vitest Test Suite (API)** | ✅ PASSED | All 65 tests in 4 test files passed successfully. |
| **Vitest Test Suite (Web)** | ❌ FAILED | 2 tests failed in `token-storage.test.ts` due to mock configuration issues. |
| **Workspace Build (`run-many -t build`)** | ❌ FAILED | `web:build` failed due to type compilation error; `api:build` compiled. |
| **Type Compilation (`run-many -t typecheck`)** | ❌ FAILED | `api:typecheck` failed with multiple TS errors (broken imports/declarations). |
| **Runtime Integrity (Web)** | ⚠️ BLOCKED | Next.js dev server starts, but pages with compilation errors will fail on-demand. |
| **Runtime Integrity (API)** | ❌ CRASHED | NestJS application crashes on startup due to an `undefined` enum validation error. |

---

## 2. Detailed Findings

### A. Vitest Test Failures (Web App)
- **Command Run**: `npx vitest run` inside `apps/web`
- **Results**: 15 tests run, 13 passed, 2 failed.
- **Failures**:
  - `token-storage > persists access and refresh tokens to localStorage`
  - `token-storage > clears localStorage AND cookies`
- **Root Cause**: The mock `document.cookie` stub in `token-storage.test.ts` is implemented as a simple string variable:
  ```typescript
  let _cookie = '';
  vi.stubGlobal('document', {
    get cookie() { return _cookie; },
    set cookie(v) { _cookie = v; }
  });
  ```
  In a real browser, `document.cookie` is a host object setter that appends/updates individual cookies (forming a cookie jar). In the test mock, setting a second cookie overrides `_cookie` completely. When `setTokens` writes both `spacejam_access` and `spacejam_refresh` cookies, the refresh cookie overrides the access cookie. The test then asserts:
  ```typescript
  expect(_cookie).toMatch(/spacejam_access=access-1/);
  ```
  This assertion fails because `_cookie` only contains the refresh cookie.
- **Conclusion**: This is a test harness stub/mock bug, not a production code bug, but it blocks clean test runs.

### B. Build Failures (`web:build`)
- **Command Run**: `npx nx run-many -t build`
- **Error Logs**:
  ```
  ./src/app/dashboard/operations/events/page.tsx:317:31
  Type error: Cannot find name 'cancel'. Did you mean 'oncancel'?

    315 |             event={selectedEvent}
    316 |             onUpdateStatus={(id, status) => updateStatus(id, status as any)}
  > 317 |             onCancel={(id) => cancel(id)}
        |                               ^
    318 |           />
  ```
- **Root Cause**: In `apps/web/src/app/dashboard/operations/events/page.tsx`, the `cancel` function is called inside the `onCancel` handler prop of `EventDetailPanel`. However, `cancel` is never imported, nor is it destructured from `useCancelEvent()` within the component. The hooks destructured are:
  ```typescript
  const { events, loading, error, data } = useEvents();
  const { event: _selectedEventDetail } = useEvent(selectedId ?? "");
  const { updateStatus } = useUpdateEventStatus();
  ```
- **Mitigation**: The component needs to call `const { cancel } = useCancelEvent();` and destructure `cancel` properly to handle the cancellation callback.

### C. Type Compilation Failures (`api:typecheck`)
- **Command Run**: `npx nx run-many -t typecheck`
- **Results**: Failed for project `api:typecheck`.
- **Root Causes**:
  1. **Circular/Self Imports**:
     In `apps/api/src/graphql/types/user.type.ts`, it imports enums from itself:
     ```typescript
     import { BookingStatus, PaymentMethod, PaymentStatus, LeadStatus, LeadSource, InvoiceStatus, PaymentFrequency, ContractStatus, DepositStatus, DepositType, UserRole, CenterStatus, SeatType, SeatStatus } from './user.type';
     ```
     This causes TS2440 (Import conflicts with local declaration) and TS2395 (Individual declarations in merged declaration must be all exported or all local) because `UserRole`, `CenterStatus`, `SeatType`, `SeatStatus` are defined and exported locally in the same file.
  2. **Missing Dependency Declarations**:
     `src/main.ts` fails because it cannot find the declaration file for `cookie-parser` (TS7016). Needs `@types/cookie-parser` installed or a declaration file.
  3. **Repository Type Errors**:
     Type mismatches exist in `booking.repository.ts`, `center.repository.ts`, `seat.repository.ts`, and `user.repository.ts` where values returned from typeorm (`Booking | null`, etc.) are typed as non-nullable (`Booking`, etc.) without null checks (TS2322).

### D. Runtime Crash on Startup (API App)
- **Command Run**: `npx nx serve api`
- **Result**: Immediate crash on startup.
- **Error Stack**:
  ```
  TypeError: Cannot convert undefined or null to object
      at Object.entries (<anonymous>)
      at validEnumValues (C:\Users\ASUS TUF A15\Desktop\DevOPS\Workspace\spacejam\node_modules\src\decorator\typechecker\IsEnum.ts:18:17)
      at IsEnum (C:\Users\ASUS TUF A15\Desktop\DevOPS\Workspace\spacejam\node_modules\src\decorator\typechecker\IsEnum.ts:30:29)
      at Array.<anonymous> (C:\Users\ASUS TUF A15\Desktop\DevOPS\Workspace\spacejam\apps\api\src\graphql\inputs\meeting-room.input.ts:34:1)
  ```
- **Root Cause**: 
  1. `meeting-room.input.ts` imports `RoomType` and `RoomStatus` from `../../typeorm/entities/meeting-room.entity`.
  2. `meeting-room.entity.ts` imports `RoomType` and `RoomStatus` from `../../graphql/types/user.type`.
  3. However, `meeting-room.entity.ts` does **not** export these enums. Since they are imported as values in `meeting-room.input.ts` but not exported by `meeting-room.entity.ts`, they are evaluated as `undefined`.
  4. When class-validator decorates the fields using `@IsEnum(RoomType)` and `@IsEnum(RoomStatus)`, it passes `undefined` to `IsEnum`, which internally calls `Object.entries(undefined)`, triggering a fatal startup `TypeError`.
