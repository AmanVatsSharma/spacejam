/**
 * File:        apps/api/src/integrations/whatsapp.service.ts
 * Module:      API · Integrations · WhatsApp
 * Purpose:     WhatsApp message delivery routed by IntegrationSettingsService
 *              (Twilio / MSG91). Mirrors ConfigurableSmsProvider's structure,
 *              but never silently console-succeeds: an unconfigured or
 *              console provider throws so the admin "send test message"
 *              surface surfaces real errors.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-27
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IntegrationSettingsService } from './integration-settings.service';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly settings: IntegrationSettingsService) {}

  async send(to: string, message: string): Promise<void> {
    const cfg = await this.settings.getWhatsappConfig();

    if (!cfg.provider || cfg.provider === 'console' || !cfg.apiKey) {
      throw new BadRequestException('WhatsApp is not configured.');
    }

    try {
      if (cfg.provider === 'twilio') {
        await this.sendViaTwilio(to, message, cfg);
      } else if (cfg.provider === 'msg91') {
        await this.sendViaMsg91(to, message, cfg);
      } else {
        throw new BadRequestException(`WhatsApp provider '${cfg.provider}' is not supported.`);
      }
    } catch (err: any) {
      // Don't swallow silently — rethrow so the caller (sendTestWhatsapp /
      // notification flows) reports the real failure.
      this.logger.error(`[WhatsApp] ${cfg.provider} delivery failed for ${to}: ${err?.message}`);
      throw err;
    }
  }

  /** Twilio WhatsApp API. apiKey = `${accountSid}:${authToken}` (same
   *  convention as the SMS provider). To/From use the whatsapp: E.164 prefix. */
  private async sendViaTwilio(
    to: string,
    message: string,
    cfg: { apiKey: string; senderId: string },
  ): Promise<void> {
    const [sid, token] = cfg.apiKey.split(':');
    if (!sid || !token) {
      throw new BadRequestException('Twilio apiKey must be "accountSid:authToken"');
    }
    const from = cfg.senderId || '+15000000000';
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const form = new URLSearchParams();
    form.append('To', `whatsapp:${to}`);
    form.append('From', `whatsapp:${from}`);
    form.append('Body', message);
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Twilio HTTP ${res.status}: ${text}`);
    }
    this.logger.log(`[WhatsApp] Twilio accepted message for ${to}.`);
  }

  /** MSG91 WhatsApp API (v5). Best-effort body shape; authkey header carries
   *  the credential. Errors are wrapped with a clear message. */
  private async sendViaMsg91(
    to: string,
    message: string,
    cfg: { apiKey: string; senderId: string; templateId: string },
  ): Promise<void> {
    const url = 'https://api.msg91.com/api/v5/whatsapp/';
    const body = {
      integrated_number: cfg.senderId || undefined,
      to: to.replace(/\D/g, ''),
      template_id: cfg.templateId || undefined,
      // Best-effort short-template variables for non-template sends.
      variables: { body: message },
      message,
    };
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authkey: cfg.apiKey },
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      throw new Error(`MSG91 WhatsApp request failed: ${err?.message ?? err}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`MSG91 WhatsApp HTTP ${res.status}: ${text}`);
    }
    this.logger.log(`[WhatsApp] MSG91 accepted message for ${to}.`);
  }
}
