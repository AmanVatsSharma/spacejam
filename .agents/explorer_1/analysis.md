# Spacejam CRM Backend Investigation & Strategy Report

## Executive Summary
This report presents the findings of a detailed read-only investigation of the Spacejam CRM NestJS backend. We mapped all GraphQL input DTO files and classes, diagnosed the root causes of the Vitest test runner crashes (including decorator compilation issues and syntax errors), and proposed a robust, production-grade input validation and exception translation strategy.

---

## 1. GraphQL Input DTO Analysis
We inspected all files under `apps/api/src/graphql/inputs/` and identified the following classes, decorators, fields, and Typescript types:

### A. `booking.input.ts`
* **`CreateBookingInput`** (`@InputType()`)
  * `seatId` (string, decorated with `@Field(() => ID)`)
  * `startTime` (Date, decorated with `@Field()`)
  * `endTime` (Date, decorated with `@Field()`)
  * `notes` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
* **`BookingFiltersInput`** (`@InputType()`)
  * `centerId` (string, optional, decorated with `@Field(() => ID, { nullable: true })`)
  * `userId` (string, optional, decorated with `@Field(() => ID, { nullable: true })`)
  * `status` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * `startDate` (Date, optional, decorated with `@Field({ nullable: true })`)
  * `endDate` (Date, optional, decorated with `@Field({ nullable: true })`)
  * `limit` (number, optional, decorated with `@Field(() => Int, { nullable: true })`)
  * `offset` (number, optional, decorated with `@Field(() => Int, { nullable: true })`)

### B. `center.input.ts`
* **`CreateCenterInput`** (`@InputType()`)
  * `name` (string, decorated with `@Field()`)
  * `description` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * `address` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * `city` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * `state` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * `country` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * `postalCode` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * `phone` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * `email` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * `timezone` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * `currency` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * `locationId` (string, optional, decorated with `@Field(() => ID, { nullable: true })`)
* **`UpdateCenterInput`** (`@InputType()`)
  * `name` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
  * ... (same fields as above decorated with `{ nullable: true }`)
  * `status` (string, optional, decorated with `@Field(() => String, { nullable: true })`)
* **`CreateLocationInput`** (`@InputType()`)
  * `name` (string, decorated with `@Field()`)
  * `address` (string, optional, `{ nullable: true }`)
  * `city` (string, optional, `{ nullable: true }`)
  * `state` (string, optional, `{ nullable: true }`)
  * `country` (string, optional, `{ nullable: true }`)
  * `postalCode` (string, optional, `{ nullable: true }`)
* **`UpdateLocationInput`** (`@InputType()`)
  * `name` (string, optional, `{ nullable: true }`)
  * ... (same fields as CreateLocationInput decorated with `{ nullable: true }`)
* **`CreateFloorInput`** (`@InputType()`)
  * `name` (string, decorated with `@Field()`)
  * `centerId` (string, decorated with `@Field(() => ID)`)
  * `description` (string, optional, `{ nullable: true }`)
  * `level` (number, optional, `@Field(() => Int, { nullable: true })`)
* **`UpdateFloorInput`** (`@InputType()`)
  * `name` (string, optional, `{ nullable: true }`)
  * `description` (string, optional, `{ nullable: true }`)
  * `level` (number, optional, `@Field(() => Int, { nullable: true })`)
* **`CreateSeatInput`** (`@InputType()`)
  * `label` (string, `@Field()`)
  * `floorId` (string, `@Field(() => ID)`)
  * `description` (string, optional, `{ nullable: true }`)
  * `type` (string, optional, `{ nullable: true }`)
  * `status` (string, optional, `{ nullable: true }`)
  * `x` (number, optional, `@Field(() => Float, { nullable: true })`)
  * `y` (number, optional, `@Field(() => Float, { nullable: true })`)
* **`UpdateSeatInput`** (`@InputType()`)
  * Same fields as `CreateSeatInput` (except `floorId`), all decorated with `{ nullable: true }`.

