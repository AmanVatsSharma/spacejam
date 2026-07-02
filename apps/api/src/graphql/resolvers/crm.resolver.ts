/**
 * File:        apps/api/src/graphql/resolvers/crm.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Lead management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-01
 */
import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadStatus } from '../types/user.type';
import { Lead as LeadEntity } from '../../typeorm/entities/lead.entity';
import { CreateLeadInput, UpdateLeadInput, LeadFiltersInput } from '../inputs/crm.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => Lead)
export class CrmResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(LeadEntity)
    private leadRepo: Repository<LeadEntity>,
  ) {}

  @Query(() => [Lead])
  async leads(
    @Args('filters', { nullable: true }) filters?: LeadFiltersInput
  ): Promise<Lead[]> {
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

    return leads as unknown as Lead[];
  }

  @Query(() => Lead, { nullable: true })
  async lead(@Args('id') id: string): Promise<Lead | null> {
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    return lead as unknown as Lead | null;
  }

  @Mutation(() => Lead)
  async createLead(
    @Args('input') input: CreateLeadInput,
    @Context() context
  ): Promise<Lead> {
    const userId = context.req?.user?.id;
    const newLead = this.leadRepo.create({
      ...input,
      ...(userId ? { assignedToId: userId } : {}),
    });
    const lead = await this.leadRepo.save(newLead);
    await this.cache.invalidatePattern('leads:*');
    return lead as unknown as Lead;
  }

  @Mutation(() => Lead)
  async updateLead(
    @Args('id') id: string,
    @Args('input') input: UpdateLeadInput
  ): Promise<Lead> {
    await this.leadRepo.update(id, input);
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    await this.cache.invalidatePattern('leads:*');
    await this.cache.invalidate(`lead:${id}`);
    return lead as unknown as Lead;
  }

  @Mutation(() => Lead)
  async convertLead(
    @Args('id') id: string
  ): Promise<Lead> {
    await this.leadRepo.update(id, { status: LeadStatus.CONVERTED });
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    await this.cache.invalidatePattern('leads:*');
    return lead as unknown as Lead;
  }

  @Mutation(() => Boolean)
  async deleteLead(@Args('id') id: string): Promise<boolean> {
    await this.leadRepo.delete(id);
    await this.cache.invalidatePattern('leads:*');
    await this.cache.invalidate(`lead:${id}`);
    return true;
  }

  @Query(() => Number)
  async leadCount(
    @Args('status', { nullable: true }) status?: LeadStatus
  ): Promise<number> {
    const where = status ? { status } : {};
    return this.leadRepo.count({ where });
  }
}
