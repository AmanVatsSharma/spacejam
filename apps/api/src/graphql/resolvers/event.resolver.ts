/**
 * File:        apps/api/src/graphql/resolvers/event.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Event management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

import { Resolver, Query, Args, Mutation, ID, Context } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import { Event } from '../../typeorm/entities/event.entity';
import { MeetingRoom } from '../../typeorm/entities/meeting-room.entity';
import { EventStatus } from '../../graphql/types/user.type';
import {
  CreateEventInput,
  UpdateEventInput,
  EventFiltersInput,
  EventStatistics,
  CreateEventPayload,
} from '../inputs/event.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => Event)
export class EventResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
    @InjectRepository(MeetingRoom)
    private roomRepo: Repository<MeetingRoom>,
  ) {}

  @Query(() => [Event])
  async events(
    @Args('filters', { nullable: true }) filters?: EventFiltersInput,
  ): Promise<Event[]> {
    const where: any = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      // The filter input exposes `type`, but the entity column is `eventType`
      // (mirrors createEvent/updateEvent). Map it so filtering by type works.
      if (filters.type) where.eventType = filters.type;
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.meetingRoomId) where.meetingRoomId = filters.meetingRoomId;
      if (filters.startDate || filters.endDate) {
        where.eventDate = {};
        if (filters.startDate) where.eventDate.gte = filters.startDate;
        if (filters.endDate) where.eventDate.lte = filters.endDate;
      }
      if (filters.search) {
        where.title = (await import('typeorm')).Like(`%${filters.search}%`);
      }
    }

    return this.eventRepo.find({
      where,
      relations: ['center', 'meetingRoom', 'requestedBy'],
      order: { eventDate: 'DESC', startTime: 'ASC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });
  }

  @Query(() => Event, { nullable: true })
  async event(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Event | null> {
    return this.eventRepo.findOne({
      where: { id },
      relations: ['center', 'meetingRoom', 'requestedBy'],
    });
  }

  @Query(() => [Event])
  async todayEvents(
    @Args('centerId', { nullable: true }) centerId?: string,
  ): Promise<Event[]> {
    const today = new Date().toISOString().split('T')[0];
    const filters: EventFiltersInput = {
      startDate: today,
      endDate: today,
      ...(centerId && { centerId }),
    };

    return this.events(filters);
  }

  @Query(() => [Event])
  async upcomingEvents(
    @Args('centerId', { nullable: true }) centerId?: string,
  ): Promise<Event[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const filters: EventFiltersInput = {
      startDate: tomorrowStr,
      ...(centerId && { centerId }),
    };

    return this.events(filters);
  }

  @Query(() => [Event])
  async pastEvents(
    @Args('centerId', { nullable: true }) centerId?: string,
  ): Promise<Event[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const filters: EventFiltersInput = {
      endDate: yesterdayStr,
      ...(centerId && { centerId }),
    };

    return this.events(filters);
  }

  @Query(() => EventStatistics)
  async eventStatistics(
    @Args('centerId', { nullable: true }) centerId?: string,
  ): Promise<any> {
    const where = centerId ? { centerId } : {};

    const total = await this.eventRepo.count({ where });
    const pending = await this.eventRepo.count({
      where: { ...where, status: EventStatus.PENDING },
    });
    const confirmed = await this.eventRepo.count({
      where: { ...where, status: EventStatus.CONFIRMED },
    });
    const completed = await this.eventRepo.count({
      where: { ...where, status: EventStatus.COMPLETED },
    });
    const cancelled = await this.eventRepo.count({
      where: { ...where, status: EventStatus.CANCELLED },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = await this.eventRepo.count({
      where: {
        ...where,
        eventDate: MoreThanOrEqual(today),
        status: In([EventStatus.PENDING, EventStatus.CONFIRMED]),
      },
    });

    return {
      totalEvents: total,
      pendingEvents: pending,
      confirmedEvents: confirmed,
      upcomingEvents: upcoming,
      completedEvents: completed,
      cancelledEvents: cancelled,
    };
  }

  @Query(() => [Event])
  async eventsByDateRange(
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
    @Args('centerId', { nullable: true }) centerId?: string,
  ): Promise<Event[]> {
    const filters: EventFiltersInput = {
      startDate,
      endDate,
      ...(centerId && { centerId }),
    };

    return this.events(filters);
  }

  @Query(() => [MeetingRoom])
  async availableRoomsForEvent(
    @Args('centerId') centerId: string,
    @Args('eventDate') eventDate: string,
    @Args('startTime') startTime: string,
    @Args('endTime') endTime: string,
    @Args('floorId', { nullable: true }) floorId?: string,
  ) {
    const baseWhere: any = {
      centerId,
      active: true,
      status: 'AVAILABLE',
    };

    if (floorId) baseWhere.floorId = floorId;

    const rooms = await this.roomRepo.find({
      where: baseWhere,
      relations: ['center'],
    });

    const availableRooms = [];

    for (const room of rooms) {
      const isAvailable = await this.isRoomAvailable(
        room.id,
        centerId,
        eventDate,
        startTime,
        endTime,
      );

      if (isAvailable) {
        availableRooms.push(room);
      }
    }

    return availableRooms;
  }

  private async isRoomAvailable(
    roomId: string,
    centerId: string,
    eventDate: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const conflictingBookings = await this.eventRepo.count({
      where: {
        meetingRoomId: roomId,
        centerId,
        eventDate: eventDate as any,
        status: (await import('typeorm')).In([
          EventStatus.PENDING,
          EventStatus.CONFIRMED,
        ]) as any,
        startTime: (await import('typeorm')).LessThan(endTime),
        endTime: (await import('typeorm')).MoreThan(startTime),
      },
    });

    return conflictingBookings === 0;
  }

  @Mutation(() => CreateEventPayload)
  async createEvent(
    @Args('input') input: CreateEventInput,
    @Context() context: any,
  ): Promise<any> {
    const user = context.req?.user;

    if (!input.centerId && input.meetingRoomId) {
      const room = await this.roomRepo.findOne({
        where: { id: input.meetingRoomId },
      });
      // centerId is nullable on MeetingRoom — only adopt it if present,
      // otherwise the fallback-center lookup below handles it.
      if (room && room.centerId) input.centerId = room.centerId;
    }

    if (!input.centerId) {
      const fallbackCenter = await this.roomRepo.manager
        .getRepository('centers')
        .createQueryBuilder('c')
        .select('c.id', 'id')
        .limit(1)
        .getRawOne<{ id: string }>();
      if (fallbackCenter?.id) {
        input.centerId = fallbackCenter.id;
      }
    }

    // Calculate duration from start/end times
    let durationMinutes = (input as any).durationMinutes;
    if (!durationMinutes && input.startTime && input.endTime) {
      const [sh, sm] = input.startTime.split(':').map(Number);
      const [eh, em] = input.endTime.split(':').map(Number);
      durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
    }

    const event = this.eventRepo.create({
      title: input.title,
      description: input.description,
      company: input.company,
      eventDate: input.eventDate,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes: durationMinutes || 60,
      attendeesCount: input.attendeesCount || 1,
      eventType: input.type as any,
      status: 'PENDING' as any,
      specialRequests: input.specialRequests,
      addons: (input as any).addons,
      cost: (input as any).cost ?? 0,
      notes: input.notes,
      centerId: input.centerId,
      meetingRoomId: input.meetingRoomId,
      requestedById: user?.id,
    });

    const saved = await this.eventRepo.save(event);

    const fullEvent = await this.eventRepo.findOne({
      where: { id: saved.id },
      relations: ['center', 'meetingRoom', 'requestedBy'],
    });

    await this.cache.invalidatePattern('events:*');

    return {
      success: true,
      event: fullEvent,
    };
  }

  @Mutation(() => CreateEventPayload)
  async updateEvent(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEventInput,
    @Context() context: any,
  ): Promise<any> {
    // The GraphQL input exposes the event category as `type`, but the DB
    // column / entity field is `eventType` (mirrors createEvent at L289).
    // Map it explicitly so editing the type actually persists; everything
    // else passes through unchanged.
    const { type, ...rest } = input as any;
    const patch: any = { ...rest };
    if (type !== undefined) patch.eventType = type;

    await this.eventRepo.update(id, patch);

    const updated = await this.eventRepo.findOne({
      where: { id },
      relations: ['center', 'meetingRoom', 'requestedBy'],
    });

    await this.cache.invalidatePattern('events:*');
    await this.cache.del(`event:${id}`);

    return {
      success: true,
      event: updated,
    };
  }

  @Mutation(() => CreateEventPayload)
  async updateEventStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => EventStatus }) status: EventStatus,
    @Context() context: any,
  ): Promise<any> {
    await this.eventRepo.update(id, { status });

    const updated = await this.eventRepo.findOne({
      where: { id },
      relations: ['center', 'meetingRoom', 'requestedBy'],
    });

    await this.cache.invalidatePattern('events:*');
    await this.cache.del(`event:${id}`);

    return {
      success: true,
      event: updated,
    };
  }

  @Mutation(() => Boolean)
  async cancelEvent(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any,
  ): Promise<boolean> {
    await this.eventRepo.update(id, {
      status: EventStatus.CANCELLED,
    });

    await this.cache.invalidatePattern('events:*');
    await this.cache.del(`event:${id}`);

    return true;
  }

  @Mutation(() => Boolean)
  async deleteEvent(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any,
  ): Promise<boolean> {
    await this.eventRepo.delete(id);

    await this.cache.invalidatePattern('events:*');
    await this.cache.del(`event:${id}`);

    return true;
  }

  @Query(() => [Event])
  async myEvents(
    @Args('requestedBy', { nullable: true }) requestedBy?: string,
    @Args('centerId', { nullable: true }) centerId?: string,
    @Args('status', { type: () => EventStatus, nullable: true })
    status?: EventStatus,
  ): Promise<Event[]> {
    const where: any = {};

    if (requestedBy) where.requestedById = requestedBy;
    if (centerId) where.centerId = centerId;
    if (status) where.status = status;

    return this.eventRepo.find({
      where,
      relations: ['center', 'meetingRoom', 'requestedBy'],
      order: { eventDate: 'DESC', startTime: 'ASC' },
    });
  }
}
