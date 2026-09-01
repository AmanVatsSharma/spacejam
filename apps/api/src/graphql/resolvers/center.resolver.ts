/**
 * File:        apps/api/src/graphql/resolvers/center.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Center and location management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Resolver, Query, Args, Mutation, Context, Subscription, ID } from '@nestjs/graphql';
import {
  NotFoundException,
  UnauthorizedException,
  UseGuards,
  Logger,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';
import { CenterStatus, UserRole } from '../types/user.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Center as CenterEntity } from '../../typeorm/entities/center.entity';
import { Location as LocationEntity } from '../../typeorm/entities/location.entity';
import { Floor as FloorEntity } from '../../typeorm/entities/floor.entity';
import { Seat as SeatEntity } from '../../typeorm/entities/seat.entity';
// Meeting rooms are managed exclusively through MeetingRoomResolver.
import { PubSubService } from '../pubsub/pubsub.service';
import { Public } from '../../auth/decorators/public.decorator';
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
import { deepMergeSettings, sanitizeSettings } from '../../common/utils/settings.util';
import { sanitizeFloorLayout } from '../../common/utils/floor-layout.util';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { centerScope } from '../../auth/helpers/center-scope.helper';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CenterScoped } from '../../auth/decorators/center-scoped.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CenterScopedGuard } from '../../auth/guards/center-scoped.guard';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { AuditService } from '../../auth/services/audit.service';

export const CENTER_TRIGGERS = {
  centerUpdated: 'center.updated',
  floorUpdated: 'floor.updated',
} as const;

/**
 * Deep-merge a partial settings object into Center.settings so that
 * updating one group (finance) never wipes another (security).
 * @see src/common/utils/settings.util.ts
 */

@Resolver(() => CenterEntity)
@UseGuards(GqlAuthGuard, RolesGuard, CenterScopedGuard)
export class CenterResolver {
  private readonly logger = new Logger(CenterResolver.name);
  constructor(
    private cache: CacheService,
    @InjectRepository(CenterEntity)
    private centerRepo: Repository<CenterEntity>,
    @InjectRepository(LocationEntity)
    private locationRepo: Repository<LocationEntity>,


    private readonly pubSub: PubSubService,
    private readonly audit: AuditService,
  ) {}

  @Query(() => [CenterEntity])
  async centers(@CurrentUser() caller?: JwtPayload): Promise<CenterEntity[]> {
    const scope = caller ? centerScope(caller) : undefined;
    const where: any = scope ? { id: scope } : {};
    const centers = await this.centerRepo.find({
      where: Object.keys(where).length ? where : undefined,
      relations: ['location', 'floors'],
    });
    return centers;
  }

  @Query(() => CenterEntity, { nullable: true })
  async center(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<CenterEntity | null> {
    // Center managers may only fetch their own center.
    const scope = caller ? centerScope(caller) : undefined;
    if (scope && scope !== id) return null;
    return this.cache.getOrSet<CenterEntity | null>(
      `center:${id}`,
      async () => {
        const center = await this.centerRepo.findOne({
          where: { id },
          relations: ['location', 'floors'],
        });
        return center;
      },
      { ttl: 3600 } // Cache for 1 hour
    );
  }

  @Query(() => [CenterEntity])
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
  async myCenters(
    @Context() context: any,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<CenterEntity[]> {
    const userId = context.req.user?.id;
    // Center managers see only their assigned center; super admins (no scope)
    // see all centers they own (legacy `owner` column) or all centers.
    const scope = caller ? centerScope(caller) : undefined;
    if (scope) {
      return this.centerRepo.find({
        where: { id: scope } as any,
        relations: ['location', 'floors', 'floors.seats'],
      });
    }
    if (!userId) {
      return [];
    }

    const centers = await this.centerRepo.find({
      where: { owner: userId } as any,
      relations: ['location', 'floors', 'floors.seats'],
    });
    // Super admins with no owned centers still see everything.
    return centers.length
      ? centers
      : this.centerRepo.find({ relations: ['location', 'floors', 'floors.seats'] });
  }

  @Mutation(() => CenterEntity)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
  async createCenter(
    @Args('input') input: CreateCenterInput,
    @Context() context: any
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
      locationId: savedLocation.id,
      status: CenterStatus.ACTIVE,
      owner: userId,
    });
    const center = await this.centerRepo.save(newCenter);
    await this.cache.invalidatePattern('centers:*');
    // A center manager creating a center is setting up their own workspace —
    // point their account at it so scoped queries (myCenters, seats,
    // settings) see the new center.
    const caller = context.req?.user;
    if (caller?.role === UserRole.CENTER_MANAGER && caller?.sub) {
      try {
        await this.centerRepo.manager.update(
          'User',
          { id: caller.sub },
          { centerId: center.id } as any,
        );
      } catch (err) {
        this.logger.warn(`could not re-assign manager to new center: ${String(err)}`);
      }
    }
    this.audit.record({
      action: 'CENTER_CREATE',
      userId: context.req.user?.sub ?? context.req.user?.id ?? null,
      entityType: 'Center',
      entityId: center.id,
      centerId: center.id,
    }).catch(() => { /* record() already swallows; belt-and-suspenders */ });
    return center;
  }

