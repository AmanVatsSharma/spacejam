/**
 * File:        apps/api/src/integrations/integration-settings.resolver.ts
 * Module:      API · Integrations · GraphQL
 * Purpose:     Super-admin resolver to read/write platform integration and
 *              payment config: SMS, Razorpay (with live test-connection and
 *              key/mode validation), the center's receiving bank account,
 *              cheque payee, UPI QR, Email/SMTP and WhatsApp. Every method is
 *              SUPER_ADMIN only. Secrets are masked on read; an empty/masked
 *              secret on save keeps the stored value. Changes are audited
 *              (never logging secret values).
 *
 * Author:      ZCode (original) · Claude Sonnet 5.5 (payments hardening)
 * Last-updated: 2026-10-02
 */
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Field, InputType, ObjectType, Int } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  IsIn,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  Min,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

import { IntegrationSettingsService } from './integration-settings.service';
import { WhatsAppService } from './whatsapp.service';
import { RazorpayService, razorpayModeFromKeyId } from './razorpay.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { AuditService } from '../auth/services/audit.service';
import { UserRole } from '@enums';
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
  @Field() qrConfigured!: boolean;
  /** Receiving bank account (NEFT/RTGS/IMPS) saved. */
  @Field() bankConfigured!: boolean;
  /** Cheque payee saved. */
  @Field() chequeConfigured!: boolean;
  /** Razorpay webhook secret saved — without it paid-but-closed-tab payments can't auto-complete. */
  @Field() razorpayWebhookConfigured!: boolean;
}

@ObjectType()
class RazorpayConnectionResultGql {
  @Field() ok!: boolean;
  @Field() message!: string;
  /** 'test' | 'live' (from the key id) or '' when the key id is malformed. */
  @Field() mode!: string;
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
export class SaveRazorpayConfigInput {
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

  /** Skip the live key check against Razorpay (offline setups only). */
  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  skipValidation?: boolean;
}

@InputType()
export class SaveBankAccountConfigInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  accountName!: string;

  @Field()
  @IsString()
  @Matches(/^\d{9,18}$/, { message: 'Account number must be 9–18 digits' })
  accountNumber!: string;

  @Field()
  @IsString()
  @Matches(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, { message: 'IFSC must look like HDFC0001234' })
  ifsc!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  bankName?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  branch?: string;
}

