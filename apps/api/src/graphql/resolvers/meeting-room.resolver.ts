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
import { Repository, MoreThanOrEqual, Like, In, NotIn, Between, LessThan, MoreThan } from 'typeorm';
import { MeetingRoom } from '../../typeorm/entities/meeting-room.entity';
import { Booking } from '../../typeorm/entities/booking.entity';
import { Notification } from '../../typeorm/entities/notification.entity';
import { NotificationType, NotificationPriority, BookingStatus } from '../types/user.type';
import {
  RoomFiltersInput,
  CreateMeetingRoomInput,
  UpdateMeetingRoomInput,
} from '../inputs/meeting-room.input';
import { CacheService } from '../../cache/cache.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/roles.enum';
import { JwtPayload } from '../../auth/types/jwt-payload.type';
import { RoomStatus } from '../types/user.type';

@Resolver(() => MeetingRoom)
export class MeetingRoomResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(MeetingRoom)
    private roomRepo: Repository<MeetingRoom>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
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
      if (filters.minCapacity) where.capacity = MoreThanOrEqual(filters.minCapacity);
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
  async meetingRoom(@Args('id', { type: () => ID }) id: string): Promise<MeetingRoom | null> {
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
    const { start, end } = this.buildBookingWindow(eventDate, startTime, endTime);

    const conflictingBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .innerJoin('booking.meetingRoom', 'room')
      .where('booking.centerId = :centerId', { centerId })
      .andWhere('room.floorId = :floorId', { floorId })
      .andWhere('booking.eventDate = :eventDate', { eventDate })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
      })
      .andWhere('(booking.startDate < :end AND booking.endDate > :start)', {
        start,
        end,
      })
      .getMany();

    const bookedIds = conflictingBookings.map((b) => b.meetingRoomId);

    return this.roomRepo.find({
      where: {
        centerId,
        floorId,
        active: true,
        ...(bookedIds.length > 0 ? { id: NotIn(bookedIds) as any } : {}),
      },
      relations: ['center'],
      order: { name: 'ASC' },
    });
  }

  @Mutation(() => MeetingRoom)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CENTER_MANAGER)
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
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CENTER_MANAGER)
  async updateMeetingRoom(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateMeetingRoomInput,
  ): Promise<MeetingRoom> {
    const { pricePerHour, ...rest } = input;
    const updatePayload: any = { ...rest };
    if (pricePerHour !== undefined) updatePayload.hourlyRate = pricePerHour;

    await this.roomRepo.update(id, updatePayload);
    const room = await this.roomRepo.findOne({ where: { id }, relations: ['center'] });
    await this.cache.invalidatePattern('meeting_rooms:*');
    await this.cache.invalidate(`meeting_room:${id}`);
    if (!room) throw new Error(`MeetingRoom ${id} not found`);
    return room;
  }

  @Mutation(() => MeetingRoom)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CENTER_MANAGER)
  async updateRoomStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => String }) status: RoomStatus,
  ): Promise<MeetingRoom> {
    await this.roomRepo.update(id, { status });
    const room = await this.roomRepo.findOne({ where: { id }, relations: ['center'] });
    await this.cache.invalidatePattern('meeting_rooms:*');
    await this.cache.invalidate(`meeting_room:${id}`);
    if (!room) throw new Error(`MeetingRoom ${id} not found`);
    return room;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CENTER_MANAGER)
  async deleteMeetingRoom(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.roomRepo.delete(id);
    await this.cache.invalidatePattern('meeting_rooms:*');
    await this.cache.invalidate(`meeting_room:${id}`);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CENTER_MANAGER)
  async bulkUpdateStatus(
    @Args('roomIds', { type: () => [String] }) roomIds: string[],
    @Args('status', { type: () => String }) status: RoomStatus,
  ): Promise<boolean> {
    if (roomIds.length === 0) return true;
    await this.roomRepo.update({ id: In(roomIds) as any }, { status });
    await this.cache.invalidatePattern('meeting_rooms:*');
    return true;
  }

  @Mutation(() => MeetingRoom)
  @UseGuards(GqlAuthGuard)
  async bookRoom(
    @Args('roomId') roomId: string,
    @Args('centerId') centerId: string,
    @Args('eventDate') eventDate: string,
    @Args('startTime') startTime: string,
    @Args('endTime') endTime: string,
    @Args('title') title: string,
    @CurrentUser() user: JwtPayload,
    @Args('requestedBy', { nullable: true }) requestedBy?: string,
  ): Promise<MeetingRoom> {
    const { start, end } = this.buildBookingWindow(eventDate, startTime, endTime);
    const eventDateObj = new Date(eventDate);

    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new Error(`MeetingRoom ${roomId} not found`);

    const duration = (end - start) / (1000 * 60);
    if (duration < room.minBookingDuration || duration > room.maxBookingDuration) {
      throw new Error(
        `Booking duration (${duration}m) must be between ${room.minBookingDuration}m and ${room.maxBookingDuration}m`,
      );
    }

    const conflict = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.meetingRoomId = :roomId', { roomId })
      .andWhere('booking.eventDate = :eventDate', { eventDate })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
      })
      .andWhere('(booking.startDate < :end AND booking.endDate > :start)', { start, end })
      .getOne();

    if (conflict) {
      throw new Error(
        `Room is already booked for the requested window (${conflict.startDate?.toISOString()} – ${conflict.endDate?.toISOString()})`,
      );
    }

    const booking = this.bookingRepo.create({
      centerId,
      meetingRoomId: roomId,
      eventDate: eventDateObj,
      startDate: start,
      endDate: end,
      title,
      requestedById: requestedBy ?? user.sub,
      status: BookingStatus.CONFIRMED,
    });
    await this.bookingRepo.save(booking);

    await this.roomRepo.update(roomId, { status: RoomStatus.BOOKED });
    await this.cache.invalidatePattern('meeting_rooms:*');

    // Create notification for the booking
    const bookedRoom = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['center'],
    });
    if (bookedRoom) {
      const notif = this.notifRepo.create({
        userId: user.sub,
        centerId: bookedRoom.centerId,
        title: `Room "${bookedRoom.name}" booked`,
        message: `You have booked ${bookedRoom.name} on ${eventDate} from ${startTime} to ${endTime}.`,
        type: NotificationType.BOOKING,
        priority: NotificationPriority.MEDIUM,
        actionUrl: null,
        metadata: { roomId, eventDate, startTime, endTime },
      });
      await this.notifRepo.save(notif);
    }

    const roomWithCenter = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['center'],
    });
    if (!roomWithCenter) throw new Error(`MeetingRoom ${roomId} not found after booking`);
    return roomWithCenter;
  }

  @Mutation(() => Boolean, { name: 'cancelRoomBooking' })
  @UseGuards(GqlAuthGuard)
  async cancelRoomBooking(
    @Args('bookingId') bookingId: string,
    @Args('roomId') roomId: string,
    @Context() context?: any,
  ): Promise<boolean> {
    const cancelledBooking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    await this.bookingRepo.delete(bookingId);

    const remainingBookings = await this.bookingRepo.count({
      where: {
        meetingRoomId: roomId,
        status: In([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
      },
    });

    if (remainingBookings === 0) {
      await this.roomRepo.update(roomId, { status: RoomStatus.AVAILABLE });
    }

    // Notify the booking owner
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    const userId = context?.req?.user?.sub ?? cancelledBooking?.userId;
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
    return true;
  }
}
