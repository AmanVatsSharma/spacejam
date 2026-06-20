/**
 * File:        auth/guards/roles.guard.ts
 * Module:      Api · Auth · Guards
 * Purpose:     Allows a route only if the authenticated user has at least
 *              one of the required roles (set via the @Roles() decorator).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../graphql/types/user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req?.user;
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }
    if (!required.includes(user.role)) {
      throw new ForbiddenException(`Requires role: ${required.join(', ')}`);
    }
    return true;
  }
}