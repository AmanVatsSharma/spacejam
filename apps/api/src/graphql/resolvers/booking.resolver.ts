/**
 * File:        apps/api/src/graphql/resolvers/booking.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Booking management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Resolver, Query, Args, Mutation, Context, ID } from '@nestjs/graphql';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingStatus, PaymentStatus, SeatStatus } from '../types/user.type';
import { Booking as BookingEntity } from '../../typeorm/entities/booking.entity';
import { Seat as SeatEntity } from '../../typeorm/entities/seat.entity';
import { Payment as PaymentEntity } from '../../typeorm/entities/payment.entity';
import { PubSubService } from '../pubsub/pubsub.service';
import { CreateBookingInput, BookingFiltersInput, UpdateBookingInput } from '../inputs/booking.input';

export const TRIGGERS = {
  bookingUpdated: 'booking.updated',
  bookingCreated: 'booking.created',
  paymentStatusChanged: 'payment.statusChanged',
  seatStatusChanged: 'seat.statusChanged',
} as const;

@Resolver(() => BookingEntity)
export class BookingResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(BookingEntity)
    private bookingRepo: Repository<BookingEntity>,
    @InjectRepository(SeatEntity)
    private seatRepo: Repository<SeatEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    private readonly pubSub: PubSubService,
  ) { }

  @Query(() => [BookingEntity])
  async bookings(
    @Args('filters', { nullable: true }) filters?: BookingFiltersInput
  ): Promise<BookingEntity[]> {
    const where: any = {};
    if (filters) {
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.userId) where.userId = filters.userId;
      if (filters.customerId) where.customerId = filters.customerId;
      if (filters.status) where.status = filters.status;
      if (filters.startDate) where.startDate = { gte: filters.startDate };
      if (filters.endDate) where.endDate = { lte: filters.endDate };
    }

    const bookings = await this.bookingRepo.find({
      where,
      relations: ['user', 'seat', 'seat.floor', 'center', 'payment', 'customer'],
      order: { createdAt: 'desc' },
    });

    return bookings as unknown as BookingEntity[];
  }

  @Query(() => [BookingEntity])
  async myBookings(@Context() context: any): Promise<BookingEntity[]> {
    const userId = context.req.user?.id;
    if (!userId) return [];

    const bookings = await this.bookingRepo.find({
      where: { userId } as any,
      relations: ['seat', 'seat.floor', 'center', 'payment'],
      order: { createdAt: 'desc' },
    });

    return bookings as unknown as BookingEntity[];
  }

  @Query(() => BookingEntity, { nullable: true })
  async booking(@Args('id', { type: () => ID }) id: string): Promise<BookingEntity | null> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['user', 'seat', 'seat.floor', 'center', 'payment'],
    });

    return booking as unknown as BookingEntity | null;
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

    return booking as unknown as BookingEntity;
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

}