/**
 * File:        apps/api/src/integrations/configurable-sms-provider.ts
 * Module:      API · Integrations · SMS
 * Purpose:     SMS provider that routes to the configured backend (MSG91 /
 *              Twilio) based on IntegrationSettingsService. Falls back to the
 *              console logger when no provider is configured or dev bypass
 *              is on. Replaces the static ConsoleSmsProvider as the default
 *              SMS_PROVIDER binding.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from '../auth/services/sms-provider.interface';
import { IntegrationSettingsService } from './integration-settings.service';

@Injectable()
export class ConfigurableSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConfigurableSmsProvider.name);

  constructor(private readonly settings: IntegrationSettingsService) {}

  async send(phone: string, code: string): Promise<void> {
    const cfg = await this.settings.getSmsConfig();

    if (!cfg.provider || cfg.provider === 'console' || !cfg.apiKey) {
      this.logger.log(`[SMS] OTP for ${phone}: ${code} (no provider configured)`);
      return;
    }

    try {
      if (cfg.provider === 'msg91') {
        await this.sendViaMsg91(phone, code, cfg);
      } else if (cfg.provider === 'twilio') {
        await this.sendViaTwilio(phone, code, cfg);
      } else {
        this.logger.warn(`[SMS] Unknown provider '${cfg.provider}'; logging code only.`);
        this.logger.log(`[SMS] OTP for ${phone}: ${code}`);
      }
    } catch (err: any) {
      // Don't swallow silently — rethrow so OtpService logs it.
      this.logger.error(`[SMS] ${cfg.provider} delivery failed for ${phone}: ${err?.message}`);
      throw err;
    }
  }

  /** MSG91 transactional SMS API. */
  private async sendViaMsg91(phone: string, code: string, cfg: { apiKey: string; senderId: string; templateId: string }): Promise<void> {
    const url = 'https://api.msg91.com/api/v5/flow/';
    const body = {
      template_id: cfg.templateId || undefined,
      sender: cfg.senderId || 'SPACEJ',
      mobiles: phone.replace(/\D/g, ''),
      var1: code, // template variable: the OTP
      auth: cfg.apiKey,
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authkey: cfg.apiKey },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`MSG91 HTTP ${res.status}: ${text}`);
    }
    this.logger.log(`[SMS] MSG91 accepted OTP for ${phone}.`);
  }

  /** Twilio Programmable SMS API. apiKey = `${accountSid}:${authToken}`. */
  private async sendViaTwilio(phone: string, code: string, cfg: { apiKey: string; senderId: string }): Promise<void> {
    const [sid, token] = cfg.apiKey.split(':');
    if (!sid || !token) throw new Error('Twilio apiKey must be "accountSid:authToken"');
    const from = cfg.senderId || '+15000000000';
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const form = new URLSearchParams();
    form.append('To', phone);
    form.append('From', from);
    form.append('Body', `Your SpaceJam verification code is ${code}`);
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Twilio HTTP ${res.status}: ${text}`);
    }
    this.logger.log(`[SMS] Twilio accepted OTP for ${phone}.`);
  }
}
