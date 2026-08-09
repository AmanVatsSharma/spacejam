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
import { ForbiddenException } from '@nestjs/common';
import { CustomerEmployee } from '../../typeorm/entities/customer-employee.entity';
import { Customer } from '../../typeorm/entities/customer.entity';
import {
  CreateCustomerEmployeeInput,
  UpdateCustomerEmployeeInput,
} from '../inputs/customer-employee.input';
import { CacheService } from '../../cache/cache.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { centerScope } from '../../auth/helpers/center-scope.helper';
import { EmailService } from '../../auth/services/email.service';
import { Logger } from '@nestjs/common';

@Resolver(() => CustomerEmployee)
export class CustomerEmployeeResolver {
  private readonly logger = new Logger(CustomerEmployeeResolver.name);

  constructor(
    private cache: CacheService,
    @InjectRepository(CustomerEmployee)
    private employeeRepo: Repository<CustomerEmployee>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    private readonly emailService: EmailService,
  ) {}

  @Query(() => [CustomerEmployee])
  async customerEmployees(
    @Args('customerId', { type: () => ID }) customerId: string,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<CustomerEmployee[]> {
    // Center managers may only list employees of customers in their center.
    await this.assertCenterAccess(customerId, caller);
    return this.employeeRepo.find({
      where: { customerId },
      relations: ['seat'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Reject if a center manager tries to access a customer in another center. */
  private async assertCenterAccess(customerId: string, caller?: JwtPayload): Promise<void> {
    const scope = caller ? centerScope(caller) : undefined;
    if (!scope) return; // super admin / no scope → allow.
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (customer && customer.centerId && customer.centerId !== scope) {
      throw new ForbiddenException('This customer belongs to a different center.');
    }
  }

  @Mutation(() => CustomerEmployee)
  async createCustomerEmployee(
    @Args('input') input: CreateCustomerEmployeeInput,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<CustomerEmployee> {
    // Center managers can only add employees to customers in their center.
    await this.assertCenterAccess(input.customerId, caller);
    const created = this.employeeRepo.create({
      ...input,
      role: input.role ?? 'Member',
      status: input.status ?? 'invited',
      invitedAt: new Date(),
    });
    const saved = await this.employeeRepo.save(created);
    await this.cache.invalidatePattern('customer:*');

    // Send the invite email (logs to console until SMTP is configured).
    const customer = await this.customerRepo.findOne({ where: { id: input.customerId } });
    const companyName = customer?.name ?? 'SpaceJam';
    if (input.email) {
      void this.emailService
        .sendEmployeeInvite({ to: input.email, employeeName: input.name, companyName })
        .catch((err) => this.logger.warn(`employee invite email to ${input.email} failed: ${err}`));
    }
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
