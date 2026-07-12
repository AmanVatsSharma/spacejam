/**
 * File:        apps/api/src/typeorm/repositories/user-session.repository.ts
 * Module:      API · TypeORM Repositories
 * Purpose:     UserSession repository with custom queries for session management
 *
 * Author:      Claude (AI Agent)
 * Last-updated: 2026-07-12
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../entities/user-session.entity';

@Injectable()
export class UserSessionRepository {
  constructor(
    @InjectRepository(UserSession)
    private sessionRepo: Repository<UserSession>,
  ) {}

  /**
   * Find all active sessions for a user.
   */
  async findActiveByUserId(userId: string): Promise<UserSession[]> {
    return this.sessionRepo.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find a session by id, optionally scoped to a user.
   */
  async findById(id: string, userId?: string): Promise<UserSession | null> {
    const where: { id: string; userId?: string } = { id };
    if (userId) where.userId = userId;
    return this.sessionRepo.findOne({ where });
  }

  /**
   * Deactivate a session by id.
   */
  async deactivate(id: string): Promise<boolean> {
    const result = await this.sessionRepo.update(id, { isActive: false } as never);
    return !!result.affected;
  }

  /**
   * Deactivate all active sessions for a user, returning the count of deactivated sessions.
   * Optionally exclude a specific session (e.g., the current one).
   */
  async deactivateAllForUser(userId: string, excludeSessionId?: string): Promise<number> {
    const queryBuilder = this.sessionRepo
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .andWhere('session.isActive = :isActive', { isActive: true });

    if (excludeSessionId) {
      queryBuilder.andWhere('session.id != :excludeSessionId', { excludeSessionId });
    }

    const result = await queryBuilder.update(UserSession).set({ isActive: false } as never).execute();
    return result.affected ?? 0;
  }

  /**
   * Update last activity timestamp.
   */
  async touch(id: string): Promise<void> {
    await this.sessionRepo.update(id, { createdAt: new Date() } as never);
  }
}
