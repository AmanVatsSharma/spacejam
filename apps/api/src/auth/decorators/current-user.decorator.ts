/**
 * File:        auth/decorators/current-user.decorator.ts
 * Module:      Api · Auth · Decorators
 * Purpose:     Extracts the authenticated user from the GraphQL request
 *              context. Use on resolvers behind GqlAuthGuard.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { UserRole } from '../../graphql/types/user.type';

export interface AuthenticatedUser {
  /** Canonical subject id (matches JWT `sub`). */
  sub: string;
  /** Legacy alias for `sub`. Kept for transition. */
  id: string;
  email?: string;
  role: UserRole;
  /** Center this user is assigned to. null for SUPER_ADMIN; set for CENTER_MANAGER. */
  centerId?: string | null;
  /** Canonical session id (matches JWT `sid`). */
  sid?: string;
  /** Legacy alias for `sid`. Kept for transition. */
  sessionId?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);