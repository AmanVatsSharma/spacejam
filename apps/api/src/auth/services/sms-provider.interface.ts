/**
 * File:        apps/api/src/auth/services/sms-provider.interface.ts
 * Module:      Api · Auth · Services
 * Purpose:     Abstraction over the SMS/OTP delivery channel. The default
 *              implementation (ConsoleSmsProvider) logs the code; swap in a
 *              real provider (MSG91/Twilio/AWS SNS) by providing an
 *              alternative `SMS_PROVIDER` impl in auth.module.ts once keys
 *              are configured.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Injectable, Logger } from '@nestjs/common';

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

export interface SmsProvider {
  /** Deliver `code` to `phone`. Resolve on accepted-for-delivery, reject on hard failure. */
  send(phone: string, code: string): Promise<void>;
}

/** Default no-op provider: logs the code so dev workflows can read it. */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);
  async send(phone: string, code: string): Promise<void> {
    this.logger.log(`[SMS] OTP for ${phone}: ${code} (no provider configured)`);
  }
}
