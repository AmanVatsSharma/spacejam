/**
 * File:        apps/api/src/graphql/resolvers/booking.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Booking management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Resolver, Query, Args, Mutation, Context, ResolveField, Parent, Subscription } from '@nestjs/graphql';
import { TypeormService } from '../../typeorm/typeorm.service';
import { CacheService } from '../../cache/cache.service';
import {
  Booking,
  BookingStatus,
  Payment,
  BookingFilters,
  SeatStatus,
  Seat,
  PaymentStatus,
} from '../types/user.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking as BookingEntity } from '../../typeorm/entities/booking.entity';
import { Seat as SeatEntity } from '../../typeorm/entities/seat.entity';
import { Payment as PaymentEntity } from '../../typeorm/entities/payment.entity';
import { GqlDataLoaders } from '../dataloaders';
import { PubSubService } from '../pubsub/pubsub.service';
import { CreateBookingInput } from '../inputs/booking.input';

export const TRIGGERS = {
  bookingUpdated: 'booking.updated',
  bookingCreated: 'booking.created',
  paymentStatusChanged: 'payment.statusChanged',
  seatStatusChanged: 'seat.statusChanged',
} as const;

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
    private readonly loaders: GqlDataLoaders,
    private readonly pubSub: PubSubService,
  ) {}

  /**
   * Field-level resolver that batches seat lookups via DataLoader so a
   * list of N bookings results in 1 SQL query for seats, not N.
   */
  @ResolveField(() => Seat, { nullable: true })
  async seat(@Parent() booking: Booking): Promise<Seat | null> {
    if (!booking.seatId) return null;
    const seat = await this.loaders.seatById.load(booking.seatId);
    return (seat as unknown as Seat) ?? null;
  }

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
    @Args('input') input: CreateBookingInput,
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

    // Publish events for real-time updates
    await this.pubSub.publish(TRIGGERS.bookingCreated, { bookingCreated: booking });
    await this.pubSub.publish(TRIGGERS.bookingUpdated, { bookingUpdated: booking });
    await this.pubSub.publish(TRIGGERS.seatStatusChanged, {
      seatStatusChanged: { seatId: input.seatId, status: SeatStatus.RESERVED },
    });

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

    await this.pubSub.publish(TRIGGERS.bookingUpdated, { bookingUpdated: updatedBooking });
    if (updatedBooking?.seatId) {
      await this.pubSub.publish(TRIGGERS.seatStatusChanged, {
        seatStatusChanged: { seatId: updatedBooking.seatId, status: SeatStatus.AVAILABLE },
      });
    }
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

    await this.pubSub.publish(TRIGGERS.paymentStatusChanged, {
      paymentStatusChanged: updatedPayment,
    });

    return updatedPayment as unknown as Payment;
  }

  /**
   * Subscription: fires every time a booking is created in any center.
   * Clients (admin dashboards, floor-plan views) subscribe to keep
   * their UI in sync without polling.
   *
   * Optional `centerId` arg filters the stream to a single center.
   */
  @Subscription(() => Booking, {
    name: 'bookingCreated',
    description: 'New booking created anywhere, or in the specified center',
    filter: (payload: { bookingCreated: BookingEntity }, vars: { centerId?: string }) => {
      if (!vars.centerId) return true;
      return payload.bookingCreated?.centerId === vars.centerId;
    },
  })
  bookingCreatedSubscription(@Args('centerId', { nullable: true }) _centerId?: string) {
    return this.pubSub.asyncIterator(TRIGGERS.bookingCreated);
  }

  /**
   * Subscription: fires every time any booking is updated (status
   * change, date change, etc.).
   */
  @Subscription(() => Booking, {
    name: 'bookingUpdated',
    description: 'Booking updated anywhere, or in the specified center',
    filter: (payload: { bookingUpdated: BookingEntity }, vars: { centerId?: string }) => {
      if (!vars.centerId) return true;
      return payload.bookingUpdated?.centerId === vars.centerId;
    },
  })
  bookingUpdatedSubscription(@Args('centerId', { nullable: true }) _centerId?: string) {
    return this.pubSub.asyncIterator(TRIGGERS.bookingUpdated);
  }

  /**
   * Subscription: fires every time a seat's status changes. The UI
   * uses this to recolor seats in real time as bookings open/close.
   */
  @Subscription(() => Seat, {
    name: 'seatStatusChanged',
    description: 'Seat status changed (e.g. AVAILABLE -> RESERVED)',
    filter: (payload: { seatStatusChanged: { seatId: string } }, vars: { centerId?: string }) => {
      // Without per-seat center info in the payload, fall through and
      // let the client filter; broadcasting is cheap enough.
      if (!vars.centerId) return true;
      return true;
    },
  })
  seatStatusChangedSubscription(@Args('centerId', { nullable: true }) _centerId?: string) {
    return this.pubSub.asyncIterator(TRIGGERS.seatStatusChanged);
  }

  /**
   * Subscription: fires every time a payment status changes.
   */
  @Subscription(() => Payment, {
    name: 'paymentStatusChanged',
    description: 'Payment status changed for any booking',
  })
  paymentStatusChangedSubscription() {
    return this.pubSub.asyncIterator(TRIGGERS.paymentStatusChanged);
  }
}