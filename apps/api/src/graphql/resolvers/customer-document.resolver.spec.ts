/**
 * File:        apps/api/src/graphql/resolvers/customer-document.resolver.spec.ts
 * Module:      API · GraphQL Resolvers · Customer documents · Tests
 * Purpose:     Customer documents are ID proofs, GST certificates and agreements —
 *              the most sensitive files the app holds. Role gating (staff only) is
 *              covered in staff-only-resolvers.spec.ts; among staff, a CENTER_MANAGER
 *              may only list, add, edit or delete documents of customers in their
 *              own center. A document inherits its customer's center.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-03
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@enums';
import { CustomerDocumentResolver } from './customer-document.resolver';

const user = (role: UserRole, centerId: string | null): any => ({
  sub: `u-${role}`,
  email: 'u@x.test',
  role,
  centerId,
  sid: 's',
  typ: 'access',
});
const MGR_1 = user(UserRole.CENTER_MANAGER, 'center-1');
const SUPER = user(UserRole.SUPER_ADMIN, null);

function build() {
  const customers = [
    { id: 'c-1', centerId: 'center-1' },
    { id: 'c-other', centerId: 'center-2' },
    { id: 'c-orphan', centerId: null },
  ];
  const docs: any[] = [
    { id: 'd-1', customerId: 'c-1', name: 'PAN' },
    { id: 'd-other', customerId: 'c-other', name: 'Aadhaar' },
  ];
  const documentRepo = {
    find: vi.fn(async (opts: any) => docs.filter((d) => d.customerId === opts?.where?.customerId)),
    findOne: vi.fn(async (opts: any) => docs.find((d) => d.id === opts?.where?.id) ?? null),
    create: vi.fn((dto: any) => ({ ...dto })),
    save: vi.fn(async (e: any) => {
      const saved = { id: `d-${docs.length + 1}`, ...e };
      docs.push(saved);
      return saved;
    }),
    update: vi.fn(async (id: string, dto: any) => {
      const d = docs.find((x) => x.id === id);
      if (d) Object.assign(d, dto);
      return { affected: d ? 1 : 0 };
    }),
    delete: vi.fn(async (id: string) => {
      const i = docs.findIndex((x) => x.id === id);
      if (i >= 0) docs.splice(i, 1);
      return { affected: i >= 0 ? 1 : 0 };
    }),
  };
  const customerRepo = {
    findOne: vi.fn(async (opts: any) => customers.find((c) => c.id === opts?.where?.id) ?? null),
  };
  const cache = { invalidatePattern: vi.fn(async () => {}) };
  const resolver = new CustomerDocumentResolver(cache as any, documentRepo as any, customerRepo as any);
  return { resolver, documentRepo, docs };
}

const newDoc = (customerId: string): any => ({
  customerId,
  name: 'GST certificate',
  documentType: 'gst',
  fileUrl: '/uploads/gst.pdf',
});

describe('CustomerDocumentResolver — access follows the customer\'s center', () => {
  let h: ReturnType<typeof build>;
  beforeEach(() => {
    h = build();
  });

  it('customerDocuments(): a manager lists their own center\'s customers only', async () => {
    await expect(h.resolver.customerDocuments('c-1', MGR_1)).resolves.toHaveLength(1);
    await expect(h.resolver.customerDocuments('c-other', MGR_1)).rejects.toThrow(ForbiddenException);
    await expect(h.resolver.customerDocuments('c-orphan', MGR_1)).rejects.toThrow(ForbiddenException);
    await expect(h.resolver.customerDocuments('c-other', SUPER)).resolves.toHaveLength(1);
  });

  it('customerDocuments(): an unknown customer is a 404, not an empty list', async () => {
    await expect(h.resolver.customerDocuments('ghost', SUPER)).rejects.toThrow(NotFoundException);
  });

  it('createCustomerDocument(): a manager cannot attach a file to another center\'s customer — nothing is saved', async () => {
    await expect(h.resolver.createCustomerDocument(newDoc('c-other'), MGR_1)).rejects.toThrow(ForbiddenException);
    expect(h.documentRepo.save).not.toHaveBeenCalled();

    const ok = await h.resolver.createCustomerDocument(newDoc('c-1'), MGR_1);
    expect(ok.customerId).toBe('c-1');
  });

  it('updateCustomerDocument(): a manager cannot edit another center\'s document', async () => {
    await expect(h.resolver.updateCustomerDocument('d-other', { name: 'Hacked' } as any, MGR_1)).rejects.toThrow(ForbiddenException);
    expect(h.documentRepo.update).not.toHaveBeenCalled();

    const ok = await h.resolver.updateCustomerDocument('d-1', { name: 'PAN card' } as any, MGR_1);
    expect(ok.name).toBe('PAN card');
  });

  it('updateCustomerDocument(): a missing document is a 404', async () => {
    await expect(h.resolver.updateCustomerDocument('ghost', { name: 'x' } as any, SUPER)).rejects.toThrow(NotFoundException);
  });

  it('deleteCustomerDocument(): a manager cannot delete another center\'s document; a missing one is simply false', async () => {
    await expect(h.resolver.deleteCustomerDocument('d-other', MGR_1)).rejects.toThrow(ForbiddenException);
    expect(h.documentRepo.delete).not.toHaveBeenCalled();

    await expect(h.resolver.deleteCustomerDocument('d-1', MGR_1)).resolves.toBe(true);
    await expect(h.resolver.deleteCustomerDocument('ghost', MGR_1)).resolves.toBe(false);
  });
});