### C. `crm.input.ts`
* **`CreateLeadInput`** (`@InputType()`)
  * `name` (string, `@Field()`)
  * `email` (string, `@Field()`)
  * `phone` (string, optional, `{ nullable: true }`)
  * `company` (string, optional, `{ nullable: true }`)
  * `status` (LeadStatus enum, optional, `@Field(() => LeadStatus, { nullable: true })`)
  * `source` (LeadSource enum, optional, `@Field(() => LeadSource, { nullable: true })`)
  * `requirement` (string, optional, `{ nullable: true }`)
  * `budget` (string, optional, `{ nullable: true }`)
  * `location` (string, optional, `{ nullable: true }`)
  * `notes` (string, optional, `{ nullable: true }`)
  * `lastContact` (string, optional, `{ nullable: true }`)
  * `assignedToId` (string, optional, `@Field(() => ID, { nullable: true })`)
  * `centerId` (string, optional, `@Field(() => ID, { nullable: true })`)
* **`UpdateLeadInput`** (`@InputType()`)
  * Same fields as `CreateLeadInput` but all optional.
* **`LeadFiltersInput`** (`@InputType()`)
  * `status`, `source`, `centerId`, `assignedToId`, `search` (string, optional), `limit` (Int, optional), `offset` (Int, optional).

### D. `event.input.ts`
* **`CreateEventInput`** (`@InputType()`)
  * `title` (string, `@Field()`), `description`, `company`
  * `eventDate`, `startTime`, `endTime` (strings, `@Field()`)
  * `attendeesCount` (number, `@Field(() => Int)`)
  * `type` (EventType enum, `@Field(() => EventType)`)
  * `specialRequests` (string, optional), `addons` (string[], `@Field(() => [String], { nullable: true })`)
  * `cost` (number, optional, `@Field(() => Float, { nullable: true })`)
  * `notes` (string, optional), `meetingRoomId` (string), `centerId` (string, optional)
* **`UpdateEventInput`** (`@InputType()`)
  * Same fields as `CreateEventInput` (all optional) + `status` (EventStatus enum, `@Field(() => EventStatus, { nullable: true })`).
* **`EventFiltersInput`** (`@InputType()`)
  * `status`, `type`, `centerId`, `meetingRoomId`, `startDate`, `endDate`, `limit`, `offset`, `search`, `requestedById`.
* **`EventStatistics`** (`@ObjectType()` - Output payload)
  * `totalEvents`, `pendingEvents`, `confirmedEvents`, `completedEvents`, `cancelledEvents` (all Int).
* **`CreateEventPayload`** (`@ObjectType()` - Mutation response wrapper)
  * `success` (boolean), `event` (any, optional), `error` (string, optional).

### E. `meeting-room.input.ts`
* **`MeetingRoomFiltersInput`** (`@InputType()`)
  * `centerId`, `floorId` (string, optional)
  * `type` (RoomType enum, optional), `status` (RoomStatus enum, optional)
  * `minCapacity` (number, optional), `search` (string, optional)
* **`CreateMeetingRoomInput`** (`@InputType()`)
  * `name` (string), `centerId` (string), `floorId` (string, optional)
  * `type` (RoomType enum), `capacity` (number, `@Field(() => Int)`)
  * `status` (RoomStatus, optional), `amenities` (string[], optional), `pricePerHour` (number, optional)
* **`UpdateMeetingRoomInput`** (`@InputType()`)
  * Same fields as `CreateMeetingRoomInput` (all optional). Note: `capacity` is decorated with `{ nullable: true, type: () => Int }`.

### F. `request.input.ts`
* **`CreateRequestInput`** (`@InputType()`)
  * `type` (RequestType enum), `title` (string), `description` (string)
  * `urgency` ('LOW' | 'MEDIUM' | 'HIGH', optional), `dueDate` (string, optional)
  * `centerId` (string, optional), `assignedToId` (string, optional)
  * `cost` (number, optional, `@Field(() => Float, { nullable: true })`)
  * `attachedFile` (string, optional), `metadata` (any, optional, `@Field(() => Object, { nullable: true })`)
