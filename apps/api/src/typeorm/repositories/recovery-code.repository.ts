/**
 * File:        apps/api/src/typeorm/repositories/recovery-code.repository.ts
 * Module:      API · TypeORM Repositories
 * Purpose:     Recovery-code repository — single-purpose accessor for the
 *              hashed backup codes that unlock a user when their TOTP
 *              device is unavailable.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { RecoveryCode } from '../entities/recovery-code.entity';

@Injectable()
export class RecoveryCodeRepository {
  constructor(
    @InjectRepository(RecoveryCode)
    private readonly repo: Repository<RecoveryCode>,
  ) {}

  /** Bulk insert pre-hashed codes for a user. Wrapped in a single
   *  transaction so we never end up with partial recovery sets if the
   *  insert fails midway. */
  async bulkInsert(userId: string, hashedCodes: string[]): Promise<void> {
    if (hashedCodes.length === 0) return;
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(RecoveryCode)
      .values(hashedCodes.map((codeHash) => ({ userId, codeHash, usedAt: null })))
      .execute();
  }

  /** Look up an unused code that matches the supplied hash. Returns null
   *  if no match (which is the expected case for an attacker guessing). */
  async findUnused(userId: string, codeHash: string): Promise<RecoveryCode | null> {
    return this.repo.findOne({ where: { userId, codeHash, usedAt: IsNull() } });
  }

  /** Atomically consume a code. Returns 1 if consumed, 0 if it was
   *  already used (lost the race) or doesn't exist. */
  async consume(id: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(RecoveryCode)
      .set({ usedAt: new Date() })
      .where('id = :id AND usedAt IS NULL', { id })
      .execute();
    return result.affected ?? 0;
  }

  async countUnused(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, usedAt: IsNull() } });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }
}