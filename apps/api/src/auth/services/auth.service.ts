/**
 * File:        auth/services/auth.service.ts
 * Module:      Api · Auth · Services
 * Purpose:     Authentication flows - signin, signup, refresh, 2FA, password reset
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
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

import { UserRole } from '../roles.enum';
import { JwtPayload, RefreshTokenPayload } from '../types/jwt-payload.type';
import { AuthPayload } from '../types/auth-payload.type';
import { User } from '../../typeorm/entities/user.entity';
import { UserSession } from '../../typeorm/entities/user-session.entity';

import { EmailService } from './email.service';
import { TwoFactorService } from './two-factor.service';
import { SigninInput } from '../dto/signin.input';
import { SignupInput } from '../dto/signup.input';
import { ResetPasswordInput } from '../dto/reset-password.input';
import { EnableTwoFactorInput } from '../dto/enable-two-factor.input';
import { VerifyTwoFactorInput } from '../dto/verify-two-factor.input';

const BCRYPT_COST = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DEFAULT = '7d';
const REFRESH_TOKEN_TTL_REMEMBER = '30d';
const CHALLENGE_TOKEN_TTL = '5m';
const RESET_TOKEN_TTL_MINUTES = 30;

export interface AuthContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async signup(input: SignupInput, ctx: AuthContext = {}): Promise<AuthPayload> {
    const email = input.email.toLowerCase().trim();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with that email already exists');
    }
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    const user = this.userRepo.create({
      email,
      name: input.name ?? null,
      passwordHash,
      role: UserRole.MEMBER,
      active: true,
      emailVerified: false,
    });
    const saved = await this.userRepo.save(user);
    this.logger.log(`signup: new user ${saved.id} (${saved.email})`);
    void this.emailService
      .sendEmailVerification({
        to: saved.email,
        name: saved.name,
        verifyUrl: this.buildEmailVerifyUrl(saved.id),
      })
      .catch((err) => this.logger.warn(`welcome email failed: ${err}`));
    return this.issueTokensFor(saved, ctx);
  }

  async signin(input: SigninInput, ctx: AuthContext = {}): Promise<AuthPayload> {
    const email = input.email.toLowerCase().trim();
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();

    if (!user || !user.active) {
      await bcrypt.compare(input.password, '$2b$12$invalidsaltinvalidsaltinO9G2cZ1Vkyf5R0UVq9X0jZ9Rk');
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordOk = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      const ok = input.twoFactorCode
        ? this.twoFactorService.verifyCode(user.twoFactorSecret!, input.twoFactorCode)
        : false;
      if (!ok) {
        return {
          user: null,
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: new Date(),
          refreshTokenExpiresAt: new Date(),
          twoFactorRequired: true,
          challengeToken: await this.signChallengeToken(user),
        };
      }
    }

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);
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
      const session = await this.sessionRepo.findOne({ where: { id: payload.sid } as never });
      const isActive = !!(session && (session as unknown as { isActive: boolean }).isActive);
      if (!isActive) {
        throw new UnauthorizedException('Session has been revoked');
      }
    }
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.active) {
      throw new UnauthorizedException('User no longer active');
    }
    if (payload.sid) {
      await this.sessionRepo.update(payload.sid, { isActive: false } as never);
    }
    return this.issueTokensFor(user, ctx, true);
  }

  async logout(userId: string, sessionId?: string): Promise<boolean> {
    if (sessionId) {
      await this.sessionRepo.update(sessionId, { isActive: false } as never);
    } else {
      await this.sessionRepo.update(
        { userId, isActive: true } as never,
        { isActive: false } as never,
      );
    }
    return true;
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    const normalized = email.toLowerCase().trim();
    const user = await this.userRepo.findOne({ where: { email: normalized } });
    if (!user) return true;
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
    return true;
  }

  async resetPassword(input: ResetPasswordInput): Promise<boolean> {
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
    user.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await this.userRepo.save(user);
    await this.sessionRepo.update(
      { userId: user.id, isActive: true } as never,
      { isActive: false } as never,
    );
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
    const otpauthUrl = this.twoFactorService.buildOtpAuthUrl({ email: user.email, secret });
    const qrDataUrl = await this.twoFactorService.buildQrDataUrl(otpauthUrl);
    user.twoFactorSecret = secret;
    await this.userRepo.save(user);
    return { secret, otpauthUrl, qrDataUrl };
  }

  async confirmTwoFactorSetup(userId: string, input: EnableTwoFactorInput): Promise<string[]> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.twoFactorSecret')
      .where('u.id = :id', { id: userId })
      .getOne();
    if (!user?.twoFactorSecret) {
      throw new BadRequestException('No pending 2FA setup found');
    }
    if (!this.twoFactorService.verifyCode(user.twoFactorSecret, input.code)) {
      throw new BadRequestException('Invalid authenticator code');
    }
    const recoveryCodes = this.twoFactorService.generateRecoveryCodes();
    user.twoFactorEnabled = true;
    user.twoFactorRecoveryCodes = recoveryCodes.map((c) => this.twoFactorService.hashRecoveryCode(c));
    await this.userRepo.save(user);
    this.logger.log(`2fa enabled for ${user.id}`);
    return recoveryCodes;
  }

  async verifyTwoFactor(input: VerifyTwoFactorInput): Promise<AuthPayload> {
    let challenge: { sub: string };
    try {
      challenge = await this.jwtService.verifyAsync(input.challengeToken, {
        secret:
          this.configService.get<string>('CHALLENGE_TOKEN_SECRET') ?? 'dev-challenge-secret',
      });
    } catch {
      throw new UnauthorizedException('Challenge token is invalid or expired');
    }
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.twoFactorSecret')
      .where('u.id = :id', { id: challenge.sub })
      .getOne();
    if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
      throw new UnauthorizedException('Two-factor not enabled for this account');
    }
    if (!this.twoFactorService.verifyCode(user.twoFactorSecret, input.code)) {
      throw new UnauthorizedException('Invalid authenticator code');
    }
    user.lastLoginAt = new Date();
    await this.userRepo.save(user);
    return this.issueTokensFor(user, {});
  }

  async disableTwoFactor(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.twoFactorSecret')
      .where('u.id = :id', { id: userId })
      .getOne();
    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Two-factor not enabled');
    }
    if (!this.twoFactorService.verifyCode(user.twoFactorSecret, code)) {
      throw new BadRequestException('Invalid authenticator code');
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorRecoveryCodes = null;
    await this.userRepo.save(user);
    return true;
  }

  private async issueTokensFor(
    user: User,
    ctx: AuthContext,
    remember = false,
  ): Promise<AuthPayload> {
    const session = this.sessionRepo.create({
      userId: user.id,
      token: crypto.randomBytes(32).toString('hex'),
      expiresAt: this.computeExpiry(
        remember ? REFRESH_TOKEN_TTL_REMEMBER : REFRESH_TOKEN_TTL_DEFAULT,
      ),
      ipAddress: ctx.ipAddress ?? null,
      userAgent: ctx.userAgent ?? null,
      isActive: true,
    });
    const savedSession = await this.sessionRepo.save(session);
    const sessionId = (savedSession as unknown as { id: string }).id;

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: sessionId,
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
      expiresIn: remember ? REFRESH_TOKEN_TTL_REMEMBER : REFRESH_TOKEN_TTL_DEFAULT,
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
      refreshTokenExpiresAt: this.computeExpiry(
        remember ? REFRESH_TOKEN_TTL_REMEMBER : REFRESH_TOKEN_TTL_DEFAULT,
      ),
      twoFactorRequired: false,
      challengeToken: null,
    };
  }

  private async signChallengeToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, kind: 'two-factor-challenge' },
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
        when: new Date(),
        ip: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    } catch (err) {
      this.logger.warn(`login alert failed: ${err}`);
    }
  }
}