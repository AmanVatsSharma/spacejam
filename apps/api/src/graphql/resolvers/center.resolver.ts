/**
 * File:        apps/api/src/graphql/resolvers/center.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Center and location management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Resolver, Query, Args, Mutation, Context, Subscription } from '@nestjs/graphql';
import { TypeormService } from '../../typeorm/typeorm.service';
import { CacheService } from '../../cache/cache.service';
import {
  Center,
  Location,
  Floor,
  Seat,
  UserRole,
  CenterStatus
} from '../types/user.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Center as CenterEntity } from '../../typeorm/entities/center.entity';
import { Location as LocationEntity } from '../../typeorm/entities/location.entity';
import { Floor as FloorEntity } from '../../typeorm/entities/floor.entity';
import { Seat as SeatEntity } from '../../typeorm/entities/seat.entity';
import { PubSubService } from '../pubsub/pubsub.service';
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

@Resolver(() => Center)
export class CenterResolver {
  constructor(
    private typeorm: TypeormService,
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

  @Query(() => [Center])
  async centers(): Promise<Center[]> {
    const centers = await this.centerRepo.find({
      relations: ['location', 'floors'],
    });
    return centers as unknown as Center[];
  }

  @Query(() => Center, { nullable: true })
  async center(@Args('id') id: string): Promise<Center | null> {
    return this.cache.getOrSet<Center>(
      `center:${id}`,
      async () => {
        const center = await this.centerRepo.findOne({
          where: { id },
          relations: ['location', 'floors'],
        });
        return center as unknown as Center | null;
      },
      3600 // Cache for 1 hour
    );
  }

  @Query(() => [Center])
  async myCenters(@Context() context): Promise<Center[]> {
    const userId = context.req.user?.id;
    if (!userId) return [];

    const centers = await this.centerRepo.find({
      where: { owner: userId } as any,
      relations: ['location', 'floors'],
    });
    return centers as unknown as Center[];
  }

  @Mutation(() => Center)
  async createCenter(
    @Args('input') input: CreateCenterInput,
    @Context() context
  ): Promise<Center> {
    const userId = context.req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const newCenter = this.centerRepo.create({
      ...input,
      owner: userId,
    });
    const center = await this.centerRepo.save(newCenter);
    await this.cache.invalidatePattern('centers:*');
    return center as unknown as Center;
  }

  @Mutation(() => Center)
  async updateCenter(
    @Args('id') id: string,
    @Args('input') input: UpdateCenterInput,
    @Context() context
  ): Promise<Center> {
    const userId = context.req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    await this.centerRepo.update(id, input);
    const center = await this.centerRepo.findOne({
      where: { id },
      relations: ['location'],
    });
    await this.cache.invalidatePattern(`center:${id}`);
    await this.pubSub.publish(CENTER_TRIGGERS.centerUpdated, { centerUpdated: center });
    return center as unknown as Center;
  }

  @Mutation(() => Boolean)
  async deleteCenter(
    @Args('id') id: string,
    @Context() context
  ): Promise<boolean> {
    const userId = context.req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    await this.centerRepo.update(id, { status: CenterStatus.MAINTENANCE });
    await this.cache.invalidatePattern(`center:${id}`);
    return true;
  }
}

@Resolver(() => Location)
export class LocationResolver {
  constructor(
    private typeorm: TypeormService,
    @InjectRepository(LocationEntity)
    private locationRepo: Repository<LocationEntity>,
  ) {}

  @Query(() => [Location])
  async locations(): Promise<Location[]> {
    const locations = await this.locationRepo.find({
      relations: ['centers'],
    });
    return locations as unknown as Location[];
  }

  @Query(() => Location, { nullable: true })
  async location(@Args('id') id: string): Promise<Location | null> {
    const location = await this.locationRepo.findOne({
      where: { id },
      relations: ['centers'],
    });
    return location as unknown as Location | null;
  }

  @Mutation(() => Location)
  async createLocation(
    @Args('input') input: CreateLocationInput,
    @Context() context
  ): Promise<Location> {
    const userId = context.req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const newLocation = this.locationRepo.create(input);
    const location = await this.locationRepo.save(newLocation);
    return location as unknown as Location;
  }

  @Mutation(() => Location)
  async updateLocation(
    @Args('id') id: string,
    @Args('input') input: UpdateLocationInput
  ): Promise<Location> {
    await this.locationRepo.update(id, input);
    const location = await this.locationRepo.findOne({ where: { id } });
    return location as unknown as Location;
  }
}

@Resolver(() => Floor)
export class FloorResolver {
  constructor(
    private typeorm: TypeormService,
    private cache: CacheService,
    @InjectRepository(FloorEntity)
    private floorRepo: Repository<FloorEntity>,
    private readonly pubSub: PubSubService,
  ) {}

  @Query(() => [Floor])
  async floors(@Args('centerId', { nullable: true }) centerId?: string): Promise<Floor[]> {
    const where: any = centerId ? { centerId, active: true } : { active: true };
    const floors = await this.floorRepo.find({
      where,
      relations: ['seats'],
    });
    return floors as unknown as Floor[];
  }

  @Mutation(() => Floor)
  async createFloor(
    @Args('input') input: CreateFloorInput
  ): Promise<Floor> {
    const newFloor = this.floorRepo.create(input);
    const floor = await this.floorRepo.save(newFloor);
    return floor as unknown as Floor;
  }
}

@Resolver(() => Seat)
export class SeatResolver {
  constructor(
    private typeorm: TypeormService,
    private cache: CacheService,
    @InjectRepository(SeatEntity)
    private seatRepo: Repository<SeatEntity>,
    private readonly pubSub: PubSubService,
  ) {}

  @Query(() => [Seat])
  async seats(@Args('floorId', { nullable: true }) floorId?: string): Promise<Seat[]> {
    const where = floorId ? { floorId } : {};
    const seats = await this.seatRepo.find({
      where,
      relations: ['floor'],
    });
    return seats as unknown as Seat[];
  }

  @Query(() => Seat, { nullable: true })
  async seat(@Args('id') id: string): Promise<Seat | null> {
    const seat = await this.seatRepo.findOne({
      where: { id },
      relations: ['floor'],
    });
    return seat as unknown as Seat | null;
  }

  @Mutation(() => Seat)
  async createSeat(@Args('input') input: CreateSeatInput): Promise<Seat> {
    const newSeat = this.seatRepo.create(input);
    const seat = await this.seatRepo.save(newSeat);
    return seat as unknown as Seat;
  }

  @Mutation(() => Seat)
  async updateSeat(
    @Args('id') id: string,
    @Args('input') input: UpdateSeatInput
  ): Promise<Seat> {
    await this.seatRepo.update(id, input);
    const seat = await this.seatRepo.findOne({
      where: { id },
      relations: ['floor'],
    });

    await this.cache.invalidatePattern(`floor:*`);
    await this.cache.invalidatePattern(`center:*`);
    await this.pubSub.publish(CENTER_TRIGGERS.floorUpdated, {
      floorUpdated: seat?.floor,
    });

    return seat as unknown as Seat;
  }

  /**
   * Subscription: fires when any seat in the system updates (status,
   * price, label). The UI listens to keep the floor plan in sync.
   */
  @Subscription(() => Seat, {
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
  @Subscription(() => Center, {
    name: 'centerUpdated',
    description: 'Center updated (name, status, location, etc.)',
  })
  centerUpdatedSubscription() {
    return this.pubSub.asyncIterator(CENTER_TRIGGERS.centerUpdated);
  }
}