  @Mutation(() => CenterEntity)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
  @CenterScoped('id')
  async updateCenter(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCenterInput,
    @Context() context: any
  ): Promise<CenterEntity> {
    await this.centerRepo.update(id, input as any);
    const center = await this.centerRepo.findOne({
      where: { id },
      relations: ['location'],
    });
    if (!center) throw new NotFoundException('Center not found');
    await this.cache.invalidatePattern(`center:${id}`);
    await this.pubSub.publish(CENTER_TRIGGERS.centerUpdated, { centerUpdated: center });
    this.audit.record({
      action: 'CENTER_UPDATE',
      userId: context.req.user?.sub ?? context.req.user?.id ?? null,
      entityType: 'Center',
      entityId: id,
      centerId: id,
    }).catch(() => { /* record() already swallows; belt-and-suspenders */ });
    return center;
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.SUPER_ADMIN)
  async deleteCenter(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any
  ): Promise<boolean> {

    await this.centerRepo.update(id, { status: CenterStatus.MAINTENANCE });
    await this.cache.invalidatePattern(`center:${id}`);
    this.audit.record({
      action: 'CENTER_DELETE',
      userId: context.req.user?.sub ?? context.req.user?.id ?? null,
      entityType: 'Center',
      entityId: id,
      centerId: id,
    }).catch(() => { /* record() already swallows; belt-and-suspenders */ });
    return true;
  }

