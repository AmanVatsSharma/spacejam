/**
 * File:        auth/services/email.service.ts
 * Module:      Api · Auth · Services
 * Purpose:     Send transactional emails (password reset, verify-email, 2FA)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP_HOST not configured — emails will be logged to console only');
      return;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(this.config.get<string>('SMTP_PORT') ?? '587', 10),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASSWORD'),
      },
    });
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

  private async send(to: string, subject: string, text: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[email:dev] to=${to} subject="${subject}" body=${text}`);
      return;
    }
    const from = this.config.get<string>('EMAIL_FROM') ?? 'no-reply@spacejam.app';
    await this.transporter.sendMail({ from, to, subject, text, html });
  }
}