@InputType()
export class SaveChequeConfigInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  payeeName!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  instructions?: string;
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
    private readonly razorpay: RazorpayService,
    private readonly audit: AuditService,
    // EmailService is provided by AuthModule (and CrmModule). Importing
    // AuthModule here would create a module cycle (Auth already imports
    // IntegrationsModule for the SMS provider), so resolve it lazily from
    // the app container instead.
    private readonly moduleRef: ModuleRef,
  ) {}

  /** Masked view of all settings in a group (for the admin forms). */
  @Query(() => [SettingEntry], { description: 'Read integration settings (masked secrets). Super admin only.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async integrationSettings(@Args('group') group: string): Promise<SettingEntry[]> {
    return this.settings.readGroup(group);
  }

  /** Whether SMS + Razorpay + Email + WhatsApp are configured (status badges). */
  @Query(() => IntegrationStatus, { description: 'Integration connection status. Super admin only.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async integrationStatus(): Promise<IntegrationStatus> {
    const [sms, smsCfg, rzp, rzpCfg, email, whatsapp, qr, bank, cheque] = await Promise.all([
      this.settings.isSmsConfigured(),
      this.settings.getSmsConfig(),
      this.settings.isRazorpayConfigured(),
      this.settings.getRazorpayConfig(),
      this.settings.isEmailConfigured(),
      this.settings.isWhatsappConfigured(),
      this.settings.isQrPaymentConfigured(),
      this.settings.isBankAccountConfigured(),
      this.settings.isChequeConfigured(),
    ]);
    return {
      smsConfigured: sms,
      smsProvider: smsCfg.provider || 'console',
      razorpayConfigured: rzp,
      qrConfigured: qr,
      razorpayMode: rzpCfg.mode || '',
      emailConfigured: email,
      whatsappConfigured: whatsapp,
      bankConfigured: bank,
      chequeConfigured: cheque,
      razorpayWebhookConfigured: !!rzpCfg.webhookSecret,
    };
  }

  @Mutation(() => Boolean, { description: 'Save SMS provider config. Super admin only.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
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

  @Mutation(() => Boolean, {
    description:
      'Save Razorpay config. Super admin only. The key id must be rzp_test_/rzp_live_ and agree with `mode`; changed credentials are checked live against Razorpay before saving (unless skipValidation). Empty/masked secrets keep the stored values.',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async saveRazorpayConfig(
    @Args('input') input: SaveRazorpayConfigInput,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<boolean> {
    const existing = await this.settings.getRazorpayConfig();

    const keyId = input.keyId.trim();
    const keyIdMode = razorpayModeFromKeyId(keyId);
    if (!keyIdMode) {
      throw new BadRequestException('Key id must look like rzp_test_xxxx or rzp_live_xxxx.');
    }
    if (input.mode && input.mode !== keyIdMode) {
      throw new BadRequestException(
        `That key id is a ${keyIdMode}-mode key but "${input.mode}" mode was selected. Use matching keys and mode.`,
      );
    }

    // Empty/masked secrets keep the stored values.
    const secretChanged = !isMaskedOrEmpty(input.keySecret);
    const keySecret = secretChanged ? input.keySecret.trim() : existing.keySecret;
    if (!keySecret) throw new BadRequestException('Enter the Razorpay key secret.');
    if (secretChanged && keySecret.length < 16) {
      throw new BadRequestException('That key secret looks too short — copy it again from the Razorpay dashboard.');
    }
    const webhookChanged = !!input.webhookSecret && !isMaskedOrEmpty(input.webhookSecret);
    const webhookSecret = webhookChanged ? input.webhookSecret!.trim() : existing.webhookSecret;
    if (webhookChanged && webhookSecret.length < 8) {
      throw new BadRequestException('The webhook secret must be at least 8 characters.');
    }

    // Don't let a typo'd key pair silently break online payments: prove the
    // credentials work before persisting them.
    const credentialsChanged = keyId !== existing.keyId || secretChanged;
    const validated = credentialsChanged && !input.skipValidation;
    if (validated) {
      const check = await this.razorpay.testConnection({ keyId, keySecret });
      if (!check.ok) throw new BadRequestException(check.message);
    }

    await this.settings.setMany('payment', [
      { key: 'razorpay.keyId', value: keyId },
      { key: 'razorpay.keySecret', value: keySecret, secret: true },
      { key: 'razorpay.webhookSecret', value: webhookSecret, secret: true },
      { key: 'razorpay.mode', value: keyIdMode },
    ]);
    await this.audit.record({
      action: 'INTEGRATION_SETTINGS_UPDATE',
      userId: caller?.sub ?? null,
      entityType: 'razorpay',
      // Never record secret values — only that they changed.
      changes: { keyId, mode: keyIdMode, keySecretUpdated: secretChanged, webhookSecretUpdated: webhookChanged, validated },
    });
    return true;
  }

  @Mutation(() => RazorpayConnectionResultGql, {
    description:
      'Check a Razorpay key pair against the live API without saving it. Omit the secret (or send the masked value) to test the stored one. Never throws for bad credentials — returns { ok:false, message }. Super admin only.',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async testRazorpayConnection(
    @Args('keyId', { type: () => String, nullable: true }) keyId?: string | null,
    @Args('keySecret', { type: () => String, nullable: true }) keySecret?: string | null,
  ): Promise<RazorpayConnectionResultGql> {
    const stored = await this.settings.getRazorpayConfig();
    return this.razorpay.testConnection({
      keyId: keyId?.trim() || stored.keyId,
      keySecret: isMaskedOrEmpty(keySecret) ? stored.keySecret : (keySecret as string).trim(),
    });
  }

  @Mutation(() => Boolean, {
    description:
      "Save the center's receiving bank account (shown to staff when a client pays by NEFT/RTGS/IMPS). Super admin only.",
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async saveBankAccountConfig(
    @Args('input') input: SaveBankAccountConfigInput,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<boolean> {
    await this.settings.setMany('payment', [
      { key: 'payment.bank.accountName', value: input.accountName.trim() },
      { key: 'payment.bank.accountNumber', value: input.accountNumber.trim() },
      { key: 'payment.bank.ifsc', value: input.ifsc.trim().toUpperCase() },
      { key: 'payment.bank.bankName', value: (input.bankName ?? '').trim() },
      { key: 'payment.bank.branch', value: (input.branch ?? '').trim() },
    ]);
    await this.audit.record({
      action: 'INTEGRATION_SETTINGS_UPDATE',
      userId: caller?.sub ?? null,
      entityType: 'bank-account',
      changes: { accountName: input.accountName.trim(), ifsc: input.ifsc.trim().toUpperCase(), accountNumberLast4: input.accountNumber.trim().slice(-4) },
    });
    return true;
  }

  @Mutation(() => Boolean, {
    description: 'Save who cheques are made out to, plus collection instructions. Super admin only.',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async saveChequeConfig(
    @Args('input') input: SaveChequeConfigInput,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<boolean> {
    await this.settings.setMany('payment', [
      { key: 'payment.cheque.payeeName', value: input.payeeName.trim() },
      { key: 'payment.cheque.instructions', value: (input.instructions ?? '').trim() },
    ]);
    await this.audit.record({
      action: 'INTEGRATION_SETTINGS_UPDATE',
      userId: caller?.sub ?? null,
      entityType: 'cheque',
      changes: { payeeName: input.payeeName.trim() },
    });
    return true;
  }

  @Mutation(() => Boolean, { description: 'Save manual UPI QR payment config (super admin only). The QR image is uploaded separately via /api/print/upload; only its public path is stored.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async saveQrPaymentConfig(
    @Args('upiId') upiId: string,
    @Args('imagePath', { type: () => String, nullable: true }) imagePath: string | null,
    @Args('payeeName', { type: () => String, nullable: true }) payeeName: string | null,
  ): Promise<boolean> {
    if (!upiId || !upiId.includes('@')) {
      throw new BadRequestException('UPI ID must look like name@bank');
    }
    const existing = await this.settings.getQrPaymentConfig();
    const image = imagePath && imagePath.startsWith('/uploads/') ? imagePath : existing.imagePath;
    await this.settings.setMany('payment', [
      { key: 'payment.qr.upiId', value: upiId },
      { key: 'payment.qr.imagePath', value: image },
      { key: 'payment.qr.payeeName', value: payeeName ?? '' },
    ]);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Save SMTP email config. Super admin only. Empty/masked password keeps the stored one.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
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

  @Mutation(() => Boolean, { description: 'Save WhatsApp provider config. Super admin only. Empty/masked apiKey keeps the stored one.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.SUPER_ADMIN)
  async sendTestEmail(@Args('to') to: string): Promise<boolean> {
    const email = await this.moduleRef.get(EmailService, { strict: false });
    await email.sendTest(to);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Send a test WhatsApp message through the configured provider. Throws when WhatsApp is unconfigured.' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async sendTestWhatsapp(
    @Args('to') to: string,
    @Args('message') message: string,
  ): Promise<boolean> {
    await this.whatsapp.send(to, message);
    return true;
  }
}
