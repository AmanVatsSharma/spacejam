/**
 * File:        auth/services/two-factor.service.ts
 * Module:      Api · Auth · Services
 * Purpose:     TOTP-based 2FA: generate secrets, render QR codes, and
 *              verify time-based one-time passwords.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
  private readonly issuer: string;

  constructor(config: ConfigService) {
    this.issuer = config.get<string>('TWO_FACTOR_ISSUER') ?? 'SpaceJam';
    authenticator.options = { window: 1, step: 30 };
  }

  /** Generate a fresh 32-char base32 secret suitable for an authenticator app. */
  generateSecret(): string {
    return authenticator.generateSecret(32);
  }

  /** Render the otpauth:// URI that the authenticator app subscribes to. */
  buildOtpAuthUri(email: string, secret: string): string {
    return authenticator.keyuri(email, this.issuer, secret);
  }

  /** Render the QR code as a data URL so the UI can drop it into an <img>. */
  async buildQrCodeDataUrl(email: string, secret: string): Promise<string> {
    const uri = this.buildOtpAuthUri(email, secret);
    return qrcode.toDataURL(uri, { margin: 1, width: 240 });
  }

  /** Throw on invalid code, return silently on success. */
  verifyCode(secret: string, code: string): void {
    const normalized = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(normalized)) {
      throw new UnauthorizedException('Code must be 6 digits');
    }
    const ok = authenticator.verify({ token: normalized, secret });
    if (!ok) {
      throw new UnauthorizedException('Invalid or expired 2FA code');
    }
  }
}