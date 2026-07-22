/**
 * File:        apps/api/src/graphql/enums/recurrence-pattern.enum.ts
 * Module:      API · GraphQL · Enums
 * Purpose:     Standalone recurrence-pattern enum + GraphQL registration.
 *              Defined in its own file to avoid circular import chains that
 *              caused `registerEnumType` to never run when loaded from
 *              user.type.ts (which itself imports entities).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */
import { registerEnumType } from '@nestjs/graphql';

export enum RecurrencePatternEnum {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

registerEnumType(RecurrencePatternEnum, { name: 'RecurrencePattern' });