* **`UpdateRequestInput`** (`@InputType()`)
  * Same fields as `CreateRequestInput` (all optional) + `status` (RequestStatus enum, optional), `resolution` (string, optional).
* **`RequestFiltersInput`** (`@InputType()`)
  * `status`, `type`, `centerId`, `assignedToId`, `requestedById`, `startDate`, `endDate`, `limit`, `offset`, `search`, `urgency`, `pendingOnly` (boolean, optional).
* **`RequestStatistics`** (`@ObjectType()`)
  * `totalRequests`, `pendingRequests`, `inProgressRequests`, `completedRequests`, `cancelledRequests`, `highUrgencyRequests` (all Int).
* **`CreateRequestPayload`** (`@ObjectType()`)
  * `success` (boolean), `request` (any, optional), `error` (string, optional).

### G. `revenue.input.ts`
* **`CreateInvoiceInput`** (`@InputType()`)
  * `customerId` (ID), `customerName` (string), `customerEmail` (string, optional)
  * `centerId` (ID, optional), `planName` (string, optional), `amount` (number), `tax` (number, optional), `totalAmount` (number, optional)
  * `status` (InvoiceStatus enum, optional), `issueDate` (Date, optional), `dueDate` (Date, optional)
  * `paymentMethod` (PaymentMethod enum, optional), `notes` (string, optional)
* **`UpdateInvoiceInput`** (`@InputType()`)
  * Same fields as `CreateInvoiceInput` (all optional) + `paidDate` (Date, optional).
* **`InvoiceFiltersInput`** (`@InputType()`)
  * `status`, `centerId`, `customerId`, `dateFrom` (Date), `dateTo` (Date), `search`, `limit`, `offset`.
* **`CreateDepositInput`** (`@InputType()`)
  * `customerId` (ID), `customerName` (string), `centerId` (ID, optional), `amount` (number), `type` (string, optional), `referenceNumber` (string, optional), `receivedDate` (Date, optional), `notes` (string, optional)
* **`UpdateDepositInput`** (`@InputType()`)
  * Same fields as `CreateDepositInput` (all optional) + `status` (string, optional), `releasedDate` (Date, optional).
* **`DepositFiltersInput`** (`@InputType()`)
  * `status`, `type`, `centerId`, `customerId`, `dateFrom`, `dateTo`, `search`, `limit`, `offset`.
* **`CreateContractInput`** (`@InputType()`)
  * `customerId` (ID), `customerName` (string), `centerId` (ID, optional), `planName` (string, optional), `startDate` (Date), `endDate` (Date), `amount` (number), `paymentFrequency` (string, optional), `autoRenew` (boolean, optional), `terms` (string, optional)
* **`UpdateContractInput`** (`@InputType()`)
  * Same fields as `CreateContractInput` (all optional) + `status` (string, optional).
* **`ContractFiltersInput`** (`@InputType()`)
  * `status`, `centerId`, `customerId`, `dateFrom`, `dateTo`, `search`, `limit`, `offset`.

---

## 2. Test Configuration & Vitest Crash Analysis

When running the Vitest suite (`npx vitest run apps/api`), the runner crashes due to three distinct issues.

### A. The Primary Cause: `ColumnTypeUndefinedError` (Decorator Compilation)
* **What happens**: Vitest fails with:
  ```
  ColumnTypeUndefinedError: Column type for Location#fullAddress is not defined and cannot be guessed.
  Make sure you have turned on an "emitDecoratorMetadata": true option in tsconfig.json.
  ```
