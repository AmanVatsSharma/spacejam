/**
 * File:        apps/api/src/integrations/integration-settings.service.ts
 * Module:      API · Integrations
 * Purpose:     Read/write platform-level integration config (SMS provider,
 *              Razorpay) from the app_settings table. Exposes typed getters
 *              used by the SMS provider router and the payment service.
 *              Secrets are masked before being returned to clients.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from '../typeorm/entities/app-setting.entity';

/** Mask: show last 4 chars only. */
function mask(value: string): string {
  if (!value) return '';
  if (value.length <= 4) return '••••';
  return '••••' + value.slice(-4);
}

export interface SmsConfig {
  provider: 'console' | 'msg91' | 'twilio' | '';
  /** MSG91 auth key, Twilio account sid, etc. */
  apiKey: string;
  /** Twilio: from number / MSG91: sender id. */
  senderId: string;
  /** MSG91 template id (optional). */
  templateId: string;
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  /** Live or Test mode. */
  mode: 'test' | 'live' | '';
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export interface WhatsappConfig {
  provider: 'console' | 'msg91' | 'twilio' | '';
  apiKey: string;
  senderId: string;
  templateId: string;
}

@Injectable()
export class IntegrationSettingsService {
  private readonly logger = new Logger(IntegrationSettingsService.name);
  // In-process cache so we don't hit the DB on every OTP send.
  private cache = new Map<string, string>();
  private cacheLoaded = false;

  constructor(
    @InjectRepository(AppSetting)
    private readonly repo: Repository<AppSetting>,
  ) {}

  /** Load all settings into the in-process cache (called once on boot). */
  async warmCache(): Promise<void> {
    if (this.cacheLoaded) return;
    const rows = await this.repo.find();
    for (const r of rows) this.cache.set(r.key, r.value);
    this.cacheLoaded = true;
    this.logger.log(`Loaded ${rows.length} integration setting(s) into cache.`);
  }

  private async getRaw(key: string): Promise<string | null> {
    if (!this.cacheLoaded) await this.warmCache();
    return this.cache.get(key) ?? null;
  }

  /** SMS config (provider routing for OTP). */
  async getSmsConfig(): Promise<SmsConfig> {
    return {
      provider: (await this.getRaw('sms.provider')) as SmsConfig['provider'] ?? '',
      apiKey: (await this.getRaw('sms.apiKey')) ?? '',
      senderId: (await this.getRaw('sms.senderId')) ?? '',
      templateId: (await this.getRaw('sms.templateId')) ?? '',
    };
  }

  /** Razorpay payment config. */
  async getRazorpayConfig(): Promise<RazorpayConfig> {
    return {
      keyId: (await this.getRaw('razorpay.keyId')) ?? '',
      keySecret: (await this.getRaw('razorpay.keySecret')) ?? '',
      webhookSecret: (await this.getRaw('razorpay.webhookSecret')) ?? '',
      mode: (await this.getRaw('razorpay.mode')) as RazorpayConfig['mode'] ?? '',
    };
  }

  /** Is a real (non-console) SMS provider configured? */
  async isSmsConfigured(): Promise<boolean> {
    const c = await this.getSmsConfig();
    return c.provider !== 'console' && c.provider !== '' && !!c.apiKey;
  }

  /** Is Razorpay configured? */
  async isRazorpayConfigured(): Promise<boolean> {
    const c = await this.getRazorpayConfig();
    return !!c.keyId && !!c.keySecret;
  }

  /** SMTP email config (app_settings keys email.*). Port defaults to 587. */
  async getEmailConfig(): Promise<EmailConfig> {
    const port = parseInt((await this.getRaw('email.port')) ?? '', 10);
    return {
      host: (await this.getRaw('email.host')) ?? '',
      port: Number.isFinite(port) && port > 0 ? port : 587,
      secure: (await this.getRaw('email.secure')) === 'true',
      user: (await this.getRaw('email.user')) ?? '',
      password: (await this.getRaw('email.password')) ?? '',
      from: (await this.getRaw('email.from')) ?? '',
    };
  }

  /** WhatsApp config (app_settings keys whatsapp.*). */
  async getWhatsappConfig(): Promise<WhatsappConfig> {
    return {
      provider: (await this.getRaw('whatsapp.provider')) as WhatsappConfig['provider'] ?? '',
      apiKey: (await this.getRaw('whatsapp.apiKey')) ?? '',
      senderId: (await this.getRaw('whatsapp.senderId')) ?? '',
      templateId: (await this.getRaw('whatsapp.templateId')) ?? '',
    };
  }

  /** Is a real SMTP account configured (host + user + password present)? */
  async isEmailConfigured(): Promise<boolean> {
    const c = await this.getEmailConfig();
    return !!c.host && !!c.user && !!c.password;
  }

  /** Is a real (non-console) WhatsApp provider configured? */
  async isWhatsappConfigured(): Promise<boolean> {
    const c = await this.getWhatsappConfig();
    return c.provider !== 'console' && c.provider !== '' && !!c.apiKey;
  }

  /**
   * Persist a batch of settings (group + key/value pairs) for the super-admin
   * resolver. Secrets are flagged so reads mask them. Updates the cache.
   */
  async setMany(
    group: string,
    entries: { key: string; value: string; secret?: boolean }[],
  ): Promise<void> {
    for (const e of entries) {
      const existing = await this.repo.findOne({ where: { key: e.key } });
      if (existing) {
        existing.value = e.value;
        existing.secret = !!e.secret;
        await this.repo.save(existing);
      } else {
        await this.repo.save(
          this.repo.create({ group, key: e.key, value: e.value, secret: !!e.secret }),
        );
      }
      this.cache.set(e.key, e.value);
    }
    this.logger.log(`Persisted ${entries.length} setting(s) in group '${group}'.`);
  }

  /** Return all settings in a group, masking secrets. For the admin UI. */
  async readGroup(group: string): Promise<{ key: string; value: string; secret: boolean }[]> {
    const rows = await this.repo.find({ where: { group }, order: { key: 'ASC' } });
    return rows.map((r) => ({ key: r.key, value: r.secret ? mask(r.value) : r.value, secret: r.secret }));
  }
}
