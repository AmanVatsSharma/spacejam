/**
 * File:        graphql/resolvers/user-settings.resolver.spec.ts
 * Module:      API · User Settings Resolver Tests
 * Purpose:     Tests the per-user settings resolvers (userSettings /
 *              updateUserSettings): self-access, staff access, center-
 *              manager center scoping, whitelist sanitization, and
 *              deep-merge semantics.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-14
 */
import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { UserResolver } from './user.resolver';
import { AuditService } from '../../auth/services/audit.service';
import { Customer } from '../../typeorm/entities/customer.entity';
import { WalletTransaction } from '../../typeorm/entities/wallet-transaction.entity';
import { UserRepository } from '../../typeorm/repositories/user.repository';
import { UserSessionRepository } from '../../typeorm/repositories/user-session.repository';
import { UserRole } from '../types/user.type';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('UserResolver per-user settings', () => {
  let resolver: UserResolver;
  let userRepo: any;
  let auditRecord: jest.Mock;

  beforeEach(async () => {
    userRepo = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    auditRecord = jest.fn().mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserResolver,
        { provide: UserRepository, useValue: userRepo },
        { provide: UserSessionRepository, useValue: {} },
        { provide: getRepositoryToken(Customer), useValue: {} },
        { provide: getRepositoryToken(WalletTransaction), useValue: {} },
        { provide: AuditService, useValue: { record: auditRecord } },
      ],
    }).compile();
    resolver = moduleRef.get(UserResolver);
  });

  const caller = (role: UserRole, centerId?: string | null) =>
    ({ sub: 'caller-id', email: 'c@x.io', role, centerId: centerId ?? null } as any);

  describe('userSettings', () => {
    it('returns "{}" when the user has no settings', async () => {
      userRepo.findById.mockResolvedValue({ id: 'u1', settings: null, centerId: null });
      const out = await resolver.userSettings('u1', caller(UserRole.SUPER_ADMIN));
      expect(out).toBe('{}');
    });

    it('returns the stored settings as JSON for a user in the manager center', async () => {
      userRepo.findById.mockResolvedValue({
        id: 'u1',
        centerId: 'c1',
        settings: { permissions: { editBookings: true } },
      });
      const out = await resolver.userSettings('u1', caller(UserRole.CENTER_MANAGER, 'c1'));
      expect(JSON.parse(out)).toEqual({ permissions: { editBookings: true } });
    });

    it('throws NotFound for a missing user', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(
        resolver.userSettings('nope', caller(UserRole.SUPER_ADMIN)),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserSettings authorization', () => {
    it('allows a user to update their own settings', async () => {
      userRepo.findById.mockResolvedValue({
        id: 'caller-id',
        centerId: 'c1',
        settings: {},
      });
      await resolver.updateUserSettings(
        'caller-id',
        JSON.stringify({ permissions: { deleteUsers: false } }),
        caller(UserRole.CENTER_MANAGER, 'c1'),
      );
      expect(userRepo.update).toHaveBeenCalled();
    });

    it('blocks a CENTER_MANAGER from users outside their center', async () => {
      userRepo.findById.mockResolvedValue({ id: 'u2', centerId: 'other-center', settings: {} });
      await expect(
        resolver.updateUserSettings(
          'u2',
          JSON.stringify({ permissions: {} }),
          caller(UserRole.CENTER_MANAGER, 'c1'),
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(userRepo.update).not.toHaveBeenCalled();
    });

    it('allows a SUPER_ADMIN to update any user', async () => {
      userRepo.findById.mockResolvedValue({ id: 'u2', centerId: 'c9', settings: {} });
      await resolver.updateUserSettings(
        'u2',
        JSON.stringify({ permissions: { createUsers: true } }),
        caller(UserRole.SUPER_ADMIN),
      );
      expect(userRepo.update).toHaveBeenCalledWith(
        'u2',
        expect.objectContaining({ settings: { permissions: { createUsers: true } } }),
      );
    });

    it('blocks a non-staff role from managing someone else', async () => {
      userRepo.findById.mockResolvedValue({ id: 'u2', centerId: null, settings: {} });
      await expect(
        resolver.updateUserSettings(
          'u2',
          JSON.stringify({ permissions: {} }),
          caller(UserRole.MEMBER),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateUserSettings merge + sanitize', () => {
    it('drops non-whitelisted groups and preserves sibling groups', async () => {
      userRepo.findById.mockResolvedValue({
        id: 'u1',
        centerId: null,
        settings: { permissions: { editBookings: true } },
      });
      const merged = await resolver.updateUserSettings(
        'u1',
        JSON.stringify({ permissionsSecurity: { otpRequired: false }, evil: { x: 1 } }),
        caller(UserRole.SUPER_ADMIN),
      );
      const parsed = JSON.parse(merged);
      expect(parsed.permissions).toEqual({ editBookings: true }); // sibling kept
      expect(parsed.permissionsSecurity).toEqual({ otpRequired: false });
      expect(parsed.evil).toBeUndefined(); // whitelist dropped it
    });

    it('rejects invalid JSON with BadRequest', async () => {
      userRepo.findById.mockResolvedValue({ id: 'u1', centerId: null, settings: {} });
      await expect(
        resolver.updateUserSettings('u1', '{not-json', caller(UserRole.SUPER_ADMIN)),
      ).rejects.toThrow();
    });

    it('audits keys only, never values', async () => {
      userRepo.findById.mockResolvedValue({ id: 'u1', centerId: 'c1', settings: {} });
      await resolver.updateUserSettings(
        'u1',
        JSON.stringify({ permissions: { secretToggle: true } }),
        caller(UserRole.SUPER_ADMIN),
      );
      const entry = auditRecord.mock.calls[0][0];
      expect(entry.action).toBe('USER_SETTINGS_UPDATE');
      expect(entry.changes).toEqual({ keys: ['permissions'] });
      expect(entry.changes).not.toHaveProperty('secretToggle');
    });
  });
});
