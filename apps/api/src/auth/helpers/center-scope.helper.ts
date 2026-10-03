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
 * IMPORTANT — none of these helpers is an authorization check on its own: they
 * answer "which center?", and `undefined` means "no restriction", which is what a
 * plain MEMBER gets too. A resolver using them must first be role-gated with
 * `@UseGuards(GqlAuthGuard, RolesGuard) @Roles(...)`.
 *
 *  - centerScope         legacy: a manager with no center comes back unrestricted
 *  - requireCenterScope  same, but refuses a manager with no center (fails closed)
 *  - assertCenterAccess  by-id guard: a manager may only touch their own center's records
 *  - writeCenterId       the center a created/edited record is written to
 *
 * Author:      AmanVatsSharma (centerScope) · Claude Sonnet 5.5 (fail-closed helpers)
 * Last-updated: 2026-10-03
 */
import { ForbiddenException } from '@nestjs/common';
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

/**
 * Like `centerScope`, but a CENTER_MANAGER who has no center is refused instead of
 * silently seeing every center. `undefined` still means "no restriction" — only for
 * a super admin (or no caller, as in unit tests that call a resolver directly).
 */
export function requireCenterScope(caller: JwtPayload | undefined): string | undefined {
  if (!caller) return undefined;
  if (caller.role === UserRole.CENTER_MANAGER && !caller.centerId) {
    throw new ForbiddenException('Your account is not assigned to a center.');
  }
  return centerScope(caller);
}

/**
 * By-id guard: throws when a CENTER_MANAGER targets a record outside their center.
 * A record with no center is a super-admin record — managers cannot see it in lists,
 * so they cannot reach it by id either. A super admin is never restricted.
 *
 * @param subject what the record is, for the message ("This lead belongs to…")
 */
export function assertCenterAccess(
  caller: JwtPayload | undefined,
  recordCenterId: string | null | undefined,
  subject = 'record',
): void {
  const scope = requireCenterScope(caller);
  if (scope && recordCenterId !== scope) {
    throw new ForbiddenException(`This ${subject} belongs to a different center.`);
  }
}

/**
 * The center a created or edited record is written to: a manager's own center (naming
 * another one is refused); a super admin chooses freely, or leaves it unset.
 */
export function writeCenterId(caller: JwtPayload | undefined, requested?: string | null): string | null {
  const scope = requireCenterScope(caller);
  if (!scope) return requested ?? null;
  if (requested && requested !== scope) {
    throw new ForbiddenException('You can only add records to your own center.');
  }
  return scope;
}
