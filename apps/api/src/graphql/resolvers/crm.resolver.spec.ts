/**
 * File:        apps/api/src/graphql/resolvers/crm.resolver.spec.ts
 * Module:      API · CRM Module Tests
 * Purpose:     Unit tests for CRM lead management resolver logic
 *              Uses mocked repositories — no database required
 *              Tests the full lead lifecycle: create → update → convert → delete
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-01
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { CrmResolver } from './crm.resolver';
import { LeadStatus, LeadSource, UserRole } from '@enums';

import { CreateLeadInput, UpdateLeadInput, LeadFiltersInput } from '../inputs/crm.input';

type Lead = any;

// ─── Helpers ────────────────────────────────────────────────────────────

function makeLead(overrides?: Partial<Lead>): Lead {
  return {
    id: 'lead-uuid',
    name: 'Test Lead',
    email: 'test@example.com',
    phone: '+91-9876543210',
    company: 'TestCorp',
    status: 'New',
    source: 'Website',
    requirement: 'Need coworking space',
    budget: '₹50,000/month',
    location: 'Bangalore',
    notes: 'Interested in hot desks',
    assignedToId: 'user-1',
    centerId: 'center-1',
    lastContact: undefined,
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-06-01'),
    assignedTo: undefined,
    center: undefined,
    ...overrides,
  };
}

function buildMockRepo(seeds: Lead[] = []) {
  const data = [...seeds];
  return {
    create: vi.fn((dto: Partial<Lead>) => makeLead(dto)),
    save: vi.fn(async (entity: Lead) => {
      const existing = data.find(l => l.id === entity.id);
      if (existing) {
        Object.assign(existing, entity);
        return existing;
      }
      data.push({ ...entity, id: entity.id || `lead-${data.length}` });
      return entity;
    }),
    find: vi.fn(async (opts?: any) => {
      let results = [...data];
      if (opts?.where) {
        if (opts.where.id) results = results.filter((l: Lead) => l.id === opts.where.id);
        if (opts.where.status) results = results.filter((l: Lead) => l.status === opts.where.status);
        if (opts.where.source) results = results.filter((l: Lead) => l.source === opts.where.source);
        if (opts.where.email) results = results.filter((l: Lead) => l.email === opts.where.email);
        if (opts.where.name) {
          const nameVal = typeof opts.where.name === 'string' ? opts.where.name : (opts.where.name._value || opts.where.name.value || '');
          const pattern = typeof nameVal === 'string' ? nameVal.replace(/[%]/g, '') : '';
          results = results.filter((l: Lead) => l.name?.toLowerCase().includes(pattern.toLowerCase()));
        }
      }
      if (opts?.order) {
        results.sort((a: Lead, b: Lead) =>
          opts.order.createdAt === 'DESC'
            ? (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
            : (a.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0),
        );
      }
      if (opts?.skip) results = results.slice(opts.skip);
      if (opts?.take) results = results.slice(0, opts.take);
      return results;
    }),
    findOne: vi.fn(async (opts?: any) => {
      const results = await (buildMockRepo(data).find as any)({ where: opts?.where });
      return results[0] || null;
    }),
    count: vi.fn(async (opts?: any) => {
      const results = await (buildMockRepo(data).find as any)({ where: opts?.where });
      return results.length;
    }),
    update: vi.fn(async (id: string, dto: Partial<Lead>) => {
      const lead = data.find((l: Lead) => l.id === id);
      if (lead) Object.assign(lead, dto, { updatedAt: new Date() });
      return { affected: lead ? 1 : 0 };
    }),
    delete: vi.fn(async (id: string) => {
      const idx = data.findIndex((l: Lead) => l.id === id);
      if (idx !== -1) data.splice(idx, 1);
      return { affected: idx !== -1 ? 1 : 0 };
    }),
  };
}

function buildMockCache() {
  return {
    invalidatePattern: vi.fn(async () => {}),
    del: vi.fn(async () => {}),
    invalidate: vi.fn(async () => {}),
  };
}

function makeContext(userId: string = 'user-1') {
  return { req: { user: { id: userId } } } as any;
}

// ─── CrmResolver Tests ────────────────────────────────────────────────

describe('CrmResolver', () => {
  let resolver: CrmResolver;
  let repo: ReturnType<typeof buildMockRepo>;
  let cache: ReturnType<typeof buildMockCache>;
  let onboardingService: { assertLeadConvertible: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repo = buildMockRepo([
      makeLead({ id: 'lead-1', name: 'Alice', email: 'alice@test.com', status: LeadStatus.NEW, source: LeadSource.WEBSITE }),
      makeLead({ id: 'lead-2', name: 'Bob', email: 'bob@test.com', status: LeadStatus.CONVERTED, source: LeadSource.REFERRAL }),
      makeLead({ id: 'lead-3', name: 'Charlie', email: 'charlie@test.com', status: LeadStatus.NEW, source: LeadSource.WEBSITE }),
    ]);
    cache = buildMockCache();
    // CrmResolver signature: (cache, dataSource, leadRepo, customerRepo, onboardingRepo, onboardingService).
    // The query tests below don't touch the transaction path, so a minimal
    // dataSource mock is sufficient. The onboarding service is stubbed (its own
    // spec covers the cheque guard); here the guard simply allows conversion.
    const dataSourceMock = { transaction: async (cb: any) => cb(repo) } as any;
    onboardingService = { assertLeadConvertible: vi.fn(async () => {}) };
    resolver = new CrmResolver(cache as any, dataSourceMock, repo as any, repo as any, repo as any, onboardingService as any);
  });

  // ── Query: leads ──────────────────────────────────────────────────
  describe('Query.leads', () => {
    it('should return all leads when no filters', async () => {
      const leads = await resolver.leads(undefined);
      expect(leads).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const leads = await resolver.leads({ status: LeadStatus.NEW } as LeadFiltersInput);
      expect(leads).toHaveLength(2);
      expect(leads.every((l: Lead) => (l as any).status === LeadStatus.NEW)).toBe(true);
    });

    it('should filter by source', async () => {
      const leads = await resolver.leads({ source: LeadSource.REFERRAL } as LeadFiltersInput);
      expect(leads).toHaveLength(1);
      expect(leads[0].name).toBe('Bob');
    });

    it('should filter by centerId', async () => {
      const leads = await resolver.leads({ centerId: 'center-1' } as LeadFiltersInput);
      expect(leads.every((l: Lead) => (l as any).centerId === 'center-1')).toBe(true);
    });

    it('should filter by assignedToId', async () => {
      const leads = await resolver.leads({ assignedToId: 'user-1' } as LeadFiltersInput);
      expect(leads.every((l: Lead) => (l as any).assignedToId === 'user-1')).toBe(true);
    });

    it('should search by name (case-insensitive LIKE)', async () => {
      const leads = await resolver.leads({ search: 'ali' } as LeadFiltersInput);
      expect(leads.some((l: Lead) => (l as any).name === 'Alice')).toBe(true);
    });

    it('should respect limit and skip (pagination)', async () => {
      const all = await resolver.leads({ limit: 2, offset: 1 } as LeadFiltersInput);
      expect(all).toHaveLength(2);
    });

    it('should combine multiple filters', async () => {
      const leads = await resolver.leads({
        status: LeadStatus.NEW,
        source: LeadSource.WEBSITE,
      } as LeadFiltersInput);
      expect(leads).toHaveLength(2);
    });
  });

  // ── Query: lead(id) ───────────────────────────────────────────────
  describe('Query.lead', () => {
    it('should return a lead by ID', async () => {
      const lead = await resolver.lead('lead-1');
      expect(lead).toBeDefined();
      expect(lead!.name).toBe('Alice');
      expect(lead!.email).toBe('alice@test.com');
    });

    it('should return null for nonexistent ID', async () => {
      const lead = await resolver.lead('does-not-exist');
      expect(lead).toBeNull();
    });
  });

  // ── Query: leadCount ──────────────────────────────────────────────
  describe('Query.leadCount', () => {
    it('should return total count with no status filter', async () => {
      const count = await resolver.leadCount();
      expect(count).toBe(3);
    });

    it('should return count for specific status', async () => {
      expect(await resolver.leadCount(LeadStatus.NEW)).toBe(2);
      expect(await resolver.leadCount(LeadStatus.CONVERTED)).toBe(1);
    });
  });

  // ── Mutation: createLead ──────────────────────────────────────────
  describe('Mutation.createLead', () => {
    it('should create a lead and auto-assign from context user', async () => {
      const input: CreateLeadInput = {
        name: 'Dana',
        email: 'dana@test.com',
        status: LeadStatus.NEW,
        source: LeadSource.WALK_IN,
        requirement: 'Private cabin',
      };

      const lead = await resolver.createLead(input, makeContext('user-5'));
      expect(lead).toBeDefined();
      expect(lead.name).toBe('Dana');
      expect(lead.email).toBe('dana@test.com');
      expect((lead as any).status).toBe(LeadStatus.NEW);
      expect((lead as any).source).toBe(LeadSource.WALK_IN);
    });

    it('should invalidate lead cache pattern on create', async () => {
      await resolver.createLead(
        { name: 'Cache', email: 'cache@test.com', status: LeadStatus.NEW, source: LeadSource.WEBSITE } as CreateLeadInput,
        makeContext('user-1'),
      );
      expect(cache.invalidatePattern).toHaveBeenCalledWith('leads:*');
    });
  });

  // ── Mutation: updateLead ──────────────────────────────────────────
  describe('Mutation.updateLead', () => {
    it('should update lead fields', async () => {
      const updated = await resolver.updateLead('lead-1', {
        name: 'Alice Updated',
        status: LeadStatus.VISITED,
        notes: 'Called — interested in annual plan',
      } as UpdateLeadInput);

      expect(updated.name).toBe('Alice Updated');
      expect((updated as any).status).toBe(LeadStatus.VISITED);
      expect(updated.notes).toBe('Called — interested in annual plan');
    });

    it('should invalidate cache on update', async () => {
      await resolver.updateLead('lead-1', { name: 'X' } as UpdateLeadInput);
      expect(cache.invalidatePattern).toHaveBeenCalledWith('leads:*');
      expect(cache.del).toHaveBeenCalledWith('lead:lead-1');
    });

    it('cannot be used to flip a cheque-pending lead to Converted by hand (cheque clients stay cold)', async () => {
      onboardingService.assertLeadConvertible.mockRejectedValueOnce(
        new Error('This lead has a cheque awaiting clearance'),
      );
      await expect(
        resolver.updateLead('lead-1', { status: LeadStatus.CONVERTED } as UpdateLeadInput),
      ).rejects.toThrow(/cheque awaiting clearance/);
      expect(onboardingService.assertLeadConvertible).toHaveBeenCalledWith('lead-1');
      // nothing was written: the lead is still New
      const lead = await resolver.lead('lead-1');
      expect((lead as any).status).toBe(LeadStatus.NEW);
    });

    it('still allows Converted when no cheque is pending', async () => {
      const updated = await resolver.updateLead('lead-1', { status: LeadStatus.CONVERTED } as UpdateLeadInput);
      expect((updated as any).status).toBe(LeadStatus.CONVERTED);
      expect(onboardingService.assertLeadConvertible).toHaveBeenCalledWith('lead-1');
    });

    it('does not consult the payment guard for other status moves', async () => {
      await resolver.updateLead('lead-1', { status: LeadStatus.NEGOTIATION } as UpdateLeadInput);
      expect(onboardingService.assertLeadConvertible).not.toHaveBeenCalled();
    });
  });

  // ── Mutation: convertLead ─────────────────────────────────────────
  describe('Mutation.convertLead', () => {
    it('should set status to CONVERTED', async () => {
      const converted = await resolver.convertLead('lead-1');
      expect((converted as any).status).toBe('Converted');
    });

    it('should invalidate cache on convert', async () => {
      await resolver.convertLead('lead-1');
      expect(cache.invalidatePattern).toHaveBeenCalledWith('leads:*');
    });

    it('refuses to convert a lead whose cheque is still clearing (cheque clients stay cold)', async () => {
      onboardingService.assertLeadConvertible.mockRejectedValueOnce(
        new Error('This lead has a cheque awaiting clearance'),
      );
      await expect(resolver.convertLead('lead-1')).rejects.toThrow(/cheque awaiting clearance/);
      // nothing was written: the lead is still New
      const lead = await resolver.lead('lead-1');
      expect((lead as any).status).toBe(LeadStatus.NEW);
    });

    it('still lets an already-converted lead pass idempotently without re-checking', async () => {
      const result = await resolver.convertLead('lead-2'); // seeded as CONVERTED
      expect((result as any).status).toBe(LeadStatus.CONVERTED);
      expect(onboardingService.assertLeadConvertible).not.toHaveBeenCalled();
    });
  });

  describe('Mutation.convertLeadWithOnboarding', () => {
    it('refuses to convert a lead whose cheque is still clearing', async () => {
      onboardingService.assertLeadConvertible.mockRejectedValueOnce(
        new Error('This lead has a cheque awaiting clearance'),
      );
      await expect(resolver.convertLeadWithOnboarding('lead-1')).rejects.toThrow(/cheque awaiting clearance/);
      expect(onboardingService.assertLeadConvertible).toHaveBeenCalledWith('lead-1');
    });
  });

  // ── Mutation: deleteLead ──────────────────────────────────────────
  describe('Mutation.deleteLead', () => {
    it('should delete an existing lead and return true', async () => {
      const result = await resolver.deleteLead('lead-1');
      expect(result).toBe(true);
    });

    it('should invalidate cache on delete', async () => {
      await resolver.deleteLead('lead-1');
      expect(cache.invalidatePattern).toHaveBeenCalledWith('leads:*');
      expect(cache.del).toHaveBeenCalledWith('lead:lead-1');
    });

    it('should return true even for nonexistent ID', async () => {
      const result = await resolver.deleteLead('ghost-id');
      expect(result).toBe(true);
    });
  });

  // ── Lead lifecycle ────────────────────────────────────────────────
  describe('Lead lifecycle transitions', () => {
    it('should advance New → Visited → Negotiation → Converted', async () => {
      // Create
      const created = await resolver.createLead(
        { name: 'Lifecycle', email: 'lc@test.com', status: LeadStatus.NEW, source: LeadSource.WEBSITE } as CreateLeadInput,
        makeContext('user-1'),
      );
      expect((created as any).status).toBe(LeadStatus.NEW);

      // Visit
      const visited = await resolver.updateLead(created.id, { status: LeadStatus.VISITED } as UpdateLeadInput);
      expect((visited as any).status).toBe(LeadStatus.VISITED);

      // Negotiate
      const negotiating = await resolver.updateLead(created.id, { status: LeadStatus.NEGOTIATION } as UpdateLeadInput);
      expect((negotiating as any).status).toBe(LeadStatus.NEGOTIATION);

      // Convert
      const converted = await resolver.convertLead(created.id);
      expect((converted as any).status).toBe('Converted');
    });
  });

  // ── Access by id is center-scoped ─────────────────────────────────
  // Role gating (staff only) is covered in staff-only-resolvers.spec.ts. Among
  // staff, a CENTER_MANAGER may only touch their own center's leads — by id as
  // well as in lists — and a manager with no center must not become unrestricted.
  describe('access by id is center-scoped', () => {
    const user = (role: UserRole, centerId: string | null): any => ({
      sub: `u-${role}`,
      email: 'u@x.test',
      role,
      centerId,
      sid: 's',
      typ: 'access',
    });
    const MGR_1 = user(UserRole.CENTER_MANAGER, 'center-1');
    const MGR_NO_CENTER = user(UserRole.CENTER_MANAGER, null);
    const SUPER = user(UserRole.SUPER_ADMIN, null);
    const ctx = (u: any) => ({ req: { user: u } }) as any;

    beforeEach(async () => {
      await repo.save(makeLead({ id: 'lead-other', name: 'Other', centerId: 'center-2' }));
      await repo.save(makeLead({ id: 'lead-nocenter', name: 'Orphan', centerId: null }));
    });

    it('lead(): a manager reads their own center only; a super admin reads any', async () => {
      await expect(resolver.lead('lead-1', MGR_1)).resolves.toMatchObject({ id: 'lead-1' });
      await expect(resolver.lead('lead-other', MGR_1)).rejects.toThrow(ForbiddenException);
      await expect(resolver.lead('lead-nocenter', MGR_1)).rejects.toThrow(ForbiddenException);
      await expect(resolver.lead('lead-other', SUPER)).resolves.toMatchObject({ id: 'lead-other' });
      await expect(resolver.lead('ghost', MGR_1)).resolves.toBeNull();
    });

    it('updateLead(): a manager cannot edit another center\'s lead, nor move one of theirs away', async () => {
      await expect(resolver.updateLead('lead-other', { name: 'Hacked' } as UpdateLeadInput, MGR_1)).rejects.toThrow(ForbiddenException);
      expect(((await resolver.lead('lead-other', SUPER)) as any).name).toBe('Other');

      await expect(resolver.updateLead('lead-1', { centerId: 'center-2' } as UpdateLeadInput, MGR_1)).rejects.toThrow(ForbiddenException);
      expect(((await resolver.lead('lead-1', SUPER)) as any).centerId).toBe('center-1');

      const ok = await resolver.updateLead('lead-1', { name: 'Alice 2' } as UpdateLeadInput, MGR_1);
      expect(ok.name).toBe('Alice 2');
    });

    it('deleteLead(): a manager cannot delete another center\'s lead; deleting a missing one stays a harmless no-op', async () => {
      await expect(resolver.deleteLead('lead-other', MGR_1)).rejects.toThrow(ForbiddenException);
      await expect(resolver.lead('lead-other', SUPER)).resolves.toMatchObject({ id: 'lead-other' });

      await expect(resolver.deleteLead('lead-1', MGR_1)).resolves.toBe(true);
      await expect(resolver.deleteLead('ghost-id', MGR_1)).resolves.toBe(true);
    });

    it('convertLead(): a manager cannot convert another center\'s lead', async () => {
      await expect(resolver.convertLead('lead-other', MGR_1)).rejects.toThrow(ForbiddenException);
      expect(onboardingService.assertLeadConvertible).not.toHaveBeenCalled();
      expect(((await resolver.lead('lead-other', SUPER)) as any).status).toBe(LeadStatus.NEW);
    });

    it('convertLeadWithOnboarding(): a manager cannot convert another center\'s lead', async () => {
      // id + every optional @Args + the caller, whatever their count
      const call = (id: string, caller: any) => {
        const args: any[] = Array(resolver.convertLeadWithOnboarding.length).fill(undefined);
        args[0] = id;
        args[args.length - 1] = caller;
        return (resolver.convertLeadWithOnboarding as any)(...args);
      };
      await expect(call('lead-other', MGR_1)).rejects.toThrow(ForbiddenException);
      expect(onboardingService.assertLeadConvertible).not.toHaveBeenCalled();
    });

    it('createLead(): a manager always creates in their own center and cannot name another one', async () => {
      const own = await resolver.createLead({ name: 'N', email: 'n@x.test' } as CreateLeadInput, ctx(MGR_1));
      expect((own as any).centerId).toBe('center-1');

      await expect(
        resolver.createLead({ name: 'M', email: 'm@x.test', centerId: 'center-2' } as CreateLeadInput, ctx(MGR_1)),
      ).rejects.toThrow(ForbiddenException);

      const picked = await resolver.createLead({ name: 'S', email: 's@x.test', centerId: 'center-9' } as CreateLeadInput, ctx(SUPER));
      expect((picked as any).centerId).toBe('center-9');
    });

    it('a manager with no center is refused instead of becoming unrestricted', async () => {
      await expect(resolver.leads(undefined, MGR_NO_CENTER)).rejects.toThrow(/not assigned to a center/);
      await expect(resolver.leadCount(undefined, MGR_NO_CENTER)).rejects.toThrow(ForbiddenException);
      await expect(resolver.lead('lead-1', MGR_NO_CENTER)).rejects.toThrow(ForbiddenException);
    });
  });
});
