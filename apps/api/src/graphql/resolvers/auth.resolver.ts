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
import { FieldRateLimit, FieldRateLimitGuard } from '../guards/field-rate-limit.guard';

import { SigninInput } from '../../auth/dto/signin.input';
import { SignupInput } from '../../auth/dto/signup.input';
import { ForgotPasswordInput } from '../../auth/dto/forgot-password.input';
import { ResetPasswordInput } from '../../auth/dto/reset-password.input';
import { ChangePasswordInput } from '../../auth/dto/change-password.input';
import { VerifyTwoFactorInput } from '../../auth/dto/verify-two-factor.input';
import { EnableTwoFactorInput } from '../../auth/dto/enable-two-factor.input';
import { VerifyMagicLinkInput } from '../../auth/dto/verify-magic-link.input';

@UseGuards(FieldRateLimitGuard)
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
  @FieldRateLimit({ name: 'signin', limit: 10, windowSec: 60 })
  @Mutation(() => AuthPayload, { description: 'Sign in with email + password (optionally a 2FA code)' })
  async signin(
    @Args('input') input: SigninInput,
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<AuthPayload> {
    return this.authService.signin(input, this.buildCtx(context));
  }

  @Public()
  @FieldRateLimit({ name: 'signup', limit: 5, windowSec: 60 })
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
  @FieldRateLimit({ name: 'requestPasswordReset', limit: 5, windowSec: 60 })
  @Mutation(() => Boolean, { description: 'Send a password-reset email if the account exists' })
  async requestPasswordReset(
    @Args('input') input: ForgotPasswordInput,
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<boolean> {
    return this.authService.requestPasswordReset(input.email, this.buildCtx(context));
  }

  @Public()
  @Mutation(() => Boolean, { description: 'Reset password using a token from the reset email' })
  async resetPassword(
    @Args('input') input: ResetPasswordInput,
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<boolean> {
    return this.authService.resetPassword(input, this.buildCtx(context));
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean, { description: 'Change the current user\'s password (signed-in flow)' })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: ChangePasswordInput,
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<boolean> {
    return this.authService.changePassword(
      user.sub,
      input.currentPassword,
      input.newPassword,
      this.buildCtx(context),
    );
  }

  @Public()
  @Mutation(() => AuthPayload, { description: 'Exchange a 2FA challenge token + TOTP code for real tokens' })
  async verifyTwoFactor(
    @Args('input') input: VerifyTwoFactorInput,
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<AuthPayload> {
    return this.authService.verifyTwoFactor(input, this.buildCtx(context));
  }

  @Public()
  @FieldRateLimit({ name: 'requestMagicLink', limit: 5, windowSec: 60 })
  @Mutation(() => Boolean, { description: 'Send a one-time sign-in link to the given email if the account exists' })
  async requestMagicLink(
    @Args('input') input: ForgotPasswordInput,
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<boolean> {
    return this.authService.requestMagicLink(input.email, this.buildCtx(context));
  }

  @Public()
  @Mutation(() => AuthPayload, { description: 'Exchange a magic-link token for a real access/refresh pair' })
  async verifyMagicLink(
    @Args('input') input: VerifyMagicLinkInput,
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<AuthPayload> {
    return this.authService.consumeMagicLink(input.token, this.buildCtx(context));
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
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<string[]> {
    return this.authService.confirmTwoFactorSetup(user.sub, input, this.buildCtx(context));
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean, { description: 'Disable 2FA after verifying a current code' })
  async disableTwoFactor(
    @CurrentUser() user: JwtPayload,
    @Args('code') code: string,
    @Context() context: { req: { ip?: string; headers?: Record<string, string | string[]> } },
  ): Promise<boolean> {
    return this.authService.disableTwoFactor(user.sub, code, this.buildCtx(context));
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Number, { description: 'Number of unused 2FA recovery codes remaining' })
  async recoveryCodesRemaining(@CurrentUser() user: JwtPayload): Promise<number> {
    return this.authService.recoveryCodesRemaining(user.sub);
  }
}