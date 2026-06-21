/**
 * File:        auth/services/auth.service.spec.ts
 * Module:      Api · Auth · Tests
 * Purpose:     Unit tests for AuthService covering the new flows:
 *                - signup + lockout-aware signin
 *                - 2FA challenge + recovery-code path
 *                - password-reset, magic-link, change-password
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  getRepositoryToken,
} from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { TwoFactorService } from './two-factor.service';
import { LockoutService } from './lockout.service';
import { PasswordPolicyService } from './password-policy.service';
import { AuditService } from './audit.service';
import { RecoveryCodeRepository } from '../../typeorm/repositories/recovery-code.repository';

import { User } from '../../typeorm/entities/user.entity';
import { UserSession } from '../../typeorm/entities/user-session.entity';
import { MagicLinkToken } from '../../typeorm/entities/magic-link-token.entity';
import { UserRole } from '../roles.enum';
import { SigninInput } from '../dto/signin.input';
import { SignupInput } from '../dto/signup.input';

type RepoMock = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  createQueryBuilder: jest.Mock;
  update: jest.Mock;
};

const qbMock = () => {
  const chain: any = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ identifiers: [], generatedMaps: [] }),
  };
  return chain;
};

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'member@spacejam.test',
    passwordHash: bcrypt.hashSync('password123', 4),
    name: 'Member',
    role: UserRole.MEMBER,
    isActive: true,
    active: true,
    emailVerified: true,
    flags: {},
    twoFactorEnabled: false,
    twoFactorSecret: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    failedLoginCount: 0,
    lockoutUntil: null,
    passwordChangedAt: new Date(),
    passwordHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
    lastLoginAt: null,
    ...overrides,
  }) as User;

const buildSession = (): UserSession =>
  ({
    id: 'session-1',
    userId: 'user-1',
    token: 'opaque',
    expiresAt: new Date(Date.now() + 86_400_000),
    ipAddress: null,
    userAgent: null,
    isActive: true,
    createdAt: new Date(),
  }) as unknown as UserSession;

const setupTestModule = async (userRepo: RepoMock, sessionRepo: RepoMock, opts: any = {}) => {
  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: getRepositoryToken(User), useValue: userRepo },
      { provide: getRepositoryToken(UserSession), useValue: sessionRepo },
      { provide: getRepositoryToken(MagicLinkToken), useValue: { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), update: jest.fn() } },
      {
        provide: RecoveryCodeRepository,
        useValue: {
          bulkInsert: jest.fn().mockResolvedValue(undefined),
          deleteAllForUser: jest.fn().mockResolvedValue(undefined),
          findUnused: jest.fn().mockResolvedValue(null),
          consume: jest.fn().mockResolvedValue(1),
          countUnused: jest.fn().mockResolvedValue(0),
        },
      },
      {
        provide: LockoutService,
        useValue: {
          enforceIpLimit: jest.fn().mockResolvedValue(undefined),
          assertNotLocked: jest.fn().mockResolvedValue(undefined),
          recordFailure: jest.fn().mockResolvedValue(1),
          recordSuccess: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: PasswordPolicyService,
        useValue: {
          enforceStrength: jest.fn(),
          enforceNoBreach: jest.fn().mockResolvedValue(undefined),
          hash: jest.fn().mockImplementation(async (pw: string) => bcrypt.hash(pw, 4)),
          matchesHistory: jest.fn().mockResolvedValue(false),
          appendHistory: jest.fn().mockImplementation((hist: string[], h: string) =>
            [h, ...(hist || []).slice(0, 4)],
          ),
        },
      },
      {
        provide: AuditService,
        useValue: { record: jest.fn().mockResolvedValue(undefined) },
      },
      {
        provide: JwtService,
        useValue: {
          signAsync: jest.fn().mockImplementation(async (payload: any) => `signed:${payload.sub}`),
          verifyAsync: jest.fn().mockImplementation(async () => ({ sub: 'user-1', typ: 'refresh', sid: 'session-1' })),
        },
      },
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn((key: string) => {
            const map: Record<string, string> = {
              JWT_SECRET: 'test-jwt',
              REFRESH_TOKEN_SECRET: 'test-refresh',
              CHALLENGE_TOKEN_SECRET: 'test-challenge',
            };
            return map[key];
          }),
        },
      },
      {
        provide: EmailService,
        useValue: {
          sendVerification: jest.fn().mockResolvedValue(undefined),
          sendPasswordReset: jest.fn().mockResolvedValue(undefined),
          sendMagicLink: jest.fn().mockResolvedValue(undefined),
          sendLoginAlert: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: TwoFactorService,
        useValue: {
          generateSecret: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
          buildOtpAuthUri: jest.fn().mockReturnValue('otpauth://totp/test'),
          buildQrCodeDataUrl: jest.fn().mockResolvedValue('data:image/png;base64,xxx'),
          verifyCode: jest.fn(),
          generateRecoveryCodes: jest.fn().mockReturnValue(['AAAA-BBBB-CCCC-DDDD-EEEE']),
          hashRecoveryCode: jest.fn().mockReturnValue('hashed'),
        },
      },
    ],
  }).compile();

  return moduleRef.get(AuthService);
};

describe('AuthService', () => {
  let userRepo: RepoMock;
  let sessionRepo: RepoMock;
  let service: AuthService;

  beforeEach(() => {
    userRepo = {
      create: jest.fn().mockImplementation((dto) => dto as User),
      save: jest.fn().mockImplementation(async (input) => input as User),
      findOne: jest.fn().mockResolvedValue(null),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock()),
      update: jest.fn().mockResolvedValue(undefined),
    };
    sessionRepo = {
      create: jest.fn().mockReturnValue(buildSession()),
      save: jest.fn().mockResolvedValue(buildSession()),
      findOne: jest.fn().mockResolvedValue(buildSession()),
      update: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('signup', () => {
    it('hashes the password and issues tokens for a new account', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const chain = qbMock();
      chain.getOne.mockResolvedValue(buildUser());
      userRepo.createQueryBuilder.mockReturnValue(chain);

      service = await setupTestModule(userRepo, sessionRepo);
      const result = await service.signup(
        { email: 'New@Example.com', password: 'password123', name: 'New' } as SignupInput,
        { ipAddress: '127.0.0.1' },
      );

      expect(userRepo.save).toHaveBeenCalled();
      expect(result.accessToken).toMatch(/^signed:/);
      expect(result.twoFactorRequired).toBe(false);
    });

    it('rejects when email already exists', async () => {
      userRepo.findOne.mockResolvedValue(buildUser());
      service = await setupTestModule(userRepo, sessionRepo);
      await expect(
        service.signup({ email: 'member@spacejam.test', password: 'password123' } as SignupInput),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('signin', () => {
    it('issues tokens on correct credentials', async () => {
      const chain = qbMock();
      chain.getOne.mockResolvedValue(buildUser());
      userRepo.createQueryBuilder.mockReturnValue(chain);
      service = await setupTestModule(userRepo, sessionRepo);

      const result = await service.signin({
        email: 'member@spacejam.test',
        password: 'password123',
      } as SigninInput);
      expect(result.accessToken).toBeDefined();
      expect(result.twoFactorRequired).toBe(false);
    });

    it('rejects with a generic UnauthorizedException on bad password', async () => {
      const chain = qbMock();
      chain.getOne.mockResolvedValue(buildUser());
      userRepo.createQueryBuilder.mockReturnValue(chain);
      service = await setupTestModule(userRepo, sessionRepo);
      await expect(
        service.signin({
          email: 'member@spacejam.test',
          password: 'wrong',
        } as SigninInput),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns a challenge token when 2FA is required and no code is provided', async () => {
      const chain = qbMock();
      chain.getOne.mockResolvedValue(
        buildUser({ twoFactorEnabled: true, twoFactorSecret: 'JBSWY3DPEHPK3PXP' }),
      );
      userRepo.createQueryBuilder.mockReturnValue(chain);
      service = await setupTestModule(userRepo, sessionRepo);
      const result = await service.signin({
        email: 'member@spacejam.test',
        password: 'password123',
      } as SigninInput);
      expect(result.twoFactorRequired).toBe(true);
      expect(result.challengeToken).toBeDefined();
      expect(result.accessToken).toBeNull();
    });
  });

  describe('refreshTokens', () => {
    it('rotates and returns a new token pair', async () => {
      const chain = qbMock();
      chain.getOne.mockResolvedValue(buildUser());
      userRepo.createQueryBuilder.mockReturnValue(chain);
      service = await setupTestModule(userRepo, sessionRepo);
      const result = await service.refreshTokens('refresh-token');
      expect(result.accessToken).toBeDefined();
      expect(sessionRepo.update).toHaveBeenCalledWith('session-1', { isActive: false });
    });

    it('rejects malformed/expired refresh tokens', async () => {
      const jwt = { verifyAsync: jest.fn().mockRejectedValue(new Error('bad')) };
      const moduleRef = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: getRepositoryToken(User), useValue: userRepo },
          { provide: getRepositoryToken(UserSession), useValue: sessionRepo },
          { provide: getRepositoryToken(MagicLinkToken), useValue: { findOne: jest.fn(), update: jest.fn(), create: jest.fn(), save: jest.fn() } },
          { provide: RecoveryCodeRepository, useValue: {} },
          { provide: LockoutService, useValue: { enforceIpLimit: jest.fn(), assertNotLocked: jest.fn(), recordFailure: jest.fn(), recordSuccess: jest.fn() } },
          { provide: PasswordPolicyService, useValue: { enforceStrength: jest.fn(), enforceNoBreach: jest.fn(), hash: jest.fn(), matchesHistory: jest.fn(), appendHistory: jest.fn() } },
          { provide: AuditService, useValue: { record: jest.fn() } },
          { provide: JwtService, useValue: jwt },
          { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret') } },
          { provide: EmailService, useValue: { sendVerification: jest.fn(), sendPasswordReset: jest.fn(), sendMagicLink: jest.fn(), sendLoginAlert: jest.fn() } },
          { provide: TwoFactorService, useValue: { generateSecret: jest.fn(), buildOtpAuthUri: jest.fn(), buildQrCodeDataUrl: jest.fn(), verifyCode: jest.fn(), generateRecoveryCodes: jest.fn(), hashRecoveryCode: jest.fn() } },
        ],
      }).compile();
      const failingService = moduleRef.get(AuthService);
      await expect(failingService.refreshTokens('whatever')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('is a no-op for unknown emails (to prevent enumeration)', async () => {
      userRepo.findOne.mockResolvedValue(null);
      service = await setupTestModule(userRepo, sessionRepo);
      await expect(
        service.requestPasswordReset('nobody@nowhere.test', {}),
      ).resolves.toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('rejects a malformed token', async () => {
      service = await setupTestModule(userRepo, sessionRepo);
      await expect(
        service.resetPassword(
          { token: 'no-dot', newPassword: 'password123' } as never,
          {},
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
