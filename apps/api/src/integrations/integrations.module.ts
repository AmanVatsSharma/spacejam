/**
 * File:        apps/api/src/integrations/integrations.module.ts
 * Module:      API · Integrations
 * Purpose:     Platform integration config + providers (SMS router, Razorpay,
 *              WhatsApp, payments webhook). Exports
 *              IntegrationSettingsService + the SMS_PROVIDER token so
 *              AuthModule can inject the configurable SMS provider.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-27
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSetting } from '../typeorm/entities/app-setting.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { IntegrationSettingsService } from './integration-settings.service';
import { IntegrationSettingsResolver } from './integration-settings.resolver';
import { PaymentResolver } from './payment.resolver';
import { ConfigurableSmsProvider } from './configurable-sms-provider';
import { RazorpayService } from './razorpay.service';
import { WhatsAppService } from './whatsapp.service';
import { PaymentsWebhookController } from './payments-webhook.controller';
import { SMS_PROVIDER } from '../auth/services/sms-provider.interface';

@Module({
  imports: [TypeOrmModule.forFeature([AppSetting, Invoice])],
  controllers: [PaymentsWebhookController],
  providers: [
    IntegrationSettingsService,
    IntegrationSettingsResolver,
    PaymentResolver,
    RazorpayService,
    WhatsAppService,
    // The configurable router reads the chosen provider from settings and
    // falls back to console logging when nothing is configured.
    { provide: SMS_PROVIDER, useClass: ConfigurableSmsProvider },
  ],
  exports: [IntegrationSettingsService, RazorpayService, WhatsAppService, SMS_PROVIDER],
})
export class IntegrationsModule {}
