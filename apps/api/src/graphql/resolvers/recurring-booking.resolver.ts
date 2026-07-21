/**
 * File:        apps/api/src/graphql/resolvers/recurring-booking.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Recurring booking resolvers — create, expand, cancel, list.
 *              expandRecurring() creates individual Event rows for each
 *              date in the recurrence window.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Resolver, Query, Args, Mutation, ID, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringBooking, RecurrencePattern } from '../../typeorm/entities/recurring-booking.entity';
import { Event } from '../../typeorm/entities/event.entity';
import { EventStatus, EventType } from '../types/user.type';
import { CreateRecurringBookingInput } from '../inputs/recurring-booking.input';

@Resolver(() => RecurringBooking)
export class RecurringBookingResolver {
  constructor(
    @InjectRepository(RecurringBooking)
    private repo: Repository<RecurringBooking>,
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
  ) {}

  @Query(() => [RecurringBooking])
  async recurringBookings(@Args('roomId', { type: () => ID, nullable: true }) roomId?: string): Promise<RecurringBooking[]> {
    const where = roomId ? { roomId, active: true } : { active: true };
    return this.repo.find({
      where,
      relations: ['room', 'center', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  @Query(() => RecurringBooking)
  async recurringBooking(@Args('id', { type: () => ID }) id: string): Promise<RecurringBooking> {
    const rb = await this.repo.findOne({ where: { id }, relations: ['room', 'center', 'user'] });
    if (!rb) throw new Error('Recurring booking not found');
    return rb;
  }

  @Mutation(() => RecurringBooking)
  async createRecurringBooking(
    @Args('input') input: CreateRecurringBookingInput,
  ): Promise<RecurringBooking> {
    const rb = this.repo.create(input);
    const saved = await this.repo.save(rb);
    await this.expandRecurring(saved.id);
    const result = await this.repo.findOne({ where: { id: saved.id }, relations: ['room', 'center', 'user'] });
    if (!result) throw new Error('Recurring booking not found after creation');
    return result;
  }

  @Mutation(() => [Event])
  async expandRecurring(@Args('id', { type: () => ID }) id: string): Promise<Event[]> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new Error('Recurring booking not found');

    const created: Event[] = [];
    const start = new Date(template.startDate);
    const end = new Date(template.endDate);
    const cursor = new Date(start);
    cursor.setDate(cursor.getDate() + 1);

    while (cursor <= end) {
      const dow = cursor.getDay();

      if (template.pattern === RecurrencePattern.WEEKLY && template.daysOfWeek) {
        if (!template.daysOfWeek.includes(dow)) {
          cursor.setDate(cursor.getDate() + 1);
          continue;
        }
      }

      const dateStr = cursor.toISOString().split('T')[0];
      const [sh, sm] = template.startTime.split(':').map(Number);
      const [eh, em] = template.endTime.split(':').map(Number);
      const eventStart = new Date(dateStr);
      eventStart.setHours(sh, sm, 0, 0);
      const eventEnd = new Date(dateStr);
      eventEnd.setHours(eh, em, 0, 0);

      const evt = this.eventRepo.create({
        title: template.title,
        status: EventStatus.CONFIRMED,
        eventType: EventType.MEETING,
        eventDate: dateStr,
        startTime: eventStart.toTimeString().slice(0, 8),
        endTime: eventEnd.toTimeString().slice(0, 8),
        meetingRoomId: template.roomId,
        centerId: template.centerId,
        requestedById: template.userId,
        recurringBookingId: template.id,
      });

      const saved = await this.eventRepo.save(evt);
      created.push(saved);

      if (template.pattern === RecurrencePattern.DAILY || template.pattern === RecurrencePattern.WEEKLY) {
        cursor.setDate(cursor.getDate() + 1);
      } else {
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    await this.repo.update(id, { occurrencesCreated: (template.occurrencesCreated ?? 0) + created.length });
    return created;
  }

  @Mutation(() => RecurringBooking)
  async cancelRecurringBooking(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<RecurringBooking> {
    await this.repo.update(id, { active: false });
    const today = new Date().toISOString().split('T')[0];
    await this.eventRepo
      .createQueryBuilder()
      .update(Event)
      .set({ status: EventStatus.CANCELLED })
      .where('recurringBookingId = :id', { id })
      .andWhere('eventDate >= :today', { today })
      .execute();

    const result = await this.repo.findOne({ where: { id } });
    if (!result) throw new Error('Recurring booking not found');
    return result;
  }

  @Mutation(() => Int)
  async countRecurringOccurrences(@Args('id', { type: () => ID }) id: string): Promise<number> {
    return this.eventRepo.count({ where: { recurringBookingId: id } });
  }
}
