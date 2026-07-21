/**
 * File:        apps/api/src/graphql/resolvers/center.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Center and location management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Resolver, Query, Args, Mutation, Context, Subscription, ID } from '@nestjs/graphql';
import { UnauthorizedException, NotFoundException, UseGuards } from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';
import { UserRole, CenterStatus } from '../types/user.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Center as CenterEntity } from '../../typeorm/entities/center.entity';
import { Location as LocationEntity } from '../../typeorm/entities/location.entity';
import { Floor as FloorEntity } from '../../typeorm/entities/floor.entity';
import { Seat as SeatEntity } from '../../typeorm/entities/seat.entity';
// Meeting rooms are managed exclusively through MeetingRoomResolver.
import { PubSubService } from '../pubsub/pubsub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole as UR } from '../../auth/roles.enum';
import {
  CreateCenterInput,
  UpdateCenterInput,
  CreateLocationInput,
  UpdateLocationInput,
  CreateFloorInput,
  UpdateFloorInput,
  CreateSeatInput,
  UpdateSeatInput,
} from '../inputs/center.input';

export const CENTER_TRIGGERS = {
  centerUpdated: 'center.updated',
  floorUpdated: 'floor.updated',
} as const;

/**
 * Recursively merge `incoming` into `target`. Plain object values are
 * merged key-by-key (so updating settings.finance doesn't wipe
 * settings.security); everything else is overwritten by the incoming value.
 */
