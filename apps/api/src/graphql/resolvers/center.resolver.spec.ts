/**
 * File:        apps/api/src/graphql/resolvers/center.resolver.spec.ts
 * Module:      API · Center Resolver Tests
 * Purpose:     Unit tests for CenterResolver settings resolvers
 *              Uses mocked repositories and cache — no database required
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */

import { describe, it, expect, vi } from 'vitest';
import { CenterResolver } from './center.resolver';

// ─── Helpers ────────────────────────────────────────────────────────────

function buildMockCache() {
  return {
    getOrSet: vi.fn(async (_key: string, fetcher: () => Promise<any>) =>
      fetcher(),
    ),
    invalidatePattern: vi.fn(async () => {}),
    invalidatePatterns: vi.fn(async () => {}),
    del: vi.fn(async () => {}),
  };
}

function buildMockPubSub() {
  return {
    publish: vi.fn(async () => {}),
    asyncIterator: vi.fn(),
  };
}

function buildMockCenterRepo(seeds: any[] = []) {
  const data = [...seeds];
  return {
    find: vi.fn(async () => data),
    findOne: vi.fn(async (opts?: any) => {
      if (opts?.where?.id)
        return data.find((c) => c.id === opts.where.id) ?? null;
      return data[0] ?? null;
    }),
    update: vi.fn(async (_id: string, patch: any) => {
      const center = data.find((c) => c.id === _id);
      if (center) Object.assign(center, patch);
      return { affected: center ? 1 : 0 };
    }),
    save: vi.fn(async (entity: any) => {
      if (!entity.id) entity.id = `center-${data.length + 1}`;
      const idx = data.findIndex((c) => c.id === entity.id);
      if (idx >= 0) data[idx] = entity;
      else data.push(entity);
      return entity;
    }),
    create: vi.fn((dto: any) => dto),
  };
}

function makeCenter(overrides?: Partial<any>): any {
  return {
    id: 'center-1',
    name: 'Test Center',
    status: 'ACTIVE',
    settings: { finance: { verificationRequired: true } },
    location: null,
    floors: [],
    ...overrides,
  };
}

function makeResolver(centers: any[] = [makeCenter()]) {
  const cache = buildMockCache();
  const repo = buildMockCenterRepo(centers);
  const pubSub = buildMockPubSub();
  const resolver = new CenterResolver(cache, repo, {} as any, pubSub);
  return { resolver, cache, repo, pubSub };
}

// ─── Settings Resolver Tests ────────────────────────────────────────────

describe('CenterResolver — Settings', () => {
  // ── centerSettings query ────────────────────────────────────────────
  describe('centerSettings', () => {
    it('returns settings as JSON string when center has settings', async () => {
      const { resolver } = makeResolver([
        makeCenter({ id: 'c1', settings: { finance: { minDeposit: 5000 } } }),
      ]);
      const result = await resolver.centerSettings('c1');
      expect(result).toBe(JSON.stringify({ finance: { minDeposit: 5000 } }));
    });

    it('returns empty object JSON when center has no settings', async () => {
      const { resolver } = makeResolver([
        makeCenter({ id: 'c2', settings: null }),
      ]);
      const result = await resolver.centerSettings('c2');
      expect(result).toBe('{}');
    });

    it('returns empty object JSON when center does not exist', async () => {
      const { resolver } = makeResolver([]);
      const result = await resolver.centerSettings('ghost-id');
      expect(result).toBe('{}');
    });
  });

  // ── updateCenterSettings mutation ───────────────────────────────────
  describe('updateCenterSettings', () => {
    it('deep-merges partial settings without wiping sibling keys', async () => {
      const { resolver, cache } = makeResolver([
        makeCenter({
          id: 'c1',
          settings: {
            finance: { minDeposit: 5000 },
            security: { otpRequired: true },
          },
        }),
      ]);
      const result = await resolver.updateCenterSettings(
        'c1',
        JSON.stringify({ finance: { minDeposit: 10000 } }),
        {} as any,
      );
      const parsed = JSON.parse(result);
      expect(parsed.finance.minDeposit).toBe;
      expect(parsed.security.otpRequired).toBe(true);
    });

    it('returns merged settings as JSON string', async () => {
      const { resolver } = makeResolver([
        makeCenter({ id: 'c1', settings: {} }),
      ]);
      const incoming = { notifications: { emailEnabled: true } };
      const result = await resolver.updateCenterSettings(
        'c1',
        JSON.stringify(incoming),
        {} as any,
      );
      expect(JSON.parse(result)).toEqual({
        notifications: { emailEnabled: true },
      });
    });

    it('handles empty incoming settings gracefully', async () => {
      const { resolver } = makeResolver([
        makeCenter({ id: 'c1', settings: { finance: { minDeposit: 5000 } } }),
      ]);
      const result = await resolver.updateCenterSettings('c1', '{}', {} as any);
      expect(JSON.parse(result)).toEqual({ finance: { minDeposit: 5000 } });
    });

    it('throws NotFoundException for non-existent center', async () => {
      const { resolver } = makeResolver([]);
      await expect(
        resolver.updateCenterSettings(
          'ghost-id',
          JSON.stringify({ foo: 'bar' }),
          {} as any,
        ),
      ).rejects.toThrow('Center not found');
    });

    it('invalidates cache for the center after update', async () => {
      const { resolver, cache } = makeResolver([makeCenter({ id: 'c1' })]);
      await resolver.updateCenterSettings(
        'c1',
        JSON.stringify({ finance: {} }),
        {} as any,
      );
      expect(cache.invalidatePattern).toHaveBeenCalledWith('center:c1');
    });

    it('publishes centerUpdated event after update', async () => {
      const { resolver, pubSub } = makeResolver([makeCenter({ id: 'c1' })]);
      await resolver.updateCenterSettings(
        'c1',
        JSON.stringify({ finance: {} }),
        {} as any,
      );
      expect(pubSub.publish).toHaveBeenCalledWith(
        'center.updated',
        expect.objectContaining({ centerUpdated: expect.any(Object) }),
      );
    });
  });
});
