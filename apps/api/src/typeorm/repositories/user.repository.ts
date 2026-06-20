/**
 * File:        apps/api/src/typeorm/repositories/user.repository.ts
 * Module:      API · TypeORM Repositories
 * Purpose:     User repository with custom queries
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

export interface UserFilters {
  role?: UserRole;
  centerId?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['center', 'bookings', 'payments'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      relations: ['center'],
    });
  }

  async findAll(filters?: UserFilters): Promise<{ users: User[]; total: number }> {
    const queryBuilder = this.userRepo.createQueryBuilder('user');

    if (filters?.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.centerId) {
      queryBuilder.andWhere('user.centerId = :centerId', { centerId: filters.centerId });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const total = await queryBuilder.getCount();

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    const users = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    return { users, total };
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepo.create(userData);
    return this.userRepo.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.userRepo.update(id, userData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.userRepo.softDelete(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepo.update(id, {
      lastLogin: new Date(),
    });
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }
    // Password comparison should be done in auth service with bcrypt
    return user;
  }
}