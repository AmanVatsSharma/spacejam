/**
 * File:        apps/api/src/graphql/resolvers/support.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Support tickets + threaded messages
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { UseGuards, NotFoundException } from '@nestjs/common';
import { Args, ID, Query, Mutation, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { SupportTicket, SupportMessage } from '../../typeorm/entities/support-ticket.entity';
import { CreateSupportTicketInput } from '../inputs/support.input';

@Resolver(() => SupportTicket)
@UseGuards(GqlAuthGuard)
export class SupportResolver {
  constructor(
    @InjectRepository(SupportTicket) private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(SupportMessage) private readonly msgRepo: Repository<SupportMessage>,
  ) {}

  @Query(() => [SupportTicket], { description: 'Support tickets for the current user' })
  async mySupportTickets(@CurrentUser() current: JwtPayload): Promise<SupportTicket[]> {
    return this.ticketRepo.find({
      where: { userId: current.sub },
      order: { createdAt: 'DESC' },
    });
  }

  @Query(() => SupportTicket, { nullable: true })
  async supportTicket(
    @CurrentUser() current: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SupportTicket | null> {
    const ticket = await this.ticketRepo.findOne({ where: { id, userId: current.sub } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  @Query(() => [SupportMessage], { description: 'Messages in a support ticket' })
  async supportMessages(
    @CurrentUser() current: JwtPayload,
    @Args('ticketId', { type: () => ID }) ticketId: string,
  ): Promise<SupportMessage[]> {
    // Ensure the ticket belongs to the caller before exposing messages.
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId, userId: current.sub } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.msgRepo.find({ where: { ticketId }, order: { createdAt: 'ASC' } });
  }

  @Mutation(() => SupportTicket, { description: 'Create a support ticket' })
  async createSupportTicket(
    @CurrentUser() current: JwtPayload,
    @Args('input') input: CreateSupportTicketInput,
  ): Promise<SupportTicket> {
    return this.ticketRepo.save({
      userId: current.sub,
      subject: input.subject,
      description: input.description,
      category: input.category ?? 'OTHER',
      priority: input.priority ?? 'MEDIUM',
      status: 'OPEN',
    });
  }

  @Mutation(() => SupportMessage, { description: 'Reply to a support ticket' })
  async addSupportMessage(
    @CurrentUser() current: JwtPayload,
    @Args('ticketId', { type: () => ID }) ticketId: string,
    @Args('message') message: string,
  ): Promise<SupportMessage> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId, userId: current.sub } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.msgRepo.save({ ticketId, userId: current.sub, isAdmin: false, message });
  }
}
