/**
 * File:        apps/api/src/typeorm/repositories/center.repository.ts
 * Module:      API · TypeORM Repositories
 * Purpose:     Center repository with custom queries
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Center } from '../entities/center.entity';
import { CenterStatus } from '../../graphql/types/user.type';

export interface CenterFilters {
  status?: CenterStatus;
  locationId?: string;
  owner?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class CenterRepository {
  constructor(
    @InjectRepository(Center)
    private centerRepo: Repository<Center>,
  ) {}

  async findById(id: string): Promise<Center | null> {
    return this.centerRepo.findOne({
      where: { id },
      relations: ['location', 'floors', 'floors.seats'],
    });
  }

  async findAll(filters?: CenterFilters): Promise<{ centers: Center[]; total: number }> {
    const queryBuilder = this.centerRepo.createQueryBuilder('center');

    if (filters?.status) {
      queryBuilder.andWhere('center.status = :status', { status: filters.status });
    }

    if (filters?.locationId) {
      queryBuilder.andWhere('center.locationId = :locationId', { locationId: filters.locationId });
    }

    if (filters?.owner) {
      queryBuilder.andWhere('center.owner = :owner', { owner: filters.owner });
    }

    if (filters?.search) {
      queryBuilder.andWhere('center.name ILIKE :search', { search: `%${filters.search}%` });
    }

    const total = await queryBuilder.getCount();

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    const centers = await queryBuilder
      .leftJoinAndSelect('center.location', 'location')
      .leftJoinAndSelect('center.floors', 'floors')
      .orderBy('center.createdAt', 'DESC')
      .getMany();

    return { centers, total };
  }

  async findByOwner(ownerId: string): Promise<Center[]> {
    return this.centerRepo.find({
      where: { owner: ownerId },
      relations: ['location', 'floors'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(centerData: Partial<Center>): Promise<Center> {
    const center = this.centerRepo.create(centerData);
    return this.centerRepo.save(center);
  }

  async update(id: string, centerData: Partial<Center>): Promise<Center | null> {
    await this.centerRepo.update(id, centerData);
    return this.findById(id);
  }

  async updateStatus(id: string, status: CenterStatus): Promise<Center | null> {
    await this.centerRepo.update(id, { status });
    return this.findById(id);
  }
}