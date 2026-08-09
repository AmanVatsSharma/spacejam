/**
 * File:        apps/api/src/integrations/integrations.module.ts
 * Module:      API · Integrations
 * Purpose:     Platform integration config + providers (SMS router, Razorpay).
 *              Exports IntegrationSettingsService + the SMS_PROVIDER token so
 *              AuthModule can inject the configurable SMS provider.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSetting } from '../typeorm/entities/app-setting.entity';
import { IntegrationSettingsService } from './integration-settings.service';
import { IntegrationSettingsResolver } from './integration-settings.resolver';
import { ConfigurableSmsProvider } from './configurable-sms-provider';
import { RazorpayService } from './razorpay.service';
import { SMS_PROVIDER } from '../auth/services/sms-provider.interface';

@Module({
  imports: [TypeOrmModule.forFeature([AppSetting])],
  providers: [
    IntegrationSettingsService,
    IntegrationSettingsResolver,
    RazorpayService,
    // The configurable router reads the chosen provider from settings and
    // falls back to console logging when nothing is configured.
    { provide: SMS_PROVIDER, useClass: ConfigurableSmsProvider },
  ],
  exports: [IntegrationSettingsService, RazorpayService, SMS_PROVIDER],
})
export class IntegrationsModule {}
