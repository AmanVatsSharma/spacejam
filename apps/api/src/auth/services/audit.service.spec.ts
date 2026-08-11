import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from '../../typeorm/entities/audit-log.entity';

describe('AuditService.record', () => {
  let service: AuditService;
  let save: jest.Mock;

  beforeEach(async () => {
    save = jest.fn().mockResolvedValue(undefined);
    const create = jest.fn((row) => row); // echo the row so we can assert on it
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: { create, save } },
      ],
    }).compile();
    service = moduleRef.get(AuditService);
  });

  it('persists centerId on the audit row when provided', async () => {
    await service.record({
      action: 'CENTER_SETTINGS_UPDATE',
      userId: 'u1',
      centerId: 'c1',
      entityType: 'Center',
      entityId: 'c1',
      changes: { keys: ['finance'] },
    });
    expect(save).toHaveBeenCalledTimes(1);
    const row = save.mock.calls[0][0];
    expect(row.centerId).toBe('c1');
    expect(row.action).toBe('CENTER_SETTINGS_UPDATE');
  });

  it('defaults centerId to null when not provided', async () => {
    await service.record({ action: 'USER_CREATE', userId: 'u1' });
    const row = save.mock.calls[0][0];
    expect(row.centerId).toBeNull();
  });

  it('never throws when the repo save fails (fire-and-forget)', async () => {
    save.mockRejectedValueOnce(new Error('db down'));
    await expect(service.record({ action: 'USER_CREATE' })).resolves.toBeUndefined();
  });
});
