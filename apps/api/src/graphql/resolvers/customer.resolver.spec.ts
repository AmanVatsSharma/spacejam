/**
 * File:        apps/api/src/graphql/resolvers/customer.resolver.spec.ts
 * Module:      API · GraphQL Resolvers · Customers · Tests
 * Purpose:     Center scoping of the customer resolver. Role gating (staff only) is
 *              covered in staff-only-resolvers.spec.ts; among staff, a CENTER_MANAGER
 *              may only touch their own center's customers — by id as well as in
 *              lists — and a manager with no center must not become unrestricted.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-03
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@enums';
import { CustomerResolver } from './customer.resolver';

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

function build() {
  const data: any[] = [
    { id: 'c-1', name: 'Own', centerId: 'center-1' },
    { id: 'c-other', name: 'Other', centerId: 'center-2' },
    { id: 'c-orphan', name: 'Orphan', centerId: null },
  ];
  // query builder used by customerDeposits / customerContracts / customerInvoices
  const qb: any = {
    leftJoinAndSelect: () => qb,
    where: () => qb,
    orderBy: () => qb,
    getMany: async () => [{ deposits: [], contracts: [], invoices: [] }],
  };
  const customerRepo = {
    findOne: vi.fn(async (opts: any) => data.find((c) => c.id === opts?.where?.id) ?? null),
    find: vi.fn(async () => [...data]),
    count: vi.fn(async () => data.length),
    update: vi.fn(async (id: string, dto: any) => {
      const c = data.find((x) => x.id === id);
      if (c) Object.assign(c, dto);
      return { affected: c ? 1 : 0 };
    }),
    delete: vi.fn(async (id: string) => {
      const i = data.findIndex((x) => x.id === id);
      if (i >= 0) data.splice(i, 1);
      return { affected: i >= 0 ? 1 : 0 };
    }),
    createQueryBuilder: vi.fn(() => qb),
  };
  const onboardingRepo = { delete: vi.fn(async () => ({ affected: 0 })) };
  const dataSource = { transaction: vi.fn(async (cb: any) => cb({})) };
  const cache = { invalidatePattern: vi.fn(async () => {}), del: vi.fn(async () => {}) };
  const resolver = new CustomerResolver(cache as any, dataSource as any, customerRepo as any, onboardingRepo as any);
  return { resolver, customerRepo, onboardingRepo, dataSource, data };
}

describe('CustomerResolver — access is center-scoped', () => {
  let h: ReturnType<typeof build>;
  beforeEach(() => {
    h = build();
  });

  it('customer(): a manager reads their own center only; a super admin reads any', async () => {
    await expect(h.resolver.customer('c-1', MGR_1)).resolves.toMatchObject({ id: 'c-1' });
    await expect(h.resolver.customer('c-other', MGR_1)).rejects.toThrow(ForbiddenException);
    await expect(h.resolver.customer('c-orphan', MGR_1)).rejects.toThrow(ForbiddenException);
    await expect(h.resolver.customer('c-other', SUPER)).resolves.toMatchObject({ id: 'c-other' });
    await expect(h.resolver.customer('ghost', MGR_1)).resolves.toBeNull();
  });

  it('updateCustomer(): a manager cannot edit another center\'s customer, nor move one of theirs away', async () => {
    await expect(h.resolver.updateCustomer('c-other', { name: 'Hacked' } as any, MGR_1)).rejects.toThrow(ForbiddenException);
    expect(h.customerRepo.update).not.toHaveBeenCalled();

    await expect(h.resolver.updateCustomer('c-1', { centerId: 'center-2' } as any, MGR_1)).rejects.toThrow(ForbiddenException);
    expect(h.customerRepo.update).not.toHaveBeenCalled();

    const ok = await h.resolver.updateCustomer('c-1', { name: 'Own 2' } as any, MGR_1);
    expect(ok.name).toBe('Own 2');
  });

  it('deleteCustomer(): a manager cannot delete another center\'s customer — nothing is removed', async () => {
    await expect(h.resolver.deleteCustomer('c-other', MGR_1)).rejects.toThrow(ForbiddenException);
    expect(h.onboardingRepo.delete).not.toHaveBeenCalled();
    expect(h.customerRepo.delete).not.toHaveBeenCalled();

    await expect(h.resolver.deleteCustomer('c-1', MGR_1)).resolves.toBe(true);
    expect(h.customerRepo.delete).toHaveBeenCalledWith('c-1');
  });

  it('createCustomer(): a manager cannot create in another center — refused before anything is written', async () => {
    await expect(
      h.resolver.createCustomer({ name: 'X', email: 'x@x.test', centerId: 'center-2' } as any, MGR_1),
    ).rejects.toThrow(ForbiddenException);
    expect(h.dataSource.transaction).not.toHaveBeenCalled();
  });

  it.each([
    ['customerDeposits', (r: CustomerResolver, id: string, c: any) => r.customerDeposits(id, c)],
    ['customerContracts', (r: CustomerResolver, id: string, c: any) => r.customerContracts(id, c)],
    ['customerInvoices', (r: CustomerResolver, id: string, c: any) => r.customerInvoices(id, c)],
  ])('%s(): own center only — other centers and center-less customers are refused', async (_n, call) => {
    await expect(call(h.resolver, 'c-1', MGR_1)).resolves.toEqual([]);
    await expect(call(h.resolver, 'c-other', MGR_1)).rejects.toThrow(ForbiddenException);
    await expect(call(h.resolver, 'c-orphan', MGR_1)).rejects.toThrow(ForbiddenException);
    await expect(call(h.resolver, 'c-other', SUPER)).resolves.toEqual([]);
  });

  it('a manager with no center is refused instead of becoming unrestricted', async () => {
    await expect(h.resolver.customers(undefined, MGR_NO_CENTER)).rejects.toThrow(/not assigned to a center/);
    await expect(h.resolver.customerCount(undefined, MGR_NO_CENTER)).rejects.toThrow(ForbiddenException);
    await expect(h.resolver.customer('c-1', MGR_NO_CENTER)).rejects.toThrow(ForbiddenException);
  });
});
