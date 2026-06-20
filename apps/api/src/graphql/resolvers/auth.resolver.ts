/**
 * File:        graphql/resolvers/auth.resolver.ts
 * Module:      Api · GraphQL · Resolvers
 * Purpose:     Authentication mutations (signin, signup, refresh, 2FA, reset)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { AuthService } from '../../auth/services/auth.service';
import { AuthPayload } from '../types/user.type';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { GqlRefreshAuthGuard } from '../../auth/guards/gql-refresh-auth.guard';
import { JwtPayload } from '../../auth/types/jwt-payload.type';

import { SigninInput } from '../../auth/dto/signin.input';
import { SignupInput } from '../../auth/dto/signup.input';
import { ForgotPasswordInput } from '../../auth/dto/forgot-password.input';
import { ResetPasswordInput } from '../../auth/dto/reset-password.input';
import { VerifyTwoFactorInput } from '../../auth/dto/verify-two-factor.input';
import { EnableTwoFactorInput } from '../../auth/dto/enable-two-factor.input';

@Resolver(() => AuthPayload)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  private buildCtx(context: { req: { ip?: string; headers?: Record<string, string | string[]> } }) {
    const fwd = (context.req.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
    return {
      ipAddress: context.req.ip ?? fwd ?? null,
      userAgent: (context.req.headers?.['user-agent'] as string | undefined) ?? null,
    };
  }

  @Public()
  @Mutation(() => AuthPayload, { description: 'Sign in with email + password (optionally a 2FA code)' })
  async signin(
    @Args('input') input: SigninInput,
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<AuthPayload> {
    return this.authService.signin(input, this.buildCtx(context));
  }

  @Public()
  @Mutation(() => AuthPayload, { description: 'Create a new account' })
  async signup(
    @Args('input') input: SignupInput,
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<AuthPayload> {
    return this.authService.signup(input, this.buildCtx(context));
  }

  @Public()
  @UseGuards(GqlRefreshAuthGuard)
  @Mutation(() => AuthPayload, { description: 'Exchange a valid refresh token for a new pair' })
  async refreshTokens(
    @Args('refreshToken') refreshToken: string,
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<AuthPayload> {
    return this.authService.refreshTokens(refreshToken, this.buildCtx(context));
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean, { description: 'End the current session' })
  async logout(@CurrentUser() user: JwtPayload): Promise<boolean> {
    return this.authService.logout(user.sub, user.sid);
  }

  @Public()
  @Mutation(() => Boolean, { description: 'Send a password-reset email if the account exists' })
  async requestPasswordReset(@Args('input') input: ForgotPasswordInput): Promise<boolean> {
    return this.authService.requestPasswordReset(input.email);
  }

  @Public()
  @Mutation(() => Boolean, { description: 'Reset password using a token from the reset email' })
  async resetPassword(@Args('input') input: ResetPasswordInput): Promise<boolean> {
    return this.authService.resetPassword(input);
  }

  @Public()
  @Mutation(() => AuthPayload, { description: 'Exchange a 2FA challenge token + TOTP code for real tokens' })
  async verifyTwoFactor(@Args('input') input: VerifyTwoFactorInput): Promise<AuthPayload> {
    return this.authService.verifyTwoFactor(input);
  }

  // ---------- authenticated setup flows ----------

  @UseGuards(GqlAuthGuard)
  @Mutation(() => String, {
    description: 'Start 2FA enrollment. Returns an otpauth URL (and a base32 secret) for the authenticator app.',
  })
  async beginTwoFactorSetup(
    @CurrentUser() user: JwtPayload,
  ): Promise<string> {
    const { otpauthUrl } = await this.authService.beginTwoFactorSetup(user.sub);
    return otpauthUrl;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => [String], {
    description: 'Confirm 2FA setup with a TOTP code. Returns one-time recovery codes (shown once).',
  })
  async confirmTwoFactorSetup(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: EnableTwoFactorInput,
  ): Promise<string[]> {
    return this.authService.confirmTwoFactorSetup(user.sub, input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean, { description: 'Disable 2FA after verifying a current code' })
  async disableTwoFactor(
    @CurrentUser() user: JwtPayload,
    @Args('code') code: string,
  ): Promise<boolean> {
    return this.authService.disableTwoFactor(user.sub, code);
  }
}