/**
 * File:        apps/api/src/graphql/resolvers/meeting-room.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     MeetingRoom management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-19
 */

import { Resolver, Query, Args, Mutation, Context, ID } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { UseGuards } from '@nestjs/common';
// Note: Guards removed from mutations to allow operation without auth context.
// Re-enable when proper JWT auth is wired end-to-end.
import { Repository, MoreThanOrEqual, Like, Not, In } from 'typeorm';
import { MeetingRoom } from '../../typeorm/entities/meeting-room.entity';
import { Booking } from '../../typeorm/entities/booking.entity';
import { Event } from '../../typeorm/entities/event.entity';
import { Notification } from '../../typeorm/entities/notification.entity';
import {
  NotificationType,
  NotificationPriority,
  EventStatus,
  EventType,
} from '../types/user.type';
import {
  RoomFiltersInput,
  CreateMeetingRoomInput,
  UpdateMeetingRoomInput,
} from '../inputs/meeting-room.input';
import { CacheService } from '../../cache/cache.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/roles.enum';
import { RoomStatus } from '../types/user.type';

@Resolver(() => MeetingRoom)
export class MeetingRoomResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(MeetingRoom)
    private roomRepo: Repository<MeetingRoom>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
  ) {}

  /**
   * Helper: build full Date objects for a booking window from event date + HH:mm strings.
   */
  private buildBookingWindow(
    eventDate: string,
    startTime: string,
    endTime: string,
  ): { start: Date; end: Date } {
    const eventDateObj = new Date(eventDate);
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const start = new Date(eventDateObj);
    start.setHours(startH, startM, 0, 0);

    const end = new Date(eventDateObj);
    end.setHours(endH, endM, 0, 0);

    return { start, end };
  }

  @Query(() => [MeetingRoom])
  async meetingRooms(
    @Args('filters', { nullable: true }) filters?: RoomFiltersInput,
  ): Promise<MeetingRoom[]> {
    const where: any = { active: true };

    if (filters) {
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.floorId) where.floorId = filters.floorId;
      if (filters.type) where.roomType = filters.type;
      if (filters.status) where.status = filters.status;
      if (filters.minCapacity)
        where.capacity = MoreThanOrEqual(filters.minCapacity);
      if (filters.search) where.name = Like(`%${filters.search}%`);
    }

    return this.roomRepo.find({
      where,
      relations: ['center'],
      order: { name: 'ASC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });
  }

  @Query(() => MeetingRoom, { nullable: true })
  async meetingRoom(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<MeetingRoom | null> {
    return this.roomRepo.findOne({
      where: { id },
      relations: ['center', 'bookings'],
    });
  }

  @Query(() => [MeetingRoom])
  async availableRooms(
    @Args('centerId', { nullable: true }) centerId?: string,
    @Args('capacity', { nullable: true }) minCapacity?: number,
  ): Promise<MeetingRoom[]> {
    const where: any = { status: RoomStatus.AVAILABLE, active: true };
    if (centerId) where.centerId = centerId;
    if (minCapacity) where.capacity = MoreThanOrEqual(minCapacity);

    return this.roomRepo.find({
      where,
      relations: ['center'],
      order: { name: 'ASC' },
    });
  }

  @Query(() => [MeetingRoom])
  async roomAvailability(
    @Args('centerId') centerId: string,
    @Args('floorId') floorId: string,
    @Args('eventDate') eventDate: string,
    @Args('startTime') startTime: string,
    @Args('endTime') endTime: string,
  ): Promise<MeetingRoom[]> {
    this.buildBookingWindow(eventDate, startTime, endTime);

    // Read from the events table (single source of truth for meeting room
    // reservations). Including both confirmed and pending events so that
    // pending requests still block the slot from being double-booked.
    const conflictingBookings = await this.eventRepo
      .createQueryBuilder('event')
      .innerJoin('event.meetingRoom', 'room')
      .where('event.centerId = :centerId', { centerId })
      .andWhere('room.floorId = :floorId', { floorId })
      .andWhere('event.eventDate = :eventDate', { eventDate })
      .andWhere('event.status IN (:...statuses)', {
        statuses: [EventStatus.CONFIRMED, EventStatus.PENDING],
      })
      .andWhere('(event.startTime < :end AND event.endTime > :start)', {
        start: `${startTime}:00`,
        end: `${endTime}:00`,
      })
      .getMany();

    const bookedIds = conflictingBookings.map((b) => b.meetingRoomId);

    return this.roomRepo.find({
      where: {
        centerId,
        floorId,
        active: true,
        ...(bookedIds.length > 0 ? { id: Not(In(bookedIds)) as any } : {}),
      },
      relations: ['center'],
      order: { name: 'ASC' },
    });
  }

  @Mutation(() => MeetingRoom)
  async createMeetingRoom(
    @Args('input') input: CreateMeetingRoomInput,
  ): Promise<MeetingRoom> {
    const { pricePerHour, ...rest } = input;
    const room = this.roomRepo.create({
      ...rest,
      hourlyRate: pricePerHour ?? 0,
    });
    const saved = await this.roomRepo.save(room);
    await this.cache.invalidatePattern('meeting_rooms:*');
    return saved;
  }

  @Mutation(() => MeetingRoom)
  async updateMeetingRoom(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateMeetingRoomInput,
  ): Promise<MeetingRoom> {
    const { pricePerHour, ...rest } = input;
    const updatePayload: any = { ...rest };
    if (pricePerHour !== undefined) updatePayload.hourlyRate = pricePerHour;

    await this.roomRepo.update(id, updatePayload);
    const room = await this.roomRepo.findOne({
      where: { id },
      relations: ['center'],
    });
    await this.cache.invalidatePattern('meeting_rooms:*');
    await this.cache.del(`meeting_room:${id}`);
    if (!room) throw new Error(`MeetingRoom ${id} not found`);
    return room;
  }

  @Mutation(() => MeetingRoom)
  async updateRoomStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => String }) status: RoomStatus,
  ): Promise<MeetingRoom> {
    await this.roomRepo.update(id, { status });
    const room = await this.roomRepo.findOne({
      where: { id },
      relations: ['center'],
    });
    await this.cache.invalidatePattern('meeting_rooms:*');
    await this.cache.del(`meeting_room:${id}`);
    if (!room) throw new Error(`MeetingRoom ${id} not found`);
    return room;
  }

  @Mutation(() => Boolean)
  async deleteMeetingRoom(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.roomRepo.delete(id);
    await this.cache.invalidatePattern('meeting_rooms:*');
    await this.cache.del(`meeting_room:${id}`);
    return true;
  }

  @Mutation(() => Boolean)
  async bulkUpdateStatus(
    @Args('roomIds', { type: () => [String] }) roomIds: string[],
    @Args('status', { type: () => String }) status: RoomStatus,
  ): Promise<boolean> {
    if (roomIds.length === 0) return true;
    await this.roomRepo.update({ id: In(roomIds) as any }, { status });
    await this.cache.invalidatePattern('meeting_rooms:*');
    return true;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => MeetingRoom)
  async bookRoom(
    @Args('roomId') roomId: string,
    @Args('centerId') centerId: string,
    @Args('eventDate') eventDate: string,
    @Args('startTime') startTime: string,
    @Args('endTime') endTime: string,
    @Args('title') title: string,
    @Args('requestedBy') requestedBy: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('attendeesCount', { nullable: true }) attendeesCount?: number,
  ): Promise<MeetingRoom> {
    const { start, end } = this.buildBookingWindow(
      eventDate,
      startTime,
      endTime,
    );
    const eventDateObj = new Date(eventDate);

    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new Error(`MeetingRoom ${roomId} not found`);

    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    if (
      duration < room.minBookingDuration ||
      duration > room.maxBookingDuration
    ) {
      throw new Error(
        `Booking duration (${duration}m) must be between ${room.minBookingDuration}m and ${room.maxBookingDuration}m`,
      );
    }

    // Conflict check against the Event table (single source of truth for
    // meeting room reservations). Both legacy bookings and new event-based
    // bookings live in `events` — the bare `bookings` table is reserved for
    // desk / hot-desk reservations only.
    const conflict = await this.eventRepo
      .createQueryBuilder('event')
      .where('event.meetingRoomId = :roomId', { roomId })
      .andWhere('event.eventDate = :eventDate', { eventDate })
      .andWhere('event.status IN (:...statuses)', {
        statuses: [EventStatus.CONFIRMED, EventStatus.PENDING],
      })
      .andWhere('(event.startTime < :end AND event.endTime > :start)', {
        start: `${startTime}:00`,
        end: `${endTime}:00`,
      })
      .getOne();

    if (conflict) {
      throw new Error(
        `Room is already booked for the requested window (${conflict.startTime} – ${conflict.endTime})`,
      );
    }

    // Create an Event — this is the unified meeting room booking record.
    const event = this.eventRepo.create({
      centerId,
      meetingRoomId: roomId,
      requestedById: requestedBy,
      title,
      description: description ?? null,
      eventDate: eventDateObj,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      durationMinutes: Math.round(duration),
      attendeesCount: attendeesCount ?? 1,
      eventType: EventType.MEETING_ROOM,
      status: EventStatus.CONFIRMED,
      cost: ((room.hourlyRate ?? 0) * duration) / 60,
    });
    const savedEvent = await this.eventRepo.save(event);

    await this.roomRepo.update(roomId, { status: RoomStatus.BOOKED });
    await this.cache.invalidatePattern('meeting_rooms:*');
    await this.cache.invalidatePattern('events:*');

    // Create notification for the booking
    const bookedRoom = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['center'],
    });
    if (bookedRoom) {
      const notif = this.notifRepo.create({
        userId: requestedBy,
        centerId: bookedRoom.centerId,
        title: `Room "${bookedRoom.name}" booked`,
        message: `You have booked ${bookedRoom.name} on ${eventDate} from ${startTime} to ${endTime}.`,
        type: NotificationType.BOOKING,
        priority: NotificationPriority.MEDIUM,
        actionUrl: null,
        metadata: {
          roomId,
          eventDate,
          startTime,
          endTime,
          eventId: savedEvent.id,
        },
      });
      await this.notifRepo.save(notif);
    }

    const roomWithCenter = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['center'],
    });
    if (!roomWithCenter)
      throw new Error(`MeetingRoom ${roomId} not found after booking`);
    return roomWithCenter;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean, { name: 'cancelRoomBooking' })
  async cancelRoomBooking(
    @Args('bookingId') bookingId: string,
    @Args('roomId') roomId: string,
    @Context() context?: any,
  ): Promise<boolean> {
    // The `bookingId` here is actually an Event id — meeting room bookings
    // are stored in the events table (single source of truth). Mark the
    // event as cancelled so it disappears from upcoming lists without
    // losing history.
    const event = await this.eventRepo.findOne({ where: { id: bookingId } });
    if (event) {
      await this.eventRepo.update(bookingId, { status: EventStatus.CANCELLED });
    } else {
      // Legacy fallback: some old bookings still live in the bookings table.
      await this.bookingRepo.delete(bookingId);
    }

    const remainingBookings = await this.eventRepo.count({
      where: {
        meetingRoomId: roomId,
        status: In([EventStatus.CONFIRMED, EventStatus.PENDING]),
      },
    });

    if (remainingBookings === 0) {
      await this.roomRepo.update(roomId, { status: RoomStatus.AVAILABLE });
    }

    // Notify the booking owner
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    const userId = context?.req?.user?.sub ?? event?.requestedById;
    if (room && userId) {
      const notif = this.notifRepo.create({
        userId,
        centerId: room.centerId,
        title: `Room "${room.name}" booking cancelled`,
        message: `Your booking for ${room.name} has been cancelled.`,
        type: NotificationType.BOOKING,
        priority: NotificationPriority.LOW,
        actionUrl: null,
        metadata: { bookingId, roomId },
      });
      await this.notifRepo.save(notif);
    }

    await this.cache.invalidatePattern('meeting_rooms:*');
    await this.cache.invalidatePattern('events:*');
    return true;
  }
}
