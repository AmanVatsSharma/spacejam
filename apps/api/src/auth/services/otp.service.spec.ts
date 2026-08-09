/**
 * File:        auth/services/otp.service.spec.ts
 * Module:      Api · Auth · Tests
 * Purpose:     Unit tests for OtpService covering the phone-OTP login flows:
 *                - requestOtp: issue + rate-limit + dev-bypass devCode
 *                - verifyOtp: happy path, expired, wrong code (attempt cap),
 *                  employee provisioning (EMPLOYEE role + link), suspended user
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi as jest, beforeEach, Mock } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
// @ts-ignore
import * as bcrypt from 'bcryptjs';

import { OtpService } from './otp.service';
import { AuthService } from './auth.service';
import { SMS_PROVIDER } from './sms-provider.interface';
import { OtpRequest } from '../../typeorm/entities/otp-request.entity';
import { User } from '../../typeorm/entities/user.entity';
import { CustomerEmployee } from '../../typeorm/entities/customer-employee.entity';
import { Customer } from '../../typeorm/entities/customer.entity';
import { UserRole } from '../roles.enum';

// ── query-builder chain mock (OtpService uses it for rate-limit + active OTP) ──
const buildQb = (opts: { count?: number; getOne?: any }) => {
  const chain: any = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(opts.count ?? 0),
    getOne: jest.fn().mockResolvedValue(opts.getOne ?? null),
  };
  return chain;
};

describe('OtpService', () => {
  let service: OtpService;
  let otpRepo: any;
  let userRepo: any;
  let employeeRepo: any;
  let customerRepo: any;
  let authService: { issueTokensFor: Mock };

  beforeEach(async () => {
    otpRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'otp-1', ...x })),
      count: jest.fn().mockResolvedValue(0),
      increment: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(() => buildQb({ count: 0, getOne: null })),
    };
    userRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((x) => ({ id: 'new-user', ...x })),
      save: jest.fn(async (x) => ({ ...x, id: 'new-user' })),
    };
    employeeRepo = { findOne: jest.fn().mockResolvedValue(null), save: jest.fn() };
    customerRepo = { findOne: jest.fn().mockResolvedValue(null), save: jest.fn() };
    authService = { issueTokensFor: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user: { id: 'u' } }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'OTP_DEV_BYPASS' ? 'true' : undefined) } },
        { provide: AuthService, useValue: authService },
        { provide: SMS_PROVIDER, useValue: { send: jest.fn().mockResolvedValue(undefined) } },
        { provide: getRepositoryToken(OtpRequest), useValue: otpRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(CustomerEmployee), useValue: employeeRepo },
        { provide: getRepositoryToken(Customer), useValue: customerRepo },
      ],
    }).compile();

    service = module.get(OtpService);
  });

  describe('requestOtp', () => {
    it('issues a dev code when OTP_DEV_BYPASS=true', async () => {
      const res = await service.requestOtp('+919999999999');
      expect(res.ok).toBe(true);
      expect(res.devCode).toBe('000000');
      expect(res.expiresInSeconds).toBe(300);
      expect(otpRepo.save).toHaveBeenCalledTimes(1);
    });

    it('rate-limits after 5 requests in the window', async () => {
      otpRepo.createQueryBuilder.mockReturnValue(buildQb({ count: 5 }));
      await expect(service.requestOtp('+919999999999')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(otpRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    // Build an OTP row whose codeHash matches a known code.
    const makeOtp = async (code: string, overrides: Partial<any> = {}) => ({
      id: 'otp-1',
      phone: '+919999999999',
      codeHash: await bcrypt.hash(code, 4),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      consumedAt: null,
      ...overrides,
    });

    it('happy path: correct code logs in an existing user and issues tokens', async () => {
      const otp = await makeOtp('000000');
      otpRepo.createQueryBuilder.mockReturnValue(buildQb({ getOne: otp }));
      const existingUser = { id: 'u1', phone: '+919999999999', active: true, role: UserRole.MEMBER };
      userRepo.findOne.mockResolvedValue(existingUser);

      await service.verifyOtp('+919999999999', '000000');

      // Marked consumed + lastLogin recorded + tokens issued.
      expect(otpRepo.update).toHaveBeenCalledWith({ id: 'otp-1' }, expect.objectContaining({ consumedAt: expect.any(Date) }));
      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ lastLoginAt: expect.any(Date) }));
      expect(authService.issueTokensFor).toHaveBeenCalledWith(existingUser, expect.any(Object));
    });

    it('rejects when no unconsumed, unexpired code exists (expired / already used)', async () => {
      otpRepo.createQueryBuilder.mockReturnValue(buildQb({ getOne: null }));
      await expect(service.verifyOtp('+919999999999', '000000')).rejects.toThrow(
        'No valid code',
      );
    });

    it('rejects a wrong code with UnauthorizedException', async () => {
      const otp = await makeOtp('000000');
      otpRepo.createQueryBuilder.mockReturnValue(buildQb({ getOne: otp }));
      await expect(service.verifyOtp('+919999999999', '999999')).rejects.toThrow(
        'Invalid verification code',
      );
    });

    it('provisions an EMPLOYEE user when the phone matches a CustomerEmployee', async () => {
      const otp = await makeOtp('000000');
      otpRepo.createQueryBuilder.mockReturnValue(buildQb({ getOne: otp }));
      userRepo.findOne
        .mockResolvedValueOnce(null) // no existing User
        .mockResolvedValueOnce(null); // pickUniqueEmail: email not taken
      employeeRepo.findOne.mockResolvedValue({
        id: 'emp-1',
        phone: '+919999999999',
        name: 'Jane',
        email: 'jane@acme.test',
        customer: { centerId: 'center-1' },
      });

      await service.verifyOtp('+919999999999', '000000');

      // Provisioned with EMPLOYEE role and linked back to the employee row.
      expect(userRepo.create).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.EMPLOYEE }));
      expect(employeeRepo.save).toHaveBeenCalledWith(expect.objectContaining({ userId: 'new-user', status: 'active', joinedAt: expect.any(Date) }));
    });

    it('rejects a suspended (active=false) user', async () => {
      const otp = await makeOtp('000000');
      otpRepo.createQueryBuilder.mockReturnValue(buildQb({ getOne: otp }));
      userRepo.findOne.mockResolvedValue({ id: 'u1', active: false });

      await expect(service.verifyOtp('+919999999999', '000000')).rejects.toThrow(
        'suspended',
      );
      expect(authService.issueTokensFor).not.toHaveBeenCalled();
    });
  });
});
