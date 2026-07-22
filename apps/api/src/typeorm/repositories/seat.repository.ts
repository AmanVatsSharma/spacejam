/**
 * File:        apps/api/src/typeorm/repositories/seat.repository.ts
 * Module:      API · TypeORM Repositories
 * Purpose:     Seat repository with custom queries
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat } from '../entities/seat.entity';
import { SeatStatus, SeatType } from '../../graphql/types/user.type';

export interface SeatFilters {
  floorId?: string;
  type?: SeatType;
  status?: SeatStatus;
  available?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class SeatRepository {
  constructor(
    @InjectRepository(Seat)
    private seatRepo: Repository<Seat>,
  ) {}

  async findById(id: string): Promise<Seat | null> {
    return this.seatRepo.findOne({
      where: { id },
      relations: ['floor', 'floor.center'],
    });
  }

  async findAll(filters?: SeatFilters): Promise<{ seats: Seat[]; total: number }> {
    const queryBuilder = this.seatRepo.createQueryBuilder('seat');

    if (filters?.floorId) {
      queryBuilder.andWhere('seat.floorId = :floorId', { floorId: filters.floorId });
    }

    if (filters?.type) {
      queryBuilder.andWhere('seat.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      queryBuilder.andWhere('seat.status = :status', { status: filters.status });
    }

    if (filters?.available) {
      queryBuilder.andWhere('seat.status = :status', { status: SeatStatus.AVAILABLE });
    }

    const total = await queryBuilder.getCount();

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    const seats = await queryBuilder
      .leftJoinAndSelect('seat.floor', 'floor')
      .orderBy('seat.name', 'ASC')
      .getMany();

    return { seats, total };
  }

  async findByFloor(floorId: string): Promise<Seat[]> {
    return this.seatRepo.find({
      where: { floorId },
      relations: ['floor'],
      order: { name: 'ASC' },
    });
  }

  async updateStatus(id: string, status: SeatStatus): Promise<Seat | null> {
    await this.seatRepo.update(id, { status });
    return this.findById(id);
  }

  async updatePrice(id: string, price: number): Promise<Seat | null> {
    await this.seatRepo.update(id, { price });
    return this.findById(id);
  }
}