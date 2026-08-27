/**
 * File:        apps/api/src/integrations/integration-settings.resolver.ts
 * Module:      API · Integrations · GraphQL
 * Purpose:     Admin resolver to read/write platform integration config
 *              (SMS provider, Razorpay, Email/SMTP, WhatsApp). Every method
 *              is guarded by @Roles(SUPER_ADMIN, ADMIN) so the Integrations
 *              settings page (gated to both roles in the web UI) works.
 *              Secrets are masked on read; an empty/masked secret on save
 *              keeps the stored value.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-27
 */
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Field, InputType, ObjectType, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IsIn, IsOptional, IsString, IsInt, IsBoolean, Min } from 'class-validator';

import { IntegrationSettingsService } from './integration-settings.service';
import { WhatsAppService } from './whatsapp.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../graphql/types/user.type';
import { EmailService } from '../auth/services/email.service';

/** Masked secrets come back from the UI as '••••1234'; treat that (and an
 *  empty string) as "keep the stored secret" on save. */
function isMaskedOrEmpty(value: string | undefined | null): boolean {
  return !value || value.startsWith('••••');
}

@ObjectType()
class SettingEntry {
  @Field() key!: string;
  @Field() value!: string;
  @Field() secret!: boolean;
}

@ObjectType()
class IntegrationStatus {
  @Field() smsConfigured!: boolean;
  @Field() smsProvider!: string;
  @Field() razorpayConfigured!: boolean;
  @Field() razorpayMode!: string;
  @Field() emailConfigured!: boolean;
  @Field() whatsappConfigured!: boolean;
}

@InputType()
class SaveSmsConfigInput {
  @Field()
  @IsIn(['console', 'msg91', 'twilio'])
  provider!: string;

  @Field()
  @IsString()
  apiKey!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  senderId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  templateId?: string;
}

@InputType()
class SaveRazorpayConfigInput {
  @Field()
  @IsString()
  keyId!: string;

  @Field()
  @IsString()
  keySecret!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  webhookSecret?: string;

  @Field({ nullable: true })
  @IsIn(['test', 'live'])
  @IsOptional()
  mode?: string;
}

@InputType()
class SaveEmailConfigInput {
  @Field()
  @IsString()
  host!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  port!: number;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  secure?: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  user?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  password?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  from?: string;
}

@InputType()
class SaveWhatsappConfigInput {
  @Field()
  @IsIn(['console', 'msg91', 'twilio'])
  provider!: string;

  @Field()
  @IsString()
  apiKey!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  senderId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  templateId?: string;
}

@Resolver()
export class IntegrationSettingsResolver {
  constructor(
    private readonly settings: IntegrationSettingsService,
    private readonly whatsapp: WhatsAppService,
    // EmailService is provided by AuthModule (and CrmModule). Importing
    // AuthModule here would create a module cycle (Auth already imports
    // IntegrationsModule for the SMS provider), so resolve it lazily from
    // the app container instead.
    private readonly moduleRef: ModuleRef,
  ) {}

