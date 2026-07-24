/**
 * File:        apps/api/src/graphql/resolvers/customer-document.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     CustomerDocument CRUD (list/create/update/delete).
 *              Backs the "Documents" tab on the customer detail page.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-24
 */
import { Resolver, Query, Args, Mutation, ID } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerDocument } from '../../typeorm/entities/customer-document.entity';
import {
  CreateCustomerDocumentInput,
  UpdateCustomerDocumentInput,
} from '../inputs/customer-document.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => CustomerDocument)
export class CustomerDocumentResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(CustomerDocument)
    private documentRepo: Repository<CustomerDocument>,
  ) {}

  @Query(() => [CustomerDocument])
  async customerDocuments(
    @Args('customerId', { type: () => ID }) customerId: string,
  ): Promise<CustomerDocument[]> {
    return this.documentRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  @Mutation(() => CustomerDocument)
  async createCustomerDocument(
    @Args('input') input: CreateCustomerDocumentInput,
  ): Promise<CustomerDocument> {
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
  ): Promise<CustomerDocument> {
    await this.documentRepo.update(id, input as any);
    const updated = await this.documentRepo.findOne({ where: { id } });
    if (!updated) throw new Error('Document not found');
    await this.cache.invalidatePattern('customer:*');
    return updated;
  }

  @Mutation(() => Boolean)
  async deleteCustomerDocument(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const result = await this.documentRepo.delete(id);
    await this.cache.invalidatePattern('customer:*');
    return (result.affected ?? 0) > 0;
  }
}
