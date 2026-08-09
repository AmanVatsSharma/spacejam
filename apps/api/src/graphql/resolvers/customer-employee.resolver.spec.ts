/**
 * File:        apps/api/src/graphql/resolvers/customer-employee.resolver.spec.ts
 * Module:      API · GraphQL · Tests
 * Purpose:     Verifies the M-hardening center-scope enforcement on the
 *              CustomerEmployee resolver: a CENTER_MANAGER can list/create
 *              employees only for customers in their own center, while a
 *              super admin (no scope) can access any customer.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi as jest, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CustomerEmployeeResolver } from './customer-employee.resolver';
import { CustomerEmployee } from '../../typeorm/entities/customer-employee.entity';
import { Customer } from '../../typeorm/entities/customer.entity';
import { CacheService } from '../../cache/cache.service';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

const MANAGER = { sub: 'mgr-1', role: 'CENTER_MANAGER', centerId: 'center-A' } as JwtPayload;
const SUPER_ADMIN = { sub: 'admin-1', role: 'SUPER_ADMIN' } as JwtPayload;

describe('CustomerEmployeeResolver — center scoping (hardening)', () => {
  let resolver: CustomerEmployeeResolver;
  let employeeRepo: any;
  let customerRepo: any;

  beforeEach(async () => {
    employeeRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'emp-1', ...x })),
    };
    customerRepo = { findOne: jest.fn() };
    const cache: Pick<CacheService, 'invalidatePattern'> = {
      invalidatePattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerEmployeeResolver,
        { provide: getRepositoryToken(CustomerEmployee), useValue: employeeRepo },
        { provide: getRepositoryToken(Customer), useValue: customerRepo },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    resolver = module.get(CustomerEmployeeResolver);
  });

  it('allows a CENTER_MANAGER to list employees of a customer in their center', async () => {
    customerRepo.findOne.mockResolvedValue({ id: 'cust-1', centerId: 'center-A' });
    await resolver.customerEmployees('cust-1', MANAGER);
    expect(employeeRepo.find).toHaveBeenCalled();
  });

  it('FORBIDS a CENTER_MANAGER from listing employees of another center\'s customer', async () => {
    customerRepo.findOne.mockResolvedValue({ id: 'cust-2', centerId: 'center-B' });
    await expect(resolver.customerEmployees('cust-2', MANAGER)).rejects.toThrow(
      ForbiddenException,
    );
    expect(employeeRepo.find).not.toHaveBeenCalled();
  });

  it('allows a SUPER_ADMIN (no scope) to list any customer\'s employees', async () => {
    customerRepo.findOne.mockResolvedValue({ id: 'cust-2', centerId: 'center-B' });
    await resolver.customerEmployees('cust-2', SUPER_ADMIN);
    expect(employeeRepo.find).toHaveBeenCalled();
  });

  it('forbids cross-center createEmployee', async () => {
    customerRepo.findOne.mockResolvedValue({ id: 'cust-2', centerId: 'center-B' });
    await expect(
      resolver.createCustomerEmployee(
        { customerId: 'cust-2', name: 'X', email: 'x@y' } as any,
        MANAGER,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(employeeRepo.save).not.toHaveBeenCalled();
  });
});