* **Why it happens**:
  1. TypeORM uses TypeScript's structural metadata (`Reflect.getMetadata("design:type", target, key)`) to infer database column types from TypeScript property types (e.g. mapping TypeScript `string` to SQL `varchar`).
  2. For `Reflect.getMetadata` to emit property types at compile time, TS compilers must compile decorators with `experimentalDecorators: true` and `emitDecoratorMetadata: true` turned on.
  3. By default, Vitest compiles TS files using Vite's pipeline, which relies on **esbuild**.
  4. While `esbuild` supports legacy TypeScript decorators (`experimentalDecorators`), it explicitly **does not support emitting decorator metadata (`emitDecoratorMetadata`)** because esbuild performs isolated file transpilations without type analysis.
  5. Without metadata, `Reflect.getMetadata("design:type")` returns `undefined` at runtime. TypeORM is then unable to resolve column types, crashing the process.

### B. Secondary Cause: Missing Closing Brace in `center.entity.ts`
* **What happens**: The Vitest runner exits with:
  ```
  Transform failed with 1 error: Expected identifier but found end of file
  File: C:/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam/apps/api/src/typeorm/entities/center.entity.ts:77:31
  ```
* **Why it happens**: In `apps/api/src/typeorm/entities/center.entity.ts`, the file ends on line 77 (`meetingRooms!: MeetingRoom[];`) without a closing class bracket `}` for the `Center` class. This is a fatal syntax error.

### C. Tertiary Cause: Broken Resolver Import
* **What happens**: The runner fails with:
  ```
  Error: Failed to load url ./crm.resolver in src/crm/crm.resolver.spec.ts. Does the file exist?
  ```
* **Why it happens**: `apps/api/src/crm/crm.resolver.spec.ts` imports the resolver via `import { CrmResolver } from './crm.resolver';`. However, the resolver is actually located at `../graphql/resolvers/crm.resolver.ts`.

### How to Fix Decorators Compilation in Vitest
To restore the test suite and resolve `ColumnTypeUndefinedError`, we must swap `esbuild` with a compiler that fully supports decorator metadata emission during tests (such as **SWC**). We recommend implementing the following configuration:

1. **Install `unplugin-swc` as a devDependency in the workspace root or `apps/api`**:
   ```bash
   npm install --save-dev unplugin-swc
   ```
2. **Update `apps/api/vitest.config.ts`**:
   Inject the SWC plugin into the Vitest config. Force the plugin to read the application tsconfig (`tsconfig.app.json`) which has `emitDecoratorMetadata` enabled:
   ```typescript
   import { defineConfig } from 'vitest/config';
   import swc from 'unplugin-swc';

   export default defineConfig({
     plugins: [
       swc.vite({
         // Explicitly configure SWC to point to the tsconfig that enables metadata
         tsconfigFile: './tsconfig.app.json',
       }),
     ],
     test: {
       include: ['src/**/*.spec.ts'],
       globals: false,
       environment: 'node',
       // Set up reflect-metadata import before any tests run
       setupFiles: ['./vitest.setup.ts'],
     },
   });
   ```
3. **Create `apps/api/vitest.setup.ts`**:
   Ensure `reflect-metadata` is imported at the start of the execution environment:
   ```typescript
   import 'reflect-metadata';
   ```
4. **Fix Syntax Error in `center.entity.ts`**:
   Append the missing closing curly brace `}` at the bottom of `apps/api/src/typeorm/entities/center.entity.ts`.
5. **Fix Import in `crm.resolver.spec.ts`**:
   Correct the import line:
   ```typescript
   // From:
   import { CrmResolver } from './crm.resolver';
   // To:
   import { CrmResolver } from '../graphql/resolvers/crm.resolver';
   ```

---

## 3. Recommended Validation & Exception Strategy

To replace generic `Error` instances, prevent unhandled schema execution panics, and provide a secure, production-safe user experience, we recommend a unified strategy.

### A. GraphQL Input validation (`class-validator`)
All input DTO classes must be annotated with `class-validator` decorators. This integrates seamlessly with the global `ValidationPipe` already configured in `apps/api/src/main.ts`.

