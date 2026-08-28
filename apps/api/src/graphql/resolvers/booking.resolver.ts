/**
 * File:        apps/api/src/graphql/resolvers/booking.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Booking management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Resolver, Query, Args, Mutation, Context, ID, ObjectType, Field, Int } from '@nestjs/graphql';
import { UnauthorizedException, BadRequestException, NotFoundException, UseGuards } from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingStatus, PaymentStatus, SeatStatus } from '../types/user.type';
import { Booking as BookingEntity } from '../../typeorm/entities/booking.entity';
import { Seat as SeatEntity } from '../../typeorm/entities/seat.entity';
import { Payment as PaymentEntity } from '../../typeorm/entities/payment.entity';
import { PubSubService } from '../pubsub/pubsub.service';
import {
  CreateBookingInput,
  BookingFiltersInput,
  UpdateBookingInput,
  AllocateCustomerSeatsInput,
} from '../inputs/booking.input';
import { Customer as CustomerEntity } from '../../typeorm/entities/customer.entity';
import { CustomerEmployee as CustomerEmployeeEntity } from '../../typeorm/entities/customer-employee.entity';
import { Offer } from '../../typeorm/entities/offer.entity';
import { OfferRedemption } from '../../typeorm/entities/offer.entity';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { centerScope } from '../../auth/helpers/center-scope.helper';

export const TRIGGERS = {
  bookingUpdated: 'booking.updated',
  bookingCreated: 'booking.created',
  paymentStatusChanged: 'payment.statusChanged',
  seatStatusChanged: 'seat.statusChanged',
} as const;

/**
 * A booked time range for a seat on a given date. The mobile client uses this
 * to mark slots as unavailable in the booking grid.
 */
@ObjectType()
export class BookedSlot {
  @Field() start!: Date;
  @Field() end!: Date;
  @Field(() => String, { nullable: true }) status?: string | null;
}