function deepMergeSettings(
  target: Record<string, any>,
  incoming: Record<string, any>,
): Record<string, any> {
  const out: Record<string, any> = { ...target };
  for (const [key, value] of Object.entries(incoming)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMergeSettings(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

@Resolver(() => CenterEntity)
export class CenterResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(CenterEntity)
    private centerRepo: Repository<CenterEntity>,
    @InjectRepository(LocationEntity)
    private locationRepo: Repository<LocationEntity>,
    @InjectRepository(FloorEntity)
    private floorRepo: Repository<FloorEntity>,
    @InjectRepository(SeatEntity)
    private seatRepo: Repository<SeatEntity>,
    private readonly pubSub: PubSubService,
  ) {}

  @Query(() => [CenterEntity])
  async centers(): Promise<CenterEntity[]> {
    const centers = await this.centerRepo.find({
      relations: ['location', 'floors'],
    });
    return centers;
  }

  @Query(() => CenterEntity, { nullable: true })
  async center(@Args('id', { type: () => ID }) id: string): Promise<CenterEntity | null> {
    return this.cache.getOrSet<CenterEntity>(
      `center:${id}`,
      async () => {
        const center = await this.centerRepo.findOne({
          where: { id },
          relations: ['location', 'floors'],
        });
        return center;
      },
      3600 // Cache for 1 hour
    );
  }

  @Query(() => [CenterEntity])
  async myCenters(@Context() context): Promise<CenterEntity[]> {
    const userId = context.req.user?.id;
    if (!userId) {
      // No auth guard applied — return all centers instead of empty list
      const centers = await this.centerRepo.find({
        relations: ['location', 'floors', 'floors.seats'],
      });
      return centers;
    }

    const centers = await this.centerRepo.find({
      where: { owner: userId } as any,
      relations: ['location', 'floors', 'floors.seats'],
    });
    return centers;
  }

  @Mutation(() => CenterEntity)
  async createCenter(
    @Args('input') input: CreateCenterInput,
    @Context() context
  ): Promise<CenterEntity> {
    const userId = context.req.user?.id;

    // Auto-create a Location record (centers require a non-null locationId)
    const cityName = input.city || 'Unknown City';
    const stateName = input.state || 'Unknown State';
    const location = this.locationRepo.create({
      name: input.name,
      city: cityName,
      state: stateName,
      country: 'India',
      fullAddress: input.address || `${cityName}, ${stateName}, India`,
    });
    const savedLocation = await this.locationRepo.save(location);

    const newCenter = this.centerRepo.create({
      name: input.name,
      description: input.description,
      address: input.address,
      city: input.city,
      state: input.state,
      locationId: savedLocation.id,
      ...(userId ? { owner: userId } : {}),
    });
    const center = await this.centerRepo.save(newCenter);
    await this.cache.invalidatePattern('centers:*');
    return center;
  }

  @Mutation(() => CenterEntity)
  async updateCenter(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCenterInput,
    @Context() context
  ): Promise<CenterEntity> {
    await this.centerRepo.update(id, input);
    const center = await this.centerRepo.findOne({
      where: { id },
      relations: ['location'],
    });
    if (!center) throw new NotFoundException('Center not found');
    await this.cache.invalidatePattern(`center:${id}`);
    await this.pubSub.publish(CENTER_TRIGGERS.centerUpdated, { centerUpdated: center });
    return center;
  }

  @Mutation(() => Boolean)
  async deleteCenter(
    @Args('id', { type: () => ID }) id: string,
    @Context() context
  ): Promise<boolean> {

    await this.centerRepo.update(id, { status: CenterStatus.MAINTENANCE });
    await this.cache.invalidatePattern(`center:${id}`);
    return true;
  }

  /**
   * Return the persisted center settings (jsonb), or an empty object when
   * none exist yet. Used by every Settings page (finance, notifications,
   * security, operations, permissions) to load their toggles.
   */
  @Query(() => String, { description: 'Center settings as a JSON string' })
  async centerSettings(
    @Args('centerId', { type: () => ID }) centerId: string,
  ): Promise<string> {
    const center = await this.centerRepo.findOne({ where: { id: centerId } });
    return JSON.stringify(center?.settings ?? {});
  }

  /**
   * Deep-merge a partial settings object into Center.settings and return
   * the updated settings as a JSON string. Only the supplied keys are
   * overwritten; existing sibling keys are preserved.
   */
  @Mutation(() => String, { description: 'Update center settings (JSON string), returns merged settings' })
  async updateCenterSettings(
    @Args('centerId', { type: () => ID }) centerId: string,
    @Args('settings', { type: () => String }) settings: string,
    @Context() context
  ): Promise<string> {
    const center = await this.centerRepo.findOne({ where: { id: centerId } });
    if (!center) throw new NotFoundException('Center not found');

    let incoming: Record<string, any> = {};
    try {
      incoming = settings ? JSON.parse(settings) : {};
    } catch {
      incoming = {};
    }

    const merged = deepMergeSettings(center.settings ?? {}, incoming);
    await this.centerRepo.update(centerId, { settings: merged });
    await this.cache.invalidatePattern(`center:${centerId}`);
    await this.pubSub.publish(CENTER_TRIGGERS.centerUpdated, {
      centerUpdated: { ...center, settings: merged },
    });

    return JSON.stringify(merged);
  }
}

@Resolver(() => LocationEntity)
export class LocationResolver {
  constructor(
    @InjectRepository(LocationEntity)
    private locationRepo: Repository<LocationEntity>,
  ) {}

  @Query(() => [LocationEntity])
  async locations(): Promise<LocationEntity[]> {
    const locations = await this.locationRepo.find({
      relations: ['centers'],
    });
    return locations;
  }

  @Query(() => LocationEntity, { nullable: true })
  async location(@Args('id', { type: () => ID }) id: string): Promise<LocationEntity | null> {
    const location = await this.locationRepo.findOne({
      where: { id },
      relations: ['centers'],
    });
    return location;
  }

  @Mutation(() => LocationEntity)
  async createLocation(
    @Args('input') input: CreateLocationInput,
    @Context() context
  ): Promise<LocationEntity> {
    const userId = context.req.user?.id;
    if (!userId) throw new UnauthorizedException('Unauthorized');

    const newLocation = this.locationRepo.create(input);
    const location = await this.locationRepo.save(newLocation);
    return location;
  }

  @Mutation(() => LocationEntity)
  async updateLocation(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateLocationInput
  ): Promise<LocationEntity> {
    await this.locationRepo.update(id, input);
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }
}

@Resolver(() => FloorEntity)
export class FloorResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(FloorEntity)
    private floorRepo: Repository<FloorEntity>,
    @InjectRepository(SeatEntity)
    private seatRepo: Repository<SeatEntity>,
    private readonly pubSub: PubSubService,
  ) {}

  @Query(() => [FloorEntity])
  @UseGuards(GqlAuthGuard)
  async floors(@Args('centerId', { type: () => ID, nullable: true }) centerId?: string): Promise<FloorEntity[]> {
    const where: any = centerId ? { centerId, active: true } : { active: true };
    const floors = await this.floorRepo.find({
      where,
      relations: ['seats'],
    });
    return floors;
  }

  @Mutation(() => FloorEntity)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UR.ADMIN, UR.CENTER_MANAGER)
  async createFloor(
    @Args('input') input: CreateFloorInput
  ): Promise<FloorEntity> {
    const newFloor = this.floorRepo.create(input);
    const floor = await this.floorRepo.save(newFloor);
    await this.cache.invalidatePattern(`center:${floor.centerId}`);
    return floor;
  }

  @Mutation(() => FloorEntity)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UR.ADMIN, UR.CENTER_MANAGER)
  async updateFloor(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFloorInput
  ): Promise<FloorEntity> {
    await this.floorRepo.update(id, input);
    const floor = await this.floorRepo.findOne({ where: { id }, relations: ['seats'] });
    if (!floor) throw new NotFoundException('Floor not found');
    await this.cache.invalidatePattern(`floor:${id}`);
    await this.cache.invalidatePattern(`center:${floor.centerId}`);
    await this.pubSub.publish(CENTER_TRIGGERS.floorUpdated, { floorUpdated: floor });
    return floor;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UR.ADMIN, UR.CENTER_MANAGER)
  async deleteFloor(
    @Args('id', { type: () => ID }) id: string
  ): Promise<boolean> {
    const floor = await this.floorRepo.findOne({ where: { id } });
    if (!floor) throw new NotFoundException('Floor not found');
    await this.floorRepo.softDelete(id);
    await this.cache.invalidatePattern(`floor:${id}`);
    await this.cache.invalidatePattern(`center:${floor.centerId}`);
    return true;
  }
}

