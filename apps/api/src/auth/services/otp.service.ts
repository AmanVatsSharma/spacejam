/**
 * File:        apps/api/src/auth/services/otp.service.ts
 * Module:      Api · Auth · Services
 * Purpose:     Phone-number OTP login. Handles requestOtp (rate-limited code
 *              generation + delivery) and verifyOtp (single-use code check +
 *              find-or-provision the matching User, then issue tokens).
 *
 *              Resolution order in verifyOtp:
 *                1. existing User by phone
 *                2. CustomerEmployee by phone → provision EMPLOYEE User
 *                3. Customer by phone → provision COMPANY_ADMIN User
 *                4. otherwise → create a fresh MEMBER (walk-in customer)
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Injectable, Logger, UnauthorizedException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
// @ts-ignore
import * as bcrypt from 'bcryptjs';

import { User } from '../../typeorm/entities/user.entity';
import { Customer } from '../../typeorm/entities/customer.entity';
import { CustomerEmployee } from '../../typeorm/entities/customer-employee.entity';
import { OtpRequest } from '../../typeorm/entities/otp-request.entity';
import { UserRole } from '../roles.enum';
import { AuthService, AuthContext } from './auth.service';
import { SMS_PROVIDER } from './sms-provider.interface';
import type { SmsProvider } from './sms-provider.interface';
import { AuthPayload, RequestOtpResult } from '../../graphql/types/user.type';

const CODE_TTL_SECONDS = 5 * 60; // 5-minute OTP expiry
const CODE_TTL_MS = CODE_TTL_SECONDS * 1000;
const MAX_ATTEMPTS = 5; // wrong-code attempts per issued code
const RATE_LIMIT_MAX = 5; // requests per window per phone
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEV_BYPASS_CODE = '000000';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectRepository(OtpRequest)
    private readonly otpRepo: Repository<OtpRequest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CustomerEmployee)
    private readonly employeeRepo: Repository<CustomerEmployee>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
  ) {}

  private get isDevBypass(): boolean {
    return this.configService.get<string>('OTP_DEV_BYPASS') === 'true';
  }

  /**
   * Generate + persist a 6-digit OTP for `phone`, enforcing per-phone rate
   * limiting. In dev bypass mode the code is fixed (000000) and returned to
   * the caller so the client can auto-fill; otherwise the code is delivered
   * out-of-band and `devCode` is null.
   */
  async requestOtp(rawPhone: string): Promise<RequestOtpResult> {
    const phone = this.normalizePhone(rawPhone);

    // Rate limit: count requests for this phone in the last window.
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recent = await this.otpRepo.count({
      where: { phone },
    });
    // Simple in-window approximation: if the recent-count over window is high,
    // refuse. We query createdAt via a queryBuilder for the window filter.
    const inWindow = await this.otpRepo
      .createQueryBuilder('o')
      .where('o.phone = :phone', { phone })
      .andWhere('o."createdAt" > :windowStart', { windowStart })
      .getCount();
    void recent; // kept for observability; inWindow is authoritative
    if (inWindow >= RATE_LIMIT_MAX) {
      throw new UnauthorizedException(
        'Too many OTP requests. Please try again later.',
      );
    }

    const code = this.isDevBypass ? DEV_BYPASS_CODE : this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);

    const otp = this.otpRepo.create({
      phone,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      attempts: 0,
      consumedAt: null,
    });
    await this.otpRepo.save(otp);

    // Deliver via the real channel unless dev bypass is on.
    if (!this.isDevBypass) {
      void this.smsProvider
        .send(phone, code)
        .catch((err) => this.logger.warn(`SMS send failed for ${phone}: ${err}`));
    }

    this.logger.log(`requestOtp: code issued for ${phone} (dev=${this.isDevBypass})`);

    return {
      ok: true,
      expiresInSeconds: CODE_TTL_SECONDS,
      devCode: this.isDevBypass ? code : null,
    };
  }

  /**
   * Verify the OTP and log the user in, provisioning a User if needed.
   * Returns a full AuthPayload (same shape as signin).
   */
  async verifyOtp(rawPhone: string, code: string, ctx: AuthContext = {}): Promise<AuthPayload> {
    const phone = this.normalizePhone(rawPhone);

    // Fetch the most recent unconsumed, unexpired code for this phone.
    const otp = await this.otpRepo
      .createQueryBuilder('o')
      .where('o.phone = :phone', { phone })
      .andWhere('o."consumedAt" IS NULL')
      .andWhere('o."expiresAt" > :now', { now: new Date() })
      .orderBy('o."createdAt"', 'DESC')
      .getOne();

    if (!otp) {
      throw new UnauthorizedException('No valid code. Request a new OTP.');
    }

    // Attempt accounting + brute-force cap.
    await this.otpRepo.increment({ id: otp.id }, 'attempts', 1);
    if (otp.attempts + 1 >= MAX_ATTEMPTS) {
      await this.otpRepo.update({ id: otp.id }, { consumedAt: new Date() });
      throw new UnauthorizedException('Too many incorrect attempts. Request a new OTP.');
    }

    const matches = await bcrypt.compare(code, otp.codeHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid verification code.');
    }

    // Single-use: mark consumed.
    await this.otpRepo.update({ id: otp.id }, { consumedAt: new Date() });

    const user = await this.findOrProvisionUserByPhone(phone);
    if (!user.active) {
      throw new UnauthorizedException('Account is suspended.');
    }

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    this.logger.log(`verifyOtp: login success for ${phone} → user ${user.id} (${user.role})`);
    return this.authService.issueTokensFor(user, ctx);
  }

  /**
   * Resolve a phone to a login User, creating one if the phone matches an
   * onboarded CustomerEmployee (→ EMPLOYEE) or Customer (→ COMPANY_ADMIN),
   * or a fresh MEMBER for walk-ins. Synthetic emails keep the unique-email
   * constraint satisfied.
   */
  async findOrProvisionUserByPhone(phone: string): Promise<User> {
    // 1. Existing User by phone.
    const existing = await this.userRepo.findOne({ where: { phone } });
    if (existing) return existing;

    // 2. CustomerEmployee by phone → provision EMPLOYEE + link.
    const employee = await this.employeeRepo.findOne({
      where: { phone },
      relations: ['customer'],
    });
    if (employee) {
      const user = await this.provisionUser({
        phone,
        role: UserRole.EMPLOYEE,
        name: employee.name,
        email: employee.email,
        centerId: employee.customer?.centerId ?? null,
      });
      employee.userId = user.id;
      employee.status = 'active';
      employee.joinedAt = new Date();
      await this.employeeRepo.save(employee);
      return user;
    }

    // 3. Customer by phone → provision COMPANY_ADMIN + link.
    const customer = await this.customerRepo.findOne({ where: { phone } });
    if (customer) {
      const user = await this.provisionUser({
        phone,
        role: UserRole.COMPANY_ADMIN,
        name: customer.name,
        email: customer.email,
        centerId: customer.centerId ?? null,
      });
      customer.userId = user.id;
      await this.customerRepo.save(customer);
      return user;
    }

    // 4. Walk-in → fresh MEMBER.
    return this.provisionUser({ phone, role: UserRole.MEMBER });
  }

  /** Create a User row with a synthetic email if none/unavailable. */
  private async provisionUser(opts: {
    phone: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
    centerId?: string | null;
  }): Promise<User> {
    const digits = opts.phone.replace(/\D/g, '');
    const email = await this.pickUniqueEmail(opts.email, digits);
    const user = this.userRepo.create({
      phone: opts.phone,
      email,
      name: opts.name ?? `User ${digits.slice(-4)}`,
      role: opts.role,
      active: true,
      emailVerified: false,
      // No password — this account authenticates only via OTP. A random hash
      // satisfies the NOT NULL column and blocks password-login entirely.
      passwordHash: await bcrypt.hash(cryptoRandom(32), 12),
      centerId: opts.centerId ?? null,
    } as any);
    return this.userRepo.save(user) as unknown as Promise<User>;
  }

  /**
   * Prefer the supplied real email; if it collides with an existing user,
   * fall back to a phone-derived synthetic address so provisioning never
   * fails on the unique-email constraint.
   */
  private async pickUniqueEmail(realEmail: string | null | undefined, digits: string): Promise<string> {
    const synthetic = `${digits}@phone.spacejam`;
    if (realEmail && realEmail.trim()) {
      const taken = await this.userRepo.findOne({ where: { email: realEmail } });
      if (!taken) return realEmail.trim();
    }
    return synthetic;
  }

  private normalizePhone(raw: string): string {
    const trimmed = raw.trim();
    // Strip spaces/dashes/parens, keep a single leading +.
    const plus = trimmed.startsWith('+') ? '+' : '';
    const digits = trimmed.replace(/[^\d]/g, '');
    return `${plus}${digits}`;
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

function cryptoRandom(len: number): string {
  // Lightweight random string for the throwaway passwordHash.
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
