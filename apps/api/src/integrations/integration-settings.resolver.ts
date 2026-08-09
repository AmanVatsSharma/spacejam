/**
 * File:        apps/api/src/integrations/integration-settings.resolver.ts
 * Module:      API · Integrations · GraphQL
 * Purpose:     Super-admin-only resolver to read/write platform integration
 *              config (SMS provider + Razorpay). Every method is guarded by
 *              @Roles(SUPER_ADMIN) so only the super-admin can view or change
 *              API keys.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { IntegrationSettingsService } from './integration-settings.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../graphql/types/user.type';

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

@Resolver()
export class IntegrationSettingsResolver {
  constructor(private readonly settings: IntegrationSettingsService) {}

  /** Masked view of all settings in a group (for the admin forms). */
  @Query(() => [SettingEntry], { description: 'Read integration settings (masked secrets). Super-admin only.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async integrationSettings(@Args('group') group: string): Promise<SettingEntry[]> {
    return this.settings.readGroup(group);
  }

  /** Whether SMS + Razorpay are configured (shown as status badges). */
  @Query(() => IntegrationStatus, { description: 'Integration connection status. Super-admin only.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async integrationStatus(): Promise<IntegrationStatus> {
    const [sms, smsCfg, rzp, rzpCfg] = await Promise.all([
      this.settings.isSmsConfigured(),
      this.settings.getSmsConfig(),
      this.settings.isRazorpayConfigured(),
      this.settings.getRazorpayConfig(),
    ]);
    return {
      smsConfigured: sms,
      smsProvider: smsCfg.provider || 'console',
      razorpayConfigured: rzp,
      razorpayMode: rzpCfg.mode || '',
    };
  }

  @Mutation(() => Boolean, { description: 'Save SMS provider config. Super-admin only.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async saveSmsConfig(@Args('input') input: SaveSmsConfigInput): Promise<boolean> {
    await this.settings.setMany('sms', [
      { key: 'sms.provider', value: input.provider },
      { key: 'sms.apiKey', value: input.apiKey, secret: true },
      { key: 'sms.senderId', value: input.senderId ?? '' },
      { key: 'sms.templateId', value: input.templateId ?? '' },
    ]);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Save Razorpay config. Super-admin only.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async saveRazorpayConfig(@Args('input') input: SaveRazorpayConfigInput): Promise<boolean> {
    await this.settings.setMany('payment', [
      { key: 'razorpay.keyId', value: input.keyId },
      { key: 'razorpay.keySecret', value: input.keySecret, secret: true },
      { key: 'razorpay.webhookSecret', value: input.webhookSecret ?? '', secret: true },
      { key: 'razorpay.mode', value: input.mode ?? 'test' },
    ]);
    return true;
  }
}
