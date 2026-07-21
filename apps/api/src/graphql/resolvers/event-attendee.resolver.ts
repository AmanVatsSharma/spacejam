/**
 * File:        apps/api/src/graphql/resolvers/event-attendee.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Event attendee CRUD — add, remove, check-in, list.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Resolver, Query, Args, Mutation, ID, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventAttendee } from '../../typeorm/entities/event-attendee.entity';
import { AddAttendeeInput, AttendeeFiltersInput } from '../inputs/event-attendee.input';
import { User } from '../../typeorm/entities/user.entity';

@Resolver(() => EventAttendee)
export class EventAttendeeResolver {
  constructor(
    @InjectRepository(EventAttendee)
    private repo: Repository<EventAttendee>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Query(() => [EventAttendee])
  async eventAttendees(
    @Args('filters', { nullable: true }) filters?: AttendeeFiltersInput,
  ): Promise<EventAttendee[]> {
    const where: any = {};
    if (filters?.eventId) where.eventId = filters.eventId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.checkedIn !== undefined) where.checkedIn = filters.checkedIn;

    return this.repo.find({
      where,
      relations: ['user', 'event'],
      order: { createdAt: 'DESC' },
      take: filters?.limit ?? 100,
      skip: filters?.offset ?? 0,
    });
  }

  @Query(() => EventAttendee, { nullable: true })
  async eventAttendee(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<EventAttendee | null> {
    return this.repo.findOne({ where: { eventId, userId }, relations: ['user', 'event'] });
  }

  @Query(() => Int)
  async attendeeCount(@Args('eventId', { type: () => ID }) eventId: string): Promise<number> {
    return this.repo.count({ where: { eventId } });
  }

  @Query(() => Int)
  async checkedInCount(@Args('eventId', { type: () => ID }) eventId: string): Promise<number> {
    return this.repo.count({ where: { eventId, checkedIn: true } });
  }

  @Mutation(() => EventAttendee)
  async addAttendee(@Args('input') input: AddAttendeeInput): Promise<EventAttendee> {
    const user = await this.userRepo.findOne({ where: { id: input.userId } });
    if (!user) throw new Error('User not found');

    const attendee = this.repo.create({
      eventId: input.eventId,
      userId: input.userId,
      ticketTier: input.ticketTier ?? null,
      seatNumber: input.seatNumber ?? null,
      notes: input.notes ?? null,
    });

    return this.repo.save(attendee);
  }

  @Mutation(() => Boolean)
  async removeAttendee(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    const result = await this.repo.delete({ eventId, userId });
    return (result.affected ?? 0) > 0;
  }

  @Mutation(() => EventAttendee)
  async checkInAttendee(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<EventAttendee> {
    await this.repo.update(
      { eventId, userId },
      { checkedIn: true, checkInTime: new Date() },
    );
    const found = await this.repo.findOne({ where: { eventId, userId }, relations: ['user'] });
    if (!found) throw new Error('Attendee not found');
    return found;
  }

  @Mutation(() => EventAttendee)
  async checkOutAttendee(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<EventAttendee> {
    await this.repo.update(
      { eventId, userId },
      { checkedIn: false, checkInTime: null },
    );
    const found = await this.repo.findOne({ where: { eventId, userId }, relations: ['user'] });
    if (!found) throw new Error('Attendee not found');
    return found;
  }

  @Mutation(() => Int)
  async bulkCheckIn(@Args('eventId', { type: () => ID }) eventId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(EventAttendee)
      .set({ checkedIn: true, checkInTime: new Date() })
      .where('eventId = :eventId', { eventId })
      .andWhere('checkedIn = false')
      .execute();
    return result.affected ?? 0;
  }
}
