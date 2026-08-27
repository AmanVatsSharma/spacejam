/**
 * File:        auth/services/email.service.ts
 * Module:      Api · Auth · Services
 * Purpose:     Send transactional emails (password reset, verify-email, 2FA).
 *              Transporter is resolved at runtime: app_settings email.*
 *              (Integrations page) takes priority, then the SMTP_* env vars,
 *              then a console-only fallback. The transporter is cached and
 *              rebuilt only when the underlying config signature changes.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-27
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IntegrationSettingsService } from '../../integrations/integration-settings.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /** Transporter built from the env SMTP_* vars (legacy path). */
  private readonly envTransporter: nodemailer.Transporter | null;
  /** Transporter built from app_settings; rebuilt when the config changes. */
  private settingsTransporter: nodemailer.Transporter | null = null;
  private settingsSignature: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly settings: IntegrationSettingsService,
  ) {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP_HOST not configured — emails will be logged to console only');
      this.envTransporter = null;
      return;
    }
    this.envTransporter = nodemailer.createTransport({
      host,
      port: parseInt(this.config.get<string>('SMTP_PORT') ?? '587', 10),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  /**
   * Resolve the active transporter. Priority: app_settings email.* config →
   * env SMTP_* config → null (console fallback). The settings-based
   * transporter is cached and only rebuilt when its config signature
   * (host/port/secure/user/password) changes, so saving a new config in the
   * Integrations page takes effect immediately without a restart.
   */
  async getTransporter(): Promise<nodemailer.Transporter | null> {
    try {
      const cfg = await this.settings.getEmailConfig();
      if (cfg.host && cfg.user && cfg.password) {
        const signature = JSON.stringify([cfg.host, cfg.port, cfg.secure, cfg.user, cfg.password]);
        if (!this.settingsTransporter || this.settingsSignature !== signature) {
          this.settingsTransporter = nodemailer.createTransport({
            host: cfg.host,
            port: cfg.port,
            secure: cfg.secure,
            auth: { user: cfg.user, pass: cfg.password },
          });
          this.settingsSignature = signature;
          this.logger.log(`Using app_settings SMTP config (${cfg.host}:${cfg.port}).`);
        }
        return this.settingsTransporter;
      }
    } catch (err: any) {
      // Settings store unreachable — fall through to the env config rather
      // than failing every send.
      this.logger.warn(`Could not read email settings (${err?.message}); falling back to SMTP_* env config.`);
    }
    return this.envTransporter;
  }

  /** True when a real transporter is available (used by flows that degrade
   *  gracefully instead of console-logging, e.g. deposit reminders). */
  async isConfigured(): Promise<boolean> {
    return (await this.getTransporter()) !== null;
  }

  /** From-address priority: app_settings email.from → EMAIL_FROM env → default. */
  private async resolveFrom(): Promise<string> {
    try {
      const cfg = await this.settings.getEmailConfig();
      if (cfg.from) return cfg.from;
    } catch {
      // ignore — fall through to env/default
    }
    return this.config.get<string>('EMAIL_FROM') ?? 'no-reply@spacejam.app';
  }

  /** Short test email used by the Integrations page "send test email" button.
   *  Throws a clear BadRequest when no transporter is configured so the admin
   *  UI surfaces the real problem instead of a silent console send. */
  async sendTest(to: string): Promise<void> {
    const transporter = await this.getTransporter();
    if (!transporter) {
      throw new BadRequestException(
        'Email is not configured. Save SMTP settings on the Integrations page (or set SMTP_* env vars) first.',
      );
    }
    const subject = 'SpaceJam test email';
    const text = 'This is a test email from your SpaceJam integrations settings. If you can read this, SMTP is configured correctly.';
    await transporter.sendMail({ from: await this.resolveFrom(), to, subject, text, html: `<p>${text}</p>` });
  }

  async sendPasswordReset(args: { to: string; resetUrl: string; ttlMinutes: number }): Promise<void> {
    const subject = 'Reset your SpaceJam password';
    const text =
      `We received a request to reset your password.\n\n` +
      `Click the link below within the next ${args.ttlMinutes} minutes to set a new password:\n${args.resetUrl}\n\n` +
      `If you didn't request this, you can safely ignore this email.`;
    const html = `
      <p>We received a request to reset your password.</p>
      <p><a href="${args.resetUrl}">Reset your password</a></p>
      <p>This link expires in ${args.ttlMinutes} minutes. If you didn't request this, you can safely ignore this email.</p>
    `;
    return this.send(args.to, subject, text, html);
  }

  async sendEmailVerification(args: { to: string; name: string; verifyUrl: string }): Promise<void> {
    return this.sendVerification({
      to: args.to,
      verifyUrl: args.verifyUrl,
      ttlMinutes: 24 * 60,
    });
  }

  async sendVerification(args: { to: string; verifyUrl: string; ttlMinutes: number }): Promise<void> {
    const subject = 'Verify your SpaceJam email';
    const text =
      `Welcome to SpaceJam! Please verify your email address by visiting:\n${args.verifyUrl}\n\n` +
      `This link expires in ${args.ttlMinutes} minutes.`;
    const html = `
      <p>Welcome to SpaceJam! Please verify your email address.</p>
      <p><a href="${args.verifyUrl}">Verify your email</a></p>
      <p>This link expires in ${args.ttlMinutes} minutes.</p>
    `;
    return this.send(args.to, subject, text, html);
  }

  /**
   * Send a "new device signed in to your account" alert. Logged in dev mode
   * (when no SMTP is configured) so a developer can confirm the path was
   * actually exercised.
   */
  async sendLoginAlert(args: {
    to: string;
    ipAddress?: string;
    userAgent?: string;
    occurredAt: Date;
  }): Promise<void> {
    const subject = 'New sign-in to your SpaceJam account';
    const ua = args.userAgent ?? 'unknown device';
    const ip = args.ipAddress ?? 'unknown location';
    const when = args.occurredAt.toISOString();
    const text =
      `A new sign-in to your SpaceJam account just happened.\n\n` +
      `When: ${when}\nIP: ${ip}\nDevice: ${ua}\n\n` +
      `If this was not you, please reset your password immediately.`;
    const html = `
      <p>A new sign-in to your SpaceJam account just happened.</p>
      <ul>
        <li><strong>When:</strong> ${when}</li>
        <li><strong>IP:</strong> ${ip}</li>
        <li><strong>Device:</strong> ${ua}</li>
      </ul>
      <p>If this was not you, please reset your password immediately.</p>
    `;
    return this.send(args.to, subject, text, html);
  }

  /** Magic-link sign-in email. The link contains the raw token, which the
   *  backend hashes and stores. Never log or persist the raw link. */
  async sendMagicLink(args: { to: string; link: string; ttlMinutes: number }): Promise<void> {
    const subject = 'Your SpaceJam sign-in link';
    const text =
      `Click the link below to sign in to your SpaceJam account. ` +
      `It expires in ${args.ttlMinutes} minutes and can only be used once.\n\n${args.link}\n\n` +
      `If you didn't request this, you can safely ignore this email.`;
    const html = `
      <p>Click the link below to sign in to your SpaceJam account.</p>
      <p><a href="${args.link}">Sign in to SpaceJam</a></p>
      <p>This link expires in ${args.ttlMinutes} minutes and can only be used once.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;
    return this.send(args.to, subject, text, html);
  }

  /** Employee invitation — sent when an admin adds a team member to a
   *  customer's roster. Tells the employee to log in via phone OTP. */
  async sendEmployeeInvite(args: { to: string; employeeName: string; companyName: string }): Promise<void> {
    const subject = `You've been added to ${args.companyName} on SpaceJam`;
    const text =
      `Hi ${args.employeeName},\n\n` +
      `${args.companyName} has added you to their SpaceJam coworking account. ` +
      `You can now book seats and meeting rooms from the SpaceJam mobile app.\n\n` +
      `Download the app and sign in with your phone number (${args.to}) to get started.\n\n` +
      `Welcome aboard!`;
    const html = `
      <p>Hi ${args.employeeName},</p>
      <p><strong>${args.companyName}</strong> has added you to their SpaceJam coworking account.
      You can now book seats and meeting rooms from the SpaceJam mobile app.</p>
      <p>Download the app and sign in with your phone number (<strong>${args.to}</strong>) to get started.</p>
      <p>Welcome aboard!</p>
    `;
    return this.send(args.to, subject, text, html);
  }

  /** Generic short message send used by deposit-reminder flows. Degrades to a
   *  console log when no transporter is configured (never throws). */
  async sendPlain(args: { to: string; subject: string; text: string; html?: string }): Promise<void> {
    return this.send(args.to, args.subject, args.text, args.html ?? `<p>${args.text}</p>`);
  }

  private async send(to: string, subject: string, text: string, html: string) {
    const transporter = await this.getTransporter();
    if (!transporter) {
      this.logger.log(`[email:dev] to=${to} subject="${subject}" body=${text}`);
      return;
    }
    const from = await this.resolveFrom();
    await transporter.sendMail({ from, to, subject, text, html });
  }
}
