/**
 * File:        auth/guards/center-scoped.guard.ts
 * Module:      Api · Auth · Guards
 * Purpose:     Enforces that a CENTER_MANAGER caller can only act on their
 *              own center. Reads the @CenterScoped('argName') metadata to
 *              know which resolver arg to compare against caller.centerId.
 *              SUPER_ADMIN and other unscoped roles pass through (their
 *              *what*-they-can-do is gated by @Roles; center scoping does
 *              not apply to roles that can touch any center).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-10
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

import { CENTER_SCOPED_KEY } from '../decorators/center-scoped.decorator';
import { UserRole } from '../../graphql/types/user.type';

@Injectable()
export class CenterScopedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const argName = this.reflector.getAllAndOverride<string>(CENTER_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // No @CenterScoped metadata → nothing to enforce.
    if (!argName) return true;

    const gqlCtx = GqlExecutionContext.create(context);
    const user = gqlCtx.getContext().req?.user;
    // Not authenticated at all — let GqlAuthGuard/RolesGuard handle that.
    if (!user) return true;

    // Only CENTER_MANAGER is center-scoped. All other roles pass through.
    if (user.role !== UserRole.CENTER_MANAGER) return true;

    const callerCenterId = user.centerId;
    if (!callerCenterId) {
      // Manager with no center assigned — misconfigured. Deny loudly rather
      // than silently over-grant.
      throw new ForbiddenException('Your account is not assigned to a center');
    }

    const argCenterId = (gqlCtx.getArgs() as Record<string, any>)?.[argName];
    if (argCenterId !== callerCenterId) {
      throw new ForbiddenException('Not allowed to access this center');
    }
    return true;
  }
}
