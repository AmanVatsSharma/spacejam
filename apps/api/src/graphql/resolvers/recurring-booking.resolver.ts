/**
 * File:        apps/api/src/graphql/resolvers/recurring-booking.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Recurring booking resolvers — create, expand, cancel, list.
 *              expandRecurring() creates individual Event rows for each
 *              date in the recurrence window.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */
import { Resolver, Query, Args, Mutation, ID, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException, UnauthorizedException, UseGuards } from '@nestjs/common';
import { RecurringBooking } from '../../typeorm/entities/recurring-booking.entity';
import { RecurrencePattern as RecurrencePatternEnum } from '../../typeorm/entities/recurring-booking.entity';
import { Event } from '../../typeorm/entities/event.entity';
import { EventStatus, EventType } from '../types/user.type';
import { CreateRecurringBookingInput } from '../inputs/recurring-booking.input';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Resolver(() => RecurringBooking)
@UseGuards(GqlAuthGuard)
export class RecurringBookingResolver {
  constructor(
    @InjectRepository(RecurringBooking)
    private repo: Repository<RecurringBooking>,
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
    private dataSource: DataSource,
  ) {}

  @Query(() => [RecurringBooking])
  async recurringBookings(
    @Args('roomId', { type: () => ID, nullable: true }) roomId?: string,
  ): Promise<RecurringBooking[]> {
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
    @CurrentUser() user: any,
  ): Promise<RecurringBooking> {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid start or end date');
    }
    if (endDate < startDate) {
      throw new BadRequestException('End date must be on or after start date');
    }
    if (input.startTime >= input.endTime) {
      throw new BadRequestException('End time must be after start time');
    }
    if (input.pattern === RecurrencePatternEnum.WEEKLY && (!input.daysOfWeek || input.daysOfWeek.length === 0)) {
      throw new BadRequestException('WEEKLY pattern requires at least one dayOfWeek');
    }
    if (input.daysOfWeek) {
      const valid = input.daysOfWeek.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
      if (!valid) throw new BadRequestException('daysOfWeek must be integers 0-6 (Sun=0)');
    }

    const rb = this.repo.create(input);
    const saved = await this.repo.save(rb);
    await this.expandRecurring(saved.id, user);
    const result = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['room', 'center', 'user'],
    });
    if (!result) throw new Error('Recurring booking not found after creation');
    return result;
  }

  @Mutation(() => [Event])
  async expandRecurring(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user?: any,
  ): Promise<Event[]> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new Error('Recurring booking not found');

    if (user && template.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('You can only expand your own recurring bookings');
    }

    const created: Event[] = [];
    const start = new Date(template.startDate);
    const end = new Date(template.endDate);
    const cursor = new Date(start);
    cursor.setDate(cursor.getDate() + 1);

    const [sh, sm] = template.startTime.split(':').map(Number);
    const [eh, em] = template.endTime.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    await this.dataSource.transaction(async (manager) => {
      while (cursor <= end) {
        const dow = cursor.getDay();

        if (template.pattern === RecurrencePatternEnum.WEEKLY && template.daysOfWeek) {
          if (!template.daysOfWeek.includes(dow)) {
            cursor.setDate(cursor.getDate() + 1);
            continue;
          }
        }

        const dateStr = cursor.toISOString().split('T')[0];

        const existing = await manager.count(Event, {
          where: {
            meetingRoomId: template.roomId,
            eventDate: dateStr,
            startTime: template.startTime,
            endTime: template.endTime,
            recurringBookingId: template.id,
          },
        });
        if (existing > 0) {
          advanceCursor(cursor, template.pattern);
          continue;
        }

        const conflicts = await manager
          .createQueryBuilder(Event, 'e')
          .where('e.meetingRoomId = :roomId', { roomId: template.roomId })
          .andWhere('e.eventDate = :date', { date: dateStr })
          .andWhere('e.status != :cancelled', { cancelled: EventStatus.CANCELLED })
          .andWhere(
            '(EXTRACT(HOUR FROM e.startTime) * 60 + EXTRACT(MINUTE FROM e.startTime)) < :endMin',
            { endMin: endMinutes },
          )
          .andWhere(
            '(EXTRACT(HOUR FROM e.endTime) * 60 + EXTRACT(MINUTE FROM e.endTime)) > :startMin',
            { startMin: startMinutes },
          )
          .getCount();

        if (conflicts > 0) {
          advanceCursor(cursor, template.pattern);
          continue;
        }

        const eventStart = new Date(dateStr);
        eventStart.setHours(sh, sm, 0, 0);
        const eventEnd = new Date(dateStr);
        eventEnd.setHours(eh, em, 0, 0);

        const evt = manager.create(Event, {
          title: template.title,
          status: EventStatus.CONFIRMED,
          eventType: EventType.MEETING_ROOM,
          eventDate: dateStr,
          startTime: eventStart.toTimeString().slice(0, 8),
          endTime: eventEnd.toTimeString().slice(0, 8),
          meetingRoomId: template.roomId,
          centerId: template.centerId,
          requestedById: template.userId,
          recurringBookingId: template.id,
        });

        const saved = await manager.save(evt);
        created.push(saved);

        advanceCursor(cursor, template.pattern);
      }

      await manager.update(RecurringBooking, id, {
        occurrencesCreated: (template.occurrencesCreated ?? 0) + created.length,
      });
    });

    return created;
  }

  @Mutation(() => RecurringBooking)
  async cancelRecurringBooking(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any,
  ): Promise<RecurringBooking> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new Error('Recurring booking not found');

    if (user && template.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('You can only cancel your own recurring bookings');
    }

    await this.repo.update(id, { active: false });
    const today = new Date().toISOString().split('T')[0];
    await this.eventRepo
      .createQueryBuilder()
      .update(Event)
      .set({ status: EventStatus.CANCELLED })
      .where('recurringBookingId = :id', { id })
      .andWhere('eventDate >= :today', { today })
      .andWhere('status NOT IN (:...excluded)', { excluded: [EventStatus.CANCELLED] })
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

/**
 * Advance the cursor safely for each recurrence pattern.
 * Uses day-based arithmetic instead of setMonth() to avoid the Jan 31 + 1 month
 * rollover bug that can skip months entirely.
 */
function advanceCursor(cursor: Date, pattern: RecurrencePatternEnum): void {
  if (pattern === RecurrencePatternEnum.DAILY || pattern === RecurrencePatternEnum.WEEKLY) {
    cursor.setDate(cursor.getDate() + 1);
    return;
  }
  const day = cursor.getDate();
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() + 1);
  const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  cursor.setDate(Math.min(day, lastDay));
}
