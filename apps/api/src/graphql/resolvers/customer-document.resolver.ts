/**
 * File:        apps/api/src/graphql/resolvers/customer-document.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     CustomerDocument CRUD (list/create/update/delete).
 *              Backs the "Documents" tab on the customer detail page.
 *
 *              Documents are ID proofs, GST certificates and agreements, so this is
 *              staff-only (SUPER_ADMIN, CENTER_MANAGER) and a document inherits its
 *              customer's center: a manager can only list, add, edit or delete the
 *              documents of customers in their own center.
 *
 * Author:      AmanVatsSharma (original) · Claude Sonnet 5.5 (access control)
 * Last-updated: 2026-10-03
 */
import { Resolver, Query, Args, Mutation, ID } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '@enums';
import { CustomerDocument } from '../../typeorm/entities/customer-document.entity';
import { Customer } from '../../typeorm/entities/customer.entity';
import {
  CreateCustomerDocumentInput,
  UpdateCustomerDocumentInput,
} from '../inputs/customer-document.input';
import { CacheService } from '../../cache/cache.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { assertCenterAccess } from '../../auth/helpers/center-scope.helper';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Resolver(() => CustomerDocument)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.CENTER_MANAGER)
export class CustomerDocumentResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(CustomerDocument)
    private documentRepo: Repository<CustomerDocument>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  /** The customer must exist, and a manager must own its center. */
  private async assertCustomerAccess(customerId: string, caller?: JwtPayload): Promise<void> {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    assertCenterAccess(caller, customer.centerId, 'customer');
  }

  /**
   * For a document that already exists: its customer's center decides. A document
   * whose customer is gone has no center, so only a super admin can touch it.
   */
  private async assertDocumentAccess(doc: CustomerDocument, caller?: JwtPayload): Promise<void> {
    const customer = await this.customerRepo.findOne({ where: { id: doc.customerId } });
    assertCenterAccess(caller, customer?.centerId ?? null, 'customer');
  }

  @Query(() => [CustomerDocument])
  async customerDocuments(
    @Args('customerId', { type: () => ID }) customerId: string,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<CustomerDocument[]> {
    await this.assertCustomerAccess(customerId, caller);
    return this.documentRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  @Mutation(() => CustomerDocument)
  async createCustomerDocument(
    @Args('input') input: CreateCustomerDocumentInput,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<CustomerDocument> {
    await this.assertCustomerAccess(input.customerId, caller);
    const created = this.documentRepo.create({
      ...input,
      uploadedAt: new Date(),
    });
    const saved = await this.documentRepo.save(created);
    await this.cache.invalidatePattern('customer:*');
    return saved as unknown as CustomerDocument;
  }

  @Mutation(() => CustomerDocument)
  async updateCustomerDocument(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCustomerDocumentInput,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<CustomerDocument> {
    const existing = await this.documentRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Document not found');
    await this.assertDocumentAccess(existing, caller);
    await this.documentRepo.update(id, input as any);
    const updated = await this.documentRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Document not found');
    await this.cache.invalidatePattern('customer:*');
    return updated;
  }

  @Mutation(() => Boolean)
  async deleteCustomerDocument(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<boolean> {
    // Deleting a document that does not exist stays a harmless `false`.
    const existing = await this.documentRepo.findOne({ where: { id } });
    if (existing) await this.assertDocumentAccess(existing, caller);
    const result = await this.documentRepo.delete(id);
    await this.cache.invalidatePattern('customer:*');
    return (result.affected ?? 0) > 0;
  }
}