@Resolver(() => BookingEntity)
export class BookingResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(BookingEntity)
    private bookingRepo: Repository<BookingEntity>,
    @InjectRepository(SeatEntity)
    private seatRepo: Repository<SeatEntity>,
    @InjectRepository(CustomerEntity)
    private customerRepo: Repository<CustomerEntity>,
    @InjectRepository(CustomerEmployeeEntity)
    private customerEmployeeRepo: Repository<CustomerEmployeeEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(Offer)
    private offerRepo: Repository<Offer>,
    @InjectRepository(OfferRedemption)
    private redemptionRepo: Repository<OfferRedemption>,
    private readonly pubSub: PubSubService,
  ) { }

  @Query(() => [BookingEntity])
  async bookings(
    @Args('filters', { nullable: true }) filters?: BookingFiltersInput,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<BookingEntity[]> {
    const where: any = {};
    // Enforce center isolation for CENTER_MANAGER
    const scope = caller ? centerScope(caller) : undefined;
    const effectiveCenterId = scope ?? filters?.centerId;
    if (effectiveCenterId) where.centerId = effectiveCenterId;
    if (filters) {
      if (filters.userId) where.userId = filters.userId;
      if (filters.customerId) where.customerId = filters.customerId;
      if (filters.status) where.status = filters.status;
      if (filters.startDate) where.startDate = { gte: filters.startDate };
      if (filters.endDate) where.endDate = { lte: filters.endDate };
    }

    const bookings = await this.bookingRepo.find({
      where,
      relations: ['user', 'seat', 'seat.floor', 'center', 'payment', 'customer', 'meetingRoom'],
      order: { createdAt: 'desc' },
    });

    return bookings as unknown as BookingEntity[];
  }

  @Query(() => [BookingEntity])
  async myBookings(@Context() context: any): Promise<BookingEntity[]> {
    const userId = context.req.user?.sub ?? context.req.user?.id;
    if (!userId) return [];

    const bookings = await this.bookingRepo.find({
      where: { userId } as any,
      relations: ['seat', 'seat.floor', 'center', 'payment', 'meetingRoom', 'user'],
      order: { createdAt: 'desc' },
    });

    return bookings as unknown as BookingEntity[];
  }

  @Query(() => BookingEntity, { nullable: true })
  async booking(@Args('id', { type: () => ID }) id: string): Promise<BookingEntity | null> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['user', 'seat', 'seat.floor', 'center', 'payment', 'meetingRoom'],
    });

    return booking as unknown as BookingEntity | null;
  }

  /**
   * Return the booked time slots for a seat on a given date. The mobile
   * booking grid marks these as unavailable. A slot is free if no
   * non-cancelled, non-completed booking overlaps it.
   */
  @Query(() => [BookedSlot], {
    description: 'Booked time slots for a seat on a date (UTC ISO). Empty = fully free.',
  })
  async seatAvailability(
    @Args('seatId', { type: () => ID }) seatId: string,
    @Args('date', { type: () => String }) date: string,
  ): Promise<BookedSlot[]> {
    // Day window in UTC for the supplied date (YYYY-MM-DD).
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(date + 'T23:59:59.999Z');
    const rows = await this.bookingRepo
      .createQueryBuilder('b')
      .select(['b."startDate" AS start', 'b."endDate" AS end', 'b.status AS status'])
      .where('b."seatId" = :seatId', { seatId })
      .andWhere('b.status NOT IN (:...statuses)', {
        statuses: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
      })
      .andWhere('(b."startDate" <= :dayEnd AND b."endDate" >= :dayStart)', { dayStart, dayEnd })
      .orderBy('b."startDate"', 'ASC')
      .getRawMany<{ start: Date; end: Date; status: string }>();
    return rows.map((r) => ({
      start: r.start,
      end: r.end,
      status: r.status,
    })) as BookedSlot[];
  }

  @Mutation(() => BookingEntity)
  async createBooking(
    @Args('input') input: CreateBookingInput,
    @Context() context: any
  ): Promise<BookingEntity> {
    const userId = context.req.user?.id;
    if (!userId) throw new UnauthorizedException('Unauthorized');

    // Validate seat availability
    const seat = await this.seatRepo.findOne({
      where: { id: input.seatId },
      relations: ['floor'],
    });

    if (!seat) {
      throw new BadRequestException('Seat not found');
    }
    // Allow booking from AVAILABLE or RESERVED; OCCUPIED/MAINTENANCE block it.
    if (
      seat.status !== SeatStatus.AVAILABLE &&
      seat.status !== SeatStatus.RESERVED
    ) {
      throw new BadRequestException('Seat is not available');
    }

    // CreateBookingInput exposes startTime/endTime, but the entity columns are
    // startDate/endDate (booking.entity.ts:62-68). Map them explicitly so the
    // booking window actually persists — the old `...input` spread silently
    // dropped them.
    const start = input.startTime ? new Date(input.startTime) : undefined;
    const end = input.endTime ? new Date(input.endTime) : undefined;

    // Check for time-range conflicts (only for non-HOT_DESK seats where time matters)
    if (seat.seatType !== 'HOT_DESK' && start && end) {
      if (end <= start) {
        throw new BadRequestException('End time must be after start time');
      }
      const conflict = await this.bookingRepo
        .createQueryBuilder('booking')
        .where('booking.seatId = :seatId', { seatId: input.seatId })
        .andWhere('booking.status NOT IN (:...statuses)', {
          statuses: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
        })
        .andWhere('(booking.startDate < :end AND booking.endDate > :start)', {
          start,
          end,
        })
        .getOne();

      if (conflict) {
        throw new BadRequestException(
          `Seat is already booked for this time slot (booking ${conflict.id} overlaps)`,
        );
      }
    }

    // ── Apply promo/offer code if provided ────────────────────────────────
    let discount = 0;
    let appliedCode: string | null = null;
    if (input.discountCode) {
      const offer = await this.offerRepo.findOne({
        where: { code: input.discountCode.toUpperCase(), isActive: true },
      });
      if (offer) {
        const now = new Date();
        const inDate = (!offer.validFrom || now >= offer.validFrom) && (!offer.validUntil || now <= offer.validUntil);
        const underLimit = !offer.usageLimit || offer.usageCount < offer.usageLimit;
        const meetsMin = !offer.minOrderAmount || seat.price >= offer.minOrderAmount;
        if (inDate && underLimit && meetsMin) {
          discount =
            offer.type === 'PERCENTAGE'
              ? (seat.price * offer.value) / 100
              : offer.type === 'FIXED'
                ? Math.min(offer.value, seat.price)
                : 0; // TOKENS handled at wallet level, not here
          appliedCode = offer.code;
          // Record the redemption + bump usage.
          await this.redemptionRepo.save(
            this.redemptionRepo.create({ offerId: offer.id, userId, code: offer.code, discountAmount: discount } as any),
          );
          await this.offerRepo.increment({ id: offer.id }, 'usageCount', 1);
        } else if (!inDate) {
          throw new BadRequestException(`Offer code ${offer.code} is not active right now.`);
        } else if (!underLimit) {
          throw new BadRequestException(`Offer code ${offer.code} has reached its usage limit.`);
        } else {
          throw new BadRequestException(`Offer code ${offer.code} requires a minimum booking of ₹${offer.minOrderAmount}.`);
        }
      } else {
        throw new BadRequestException(`Invalid offer code: ${input.discountCode}`);
      }
    }

    const newBooking = this.bookingRepo.create({
      userId,
      seatId: input.seatId,
      customerId: input.customerId || undefined,
      notes: input.notes,
      // seat.floor.centerId holds the real center; the old code wrongly
      // assigned seat.floor.id (the floor id) to centerId.
      centerId: seat.floor?.centerId ?? seat.centerId ?? undefined,
      startDate: start,
      endDate: end,
      totalPrice: seat.price,
      discount,
      discountCode: appliedCode,
    });

    const booking = await this.bookingRepo.save(newBooking);

    // Update seat status to RESERVED
    await this.seatRepo.update(input.seatId, { status: SeatStatus.RESERVED });

    // Publish events for real-time updates
    await this.pubSub.publish(TRIGGERS.bookingCreated, { bookingCreated: booking });
    await this.pubSub.publish(TRIGGERS.bookingUpdated, { bookingUpdated: booking });
    await this.pubSub.publish(TRIGGERS.seatStatusChanged, {
      seatStatusChanged: { seatId: input.seatId, status: SeatStatus.RESERVED },
    });

    // Invalidate cache
    await this.cache.invalidatePattern(`center:${(booking as any).centerId}`);

    const reloaded = await this.bookingRepo.findOne({
      where: { id: (booking as any).id },
      relations: ['seat', 'seat.floor', 'center', 'payment', 'meetingRoom', 'user'],
    });
    return (reloaded ?? booking) as unknown as BookingEntity;
  }

  @Mutation(() => BookingEntity)
  async cancelBooking(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any
  ): Promise<BookingEntity> {
    const userId = context.req.user?.id;
    if (!userId) throw new UnauthorizedException('Unauthorized');

    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['payment'],
    });

    if (!booking || booking.userId !== userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.bookingRepo.update(id, {
      status: BookingStatus.CANCELLED,
      endDate: new Date(),
    });

    const updatedBooking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['seat', 'payment'],
    });

    // Make seat available again
    if (updatedBooking?.seatId) {
      await this.seatRepo.update(updatedBooking.seatId, {
        status: SeatStatus.AVAILABLE,
      });
    }

    // Refund payment if completed
    if (updatedBooking?.payment?.status === PaymentStatus.COMPLETED) {
      await this.paymentRepo.update(updatedBooking!.paymentId as string, {
        status: PaymentStatus.REFUNDED,
      });
    }

    await this.pubSub.publish(TRIGGERS.bookingUpdated, { bookingUpdated: updatedBooking });
    if (updatedBooking?.seatId) {
      await this.pubSub.publish(TRIGGERS.seatStatusChanged, {
        seatStatusChanged: { seatId: updatedBooking.seatId, status: SeatStatus.AVAILABLE },
      });
    }
    await this.cache.invalidatePattern(`center:*`);

    return updatedBooking!;
  }

  @Mutation(() => BookingEntity)
  async updateBooking(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateBookingInput,
    @Context() context: any
  ): Promise<BookingEntity> {
    const userId = context.req.user?.id;
    if (!userId) throw new UnauthorizedException('Unauthorized');

    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['seat', 'payment'],
    });

    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    await this.bookingRepo.update(id, input as any);

    const updatedBooking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['seat', 'payment'],
    });

    await this.pubSub.publish(TRIGGERS.bookingUpdated, { bookingUpdated: updatedBooking });
    await this.cache.invalidatePattern(`center:*`);

    return updatedBooking!;
  }

  @Mutation(() => BookingEntity)
  async checkInBooking(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any
  ): Promise<BookingEntity> {
    const userId = context.req.user?.id;
    if (!userId) throw new UnauthorizedException('Unauthorized');

    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['seat'],
    });

    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be checked in');
    }

    await this.bookingRepo.update(id, {
      status: BookingStatus.CHECKED_IN,
    });

    if (booking.seatId) {
      await this.seatRepo.update(booking.seatId, {
        status: SeatStatus.OCCUPIED,
      });
    }

    const updatedBooking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['seat', 'payment'],
    });

    await this.pubSub.publish(TRIGGERS.bookingUpdated, { bookingUpdated: updatedBooking });
    if (updatedBooking?.seatId) {
      await this.pubSub.publish(TRIGGERS.seatStatusChanged, {
        seatStatusChanged: { seatId: updatedBooking.seatId, status: SeatStatus.OCCUPIED },
      });
    }
    await this.cache.invalidatePattern(`center:*`);

    return updatedBooking!;
  }

  @Mutation(() => BookingEntity)
  async checkOutBooking(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any
  ): Promise<BookingEntity> {
    const userId = context.req.user?.id;
    if (!userId) throw new UnauthorizedException('Unauthorized');

    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['seat'],
    });

    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException('Only checked-in bookings can be checked out');
    }

    await this.bookingRepo.update(id, {
      status: BookingStatus.CHECKED_OUT,
    });

    if (booking.seatId) {
      await this.seatRepo.update(booking.seatId, {
        status: SeatStatus.AVAILABLE,
      });
    }

    const updatedBooking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['seat', 'payment'],
    });

    await this.pubSub.publish(TRIGGERS.bookingUpdated, { bookingUpdated: updatedBooking });
    if (updatedBooking?.seatId) {
      await this.pubSub.publish(TRIGGERS.seatStatusChanged, {
        seatStatusChanged: { seatId: updatedBooking.seatId, status: SeatStatus.AVAILABLE },
      });
    }
    await this.cache.invalidatePattern(`center:*`);

    return updatedBooking!;
  }

  @Mutation(() => BookingEntity)
  @UseGuards(GqlAuthGuard)
  async extendBooking(
    @Args('id') id: string,
    @Args('endTime') endTime: Date,
    @CurrentUser() current: JwtPayload,
  ): Promise<BookingEntity> {
    const booking = await this.bookingRepo.findOne({
      where: { id, userId: current.sub } as any,
      relations: ['seat', 'seat.floor', 'center', 'payment', 'meetingRoom', 'user'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!endTime || endTime <= booking.endDate) {
      throw new BadRequestException('endTime must be later than the current booking end');
    }
    booking.endDate = endTime;
    return (await this.bookingRepo.save(booking)) as unknown as BookingEntity;
  }

  @Mutation(() => PaymentEntity)
  async processPayment(
    @Args('paymentId', { type: () => ID }) paymentId: string,
    @Args('method') method: string
  ): Promise<PaymentEntity> {
    // This would integrate with payment gateway (Razorpay/Stripe)
    // For now, simulate payment processing
    await this.paymentRepo.update(paymentId, {
      status: PaymentStatus.COMPLETED,
      method: method as any,
      transactionId: `TXN-${Date.now()}`,
    });

    const updatedPayment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });

    // Update booking status
    const booking = await this.bookingRepo.findOne({
      where: { id: updatedPayment?.bookingId },
    });

    if (booking) {
      await this.bookingRepo.update(booking.id, {
        status: BookingStatus.CONFIRMED,
      });
    }

    await this.pubSub.publish(TRIGGERS.paymentStatusChanged, {
      paymentStatusChanged: updatedPayment,
    });

    return updatedPayment!;
  }


  // ── Onboarding seat allocation ────────────────────────────────────────────

  /**
   * Allocate inventory seats to a customer during onboarding: reserves the
   * requested number of AVAILABLE seats in the customer's center (matching
   * named seats first, then auto-assigning), books each for `months`,
   * and persists team members as CustomerEmployees with their seat.
   * Seats flip to RESERVED so they show up across inventory immediately.
   */
  @Mutation(() => SeatAllocationResult)
  async allocateCustomerSeats(
    @Args('input') input: AllocateCustomerSeatsInput,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<SeatAllocationResult> {
    const customer = await this.customerRepo.findOne({ where: { id: input.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const scope = caller ? centerScope(caller) : undefined;
    const centerId = scope ?? customer.centerId;
    if (!centerId) {
      throw new BadRequestException('Customer has no center assigned and caller is not center-scoped');
    }

    const where: any = { centerId, status: SeatStatus.AVAILABLE, active: true };
    if (input.seatType && input.seatType !== 'ANY') where.seatType = input.seatType;
    const available = await this.seatRepo.find({ where, order: { name: 'ASC' } });

    const result = new SeatAllocationResult();
    result.requested = input.count;
    result.availableAtStart = available.length;

    const claimed = new Set<string>();
    const pick = (predicate: (s: SeatEntity) => boolean): SeatEntity | null => {
      const seat = available.find((s) => !claimed.has(s.id) && predicate(s));
      if (seat) claimed.add(seat.id);
      return seat ?? null;
    };

    const individuals = input.individuals ?? [];
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + (input.months ?? 1));

    for (const ind of individuals) {
      if (result.seats.length >= input.count) break;
      // Named match first (case-insensitive), else next available.
      const seat = ind.seatName
        ? pick((s) => s.name.toLowerCase().trim() === ind.seatName!.toLowerCase().trim())
        : null;
      const chosen = seat ?? pick(() => true);
      if (!chosen) break;

      const booking = await this.bookingRepo.save(
        this.bookingRepo.create({
          userId: caller?.sub ?? null,
          customerId: customer.id,
          seatId: chosen.id,
          centerId,
          startDate: now,
          endDate: end,
          status: BookingStatus.CONFIRMED,
          totalPrice: chosen.price,
          notes: `Seat allocated during onboarding${ind.name ? ` — ${ind.name}` : ''}`,
        } as any),
      );
      await this.seatRepo.update(chosen.id, { status: SeatStatus.RESERVED });

      let employeeId: string | null = null;
      if (ind.name && ind.email) {
        const emp = await this.customerEmployeeRepo.save(
          this.customerEmployeeRepo.create({
            customerId: customer.id,
            name: ind.name,
            email: ind.email,
            phone: ind.phone,
            seatId: chosen.id,
            seatNumber: chosen.name,
          } as any),
        );
        employeeId = emp.id;
      }

      result.seats.push(
        new AllocatedSeat(chosen.id, chosen.name, employeeId, ind.name ?? null, booking.id),
      );
    }

    // Unnamed seats for the remaining count.
    while (result.seats.length < input.count) {
      const chosen = pick(() => true);
      if (!chosen) break;
      const booking = await this.bookingRepo.save(
        this.bookingRepo.create({
          userId: caller?.sub ?? null,
          customerId: customer.id,
          seatId: chosen.id,
          centerId,
          startDate: now,
          endDate: end,
          status: BookingStatus.CONFIRMED,
          totalPrice: chosen.price,
          notes: 'Seat allocated during onboarding',
        } as any),
      );
      await this.seatRepo.update(chosen.id, { status: SeatStatus.RESERVED });
      result.seats.push(new AllocatedSeat(chosen.id, chosen.name, null, null, booking.id));
    }

    result.booked = result.seats.length;
    if (result.booked < result.requested) {
      result.shortfall = result.requested - result.booked;
    }

    await this.cache.invalidatePattern(`center:${centerId}`);

    return result;
  }
}

/** Plain result classes (declared after use via hoisting-safe class syntax). */
@ObjectType()
class AllocatedSeat {
  @Field(() => ID) seatId: string;
  @Field() seatName: string;
  @Field(() => ID, { nullable: true }) employeeId?: string | null;
  @Field(() => String, { nullable: true }) employeeName?: string | null;
  @Field(() => ID) bookingId: string;

  constructor(seatId: string, seatName: string, employeeId: string | null, employeeName: string | null, bookingId: string) {
    this.seatId = seatId;
    this.seatName = seatName;
    this.employeeId = employeeId;
    this.employeeName = employeeName;
    this.bookingId = bookingId;
  }
}

@ObjectType()
class SeatAllocationResult {
  @Field(() => Int) requested: number = 0;
  @Field(() => Int) booked: number = 0;
  @Field(() => Int) availableAtStart: number = 0;
  @Field(() => Int, { nullable: true }) shortfall?: number;
  @Field(() => [AllocatedSeat]) seats: AllocatedSeat[] = [];
}
