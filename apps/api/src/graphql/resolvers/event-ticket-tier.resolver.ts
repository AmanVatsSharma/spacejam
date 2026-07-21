/**
 * File:        apps/api/src/graphql/resolvers/event-ticket-tier.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Event ticket tier CRUD — early bird, VIP, regular.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Resolver, Query, Args, Mutation, ID, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventTicketTier } from '../../typeorm/entities/event-ticket-tier.entity';
import { CreateTicketTierInput, UpdateTicketTierInput } from '../inputs/event-ticket-tier.input';

@Resolver(() => EventTicketTier)
export class EventTicketTierResolver {
  constructor(
    @InjectRepository(EventTicketTier)
    private repo: Repository<EventTicketTier>,
  ) {}

  @Query(() => [EventTicketTier])
  async ticketTiers(@Args('eventId', { type: () => ID }) eventId: string): Promise<EventTicketTier[]> {
    return this.repo.find({ where: { eventId }, order: { price: 'ASC' } });
  }

  @Query(() => EventTicketTier)
  async ticketTier(@Args('id', { type: () => ID }) id: string): Promise<EventTicketTier> {
    const t = await this.repo.findOne({ where: { id }, relations: ['event'] });
    if (!t) throw new Error('Ticket tier not found');
    return t;
  }

  @Mutation(() => EventTicketTier)
  async createTicketTier(@Args('input') input: CreateTicketTierInput): Promise<EventTicketTier> {
    const tier = this.repo.create(input);
    return this.repo.save(tier);
  }

  @Mutation(() => EventTicketTier)
  async updateTicketTier(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTicketTierInput,
  ): Promise<EventTicketTier> {
    await this.repo.update(id, input);
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new Error('Ticket tier not found');
    return t;
  }

  @Mutation(() => Boolean)
  async deleteTicketTier(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  @Mutation(() => EventTicketTier)
  async incrementTierSold(
    @Args('id', { type: () => ID }) id: string,
    @Args('count', { type: () => Int, defaultValue: 1 }) count: number,
  ): Promise<EventTicketTier> {
    const tier = await this.repo.findOne({ where: { id } });
    if (!tier) throw new Error('Ticket tier not found');
    if (tier.soldCount + count > tier.quantity) throw new Error('Exceeds available quantity');
    await this.repo.update(id, { soldCount: tier.soldCount + count });
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new Error('Ticket tier not found');
    return t;
  }
}
