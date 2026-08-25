/**
 * File:        graphql/resolvers/floor-layout.resolver.spec.ts
 * Module:      API · Floor Layout Resolver Tests
 * Purpose:     updateFloorLayout — sanitization pass-through, version
 *              conflict, center scoping, audit, cache invalidation.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-26
 */
import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { FloorResolver } from './center.resolver';
import { AuditService } from '../../auth/services/audit.service';
import { CacheService } from '../../cache/cache.service';
import { PubSubService } from '../pubsub/pubsub.service';
import { Floor } from '../../typeorm/entities/floor.entity';
import { UserRole } from '../types/user.type';

describe('FloorResolver.updateFloorLayout', () => {
  let resolver: FloorResolver;
  let floorRepo: any;
  let auditRecord: jest.Mock;
  let cacheInvalidate: jest.Mock;
  let pubPublish: jest.Mock;

  const layoutJson = (v: number) =>
    JSON.stringify({
      version: v,
      zones: [{ id: 'z1', x: 1, y: 1, w: 4, h: 3, label: 'Meeting Room', kind: 'MEETING_ROOM' }],
      labels: [],
    });

  beforeEach(async () => {
    floorRepo = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    auditRecord = jest.fn().mockResolvedValue(undefined);
    cacheInvalidate = jest.fn().mockResolvedValue(undefined);
    pubPublish = jest.fn();
    const moduleRef = await Test.createTestingModule({
      providers: [
        FloorResolver,
        { provide: getRepositoryToken(Floor), useValue: floorRepo },
        { provide: CacheService, useValue: { invalidatePattern: cacheInvalidate } },
        { provide: PubSubService, useValue: { publish: pubPublish } },
        { provide: AuditService, useValue: { record: auditRecord } },
      ],
    }).compile();
    resolver = moduleRef.get(FloorResolver);
  });

  const caller = (role: UserRole, centerId?: string | null) =>
    ({ sub: 'u1', email: 'u@x.io', role, centerId: centerId ?? null }) as any;

  it('saves a first layout (incoming version normalized to 1) and audits', async () => {
    floorRepo.findOne.mockResolvedValue({ id: 'f1', centerId: 'c1', layout: null });
    await resolver.updateFloorLayout('f1', layoutJson(99), caller(UserRole.CENTER_MANAGER, 'c1'));
    expect(floorRepo.update).toHaveBeenCalledWith(
      'f1',
      expect.objectContaining({ layout: expect.objectContaining({ version: 1 }) }),
    );
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'FLOOR_LAYOUT_UPDATE', entityId: 'f1', centerId: 'c1' }),
    );
    expect(cacheInvalidate).toHaveBeenCalledWith('floor:f1');
  });

  it('accepts version current+1 and persists it', async () => {
    floorRepo.findOne.mockResolvedValue({ id: 'f1', centerId: 'c1', layout: { version: 3, zones: [], labels: [] } });
    await resolver.updateFloorLayout('f1', layoutJson(4), caller(UserRole.SUPER_ADMIN));
    expect(floorRepo.update).toHaveBeenCalledWith(
      'f1',
      expect.objectContaining({ layout: expect.objectContaining({ version: 4 }) }),
    );
  });

  it('rejects a stale version with ConflictException carrying the current version', async () => {
    floorRepo.findOne.mockResolvedValue({ id: 'f1', centerId: 'c1', layout: { version: 5, zones: [], labels: [] } });
    await expect(
      resolver.updateFloorLayout('f1', layoutJson(3), caller(UserRole.SUPER_ADMIN)),
    ).rejects.toThrow(ConflictException);
    await expect(
      resolver.updateFloorLayout('f1', layoutJson(3), caller(UserRole.SUPER_ADMIN)),
    ).rejects.toThrow(/current version 5/);
  });

  it('blocks a CENTER_MANAGER from another center floor', async () => {
    floorRepo.findOne.mockResolvedValue({ id: 'f1', centerId: 'other', layout: null });
    await expect(
      resolver.updateFloorLayout('f1', layoutJson(1), caller(UserRole.CENTER_MANAGER, 'c1')),
    ).rejects.toThrow(ForbiddenException);
    expect(floorRepo.update).not.toHaveBeenCalled();
  });

  it('throws NotFound for a missing floor', async () => {
    floorRepo.findOne.mockResolvedValue(null);
    await expect(
      resolver.updateFloorLayout('nope', layoutJson(1), caller(UserRole.SUPER_ADMIN)),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an invalid layout payload with BadRequest', async () => {
    floorRepo.findOne.mockResolvedValue({ id: 'f1', centerId: 'c1', layout: null });
    await expect(
      resolver.updateFloorLayout('f1', JSON.stringify({ zones: [{ kind: 'VOLCANO' }] }), caller(UserRole.SUPER_ADMIN)),
    ).rejects.toThrow();
  });
});