  /** Masked view of all settings in a group (for the admin forms). */
  @Query(() => [SettingEntry], { description: 'Read integration settings (masked secrets). Super-admin or admin only.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async integrationSettings(@Args('group') group: string): Promise<SettingEntry[]> {
    return this.settings.readGroup(group);
  }

  /** Whether SMS + Razorpay + Email + WhatsApp are configured (status badges). */
  @Query(() => IntegrationStatus, { description: 'Integration connection status. Super-admin or admin only.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async integrationStatus(): Promise<IntegrationStatus> {
    const [sms, smsCfg, rzp, rzpCfg, email, whatsapp] = await Promise.all([
      this.settings.isSmsConfigured(),
      this.settings.getSmsConfig(),
      this.settings.isRazorpayConfigured(),
      this.settings.getRazorpayConfig(),
      this.settings.isEmailConfigured(),
      this.settings.isWhatsappConfigured(),
    ]);
    return {
      smsConfigured: sms,
      smsProvider: smsCfg.provider || 'console',
      razorpayConfigured: rzp,
      razorpayMode: rzpCfg.mode || '',
      emailConfigured: email,
      whatsappConfigured: whatsapp,
    };
  }

  @Mutation(() => Boolean, { description: 'Save SMS provider config. Super-admin or admin only.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async saveSmsConfig(@Args('input') input: SaveSmsConfigInput): Promise<boolean> {
    // Empty/masked apiKey keeps the stored secret (UI round-trips the mask).
    const apiKey = isMaskedOrEmpty(input.apiKey)
      ? (await this.settings.getSmsConfig()).apiKey
      : input.apiKey;
    await this.settings.setMany('sms', [
      { key: 'sms.provider', value: input.provider },
      { key: 'sms.apiKey', value: apiKey, secret: true },
      { key: 'sms.senderId', value: input.senderId ?? '' },
      { key: 'sms.templateId', value: input.templateId ?? '' },
    ]);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Save Razorpay config. Super-admin or admin only.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async saveRazorpayConfig(@Args('input') input: SaveRazorpayConfigInput): Promise<boolean> {
    // Empty/masked secrets keep the stored values.
    const existing = await this.settings.getRazorpayConfig();
    const keySecret = isMaskedOrEmpty(input.keySecret) ? existing.keySecret : input.keySecret;
    const webhookSecret = isMaskedOrEmpty(input.webhookSecret) ? existing.webhookSecret : (input.webhookSecret ?? '');
    await this.settings.setMany('payment', [
      { key: 'razorpay.keyId', value: input.keyId },
      { key: 'razorpay.keySecret', value: keySecret, secret: true },
      { key: 'razorpay.webhookSecret', value: webhookSecret, secret: true },
      { key: 'razorpay.mode', value: input.mode ?? 'test' },
    ]);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Save SMTP email config. Super-admin or admin only. Empty/masked password keeps the stored one.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async saveEmailConfig(@Args('input') input: SaveEmailConfigInput): Promise<boolean> {
    const existing = await this.settings.getEmailConfig();
    // Empty/masked password keeps the stored secret (the UI sends the mask
    // back when the admin doesn't retype it).
    const password =
      input.password && !isMaskedOrEmpty(input.password) ? input.password : existing.password;
    await this.settings.setMany('email', [
      { key: 'email.host', value: input.host },
      { key: 'email.port', value: String(input.port) },
      { key: 'email.secure', value: String(input.secure ?? false) },
      { key: 'email.user', value: input.user ?? '' },
      { key: 'email.password', value: password, secret: true },
      { key: 'email.from', value: input.from ?? '' },
    ]);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Save WhatsApp provider config. Super-admin or admin only. Empty/masked apiKey keeps the stored one.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async saveWhatsappConfig(@Args('input') input: SaveWhatsappConfigInput): Promise<boolean> {
    const existing = await this.settings.getWhatsappConfig();
    const apiKey = isMaskedOrEmpty(input.apiKey) ? existing.apiKey : input.apiKey;
    await this.settings.setMany('whatsapp', [
      { key: 'whatsapp.provider', value: input.provider },
      { key: 'whatsapp.apiKey', value: apiKey, secret: true },
      { key: 'whatsapp.senderId', value: input.senderId ?? '' },
      { key: 'whatsapp.templateId', value: input.templateId ?? '' },
    ]);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Send a short test email through the configured SMTP settings. Throws when email is unconfigured.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async sendTestEmail(@Args('to') to: string): Promise<boolean> {
    const email = await this.moduleRef.get(EmailService, { strict: false });
    await email.sendTest(to);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Send a test WhatsApp message through the configured provider. Throws when WhatsApp is unconfigured.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async sendTestWhatsapp(
    @Args('to') to: string,
    @Args('message') message: string,
  ): Promise<boolean> {
    await this.whatsapp.send(to, message);
    return true;
  }
}