@Resolver(() => SeatEntity)
export class SeatResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(SeatEntity)
    private seatRepo: Repository<SeatEntity>,
    private readonly pubSub: PubSubService,
  ) {}

  @Query(() => [SeatEntity])
  @UseGuards(GqlAuthGuard)
  async seats(@Args('floorId', { type: () => ID, nullable: true }) floorId?: string): Promise<SeatEntity[]> {
    const where = floorId ? { floorId } : {};
    const seats = await this.seatRepo.find({
      where,
      relations: ['floor'],
    });
    return seats;
  }

  @Query(() => SeatEntity, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async seat(@Args('id', { type: () => ID }) id: string): Promise<SeatEntity | null> {
    const seat = await this.seatRepo.findOne({
      where: { id },
      relations: ['floor'],
    });
    return seat;
  }

  @Mutation(() => SeatEntity)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UR.ADMIN, UR.CENTER_MANAGER)
  async createSeat(@Args('input') input: CreateSeatInput): Promise<SeatEntity> {
    const newSeat = this.seatRepo.create(input);
    const seat = await this.seatRepo.save(newSeat);

    // Note: Meeting rooms are managed exclusively through the meeting_rooms
    // table via MeetingRoomResolver. Seats are inventory assets (desks,
    // hot-desks, private spaces) only. Setting seatType='MEETING_ROOM' here
    // is just a label and does NOT create a MeetingRoom record.

    return seat;
  }

  @Mutation(() => SeatEntity)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UR.ADMIN, UR.CENTER_MANAGER)
  async updateSeat(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSeatInput
  ): Promise<SeatEntity> {
    await this.seatRepo.update(id, input);
    const seat = await this.seatRepo.findOne({
      where: { id },
      relations: ['floor'],
    });
    if (!seat) throw new NotFoundException('Seat not found');

    await this.cache.invalidatePattern(`floor:*`);
    await this.cache.invalidatePattern(`center:*`);
    await this.pubSub.publish(CENTER_TRIGGERS.floorUpdated, {
      floorUpdated: seat?.floor,
    });

    return seat;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UR.ADMIN, UR.CENTER_MANAGER)
  async deleteSeat(
    @Args('id', { type: () => ID }) id: string
  ): Promise<boolean> {
    const seat = await this.seatRepo.findOne({ where: { id }, relations: ['floor'] });
    if (!seat) throw new NotFoundException('Seat not found');
    await this.seatRepo.softDelete(id);
    if (seat.floor) {
      await this.cache.invalidatePattern(`floor:${seat.floor.id}`);
      await this.pubSub.publish(CENTER_TRIGGERS.floorUpdated, { floorUpdated: seat.floor });
    }
    return true;
  }

  /**
   * Subscription: fires when any seat in the system updates (status,
   * price, label). The UI listens to keep the floor plan in sync.
   */
  @Subscription(() => SeatEntity, {
    name: 'seatUpdated',
    description: 'Seat updated (status, price, label, etc.)',
    filter: (payload: { seatUpdated: SeatEntity | null }, vars: { floorId?: string }) => {
      if (!vars.floorId) return true;
      return payload.seatUpdated?.floorId === vars.floorId;
    },
  })
  seatUpdatedSubscription(@Args('floorId', { nullable: true }) _floorId?: string) {
    return this.pubSub.asyncIterator(CENTER_TRIGGERS.floorUpdated);
  }

  /**
   * Subscription: fires when any center is updated.
   */
  @Subscription(() => CenterEntity, {
    name: 'centerUpdated',
    description: 'Center updated (name, status, location, etc.)',
  })
  centerUpdatedSubscription() {
    return this.pubSub.asyncIterator(CENTER_TRIGGERS.centerUpdated);
  }
}