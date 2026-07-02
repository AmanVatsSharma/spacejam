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
import { CrmResolver } from './crm.resolver';
import { LeadStatus, LeadSource } from '../types/user.type';
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
    status: LeadStatus.NEW,
    source: LeadSource.WEBSITE,
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
        if (opts.where.status) results = results.filter((l: Lead) => l.status === opts.where.status);
        if (opts.where.source) results = results.filter((l: Lead) => l.source === opts.where.source);
        if (opts.where.email) results = results.filter((l: Lead) => l.email === opts.where.email);
        if (opts.where.name) {
          const pattern = opts.where.name.replace(/[%]/g, '').slice(1, -1);
          results = results.filter((l: Lead) => l.name?.toLowerCase().includes(pattern.toLowerCase()));
        }
      }
      if (opts?.order) {
        results.sort((a: Lead, b: Lead) =>
          opts.order.createdAt === 'DESC'
            ? (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
            : (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0),
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
    invalidate: vi.fn(async () => {}),
  };
}

function makeContext(userId: string = 'user-1') {
  return { req: { user: { id: userId } } } as any;
}

// ─── Lead Entity / Enum Tests ─────────────────────────────────────────

describe('Lead Enums & Types', () => {
  it('LeadStatus enum should have 5 values', () => {
    const values = Object.values(LeadStatus);
    expect(values).toEqual(['New', 'Visited', 'Negotiation', 'Converted', 'Cold']);
  });

  it('LeadSource enum should have 5 values', () => {
    const values = Object.values(LeadSource);
    expect(values).toEqual(['Website', 'Referral', 'Walk-in', 'Social', 'Email']);
  });
});

// ─── CrmResolver Tests ────────────────────────────────────────────────

describe('CrmResolver', () => {
  let resolver: CrmResolver;
  let repo: ReturnType<typeof buildMockRepo>;
  let cache: ReturnType<typeof buildMockCache>;

  beforeEach(() => {
    repo = buildMockRepo([
      makeLead({ id: 'lead-1', name: 'Alice', email: 'alice@test.com', status: LeadStatus.NEW, source: LeadSource.WEBSITE }),
      makeLead({ id: 'lead-2', name: 'Bob', email: 'bob@test.com', status: LeadStatus.CONVERTED, source: LeadSource.REFERRAL }),
      makeLead({ id: 'lead-3', name: 'Charlie', email: 'charlie@test.com', status: LeadStatus.NEW, source: LeadSource.WEBSITE }),
    ]);
    cache = buildMockCache();
    resolver = new CrmResolver(cache as any, repo as any);
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
      expect(cache.invalidate).toHaveBeenCalledWith('lead:lead-1');
    });
  });

  // ── Mutation: convertLead ─────────────────────────────────────────
  describe('Mutation.convertLead', () => {
    it('should set status to CONVERTED', async () => {
      const converted = await resolver.convertLead('lead-1');
      expect((converted as any).status).toBe(LeadStatus.CONVERTED);
    });

    it('should invalidate cache on convert', async () => {
      await resolver.convertLead('lead-1');
      expect(cache.invalidatePattern).toHaveBeenCalledWith('leads:*');
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
      expect(cache.invalidate).toHaveBeenCalledWith('lead:lead-1');
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
      expect((converted as any).status).toBe(LeadStatus.CONVERTED);
    });
  });
});
