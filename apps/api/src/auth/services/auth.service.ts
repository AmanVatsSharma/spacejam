/**
 * File:        auth/services/auth.service.ts
 * Module:      Api · Auth · Services
 * Purpose:     Authentication flows — signin, signup, refresh, 2FA,
 *              password reset, magic-link. Delegates:
 *                - brute-force protection  → LockoutService
 *                - password policy         → PasswordPolicyService
 *                - audit logging           → AuditService
 *                - 2FA + recovery codes    → TwoFactorService + RecoveryCodeRepository
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { User } from '../../typeorm/entities/user.entity';
import { UserSession } from '../../typeorm/entities/user-session.entity';
import { UserRole } from '../roles.enum';
import {
  ChallengeTokenPayload,
  JwtPayload,
  RefreshTokenPayload,
} from '../types/jwt-payload.type';
import { AuthPayload } from '../types/auth-payload.type';

import { EmailService } from './email.service';
import { TwoFactorService } from './two-factor.service';
import { LockoutService } from './lockout.service';
import { PasswordPolicyService } from './password-policy.service';
import { AuditService } from './audit.service';
import { RecoveryCodeRepository } from '../../typeorm/repositories/recovery-code.repository';
import { MagicLinkToken } from '../../typeorm/entities/magic-link-token.entity';

import { SigninInput } from '../dto/signin.input';
import { SignupInput } from '../dto/signup.input';
import { ResetPasswordInput } from '../dto/reset-password.input';
import { EnableTwoFactorInput } from '../dto/enable-two-factor.input';
import { VerifyTwoFactorInput } from '../dto/verify-two-factor.input';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DEFAULT = '7d';
const REFRESH_TOKEN_TTL_REMEMBER = '30d';
const CHALLENGE_TOKEN_TTL = '5m';
const RESET_TOKEN_TTL_MINUTES = 30;
const MAGIC_LINK_TTL_MINUTES = 15;
const EMAIL_VERIFY_TTL_MINUTES = 24 * 60;

export interface AuthContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserSession) private readonly sessionRepo: Repository<UserSession>,
    @InjectRepository(MagicLinkToken) private readonly magicLinkRepo: Repository<MagicLinkToken>,
    private readonly recoveryCodes: RecoveryCodeRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly twoFactorService: TwoFactorService,
    private readonly lockout: LockoutService,
    private readonly passwordPolicy: PasswordPolicyService,
    private readonly audit: AuditService,
  ) {}

  async signup(input: SignupInput, ctx: AuthContext = {}): Promise<AuthPayload> {
    const email = input.email.toLowerCase().trim();

    this.passwordPolicy.enforceStrength(input.password);
    await this.passwordPolicy.enforceNoBreach(input.password);

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      await this.audit.record({
        action: 'AUTH_SIGNUP',
        userId: existing.id,
        ipAddress: ctx.ipAddress ?? undefined,
        userAgent: ctx.userAgent ?? undefined,
        success: false,
        metadata: { reason: 'duplicate', email },
      });
      throw new ConflictException('An account with that email already exists');
    }

    const passwordHash = await this.passwordPolicy.hash(input.password);
    const user = this.userRepo.create({
      email,
      name: input.name ?? null,
      passwordHash,
      role: UserRole.MEMBER,
      isActive: true,
      emailVerified: false,
      passwordChangedAt: new Date(),
      passwordHistory: [passwordHash],
    });
    const saved = await this.userRepo.save(user);
    this.logger.log(`signup: new user ${saved.id} (${saved.email})`);

    await this.audit.record({
      action: 'AUTH_SIGNUP',
      userId: saved.id,
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
      success: true,
    });

    void this.emailService
      .sendVerification({
        to: saved.email,
        verifyUrl: this.buildEmailVerifyUrl(saved.id),
        ttlMinutes: EMAIL_VERIFY_TTL_MINUTES,
      })
      .catch((err) => this.logger.warn(`welcome email failed: ${err}`));

    return this.issueTokensFor(saved, ctx, false);
  }

  async signin(input: SigninInput, ctx: AuthContext = {}): Promise<AuthPayload> {
    const email = input.email.toLowerCase().trim();

    await this.lockout.enforceIpLimit(ctx.ipAddress ?? undefined);

    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .addSelect('u.twoFactorSecret')
      .addSelect('u.failedLoginCount')
      .addSelect('u.lockoutUntil')
      .where('u.email = :email', { email })
      .getOne();

    await this.lockout.assertNotLocked(user, email);

    if (!user || !user.isActive) {
      await bcrypt.compare(input.password, '$2b$12$invalidsaltinvalidsaltinO9G2cZ1Vkyf5R0UVq9X0jZ9Rk');
      await this.lockout.recordFailure(user ?? null);
      await this.audit.record({
        action: 'AUTH_SIGNIN_FAIL',
        userId: user?.id ?? null,
        ipAddress: ctx.ipAddress ?? undefined,
        userAgent: ctx.userAgent ?? undefined,
        success: false,
        metadata: { reason: user ? 'inactive' : 'unknown_email' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordOk) {
      const failCount = await this.lockout.recordFailure(user);
      await this.audit.record({
        action: 'AUTH_SIGNIN_FAIL',
        userId: user.id,
        ipAddress: ctx.ipAddress ?? undefined,
        userAgent: ctx.userAgent ?? undefined,
        success: false,
        metadata: { reason: 'bad_password', failCount },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      let codeOk = false;
      try {
        if (input.twoFactorCode) {
          this.twoFactorService.verifyCode(user.twoFactorSecret!, input.twoFactorCode);
          codeOk = true;
        }
      } catch {
        codeOk = false;
      }
      if (!codeOk) {
        await this.audit.record({
          action: 'AUTH_2FA_VERIFY_FAIL',
          userId: user.id,
          ipAddress: ctx.ipAddress ?? undefined,
          userAgent: ctx.userAgent ?? undefined,
          success: false,
        });
        return {
          user,
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: new Date(),
          refreshTokenExpiresAt: new Date(),
          twoFactorRequired: true,
          challengeToken: await this.signChallengeToken(user),
        };
      }
    }

    await this.lockout.recordSuccess(user);
    user.lastLogin = new Date();
    await this.userRepo.update(user.id, { lastLogin: user.lastLogin });

    await this.audit.record({
      action: 'AUTH_SIGNIN_SUCCESS',
      userId: user.id,
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
      success: true,
    });

    void this.maybeSendLoginAlert(user, ctx);
    return this.issueTokensFor(user, ctx, !!input.rememberMe);
  }

  async refreshTokens(refreshToken: string, ctx: AuthContext = {}): Promise<AuthPayload> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret:
          this.configService.get<string>('REFRESH_TOKEN_SECRET') ??
          this.configService.get<string>('JWT_SECRET') ??
          'dev-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.typ !== 'refresh' || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.sid) {
      const session = await this.sessionRepo.findOne({ where: { id: payload.sid } });
      if (!session || !session.isActive) {
        throw new UnauthorizedException('Session has been revoked');
      }
    }
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active');
    }
    if (payload.sid) {
      await this.sessionRepo.update(payload.sid, { isActive: false });
    }
    return this.issueTokensFor(user, ctx, true);
  }

  async logout(userId: string, sessionId?: string): Promise<boolean> {
    if (sessionId) {
      await this.sessionRepo.update(sessionId, { isActive: false });
    } else {
      await this.sessionRepo.update({ userId, isActive: true }, { isActive: false });
    }
    await this.audit.record({
      action: 'AUTH_SIGNOUT',
      userId,
      metadata: { sessionId: sessionId ?? '*' },
    });
    return true;
  }

  async requestPasswordReset(email: string, ctx: AuthContext = {}): Promise<boolean> {
    const normalized = email.toLowerCase().trim();
    const user = await this.userRepo.findOne({ where: { email: normalized } });
    if (!user) {
      await bcrypt.compare(
        'x',
        '$2b$12$invalidsaltinvalidsaltinO9G2cZ1Vkyf5R0UVq9X0jZ9Rk',
      );
      return true;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);
    user.passwordResetToken = await bcrypt.hash(token, 10);
    user.passwordResetExpiresAt = expires;
    await this.userRepo.save(user);
    await this.emailService.sendPasswordReset({
      to: user.email,
      resetUrl: this.buildResetUrl(token, user.id),
      ttlMinutes: RESET_TOKEN_TTL_MINUTES,
    });
    await this.audit.record({
      action: 'AUTH_PASSWORD_RESET_REQUEST',
      userId: user.id,
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
      success: true,
    });
    return true;
  }

  async resetPassword(input: ResetPasswordInput, ctx: AuthContext = {}): Promise<boolean> {
    const [userId, rawToken] = this.splitResetToken(input.token);
    if (!userId || !rawToken) {
      throw new BadRequestException('Invalid reset token');
    }
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.passwordResetToken || !user.passwordResetExpiresAt) {
      throw new BadRequestException('Invalid reset token');
    }
    if (user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset link has expired');
    }
    const matches = await bcrypt.compare(rawToken, user.passwordResetToken);
    if (!matches) {
      throw new BadRequestException('Invalid reset token');
    }

    this.passwordPolicy.enforceStrength(input.newPassword);
    await this.passwordPolicy.enforceNoBreach(input.newPassword);
    if (await this.passwordPolicy.matchesHistory(input.newPassword, user.passwordHistory)) {
      throw new BadRequestException({
        code: 'PASSWORD_RECENTLY_USED',
        message: 'You have used this password recently. Please choose a different one.',
      });
    }
    const newHash = await this.passwordPolicy.hash(input.newPassword);
    user.passwordHash = newHash;
    user.passwordChangedAt = new Date();
    user.passwordHistory = this.passwordPolicy.appendHistory(user.passwordHistory, newHash);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    user.failedLoginCount = 0;
    user.lockoutUntil = null;
    await this.userRepo.save(user);

    await this.sessionRepo.update({ userId: user.id, isActive: true }, { isActive: false });

    await this.audit.record({
      action: 'AUTH_PASSWORD_RESET_SUCCESS',
      userId: user.id,
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
      success: true,
    });
    return true;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ctx: AuthContext = {},
  ): Promise<boolean> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .addSelect('u.passwordHistory')
      .where('u.id = :id', { id: userId })
      .getOne();
    if (!user) throw new BadRequestException('User not found');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    this.passwordPolicy.enforceStrength(newPassword);
    await this.passwordPolicy.enforceNoBreach(newPassword);
    if (await this.passwordPolicy.matchesHistory(newPassword, user.passwordHistory)) {
      throw new BadRequestException({
        code: 'PASSWORD_RECENTLY_USED',
        message: 'You have used this password recently. Please choose a different one.',
      });
    }
    const newHash = await this.passwordPolicy.hash(newPassword);
    user.passwordHash = newHash;
    user.passwordChangedAt = new Date();
    user.passwordHistory = this.passwordPolicy.appendHistory(user.passwordHistory, newHash);
    await this.userRepo.save(user);

    await this.audit.record({
      action: 'AUTH_PASSWORD_CHANGE',
      userId,
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
      success: true,
    });
    return true;
  }

  async beginTwoFactorSetup(
    userId: string,
  ): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.twoFactorSecret')
      .where('u.id = :id', { id: userId })
      .getOne();
    if (!user) throw new BadRequestException('User not found');
    const secret = this.twoFactorService.generateSecret();
    const otpauthUrl = this.twoFactorService.buildOtpAuthUri(user.email, secret);
    const qrDataUrl = await this.twoFactorService.buildQrCodeDataUrl(user.email, secret);
    user.twoFactorSecret = secret;
    await this.userRepo.save(user);
    return { secret, otpauthUrl, qrDataUrl };
  }

  async confirmTwoFactorSetup(
    userId: string,
    input: EnableTwoFactorInput,
    ctx: AuthContext = {},
  ): Promise<string[]> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.twoFactorSecret')
      .where('u.id = :id', { id: userId })
      .getOne();
    if (!user?.twoFactorSecret) {
      throw new BadRequestException('No pending 2FA setup found');
    }
    try {
      this.twoFactorService.verifyCode(user.twoFactorSecret, input.code);
    } catch (err) {
      await this.audit.record({
        action: 'AUTH_2FA_VERIFY_FAIL',
        userId,
        ipAddress: ctx.ipAddress ?? undefined,
        success: false,
        metadata: { stage: 'enable' },
      });
      throw err;
    }
    const plain = this.twoFactorService.generateRecoveryCodes(10);
    const hashes = plain.map((c) => this.twoFactorService.hashRecoveryCode(c));
    user.twoFactorEnabled = true;
    await this.userRepo.save(user);
    await this.recoveryCodes.deleteAllForUser(user.id);
    await this.recoveryCodes.bulkInsert(user.id, hashes);

    await this.audit.record({
      action: 'AUTH_2FA_ENABLE',
      userId,
      ipAddress: ctx.ipAddress ?? undefined,
      success: true,
    });
    return plain;
  }

  async verifyTwoFactor(input: VerifyTwoFactorInput, ctx: AuthContext = {}): Promise<AuthPayload> {
    let challenge: ChallengeTokenPayload;
    try {
      challenge = await this.jwtService.verifyAsync<ChallengeTokenPayload>(input.challengeToken, {
        secret:
          this.configService.get<string>('CHALLENGE_TOKEN_SECRET') ?? 'dev-challenge-secret',
      });
    } catch {
      throw new UnauthorizedException('Challenge token is invalid or expired');
    }
    if (challenge.kind !== 'two-factor-challenge' || !challenge.sub) {
      throw new UnauthorizedException('Invalid challenge token');
    }
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.twoFactorSecret')
      .where('u.id = :id', { id: challenge.sub })
      .getOne();
    if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
      throw new UnauthorizedException('Two-factor not enabled for this account');
    }

    let verified = false;
    try {
      this.twoFactorService.verifyCode(user.twoFactorSecret, input.code);
      verified = true;
    } catch {
      const hash = this.twoFactorService.hashRecoveryCode(input.code);
      const row = await this.recoveryCodes.findUnused(user.id, hash);
      if (row) {
        const consumed = await this.recoveryCodes.consume(row.id);
        if (consumed === 1) {
          verified = true;
          await this.audit.record({
            action: 'AUTH_RECOVERY_CODE_USED',
            userId: user.id,
            ipAddress: ctx.ipAddress ?? undefined,
            success: true,
          });
        }
      }
    }
    if (!verified) {
      await this.audit.record({
        action: 'AUTH_2FA_VERIFY_FAIL',
        userId: user.id,
        ipAddress: ctx.ipAddress ?? undefined,
        success: false,
        metadata: { stage: 'verify' },
      });
      throw new UnauthorizedException('Invalid authenticator or recovery code');
    }

    user.lastLogin = new Date();
    await this.userRepo.update(user.id, { lastLogin: user.lastLogin });
    return this.issueTokensFor(user, ctx, false);
  }

  async disableTwoFactor(userId: string, code: string, ctx: AuthContext = {}): Promise<boolean> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.twoFactorSecret')
      .where('u.id = :id', { id: userId })
      .getOne();
    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Two-factor not enabled');
    }
    try {
      this.twoFactorService.verifyCode(user.twoFactorSecret, code);
    } catch (err) {
      await this.audit.record({
        action: 'AUTH_2FA_VERIFY_FAIL',
        userId,
        ipAddress: ctx.ipAddress ?? undefined,
        success: false,
        metadata: { stage: 'disable' },
      });
      throw err;
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await this.userRepo.save(user);
    await this.recoveryCodes.deleteAllForUser(user.id);
    await this.audit.record({
      action: 'AUTH_2FA_DISABLE',
      userId,
      ipAddress: ctx.ipAddress ?? undefined,
      success: true,
    });
    return true;
  }

  async recoveryCodesRemaining(userId: string): Promise<number> {
    return this.recoveryCodes.countUnused(userId);
  }

  async requestMagicLink(email: string, ctx: AuthContext = {}): Promise<boolean> {
    const normalized = email.toLowerCase().trim();
    const user = await this.userRepo.findOne({ where: { email: normalized } });
    if (!user) {
      await bcrypt.compare('x', '$2b$12$invalidsaltinvalidsaltinO9G2cZ1Vkyf5R0UVq9X0jZ9Rk');
      return true;
    }
    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    await this.magicLinkRepo.save(
      this.magicLinkRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60_000),
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
      }),
    );
    await this.emailService.sendMagicLink({
      to: user.email,
      link: this.buildMagicLinkUrl(raw),
      ttlMinutes: MAGIC_LINK_TTL_MINUTES,
    });
    await this.audit.record({
      action: 'AUTH_MAGIC_LINK_SENT',
      userId: user.id,
      ipAddress: ctx.ipAddress ?? undefined,
      success: true,
    });
    return true;
  }

  async consumeMagicLink(rawToken: string, ctx: AuthContext = {}): Promise<AuthPayload> {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new BadRequestException('Invalid magic link');
    }
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const row = await this.magicLinkRepo.findOne({ where: { tokenHash } });
    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Magic link is invalid or has expired');
    }
    const result = await this.magicLinkRepo.update(
      { id: row.id, usedAt: row.usedAt ?? (null as unknown as Date) } as never,
      { usedAt: new Date() } as never,
    );
    if (!result.affected) {
      throw new UnauthorizedException('Magic link has already been used');
    }
    const user = await this.userRepo.findOne({ where: { id: row.userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active');
    }
    user.lastLogin = new Date();
    await this.userRepo.update(user.id, { lastLogin: user.lastLogin });
    await this.audit.record({
      action: 'AUTH_MAGIC_LINK_USED',
      userId: user.id,
      ipAddress: ctx.ipAddress ?? undefined,
      success: true,
    });
    return this.issueTokensFor(user, ctx, false);
  }

  private async issueTokensFor(
    user: User,
    ctx: AuthContext,
    remember: boolean,
  ): Promise<AuthPayload> {
    const refreshTtl = remember ? REFRESH_TOKEN_TTL_REMEMBER : REFRESH_TOKEN_TTL_DEFAULT;
    const session = this.sessionRepo.create({
      userId: user.id,
      token: crypto.randomBytes(32).toString('hex'),
      expiresAt: this.computeExpiry(refreshTtl),
      ipAddress: ctx.ipAddress ?? null,
      userAgent: ctx.userAgent ?? null,
      isActive: true,
    });
    const savedSession = await this.sessionRepo.save(session);
    const sessionId = savedSession.id;

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: sessionId,
      typ: 'access',
      twoFactorVerified: !!user.twoFactorEnabled,
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      sid: sessionId,
      typ: 'refresh',
    };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: ACCESS_TOKEN_TTL,
      secret: this.configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret',
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: refreshTtl,
      secret:
        this.configService.get<string>('REFRESH_TOKEN_SECRET') ??
        this.configService.get<string>('JWT_SECRET') ??
        'dev-refresh-secret',
    });
    return {
      user,
      accessToken,
      refreshToken,
      accessTokenExpiresAt: this.computeExpiry(ACCESS_TOKEN_TTL),
      refreshTokenExpiresAt: this.computeExpiry(refreshTtl),
      twoFactorRequired: false,
      challengeToken: null,
    };
  }

  private async signChallengeToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, kind: 'two-factor-challenge' } as ChallengeTokenPayload,
      {
        expiresIn: CHALLENGE_TOKEN_TTL,
        secret:
          this.configService.get<string>('CHALLENGE_TOKEN_SECRET') ?? 'dev-challenge-secret',
      },
    );
  }

  private computeExpiry(duration: string): Date {
    const m = /^(\d+)([smhd])$/.exec(duration);
    if (!m) return new Date(Date.now() + 15 * 60_000);
    const n = Number(m[1]);
    const unit = m[2];
    const ms =
      unit === 's'
        ? n * 1000
        : unit === 'm'
        ? n * 60_000
        : unit === 'h'
        ? n * 3_600_000
        : n * 86_400_000;
    return new Date(Date.now() + ms);
  }

  private buildEmailVerifyUrl(userId: string): string {
    const base = this.configService.get<string>('WEB_APP_URL') ?? 'http://localhost:3000';
    return `${base}/verify-email?uid=${encodeURIComponent(userId)}`;
  }

  private buildResetUrl(token: string, userId: string): string {
    const base = this.configService.get<string>('WEB_APP_URL') ?? 'http://localhost:3000';
    return `${base}/reset-password?token=${encodeURIComponent(`${userId}.${token}`)}`;
  }

  private buildMagicLinkUrl(rawToken: string): string {
    const base = this.configService.get<string>('WEB_APP_URL') ?? 'http://localhost:3000';
    return `${base}/auth/magic?token=${encodeURIComponent(rawToken)}`;
  }

  private splitResetToken(combined: string): [string | null, string | null] {
    const idx = combined.indexOf('.');
    if (idx === -1) return [null, null];
    return [combined.slice(0, idx), combined.slice(idx + 1)];
  }

  private async maybeSendLoginAlert(user: User, ctx: AuthContext): Promise<void> {
    if (!ctx.userAgent && !ctx.ipAddress) return;
    try {
      await this.emailService.sendLoginAlert({
        to: user.email,
        ipAddress: ctx.ipAddress ?? undefined,
        userAgent: ctx.userAgent ?? undefined,
        occurredAt: new Date(),
      });
    } catch (err) {
      this.logger.warn(`login alert failed: ${err}`);
    }
  }
}