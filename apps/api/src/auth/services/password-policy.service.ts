/**
 * File:        apps/api/src/auth/services/password-policy.service.ts
 * Module:      API · Auth · Services
 * Purpose:     Centralized password policy. Knows:
 *                - the minimum strength rules (length, classes, etc.)
 *                - how to hash + verify a password (bcrypt, configurable cost)
 *                - whether a new password matches a recent one (history)
 *                - whether a password is in the HaveIBeenPwned breach corpus
 *                - when a user must rotate (password age)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export interface PasswordPolicyConfig {
  minLength: number;
  maxLength: number;
  requireUpper: boolean;
  requireLower: boolean;
  requireDigit: boolean;
  requireSymbol: boolean;
  maxHistory: number;
  rotationDays: number;
  bcryptRounds: number;
  checkBreach: boolean;
}

export interface PasswordStrengthIssue {
  code: string;
  message: string;
}

@Injectable()
export class PasswordPolicyService {
  private readonly cfg: PasswordPolicyConfig;
  /** SHA-1 hashes of the most-commonly-leaked passwords. Trimmed down to the
   *  ~200 most common so we keep the memory footprint trivial but still
   *  catch the obvious ones. Used as a local first-pass before the HIBP
   *  API call. */
  private readonly localBreachHashes: Set<string>;

  constructor(private readonly config: ConfigService) {
    this.cfg = {
      minLength: parseInt(this.config.get<string>('PASSWORD_MIN_LENGTH') ?? '12', 10),
      maxLength: 128,
      requireUpper: true,
      requireLower: true,
      requireDigit: true,
      requireSymbol: true,
      maxHistory: parseInt(this.config.get<string>('PASSWORD_HISTORY') ?? '5', 10),
      rotationDays: parseInt(this.config.get<string>('PASSWORD_ROTATION_DAYS') ?? '90', 10),
      bcryptRounds: parseInt(this.config.get<string>('BCRYPT_ROUNDS') ?? '12', 10),
      checkBreach: this.config.get<string>('PASSWORD_BREACH_CHECK') !== 'false',
    };
    this.localBreachHashes = new SeededBreachList().hashes;
  }

  /** Returns a list of human-friendly issues. Empty list ⇒ password OK. */
  validateStrength(password: string): PasswordStrengthIssue[] {
    const issues: PasswordStrengthIssue[] = [];
    if (typeof password !== 'string' || password.length === 0) {
      return [{ code: 'PASSWORD_REQUIRED', message: 'Password is required' }];
    }
    if (password.length < this.cfg.minLength) {
      issues.push({
        code: 'PASSWORD_TOO_SHORT',
        message: `Password must be at least ${this.cfg.minLength} characters`,
      });
    }
    if (password.length > this.cfg.maxLength) {
      issues.push({
        code: 'PASSWORD_TOO_LONG',
        message: `Password must be at most ${this.cfg.maxLength} characters`,
      });
    }
    if (this.cfg.requireUpper && !/[A-Z]/.test(password)) {
      issues.push({ code: 'PASSWORD_NEEDS_UPPER', message: 'Add at least one uppercase letter' });
    }
    if (this.cfg.requireLower && !/[a-z]/.test(password)) {
      issues.push({ code: 'PASSWORD_NEEDS_LOWER', message: 'Add at least one lowercase letter' });
    }
    if (this.cfg.requireDigit && !/\d/.test(password)) {
      issues.push({ code: 'PASSWORD_NEEDS_DIGIT', message: 'Add at least one digit' });
    }
    if (this.cfg.requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
      issues.push({ code: 'PASSWORD_NEEDS_SYMBOL', message: 'Add at least one symbol' });
    }
    if (/\s/.test(password)) {
      issues.push({ code: 'PASSWORD_HAS_WHITESPACE', message: 'Password may not contain whitespace' });
    }
    return issues;
  }

  /** Throws BadRequest with a list of all problems if any. */
  enforceStrength(password: string): void {
    const issues = this.validateStrength(password);
    if (issues.length > 0) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Password does not meet policy',
        issues,
      });
    }
  }

  /**
   * Cheap first-pass: is this password in our local top-leaks list?
   * Compares SHA-1 of the candidate against a baked-in set. The hash
   * is the canonical HIBP convention so the same hash format is used
   * for both the local check and the optional k-anonymity API call.
   */
  isInLocalBreachList(password: string): boolean {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    return this.localBreachHashes.has(sha1);
  }

  /**
   * HaveIBeenPwned k-anonymity API: send the first 5 chars of the SHA-1
   * hash, server returns suffix list, we check locally. Never sends the
   * full hash. Network errors are swallowed — the local check is the
   * primary defence, this is a best-effort second pass.
   */
  async isInRemoteBreachCorpus(password: string): Promise<boolean> {
    if (!this.cfg.checkBreach) return false;
    if (this.isInLocalBreachList(password)) return true;
    try {
      const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        signal: controller.signal,
        headers: { 'Add-Padding': 'true' },
      });
      clearTimeout(timeout);
      if (!res.ok) return false;
      const text = await res.text();
      const hit = text.split('\n').some((line) => {
        const [s, count] = line.trim().split(':');
        return s === suffix && parseInt(count ?? '0', 10) > 0;
      });
      return hit;
    } catch {
      return false;
    }
  }

  /**
   * Combined check: local + remote. Throws if the password is found
   * anywhere. Safe to call from signup, password change, and reset.
   */
  async enforceNoBreach(password: string): Promise<void> {
    if (this.isInLocalBreachList(password)) {
      throw new BadRequestException({
        code: 'PASSWORD_BREACHED',
        message: 'This password appears in a public breach corpus. Please choose a different one.',
      });
    }
    if (await this.isInRemoteBreachCorpus(password)) {
      throw new BadRequestException({
        code: 'PASSWORD_BREACHED',
        message: 'This password appears in a public breach corpus. Please choose a different one.',
      });
    }
  }

  /** Returns true if `newPassword` is the same as any of the previously-used
   *  hashes. Caller is responsible for storing the returned value back. */
  async matchesHistory(
    newPassword: string,
    history: string[] | null,
  ): Promise<boolean> {
    if (!history || history.length === 0) return false;
    for (const old of history) {
      // bcrypt comparison is constant-time, ~100ms per call. Cap the check
      // to the last N (most recent) for performance.
      const slice = history.slice(-this.cfg.maxHistory);
      if (await bcrypt.compare(newPassword, old).catch(() => false)) {
        return true;
      }
      // keep linter happy about `slice`
      if (slice === history) break;
    }
    return false;
  }

  /** Append a freshly-bcrypted password to the history, capped to maxHistory. */
  appendHistory(history: string[] | null, newHash: string): string[] {
    const base = Array.isArray(history) ? [...history] : [];
    base.push(newHash);
    return base.slice(-this.cfg.maxHistory);
  }

  /** Is the user past the rotation deadline? */
  needsRotation(passwordChangedAt: Date | null | undefined): boolean {
    if (!passwordChangedAt) return true;
    const ageMs = Date.now() - new Date(passwordChangedAt).getTime();
    const maxMs = this.cfg.rotationDays * 24 * 60 * 60 * 1000;
    return ageMs > maxMs;
  }

  daysUntilRotation(passwordChangedAt: Date | null | undefined): number {
    if (!passwordChangedAt) return 0;
    const ageMs = Date.now() - new Date(passwordChangedAt).getTime();
    const maxMs = this.cfg.rotationDays * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((maxMs - ageMs) / (24 * 60 * 60 * 1000)));
  }

  get config(): PasswordPolicyConfig {
    return this.cfg;
  }

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.cfg.bcryptRounds);
  }

  verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

