/**
 * File:        graphql/resolvers/user.resolver.spec.ts
 * Module:      API · User Resolver Tests
 * Purpose:     Behaviour-level tests for the hardened user-management
 *              resolvers. Mirrors the CenterResolver spec style: build a
 *              Nest TestingModule with the real UserResolver and mocked
 *              repos + AuditService, then call the resolver methods
 *              directly (guards are unit-tested elsewhere).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-11
 */
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { UserResolver } from './user.resolver';
import { UserRepository } from '../../typeorm/repositories/user.repository';
import { UserSessionRepository } from '../../typeorm/repositories/user-session.repository';
import { AuditService } from '../../auth/services/audit.service';
import { UserRole } from '../types/user.type';
import { Customer } from '../../typeorm/entities/customer.entity';
import { WalletTransaction } from '../../typeorm/entities/wallet-transaction.entity';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userRepo: any;
  let auditRecord: jest.Mock;

  beforeEach(async () => {
    userRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue({ users: [] }),
      update: jest.fn().mockResolvedValue({} as any),
      delete: jest.fn().mockResolvedValue(true),
      create: jest.fn().mockResolvedValue({} as any),
      countSuperAdmins: jest.fn(), // added in Task 7 step 4 to the repo
    };
    auditRecord = jest.fn().mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserResolver,
        { provide: UserRepository, useValue: userRepo },
        { provide: UserSessionRepository, useValue: {} },
        // Pass the entity class so the token matches what
        // @InjectRepository(Customer) resolves to. A string token like
        // 'Customer' would tokenize as 'undefinedRepository' (no .name).
        { provide: getRepositoryToken(Customer), useValue: {} },
        { provide: getRepositoryToken(WalletTransaction), useValue: {} },
        { provide: AuditService, useValue: { record: auditRecord } },
      ],
    }).compile();
    resolver = moduleRef.get(UserResolver);
  });

  describe('setUserRole', () => {
    it('stores CENTER_MANAGER verbatim (no demotion to STAFF)', async () => {
      userRepo.findById.mockResolvedValueOnce({ id: 't1', role: UserRole.MEMBER });
      userRepo.countSuperAdmins.mockResolvedValue(2);
      await resolver.setUserRole('t1', UserRole.CENTER_MANAGER, { sub: 'admin', role: UserRole.SUPER_ADMIN } as any);
      expect(userRepo.update).toHaveBeenCalledWith('t1', { role: UserRole.CENTER_MANAGER });
    });

    it('records a USER_ROLE_CHANGE audit entry with from/to', async () => {
      userRepo.findById.mockResolvedValueOnce({ id: 't1', role: UserRole.MEMBER });
      userRepo.countSuperAdmins.mockResolvedValue(2);
      await resolver.setUserRole('t1', UserRole.CENTER_MANAGER, { sub: 'admin', role: UserRole.SUPER_ADMIN } as any);
      expect(auditRecord).toHaveBeenCalledWith(expect.objectContaining({
        action: 'USER_ROLE_CHANGE',
        entityId: 't1',
        changes: { from: UserRole.MEMBER, to: UserRole.CENTER_MANAGER },
      }));
    });

    it('blocks demoting the last super admin', async () => {
      userRepo.findById.mockResolvedValueOnce({ id: 'last', role: UserRole.SUPER_ADMIN, centerId: null });
      userRepo.countSuperAdmins.mockResolvedValue(1);
      await expect(
        resolver.setUserRole('last', UserRole.MEMBER, { sub: 'last', role: UserRole.SUPER_ADMIN } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('user(id) ownership', () => {
    it('allows a CENTER_MANAGER to fetch a user in their own center', async () => {
      userRepo.findById.mockResolvedValueOnce({ id: 'u', centerId: 'c-mine' });
      const out = await resolver.user('u', { sub: 'm', role: UserRole.CENTER_MANAGER, centerId: 'c-mine' } as any);
      expect(out.id).toBe('u');
    });

    it('denies a CENTER_MANAGER fetching a user in another center', async () => {
      userRepo.findById.mockResolvedValueOnce({ id: 'u', centerId: 'c-other' });
      await expect(
        resolver.user('u', { sub: 'm', role: UserRole.CENTER_MANAGER, centerId: 'c-mine' } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
