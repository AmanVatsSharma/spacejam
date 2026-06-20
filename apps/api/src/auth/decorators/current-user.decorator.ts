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
  id: string;
  email?: string;
  role: UserRole;
  sessionId?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);