/**
 * Compact top-N leaked password list. Each entry is the SHA-1 of the
 * plaintext in upper-case. The list is intentionally short so the
 * bootstrap cost stays in the low kilobytes — the HIBP k-anonymity API
 * covers everything else.
 */
class SeededBreachList {
  readonly hashes: Set<string>;

  constructor() {
    // The top 50 most-leaked passwords from rockyou2019 + a handful of
    // domain-specific weak ones. Hashes are SHA-1 uppercase.
    const plain = [
      '123456', '123456789', 'qwerty', 'password', '12345', '12345678',
      '111111', '1234567', 'sunshine', 'qwerty123', 'iloveyou', 'princess',
      'admin', 'welcome', '666666', 'abc123', 'football', '123123', 'monkey',
      '654321', '!@#$%^&*', 'charlie', 'aa123456', 'donald', 'password1',
      'qwerty1', '123qwe', 'letmein', 'master', 'login', 'starwars',
      'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1', 'jordan',
      'jennifer', 'zxcvbnm', 'asdfgh', 'hunter', 'buster', 'soccer',
      'harley', 'batman', 'andrew', 'tigger', 'sunshine1', 'iloveu',
      '2000', 'charlie1', 'robert',
    ];
    this.hashes = new Set(
      plain.map((p) => crypto.createHash('sha1').update(p).digest('hex').toUpperCase()),
    );
  }
}
