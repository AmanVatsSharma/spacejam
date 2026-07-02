/**
 * File:        graphql/resolvers/meeting-room.resolver.ts
 * Module:      API · GraphQL · Resolver · MeetingRoom
 * Purpose:     GraphQL resolver for meeting room queries and mutations.
 *              Provides CRUD operations for meeting room management with
 *              cache invalidation, status updates, and filtered queries.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cacheable } from '../../cache/decorators/cacheable.decorator';
import { CacheInvalidate } from '../../cache/decorators/cache-invalidate.decorator';

import { MeetingRoom } from '../../typeorm/entities/meeting-room.entity';
import {
  MeetingRoomFiltersInput,
  CreateMeetingRoomInput,
  UpdateMeetingRoomInput,
} from '../inputs/meeting-room.input';
import { GenericActionResult } from '../types/user.type';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => MeetingRoom)
export class MeetingRoomResolver {
  constructor(
    private readonly cache: CacheService,
    @InjectRepository(MeetingRoom)
    private readonly roomRepo: Repository<MeetingRoom>,
  ) {}

  @Query(() => [MeetingRoom], { description: 'List all meeting rooms with optional filters' })
  @Cacheable({ key: 'meetingRooms:list', ttlSeconds: 300 })
  async meetingRooms(
    @Args('filters', { nullable: true }) filters?: MeetingRoomFiltersInput,
  ): Promise<MeetingRoom[]> {
    const where: Record<string, unknown> = {};
    if (filters?.centerId) where.centerId = filters.centerId;
    if (filters?.floorId) where.floorId = filters.floorId;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.minCapacity) where.capacity = (where.capacity as number) >= filters.minCapacity!;

    const query = this.roomRepo.createQueryBuilder('room');

    if (filters?.search) {
      query.andWhere('room.name ILIKE :search', { search: `%${filters.search}%` });
    }

    query.andWhere(where);

    return query.getMany();
  }

  @Query(() => MeetingRoom, { nullable: true, description: 'Get a single meeting room by ID' })
  async meetingRoom(@Args('id') id: string): Promise<MeetingRoom | null> {
    return this.roomRepo.findOne({ where: { id } });
  }

  @Mutation(() => MeetingRoom, { description: 'Create a new meeting room' })
  @CacheInvalidate({ keys: ['meetingRooms:*'] })
  async createMeetingRoom(
    @Args('input') input: CreateMeetingRoomInput,
  ): Promise<MeetingRoom> {
    const room = this.roomRepo.create(input);
    return this.roomRepo.save(room);
  }

  @Mutation(() => MeetingRoom, { nullable: true, description: 'Update an existing meeting room' })
  @CacheInvalidate({ keys: ['meetingRooms:*'] })
  async updateMeetingRoom(
    @Args('id') id: string,
    @Args('input') input: UpdateMeetingRoomInput,
  ): Promise<MeetingRoom | null> {
    await this.roomRepo.update(id, input);
    return this.roomRepo.findOne({ where: { id } });
  }

  @Mutation(() => GenericActionResult, { description: 'Delete a meeting room' })
  @CacheInvalidate({ keys: ['meetingRooms:*'] })
  async deleteMeetingRoom(@Args('id') id: string): Promise<GenericActionResult> {
    const count = await this.roomRepo.delete(id);
    return { ok: count.affected > 0, error: count.affected > 0 ? null : 'Room not found' };
  }

  @Mutation(() => MeetingRoom, { description: 'Update a meeting room status' })
  @CacheInvalidate({ keys: ['meetingRooms:*'] })
  async updateRoomStatus(
    @Args('id') id: string,
    @Args('status') status: RoomStatus,
  ): Promise<MeetingRoom | null> {
    await this.roomRepo.update(id, { status });
    return this.roomRepo.findOne({ where: { id } });
  }

  /**
   * Bulk update room statuses — useful when a booking starts/ends
   * and multiple rooms need status recalculation.
   */
  @Mutation(() => [MeetingRoom], {
    description: 'Bulk update meeting room statuses. Input is an array of { id, status } pairs.',
  })
  @CacheInvalidate({ keys: ['meetingRooms:*'] })
  async bulkUpdateStatus(
    @Args('updates', { type: () => [MeetingRoomBulkUpdateInput!] })
    updates: Array<{ id: string; status: RoomStatus }>,
  ): Promise<MeetingRoom[]> {
    const results: MeetingRoom[] = [];
    for (const update of updates) {
      await this.roomRepo.update(update.id, { status: update.status });
      const room = await this.roomRepo.findOne({ where: { id: update.id } });
      if (room) results.push(room);
    }
    return results;
  }
}

/**
 * Scalar input type for bulk status updates.
 * Must be declared outside the resolver class so NestJS can register it.
 */
@InputType()
export class MeetingRoomBulkUpdateInput {
  @Field()
  id!: string;

  @Field()
  status!: RoomStatus;
}
