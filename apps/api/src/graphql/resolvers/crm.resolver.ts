/**
 * File:        apps/api/src/graphql/resolvers/crm.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Lead management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */
import { Resolver, Query, Args, Mutation, Context, ID } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadStatus } from '../types/user.type';
import { Lead as LeadEntity } from '../../typeorm/entities/lead.entity';
import { Customer as CustomerEntity } from '../../typeorm/entities/customer.entity';
import { CustomerStatus } from '../types/user.type';
import { CreateLeadInput, UpdateLeadInput, LeadFiltersInput } from '../inputs/crm.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => LeadEntity)
export class CrmResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(LeadEntity)
    private leadRepo: Repository<LeadEntity>,
    @InjectRepository(CustomerEntity)
    private customerRepo: Repository<CustomerEntity>,
  ) {}

  @Query(() => [LeadEntity])
  async leads(
    @Args('filters', { nullable: true }) filters?: LeadFiltersInput
  ): Promise<LeadEntity[]> {
    const where: any = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.source) where.source = filters.source;
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.assignedToId) where.assignedToId = filters.assignedToId;
      if (filters.search) {
        where.name = (await import('typeorm')).Like(`%${filters.search}%`);
      }
    }

    const leads = await this.leadRepo.find({
      where,
      relations: ['assignedTo'],
      order: { createdAt: 'DESC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });

    return leads;
  }

  @Query(() => LeadEntity, { nullable: true })
  async lead(@Args('id', { type: () => ID }) id: string): Promise<LeadEntity | null> {
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    return lead;
  }

  @Mutation(() => LeadEntity)
  async createLead(
    @Args('input') input: CreateLeadInput,
    @Context() context
  ): Promise<LeadEntity> {
    const userId = context.req?.user?.id;
    const newLead = this.leadRepo.create({
      ...input,
      ...(userId ? { assignedToId: userId } : {}),
    });
    const lead = await this.leadRepo.save(newLead);
    await this.cache.invalidatePattern('leads:*');
    return lead;
  }

  @Mutation(() => LeadEntity)
  async updateLead(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateLeadInput
  ): Promise<LeadEntity> {
    await this.leadRepo.update(id, input);
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.cache.invalidatePattern('leads:*');
    await this.cache.invalidate(`lead:${id}`);
    return lead;
  }

  @Mutation(() => LeadEntity)
  async convertLead(
    @Args('id', { type: () => ID }) id: string
  ): Promise<LeadEntity> {
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    if (!lead) throw new NotFoundException('Lead not found');

    // Check if already converted
    if (lead.status === LeadStatus.CONVERTED) {
      await this.cache.invalidatePattern('leads:*');
      return lead;
    }

    // Auto-create Customer from lead data
    const newCustomer = this.customerRepo.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      location: lead.location,
      notes: lead.notes,
      centerId: lead.centerId,
      status: CustomerStatus.ACTIVE,
      joinDate: new Date(),
      totalBookings: 0,
      totalSpent: 0,
    });
    await this.customerRepo.save(newCustomer);

    // Mark lead as converted
    await this.leadRepo.update(id, { status: LeadStatus.CONVERTED });

    // Invalidate caches
    await this.cache.invalidatePattern('leads:*');
    await this.cache.invalidatePattern('customers:*');

    // Return refreshed lead
    const updatedLead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    return updatedLead!;
  }

  @Mutation(() => Boolean)
  async deleteLead(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.leadRepo.delete(id);
    await this.cache.invalidatePattern('leads:*');
    await this.cache.invalidate(`lead:${id}`);
    return true;
  }

  @Query(() => Number, { description: 'Get count of leads, optionally filtered by status' })
  async leadCount(
    @Args('status', { nullable: true, type: () => LeadStatus }) status?: LeadStatus
  ): Promise<number> {
    const where = status ? { status } : {};
    return this.leadRepo.count({ where });
  }
}
