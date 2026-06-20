/**
 * File:        auth/guards/gql-auth.guard.ts
 * Module:      Api · Auth · Guards
 * Purpose:     GraphQL-flavored JWT guard. Wraps passport-jwt so resolvers
 *              can opt-in with `@UseGuards(GqlAuthGuard)`.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}