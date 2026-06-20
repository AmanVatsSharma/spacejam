/**
 * File:        apps/api/src/typeorm/repositories/booking.repository.ts
 * Module:      API · TypeORM Repositories
 * Purpose:     Booking repository with custom queries
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';

export interface BookingFilters {
  centerId?: string;
  userId?: string;
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class BookingRepository {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  async findById(id: string): Promise<Booking | null> {
    return this.bookingRepo.findOne({
      where: { id },
      relations: ['user', 'seat', 'center', 'payment'],
    });
  }

  async findAll(filters?: BookingFilters): Promise<{ bookings: Booking[]; total: number }> {
    const queryBuilder = this.bookingRepo.createQueryBuilder('booking');

    if (filters?.centerId) {
      queryBuilder.andWhere('booking.centerId = :centerId', { centerId: filters.centerId });
    }

    if (filters?.userId) {
      queryBuilder.andWhere('booking.userId = :userId', { userId: filters.userId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('booking.status = :status', { status: filters.status });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('booking.startDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('booking.endDate <= :endDate', { endDate: filters.endDate });
    }

    const total = await queryBuilder.getCount();

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    const bookings = await queryBuilder
      .orderBy('booking.createdAt', 'DESC')
      .getMany();

    return { bookings, total };
  }

  async findByUserId(userId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: { userId },
      relations: ['seat', 'seat.floor', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(bookingData: Partial<Booking>): Promise<Booking> {
    const booking = this.bookingRepo.create(bookingData);
    return this.bookingRepo.save(booking);
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    await this.bookingRepo.update(id, { status });
    return this.findById(id);
  }

  async cancel(id: string): Promise<Booking> {
    await this.bookingRepo.update(id, {
      status: BookingStatus.CANCELLED,
      endDate: new Date(),
    });
    return this.findById(id);
  }
}