/**
 * File:        apps/api/src/graphql/resolvers/meeting-room.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     MeetingRoom management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

import { Resolver, Query, Args, Mutation, Context, ID } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Like, Not, In } from 'typeorm';
import { MeetingRoom } from '../../typeorm/entities/meeting-room.entity';
import { Booking } from '../../typeorm/entities/booking.entity';
import { RoomFiltersInput } from '../inputs/meeting-room.input';
import { CreateMeetingRoomInput, UpdateMeetingRoomInput } from '../inputs/meeting-room.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => MeetingRoom)
export class MeetingRoomResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(MeetingRoom)
    private roomRepo: Repository<MeetingRoom>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  @Query(() => [MeetingRoom])
  async meetingRooms(
    @Args('filters', { nullable: true }) filters?: RoomFiltersInput,
  ): Promise<MeetingRoom[]> {
    const where: any = { active: true };

    if (filters) {
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.floorId) where.floorId = filters.floorId;
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      if (filters.minCapacity) where.capacity = MoreThanOrEqual(filters.minCapacity);
      if (filters.search) where.name = Like(`%${filters.search}%`);
    }

    const rooms = await this.roomRepo.find({
      where,
      relations: ['center'],
      order: { name: 'ASC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });

    return rooms;
  }

  @Query(() => MeetingRoom, { nullable: true })
  async meetingRoom(@Args('id', () => ID) id: string): Promise<MeetingRoom | null> {
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
    const where: any = { status: 'AVAILABLE', active: true };
    if (centerId) where.centerId = centerId;
    if (minCapacity) where.capacity = MoreThanOrEqual(minCapacity);

    return this.roomRepo.find({
      where,
      relations: ['center'],
      order: { name: 'ASC' },
    });
  }

  @Mutation(() => MeetingRoom)
  async createMeetingRoom(
    @Args('input') input: CreateMeetingRoomInput,
    @Context() context: any,
  ): Promise<MeetingRoom> {
    const room = this.roomRepo.create(input);
    const saved = await this.roomRepo.save(room);
    await this.cache.invalidatePattern('meeting_rooms:*');
    return saved;
  }

  @Mutation(() => MeetingRoom)
  async updateMeetingRoom(
    @Args('id', () => ID) id: string,
    @Args('input') input: UpdateMeetingRoomInput,
  ): Promise<MeetingRoom> {
    await this.roomRepo.update(id, input);
    const room = await this.roomRepo.findOne({ where: { id }, relations: ['center'] });
    await this.cache.invalidatePattern('meeting_rooms:*');
    await this.cache.invalidate(`meeting_room:${id}`);
    return room!;
  }

  @Mutation(() => MeetingRoom)
  async updateRoomStatus(
    @Args('id', () => ID) id: string,
    @Args('status') status: string,
  ): Promise<MeetingRoom> {
    await this.roomRepo.update(id, { status });
    const room = await this.roomRepo.findOne({ where: { id }, relations: ['center'] });
    await this.cache.invalidatePattern('meeting_rooms:*');
    await this.cache.invalidate(`meeting_room:${id}`);
    return room!;
  }

  @Mutation(() => Boolean)
  async deleteMeetingRoom(@Args('id', () => ID) id: string): Promise<boolean> {
    await this.roomRepo.delete(id);
    await this.cache.invalidatePattern('meeting_rooms:*');
    await this.cache.invalidate(`meeting_room:${id}`);
    return true;
  }

  @Mutation(() => Boolean)
  async bulkUpdateStatus(
    @Args('roomIds', () => [String]) roomIds: string[],
    @Args('status') status: string,
  ): Promise<boolean> {
    await this.roomRepo.update(
      { id: In(roomIds) as any },
      { status: status as any },
    );
    await this.cache.invalidatePattern('meeting_rooms:*');
    return true;
  }

  @Query(() => [MeetingRoom])
  async roomAvailability(
    @Args('centerId') centerId: string,
    @Args('floorId') floorId: string,
    @Args('eventDate') eventDate: string,
    @Args('startTime') startTime: string,
    @Args('endTime') endTime: string,
  ): Promise<MeetingRoom[]> {
    // Rooms not booked during this window
    const conflictingBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .innerJoin('booking.meetingRoom', 'room')
      .where('booking.centerId = :centerId', { centerId })
      .andWhere('room.floorId = :floorId', { floorId })
      .andWhere('booking.eventDate = :eventDate', { eventDate })
      .andWhere('booking.status IN (:...statuses)', { statuses: ['CONFIRMED', 'PENDING'] })
      .andWhere('(booking.startTime < :end AND booking.endTime > :start)', { start: startTime, end: endTime })
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
  async bookRoom(
    @Args('roomId') roomId: string,
    @Args('centerId') centerId: string,
    @Args('eventDate') eventDate: string,
    @Args('startTime') startTime: string,
    @Args('endTime') endTime: string,
    @Args('title') title: string,
    @Args('requestedBy', { nullable: true }) requestedBy?: string,
  ): Promise<MeetingRoom> {
    const booking = this.bookingRepo.create({
      centerId,
      meetingRoomId: roomId,
      eventDate: new Date(eventDate),
      startTime,
      endTime,
      title,
      requestedBy,
      status: 'CONFIRMED',
    });
    await this.bookingRepo.save(booking);
    await this.roomRepo.update(roomId, { status: 'BOOKED' });
    await this.cache.invalidatePattern('meeting_rooms:*');

    return this.roomRepo.findOne({ where: { id: roomId }, relations: ['center'] }) as Promise<MeetingRoom>;
  }

  @Mutation(() => Boolean)
  async cancelBooking(
    @Args('bookingId') bookingId: string,
    @Args('roomId') roomId: string,
  ): Promise<boolean> {
    await this.bookingRepo.delete(bookingId);
    await this.roomRepo.update(roomId, { status: 'AVAILABLE' });
    await this.cache.invalidatePattern('meeting_rooms:*');
    return true;
  }
}