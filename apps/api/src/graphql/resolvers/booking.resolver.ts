/**
 * File:        apps/api/src/graphql/resolvers/booking.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Booking management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { TypeormService } from '../../typeorm/typeorm.service';
import { CacheService } from '../../cache/cache.service';
import { PubSub } from 'graphql-subscriptions';
import {
  Booking,
  BookingStatus,
  Payment,
  BookingFilters,
  SeatStatus
} from '../types/user.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking as BookingEntity } from '../../typeorm/entities/booking.entity';
import { Seat as SeatEntity } from '../../typeorm/entities/seat.entity';
import { Payment as PaymentEntity } from '../../typeorm/entities/payment.entity';

const pubSub = new PubSub();

@Resolver(() => Booking)
export class BookingResolver {
  constructor(
    private typeorm: TypeormService,
    private cache: CacheService,
    @InjectRepository(BookingEntity)
    private bookingRepo: Repository<BookingEntity>,
    @InjectRepository(SeatEntity)
    private seatRepo: Repository<SeatEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
  ) {}

  @Query(() => [Booking])
  async bookings(
    @Args('filters', { nullable: true }) filters?: BookingFilters
  ): Promise<Booking[]> {
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

  @Query(() => [Booking])
  async myBookings(@Context() context): Promise<Booking[]> {
    const userId = context.req.user?.id;
    if (!userId) return [];

    const bookings = await this.bookingRepo.find({
      where: { userId } as any,
      relations: ['seat', 'seat.floor', 'payment'],
      order: { createdAt: 'desc' },
    });

    return bookings as unknown as Booking[];
  }

  @Query(() => Booking, { nullable: true })
  async booking(@Args('id') id: string): Promise<Booking | null> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['user', 'seat', 'seat.floor', 'payment'],
    });

    return booking as unknown as Booking | null;
  }

  @Mutation(() => Booking)
  async createBooking(
    @Args('input') input: any,
    @Context() context
  ): Promise<Booking> {
    const userId = context.req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    // Validate seat availability
    const seat = await this.seatRepo.findOne({
      where: { id: input.seatId },
      relations: ['floor'],
    });

    if (!seat || seat.status !== SeatStatus.AVAILABLE) {
      throw new Error('Seat is not available');
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

    // Publish event for real-time updates
    pubSub.publish('bookingUpdated', { bookingUpdated: booking });

    // Invalidate cache
    await this.cache.invalidatePattern(`center:${booking.centerId}`);

    return booking as unknown as Booking;
  }

  @Mutation(() => Booking)
  async cancelBooking(
    @Args('id') id: string,
    @Context() context
  ): Promise<Booking> {
    const userId = context.req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['payment'],
    });

    if (!booking || booking.userId !== userId) {
      throw new Error('Unauthorized');
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

    pubSub.publish('bookingUpdated', { bookingUpdated: updatedBooking });
    await this.cache.invalidatePattern(`center:*`);

    return updatedBooking as unknown as Booking;
  }

  @Mutation(() => Payment)
  async processPayment(
    @Args('paymentId') paymentId: string,
    @Args('method') method: string
  ): Promise<Payment> {
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

    pubSub.publish('paymentStatusChanged', { paymentStatusChanged: updatedPayment });

    return updatedPayment as unknown as Payment;
  }
}