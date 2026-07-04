/**
 * File:        apps/api/src/graphql/resolvers/booking.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Booking management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingStatus, PaymentStatus, SeatStatus } from '../types/user.type';
import { Booking as BookingEntity } from '../../typeorm/entities/booking.entity';
import { Seat as SeatEntity } from '../../typeorm/entities/seat.entity';
import { Payment as PaymentEntity } from '../../typeorm/entities/payment.entity';
import { PubSubService } from '../pubsub/pubsub.service';
import { CreateBookingInput, BookingFiltersInput } from '../inputs/booking.input';

export const TRIGGERS = {
  bookingUpdated: 'booking.updated',
  bookingCreated: 'booking.created',
  paymentStatusChanged: 'payment.statusChanged',
  seatStatusChanged: 'seat.statusChanged',
} as const;

@Resolver(() => BookingEntity)
@Scope(Scope.DEFAULT)
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
  ) {}

  @Query(() => [BookingEntity])
  async bookings(
    @Args('filters', { nullable: true }) filters?: BookingFiltersInput
  ): Promise<BookingEntity[]> {
    const where: any = {};
    if (filters) {
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.userId) where.userId = filters.userId;
      if (filters.status) where.status = filters.status;
      if (filters.startDate) where.startDate = { gte: filters.startDate };
      if (filters.endDate) where.endDate = { lte: filters.endDate };
    }

    const bookings = await this.bookingRepo.find({
      where,
      relations: ['user', 'seat', 'payment'],
      order: { createdAt: 'desc' },
    });

    return bookings as unknown as Booking[];
  }

  @Query(() => [BookingEntity])
  async myBookings(@Context() context): Promise<BookingEntity[]> {
    const userId = context.req.user?.id;
    if (!userId) return [];

    const bookings = await this.bookingRepo.find({
      where: { userId } as any,
      relations: ['seat', 'seat.floor', 'payment'],
      order: { createdAt: 'desc' },
    });

    return bookings as unknown as Booking[];
  }

  @Query(() => BookingEntity, { nullable: true })
  async booking(@Args('id') id: string): Promise<BookingEntity | null> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['user', 'seat', 'seat.floor', 'payment'],
    });

    return booking as unknown as Booking | null;
  }

  @Mutation(() => BookingEntity)
  async createBooking(
    @Args('input') input: CreateBookingInput,
    @Context() context
  ): Promise<BookingEntity> {
    const userId = context.req.user?.id;
    if (!userId) throw new UnauthorizedException('Unauthorized');

    // Validate seat availability
    const seat = await this.seatRepo.findOne({
      where: { id: input.seatId },
      relations: ['floor'],
    });

    if (!seat || seat.status !== SeatStatus.AVAILABLE) {
      throw new BadRequestException('Seat is not available');
    }

    const newBooking = this.bookingRepo.create({
      ...input,
      userId,
      centerId: seat.floor.id, // floor has center relation
      totalPrice: seat.price,
    });

    const booking = await this.bookingRepo.save(newBooking);

    // Update seat status
    await this.seatRepo.update(input.seatId, { status: SeatStatus.RESERVED });

    // Publish events for real-time updates
    await this.pubSub.publish(TRIGGERS.bookingCreated, { bookingCreated: booking });
    await this.pubSub.publish(TRIGGERS.bookingUpdated, { bookingUpdated: booking });
    await this.pubSub.publish(TRIGGERS.seatStatusChanged, {
      seatStatusChanged: { seatId: input.seatId, status: SeatStatus.RESERVED },
    });

    // Invalidate cache
    await this.cache.invalidatePattern(`center:${booking.centerId}`);

    return booking;
  }

  @Mutation(() => BookingEntity)
  async cancelBooking(
    @Args('id') id: string,
    @Context() context
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
      await this.paymentRepo.update(updatedBooking.paymentId, {
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

    return updatedBooking;
  }

  @Mutation(() => PaymentEntity)
  async processPayment(
    @Args('paymentId') paymentId: string,
    @Args('method') method: string
  ): Promise<PaymentEntity> {
    // This would integrate with payment gateway (Razorpay/Stripe)
    // For now, simulate payment processing
    const payment = await this.paymentRepo.update(paymentId, {
      status: PaymentStatus.COMPLETED,
      method: method,
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

    return updatedPayment;
  }

}