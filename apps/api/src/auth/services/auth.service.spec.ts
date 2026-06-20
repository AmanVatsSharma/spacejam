/**
 * File:        auth/services/auth.service.spec.ts
 * Module:      Api · Auth · Tests
 * Purpose:     Unit tests for AuthService — signin, signup, 2FA, refresh, reset
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { TwoFactorService } from './two-factor.service';
import { User } from '../../typeorm/entities/user.entity';
import { UserSession } from '../../typeorm/entities/user-session.entity';
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
    getOne: jest.fn(),
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
    active: true,
    emailVerified: true,
    flags: {},
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorRecoveryCodes: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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

const setupTestModule = async (userRepo: RepoMock, sessionRepo: RepoMock) => {
  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      {
        provide: getRepositoryToken(User),
        useValue: userRepo,
      },
      {
        provide: getRepositoryToken(UserSession),
        useValue: sessionRepo,
      },
      {
        provide: JwtService,
        useValue: {
          signAsync: jest.fn().mockImplementation(async (payload) => `signed:${payload.sub}`),
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
          sendEmailVerification: jest.fn().mockResolvedValue(undefined),
          sendPasswordReset: jest.fn().mockResolvedValue(undefined),
          sendLoginAlert: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: TwoFactorService,
        useValue: {
          generateSecret: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
          buildOtpAuthUrl: jest.fn().mockReturnValue('otpauth://totp/test'),
          buildQrDataUrl: jest.fn().mockResolvedValue('data:image/png;base64,xxx'),
          verifyCode: jest.fn().mockReturnValue(true),
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

      const result = await service.signin(
        { email: 'member@spacejam.test', password: 'password123' } as SigninInput,
      );
      expect(result.accessToken).toBeDefined();
      expect(result.twoFactorRequired).toBe(false);
    });

    it('rejects with a generic UnauthorizedException on bad password', async () => {
      const chain = qbMock();
      chain.getOne.mockResolvedValue(buildUser());
      userRepo.createQueryBuilder.mockReturnValue(chain);
      service = await setupTestModule(userRepo, sessionRepo);
      await expect(
        service.signin({ email: 'member@spacejam.test', password: 'wrong' } as SigninInput),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns a challenge token when 2FA is required and not provided', async () => {
      const chain = qbMock();
      chain.getOne.mockResolvedValue(buildUser({ twoFactorEnabled: true, twoFactorSecret: 'JBSWY3DPEHPK3PXP' }));
      userRepo.createQueryBuilder.mockReturnValue(chain);
      service = await setupTestModule(userRepo, sessionRepo);
      const result = await service.signin({ email: 'member@spacejam.test', password: 'password123' } as SigninInput);
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
          { provide: JwtService, useValue: jwt },
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue('test-secret') },
          },
          {
            provide: EmailService,
            useValue: {
              sendEmailVerification: jest.fn(),
              sendPasswordReset: jest.fn(),
              sendLoginAlert: jest.fn(),
            },
          },
          {
            provide: TwoFactorService,
            useValue: {
              generateSecret: jest.fn(),
              buildOtpAuthUrl: jest.fn(),
              buildQrDataUrl: jest.fn(),
              verifyCode: jest.fn(),
              generateRecoveryCodes: jest.fn(),
              hashRecoveryCode: jest.fn(),
            },
          },
        ],
      }).compile();
      const failingService = moduleRef.get(AuthService);
      await expect(failingService.refreshTokens('whatever')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('requestPasswordReset', () => {
    it('is a no-op for unknown emails (to prevent enumeration)', async () => {
      userRepo.findOne.mockResolvedValue(null);
      service = await setupTestModule(userRepo, sessionRepo);
      await expect(service.requestPasswordReset('nobody@nowhere.test')).resolves.toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('rejects a malformed token', async () => {
      service = await setupTestModule(userRepo, sessionRepo);
      await expect(
        service.resetPassword({ token: 'no-dot', newPassword: 'password123' } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