#### Example Implementation (`CreateLeadInput` in `crm.input.ts`):
```typescript
import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { LeadStatus, LeadSource } from '../types/user.type';

@InputType()
export class CreateLeadInput {
  @Field()
  @IsNotEmpty({ message: 'Name must not be empty' })
  @IsString()
  name!: string;

  @Field()
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  company?: string;

  @Field(() => LeadStatus, { nullable: true })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @Field(() => LeadSource, { nullable: true })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  requirement?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  budget?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastContact?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  centerId?: string;
}
```

### B. Standardize NestJS Built-in Exceptions in Resolvers
Generic errors (e.g. `throw new Error('Unauthorized')`) must be replaced with NestJS built-in exceptions (`UnauthorizedException`, `BadRequestException`, `NotFoundException`, `ConflictException`).

#### Example Conversion (`booking.resolver.ts`):
```typescript
// BEFORE:
if (!userId) throw new Error('Unauthorized');
if (seatOccupied) throw new Error('Seat is not available');

// AFTER:
import { UnauthorizedException, ConflictException } from '@nestjs/common';

if (!userId) throw new UnauthorizedException('Please log in to continue');
if (seatOccupied) throw new ConflictException('The selected seat is already occupied during this time');
```

### C. Exception Translation & Apollo Error Masking (GraphQL Configuration)
Currently, `apps/api/src/graphql/graphql.config.ts` masks all errors not in `SAFE_CODES` to `"Internal server error"`.
NestJS HTTP exceptions thrown from resolvers default to error code `INTERNAL_SERVER_ERROR` in the GraphQL layer. Therefore, valid business rule errors (e.g. "An account with that email already exists") are masked, disrupting client-side feedback.

To bridge NestJS HTTP exceptions and Apollo's error masking, we recommend updating the `formatError` function in `graphql.config.ts` to map HTTP statuses to Apollo `SAFE_CODES`:

```typescript
    formatError: (formatted, error: any) => {
      // Extract the original exception thrown inside NestJS
      const originalError = error?.originalError;
      let code = (formatted.extensions?.code as string) || 'INTERNAL_SERVER_ERROR';
      let message = formatted.message;

      if (originalError && originalError.response) {
        const response = originalError.response;
        // NestJS HTTP exceptions contain a response object: { statusCode, message, error }
        if (typeof response === 'object') {
          const status = response.statusCode;
          if (status === 400 || status === 409) {
            code = 'BAD_USER_INPUT';
            // Join validation array strings if they are from the ValidationPipe
            message = Array.isArray(response.message) ? response.message.join(', ') : response.message;
          } else if (status === 401) {
            code = 'UNAUTHENTICATED';
            message = response.message || 'Unauthorized';
          } else if (status === 403) {
            code = 'FORBIDDEN';
            message = response.message || 'Forbidden';
          } else if (status === 404) {
            code = 'BAD_USER_INPUT'; // Map NotFound to a safe code to avoid masking it
            message = response.message || 'Resource not found';
          }
        }
      }

      if (!MASK_ERRORS) {
        return {
          ...formatted,
          message,
          extensions: { ...formatted.extensions, code },
        };
      }

      // If masking is active, only allow defined SAFE_CODES to be sent to client
      if (SAFE_CODES.has(code)) {
        return {
          ...formatted,
          message,
          extensions: { ...formatted.extensions, code },
        };
      }

      // Mask all other errors (unhandled database errors, syntax exceptions, etc.)
      return {
        message: 'Internal server error',
        path: formatted.path,
        locations: formatted.locations,
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      };
    },
```
This strategy ensures:
1. Malformed API inputs are blocked automatically by `class-validator` via NestJS global pipeline.
2. Standard HTTP exceptions thrown from services/resolvers bypass the production error mask.
3. Actual server crashes, database connection failures, and syntax issues remain safely masked.