  /**
   * Return the persisted center settings (jsonb), or an empty object when
   * none exist yet. Used by every Settings page (finance, notifications,
   * security, operations, permissions) to load their toggles.
   */
  @Query(() => String, { description: 'Center settings as a JSON string' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
  @CenterScoped('centerId')
  async centerSettings(
    @Args('centerId', { type: () => ID }) centerId: string,
    @CurrentUser() caller?: JwtPayload,
    @Context() context?: any,
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
  @CenterScoped('centerId')
  async updateCenterSettings(
    @Args('centerId', { type: () => ID }) centerId: string,
    @Args('settings', { type: () => String }) settings: string,
    @CurrentUser() caller?: JwtPayload,
    @Context() context?: any,
  ): Promise<string> {
    const center = await this.centerRepo.findOne({ where: { id: centerId } });
    if (!center) throw new NotFoundException('Center not found');

    let incoming: Record<string, any> = {};
    try {
      incoming = settings ? JSON.parse(settings) : {};
    } catch {
      incoming = {};
    }

    // Whitelist + size cap. Drop unknown keys silently but log so bugs surface.
    const before = Object.keys(incoming);
    incoming = sanitizeSettings(incoming);
    const dropped = before.filter((k) => !(k in incoming));
    if (dropped.length) {
      this.logger.warn(
        `updateCenterSettings dropped non-whitelisted keys for center ${centerId}: ${dropped.join(', ')}`,
      );
    }

    const merged = deepMergeSettings(center.settings ?? {}, incoming);
    await this.centerRepo.update(centerId, { settings: merged });
    await this.cache.invalidatePattern(`center:${centerId}`);
    await this.pubSub.publish(CENTER_TRIGGERS.centerUpdated, {
      centerUpdated: { ...center, settings: merged },
    });

    // Fire-and-forget audit. changes = keys only (values may later hold secrets).
    this.audit.record({
      action: 'CENTER_SETTINGS_UPDATE',
      userId: caller?.sub ?? caller?.id ?? null,
      entityType: 'Center',
      entityId: centerId,
      centerId,
      changes: { keys: Object.keys(incoming) },
      ipAddress: context?.req?.headers?.['x-forwarded-for'] ?? context?.req?.ip ?? null,
      userAgent: context?.req?.headers?.['user-agent'] ?? null,
    }).catch(() => { /* record() already swallows; belt-and-suspenders */ });

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
    @Context() context: any
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

    private readonly pubSub: PubSubService,
    private readonly audit: AuditService,
  ) {}

  @Public()
  @Query(() => [FloorEntity])
  async floors(@Args('centerId', { type: () => ID, nullable: true }) centerId?: string): Promise<FloorEntity[]> {
    const where: any = centerId ? { centerId, active: true } : { active: true };
    const floors = await this.floorRepo.find({
      where,
      relations: ['seats'],
    });
    return floors;
  }

  @Mutation(() => FloorEntity)
  async createFloor(
    @Args('input') input: CreateFloorInput
  ): Promise<FloorEntity> {
    const newFloor = this.floorRepo.create(input);
    const floor = await this.floorRepo.save(newFloor);
    await this.cache.invalidatePattern(`center:${floor.centerId}`);
    return floor;
  }

  @Mutation(() => FloorEntity)
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

  /**
   * Replace a floor's layout (zones + labels) with a validated blob.
   * Optimistic concurrency: incoming version must be current+1 (any value
   * is accepted for the first save and normalized to 1). CENTER_MANAGER
   * callers may only edit floors of their own center.
   */
  @Mutation(() => FloorEntity)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
  async updateFloorLayout(
    @Args('floorId', { type: () => ID }) floorId: string,
    @Args('layout', { type: () => String }) layout: string,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<FloorEntity> {
    const floor = await this.floorRepo.findOne({ where: { id: floorId } });
    if (!floor) throw new NotFoundException('Floor not found');

    // Inline center scoping (the @CenterScoped guard compares a centerId
    // arg; ours is a floorId, so the check lives here).
    const scope = caller ? centerScope(caller) : undefined;
    if (scope && floor.centerId !== scope) {
      throw new ForbiddenException('Not allowed to edit this floor');
    }

    let incoming: unknown;
    try {
      incoming = layout ? JSON.parse(layout) : null;
    } catch {
      throw new BadRequestException('Layout must be valid JSON');
    }
    const sanitized = sanitizeFloorLayout(incoming);

    const current = floor.layout as { version?: number } | null;
    if (current?.version) {
      if (sanitized.version !== current.version + 1) {
        throw new ConflictException(
          `Floor layout was modified elsewhere (current version ${current.version}). Reload and retry.`,
        );
      }
    } else {
      sanitized.version = 1;
    }

    await this.floorRepo.update(floorId, { layout: sanitized } as any);
    await this.cache.invalidatePattern(`floor:${floorId}`);
    await this.cache.invalidatePattern(`center:${floor.centerId}`);
    await this.pubSub.publish(CENTER_TRIGGERS.floorUpdated, {
      floorUpdated: { ...floor, layout: sanitized },
    });

    this.audit.record({
      action: 'FLOOR_LAYOUT_UPDATE',
      userId: caller?.sub ?? null,
      entityType: 'Floor',
      entityId: floorId,
      centerId: floor.centerId,
      changes: { zones: sanitized.zones.length, labels: sanitized.labels.length, version: sanitized.version },
    }).catch(() => { /* record() already swallows; belt-and-suspenders */ });

    const updated = await this.floorRepo.findOne({ where: { id: floorId }, relations: ['seats'] });
    return updated!;
  }

  @Mutation(() => Boolean)
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
  async seats(
    @Args('floorId', { type: () => ID, nullable: true }) floorId?: string,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<SeatEntity[]> {
    const where: any = floorId ? { floorId } : {};
    // Center managers see only their center's seats.
    const scope = caller ? centerScope(caller) : undefined;
    if (scope) where.centerId = scope;
    const seats = await this.seatRepo.find({
      where,
      relations: ['floor'],
    });
    return seats;
  }

  @Query(() => SeatEntity, { nullable: true })
  async seat(@Args('id', { type: () => ID }) id: string): Promise<SeatEntity | null> {
    const seat = await this.seatRepo.findOne({
      where: { id },
      relations: ['floor'],
    });
    return seat;
  }

  @Mutation(() => SeatEntity)
  async createSeat(@Args('input') input: CreateSeatInput): Promise<SeatEntity> {
    // Derive centerId from the seat's floor. CreateSeatInput has no centerId
    // and the seat column previously stayed NULL, which made scoped queries
    // (seats/dashboardMetrics for CENTER_MANAGER) return nothing — the
    // "floor map is empty" bug.
    const floor = await this.seatRepo.manager.findOne(FloorEntity, {
      where: { id: input.floorId } as any,
    });
    const seatCenterId = (floor as any)?.centerId ?? null;

    const newSeat = this.seatRepo.create({ ...input, centerId: seatCenterId } as any);
    const seat = await this.seatRepo.save(newSeat);

    // Auto-sync: if seatType is MEETING_ROOM, also create a MeetingRoom record
    // so the Operations > Meeting Room page can see and book it.
    if (input.seatType === 'MEETING_ROOM' && seatCenterId) {
      {
        const roomRepo = this.seatRepo.manager.getRepository('MeetingRoom');
        const existing = await roomRepo.findOne({ where: { name: input.name, centerId: seatCenterId } as any });
        if (!existing) {
          await roomRepo.save(roomRepo.create({
            name: input.name,
            centerId: seatCenterId,
            floorId: input.floorId,
            capacity: 1,
            status: input.status || 'AVAILABLE',
            hourlyRate: input.price ?? 0,
          } as any));
        }
      }
    }

    await this.cache.invalidatePattern(`floor:*`);
    return seat;
  }

  @Mutation(() => SeatEntity)
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