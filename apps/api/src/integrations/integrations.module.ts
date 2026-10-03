/**
 * File:        apps/api/src/integrations/integrations.module.ts
 * Module:      API · Integrations
 * Purpose:     Platform integration config + providers (SMS router, Razorpay,
 *              WhatsApp, payments webhook, payment-orders ledger). Exports
 *              IntegrationSettingsService + the SMS_PROVIDER token so
 *              AuthModule can inject the configurable SMS provider, and
 *              PaymentOrdersService so feature modules (CRM onboarding) can
 *              create gateway orders and register their settlement finalizer.
 *
 * Author:      ZCode (original) · Claude Sonnet 5.5 (payment ledger)
 * Last-updated: 2026-10-02
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSetting } from '../typeorm/entities/app-setting.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { PaymentOrder } from '../typeorm/entities/payment-order.entity';
import { AuditModule } from '../auth/audit.module';
import { PaymentOrdersService } from './payment-orders.service';
import { IntegrationSettingsService } from './integration-settings.service';
import { IntegrationSettingsResolver } from './integration-settings.resolver';
import { PaymentResolver } from './payment.resolver';
import { ConfigurableSmsProvider } from './configurable-sms-provider';
import { RazorpayService } from './razorpay.service';
import { WhatsAppService } from './whatsapp.service';
import { PaymentsWebhookController } from './payments-webhook.controller';
import { SMS_PROVIDER } from '../auth/services/sms-provider.interface';

@Module({
  // AuditModule is TypeORM-only (no auth dependency), so importing it here
  // does not create a cycle with AuthModule (which imports this module).
  imports: [TypeOrmModule.forFeature([AppSetting, Invoice, PaymentOrder]), AuditModule],
  controllers: [PaymentsWebhookController],
  providers: [
    IntegrationSettingsService,
    IntegrationSettingsResolver,
    PaymentResolver,
    RazorpayService,
    PaymentOrdersService,
    WhatsAppService,
    // The configurable router reads the chosen provider from settings and
    // falls back to console logging when nothing is configured.
    { provide: SMS_PROVIDER, useClass: ConfigurableSmsProvider },
  ],
  exports: [
    IntegrationSettingsService,
    RazorpayService,
    PaymentOrdersService,
    WhatsAppService,
    SMS_PROVIDER,
  ],
})
export class IntegrationsModule {}
