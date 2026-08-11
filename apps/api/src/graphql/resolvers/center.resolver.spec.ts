/**
 * File:        apps/api/src/graphql/resolvers/center.resolver.spec.ts
 * Module:      API · Center Resolver Tests
 * Purpose:     Integration tests for the hardened CenterResolver settings
 *              resolvers. Builds a Nest TestingModule with the real
 *              CenterResolver, real RolesGuard + CenterScopedGuard, mocked
 *              repos, and a spied AuditService. Resolver methods are called
 *              directly (guards are unit-tested in Task 3); here we verify
 *              the resolver's own plumbing: sanitize + merge + audit shape.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-11
 */
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { CenterResolver } from './center.resolver';
import { CenterScopedGuard } from '../../auth/guards/center-scoped.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuditService } from '../../auth/services/audit.service';
import { CacheService } from '../../cache/cache.service';
import { PubSubService } from '../pubsub/pubsub.service';
import { UserRole } from '../types/user.type';
import { Center } from '../../typeorm/entities/center.entity';
import { Location } from '../../typeorm/entities/location.entity';

/**
 * Minimal fake reflector that returns whatever metadata map we set per-test.
 * The guards read metadata via `getAllAndOverride`, so we mock just that one
 * method to surface the metadata the @Roles / @CenterScoped decorators would
 * have set. (We don't rely on the decorator metadata here because the test
 * calls the resolver method directly — guards never run on these calls.)
 */
function fakeReflector(meta: Record<string, any> = {}): Reflector {
  const r = new Reflector();
  jest.spyOn(r, 'getAllAndOverride').mockImplementation((key: string) => meta[key]);
  return r;
}

describe('CenterResolver settings hardening', () => {
  let resolver: CenterResolver;
  let centerRepo: any;
  let auditRecord: jest.Mock;

  async function build(opts: { meta?: Record<string, any> } = {}) {
    centerRepo = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    auditRecord = jest.fn().mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        CenterResolver,
        // Use the actual entity class so the token matches what
        // @InjectRepository(Center) resolves to ('CenterRepository').
        // The brief's `getRepositoryToken('CenterEntity')` string would NOT
        // match — a string has no .name, so it tokenizes as 'undefinedRepository'.
        { provide: getRepositoryToken(Center), useValue: centerRepo },
        { provide: getRepositoryToken(Location), useValue: {} },
        { provide: CacheService, useValue: { invalidatePattern: jest.fn() } },
        { provide: PubSubService, useValue: { publish: jest.fn() } },
        { provide: AuditService, useValue: { record: auditRecord } },
        { provide: Reflector, useValue: fakeReflector(opts.meta) },
        RolesGuard,
        CenterScopedGuard,
      ],
    }).compile();
    resolver = moduleRef.get(CenterResolver);
    return moduleRef;
  }

  it('updateCenterSettings throws NotFound when center missing', async () => {
    await build();
    centerRepo.findOne.mockResolvedValue(null);
    await expect(
      resolver.updateCenterSettings(
        'c1',
        JSON.stringify({ finance: { a: 1 } }),
        { sub: 'a', role: UserRole.SUPER_ADMIN } as any,
        { req: { headers: {} } } as any,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateCenterSettings sanitizes, merges, updates, and audits for a SUPER_ADMIN', async () => {
    await build();
    centerRepo.findOne.mockResolvedValue({ id: 'c1', settings: { security: { x: 1 } } });
    const merged = await resolver.updateCenterSettings(
      'c1',
      JSON.stringify({ finance: { a: 1 }, evil: 'drop-me' }),
      { sub: 'admin', role: UserRole.SUPER_ADMIN, centerId: null } as any,
      { req: { headers: {} } } as any,
    );
    const result = JSON.parse(merged);
    expect(result.finance).toEqual({ a: 1 });
    expect(result.security).toEqual({ x: 1 }); // sibling preserved
    expect(result.evil).toBeUndefined();       // whitelist dropped it
    expect(centerRepo.update).toHaveBeenCalledWith(
      'c1',
      { settings: expect.objectContaining({ finance: { a: 1 } }) },
    );
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CENTER_SETTINGS_UPDATE',
        entityType: 'Center',
        entityId: 'c1',
        centerId: 'c1',
      }),
    );
  });

  it('centerSettings returns "{}" when center has no settings', async () => {
    await build();
    centerRepo.findOne.mockResolvedValue({ id: 'c1', settings: null });
    const out = await resolver.centerSettings('c1');
    expect(out).toBe('{}');
  });

  it('updateCenterSettings audit changes contain keys, not values', async () => {
    await build();
    centerRepo.findOne.mockResolvedValue({ id: 'c1', settings: {} });
    await resolver.updateCenterSettings(
      'c1',
      JSON.stringify({ finance: { secret: 'x' } }),
      { sub: 'a', role: UserRole.SUPER_ADMIN } as any,
      { req: { headers: {} } } as any,
    );
    const entry = auditRecord.mock.calls[0][0];
    expect(entry.changes).toEqual({ keys: ['finance'] });
    expect(entry.changes).not.toHaveProperty('secret');
  });
});
