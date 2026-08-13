/**
 * File:        apps/api/src/graphql/enums/visit.enums.ts
 * Module:      API · GraphQL Enums
 * Purpose:     Enums for the Visit domain (scheduled center tours / site visits).
 *              NOTE: keep this file side-effect-free (plain enums only). The
 *              registerEnumType calls live in a separate module that the
 *              GraphQL layer loads, so importing these enums into an entity
 *              does not pull in GraphQL registration side-effects (which can
 *              break entity class construction order under webpack).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-13
 */

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
