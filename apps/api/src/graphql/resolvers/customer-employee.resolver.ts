/**
 * File:        apps/api/src/graphql/resolvers/customer-employee.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     CustomerEmployee CRUD + seat assignment + invite flow.
 *              Backs the "Team Members" tab on the customer detail page.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-24
 */
import { Resolver, Query, Args, Mutation, ID } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEmployee } from '../../typeorm/entities/customer-employee.entity';
import {
  CreateCustomerEmployeeInput,
  UpdateCustomerEmployeeInput,
} from '../inputs/customer-employee.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => CustomerEmployee)
export class CustomerEmployeeResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(CustomerEmployee)
    private employeeRepo: Repository<CustomerEmployee>,
  ) {}

  @Query(() => [CustomerEmployee])
  async customerEmployees(
    @Args('customerId', { type: () => ID }) customerId: string,
  ): Promise<CustomerEmployee[]> {
    return this.employeeRepo.find({
      where: { customerId },
      relations: ['seat'],
      order: { createdAt: 'DESC' },
    });
  }

  @Mutation(() => CustomerEmployee)
  async createCustomerEmployee(
    @Args('input') input: CreateCustomerEmployeeInput,
  ): Promise<CustomerEmployee> {
    const created = this.employeeRepo.create({
      ...input,
      role: input.role ?? 'Member',
      status: input.status ?? 'invited',
      invitedAt: new Date(),
    });
    const saved = await this.employeeRepo.save(created);
    await this.cache.invalidatePattern('customer:*');
    // NOTE: a real email invite requires SMTP (EmailService logs to console
    // until SMTP_HOST is configured). The invitation is recorded here;
    // delivery is handled by the email layer if configured.
    return saved as unknown as CustomerEmployee;
  }

  @Mutation(() => CustomerEmployee)
  async updateCustomerEmployee(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCustomerEmployeeInput,
  ): Promise<CustomerEmployee> {
    await this.employeeRepo.update(id, input as any);
    const updated = await this.employeeRepo.findOne({
      where: { id },
      relations: ['seat'],
    });
    if (!updated) throw new Error('Employee not found');
    await this.cache.invalidatePattern('customer:*');
    return updated;
  }

  @Mutation(() => Boolean)
  async deleteCustomerEmployee(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const result = await this.employeeRepo.delete(id);
    await this.cache.invalidatePattern('customer:*');
    return (result.affected ?? 0) > 0;
  }

  /** Mark an invited employee as joined (e.g. after they accept). */
  @Mutation(() => CustomerEmployee)
  async acceptEmployeeInvite(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<CustomerEmployee> {
    await this.employeeRepo.update(id, { status: 'active', joinedAt: new Date() });
    const updated = await this.employeeRepo.findOne({
      where: { id },
      relations: ['seat'],
    });
    if (!updated) throw new Error('Employee not found');
    await this.cache.invalidatePattern('customer:*');
    return updated;
  }
}
