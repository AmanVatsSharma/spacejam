/**
 * File:        auth/guards/gql-refresh-auth.guard.ts
 * Module:      Api · Auth · Guards
 * Purpose:     GraphQL guard that authenticates the refresh token and
 *              exposes the session + user on `req.user` for `refreshTokens`.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}