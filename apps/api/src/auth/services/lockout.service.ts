/**
 * File:        apps/api/src/auth/services/lockout.service.ts
 * Module:      API · Auth · Services
 * Purpose:     Account + IP-level brute-force protection.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 *
 *  ┌─────────────────────────────────────────────────────────────────┐
 *  │ Strategy:                                                        │
 *  │   1. Per-account: counter lives in `users.failedLoginCount`      │
 *  │      and `lockoutUntil`. On N consecutive failures the account   │
 *  │      is locked for an exponential amount of time (1m, 5m, 30m,   │
 *  │      2h, 24h) — capped at 24h. A successful signin resets it.   │
 *  │   2. Per-IP: a Redis-backed rolling window rejects requests      │
 *  │      above a threshold (default 30 failures / 5 min). Stops     │
 *  │      an attacker from spraying many accounts from one node.     │
 *  │   3. Anti-enumeration: an unknown email is treated as a single  │
 *  │      miss against a generic "unknown account" bucket so an       │
 *  │      attacker can't tell which addresses exist.                 │
 *  └─────────────────────────────────────────────────────────────────┘
 */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../typeorm/entities/user.entity';
import { CacheService } from '../../cache/cache.service';

const LOCKOUT_STAGES_MS = [
  60 * 1000,        // 1 minute  (5 fails)
  5 * 60 * 1000,    // 5 minutes (10 fails)
  30 * 60 * 1000,   // 30 minutes (15 fails)
  2 * 60 * 60 * 1000, // 2 hours  (20 fails)
  24 * 60 * 60 * 1000, // 24 hours  (25+ fails)
];
const FAILURE_THRESHOLDS = [5, 10, 15, 20, 25];

@Injectable()
export class LockoutService {
  private readonly logger = new Logger(LockoutService.name);
  private readonly ipWindowMs: number;
  private readonly ipLimit: number;
  private readonly unknownEmailKey = 'lockout:unknown';

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.ipWindowMs = parseInt(config.get<string>('LOCKOUT_IP_WINDOW_MS') ?? '300000', 10);
    this.ipLimit = parseInt(config.get<string>('LOCKOUT_IP_MAX') ?? '30', 10);
  }

  /**
   * Throws if the IP has exceeded its rolling window. Safe to call before
   * even looking at the email — protects the per-account column from
   * being clobbered by a single attacker hitting one address 10,000x.
   */
  async enforceIpLimit(ipAddress: string | undefined): Promise<void> {
    if (!ipAddress) return;
    const key = `lockout:ip:${ipAddress}`;
    const count = await this.cache.increment(key, 1, Math.ceil(this.ipWindowMs / 1000));
    if (count > this.ipLimit) {
      this.logger.warn(`IP rate-limit hit for ${ipAddress} (count=${count})`);
      throw new UnauthorizedException('Too many failed attempts. Try again later.');
    }
  }

  /**
   * Throws if the account is currently locked. Called at the start of
   * every signin attempt.
   */
  async assertNotLocked(user: User | null, emailForUnknown: string): Promise<void> {
    if (!user) {
      // Track unknown emails too — same key for all so an attacker can't
      // probe the corpus to figure out which addresses are registered.
      await this.cache.increment(this.unknownEmailKey, 1, 60);
      return;
    }
    if (user.lockoutUntil && user.lockoutUntil.getTime() > Date.now()) {
      const remaining = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 1000);
      this.logger.warn(`Login attempt on locked account ${user.id} (${remaining}s remaining)`);
      throw new UnauthorizedException(
        `Account temporarily locked. Try again in ${Math.ceil(remaining / 60)} minute(s).`,
      );
    }
  }

  /**
   * Record a failed attempt. Increments the counter and, when a
   * threshold is crossed, sets `lockoutUntil` to the corresponding
   * exponential delay. Returns the new failure count.
   */
  async recordFailure(user: User | null): Promise<number> {
    if (!user) {
      await this.cache.increment(this.unknownEmailKey, 1, 60);
      return 0;
    }
    const newCount = (user.failedLoginCount ?? 0) + 1;
    const stageIndex = this.stageFor(newCount);
    const lockoutUntil = stageIndex >= 0 ? new Date(Date.now() + LOCKOUT_STAGES_MS[stageIndex]) : null;
    await this.users.update(user.id, {
      failedLoginCount: newCount,
      lastFailedLoginAt: new Date(),
      lockoutUntil,
    });
    if (lockoutUntil) {
      this.logger.warn(
        `Account ${user.id} locked until ${lockoutUntil.toISOString()} (failures=${newCount})`,
      );
    }
    return newCount;
  }

  /** Reset on successful signin. */
  async recordSuccess(user: User): Promise<void> {
    if ((user.failedLoginCount ?? 0) === 0 && !user.lockoutUntil) return;
    await this.users.update(user.id, {
      failedLoginCount: 0,
      lastFailedLoginAt: null,
      lockoutUntil: null,
    });
  }

  /** Get current status for the UI (how many failures, locked until when). */
  async getStatus(user: User): Promise<{
    failedLoginCount: number;
    lockedUntil: Date | null;
    nextLockoutAt: number | null;
  }> {
    const count = user.failedLoginCount ?? 0;
    const currentStage = this.stageFor(count);
    const nextThreshold = FAILURE_THRESHOLDS[currentStage + 1] ?? null;
    return {
      failedLoginCount: count,
      lockedUntil: user.lockoutUntil ?? null,
      nextLockoutAt: nextThreshold,
    };
  }

  private stageFor(count: number): number {
    let idx = -1;
    for (let i = 0; i < FAILURE_THRESHOLDS.length; i++) {
      if (count >= FAILURE_THRESHOLDS[i]) idx = i;
    }
    return idx;
  }
}
