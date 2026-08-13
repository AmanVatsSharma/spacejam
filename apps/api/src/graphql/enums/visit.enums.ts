/**
 * File:        apps/api/src/graphql/enums/visit.enums.ts
 * Module:      API · GraphQL Enums
 * Purpose:     Enums for the Visit domain (scheduled center tours / site visits).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-13
 */
import { registerEnumType } from '@nestjs/graphql';

export enum TourType {
  WALK_IN = 'WALK_IN',
  SCHEDULED_TOUR = 'SCHEDULED_TOUR',
  VIRTUAL = 'VIRTUAL',
  FOLLOW_UP = 'FOLLOW_UP',
}

export enum VisitStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

registerEnumType(TourType, { name: 'TourType' });
registerEnumType(VisitStatus, { name: 'VisitStatus' });
