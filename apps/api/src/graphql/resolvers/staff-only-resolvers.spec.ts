/**
 * File:        apps/api/src/graphql/resolvers/staff-only-resolvers.spec.ts
 * Module:      API · GraphQL Resolvers · Access control · Tests
 * Purpose:     Leads, customers, customer documents and analytics are STAFF data.
 *              Open sign-up issues a MEMBER token, so a valid JWT alone must not be
 *              enough: every operation on these resolvers has to refuse anyone who
 *              is not SUPER_ADMIN or CENTER_MANAGER.
 *
 *              For each resolver this checks (1) the declared roles and that
 *              RolesGuard is actually attached — @Roles on its own enforces
 *              nothing — and (2) that the REAL RolesGuard lets staff through and
 *              refuses every other role and anonymous callers on EVERY
 *              @Query/@Mutation, so a method-level override can't weaken a class.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-03
 */
import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@enums';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CrmResolver } from './crm.resolver';
import { CustomerResolver } from './customer.resolver';
import { CustomerDocumentResolver } from './customer-document.resolver';
import { AnalyticsResolver } from './analytics.resolver';

const STAFF = [UserRole.SUPER_ADMIN, UserRole.CENTER_MANAGER];
const NOT_STAFF = [UserRole.EMPLOYEE, UserRole.COMPANY_ADMIN, UserRole.MEMBER];

/** Every @Query / @Mutation handler declared on a resolver class. */
function operationsOf(resolver: Function): Array<[string, Function]> {
  return Object.getOwnPropertyNames(resolver.prototype)
    .filter((name) => name !== 'constructor')
    .map((name): [string, Function] => [name, resolver.prototype[name]])
    .filter(([, fn]) => typeof fn === 'function' && Reflect.getMetadata('graphql:resolver_type', fn));
}

/** The ExecutionContext shape RolesGuard reads: GqlExecutionContext → context.req.user. */
function contextFor(resolver: Function, handler: Function, user?: { role: UserRole }) {
  const ctx = new ExecutionContextHost([{}, {}, { req: { user } }, {}], resolver as any, handler as any);
  ctx.setType('graphql');
  return ctx;
}

describe.each([
  ['CrmResolver (leads)', CrmResolver],
  ['CustomerResolver', CustomerResolver],
  ['CustomerDocumentResolver', CustomerDocumentResolver],
  ['AnalyticsResolver', AnalyticsResolver],
])('%s is staff-only', (_name, Resolver) => {
  const operations = operationsOf(Resolver);

  it('declares SUPER_ADMIN and CENTER_MANAGER, enforced by GqlAuthGuard + RolesGuard', () => {
    expect(Reflect.getMetadata('roles', Resolver)).toEqual(STAFF);
    expect(Reflect.getMetadata('__guards__', Resolver)).toEqual(expect.arrayContaining([GqlAuthGuard, RolesGuard]));
  });

  it('has GraphQL operations to protect', () => {
    expect(operations.length).toBeGreaterThan(0);
  });

  it.each(operations)('%s: staff pass; every other role and anonymous callers are refused', (_op, handler) => {
    const guard = new RolesGuard(new Reflector());
    for (const role of STAFF) {
      expect(guard.canActivate(contextFor(Resolver, handler, { role }))).toBe(true);
    }
    for (const role of NOT_STAFF) {
      expect(() => guard.canActivate(contextFor(Resolver, handler, { role }))).toThrow(ForbiddenException);
    }
    expect(() => guard.canActivate(contextFor(Resolver, handler))).toThrow(ForbiddenException);
  });
});
