/**
 * File:        auth/helpers/center-scope.helper.ts
 * Module:      Api · Auth · Helpers
 * Purpose:     Returns the centerId that should be applied to database queries
 *              for the given caller.
 *
 *  - CENTER_MANAGER → returns their assigned centerId (scoped to one center)
 *  - All other roles  → returns undefined (no restriction, sees all data)
 *
 * Usage in resolvers:
 *   const scope = centerScope(caller);
 *   if (scope) filters.centerId = scope;   // overrides whatever the client sent
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-07
 */
import type { JwtPayload } from '../types/jwt-payload.type';
import { UserRole } from '../roles.enum';

/**
 * Returns the centerId that must be applied to every list/count query for this
 * caller, or `undefined` if the caller has no center restriction.
 */
export function centerScope(caller: JwtPayload): string | undefined {
  if (caller.role === UserRole.CENTER_MANAGER && caller.centerId) {
    return caller.centerId;
  }
  return undefined;
}
