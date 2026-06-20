/**
 * File:        apps/api/src/graphql/resolvers/auth.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Authentication resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { AuthService } from '../auth/auth.service';
import { AuthPayload } from '../types/user.type';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Context() context
  ): Promise<AuthPayload> {
    return this.authService.login(email, password, context.req);
  }

  @Mutation(() => AuthPayload)
  async refreshToken(
    @Args('refreshToken') refreshToken: string
  ): Promise<AuthPayload> {
    return this.authService.refreshToken(refreshToken);
  }

  @Mutation(() => Boolean)
  async logout(@Context() context): Promise<boolean> {
    const token = context.req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await this.authService.logout(token);
    }
    return true;
  }

  @Mutation(() => Boolean)
  async verifyEmail(@Args('token') token: string): Promise<boolean> {
    return this.authService.verifyEmail(token);
  }
}