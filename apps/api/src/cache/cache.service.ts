/**
 * File:        apps/api/src/cache/cache.service.ts
 * Module:      API · Cache Service
 * Purpose:     Redis-based caching service for hot data + a safe in-memory
 *              fallback for local dev (when REDIS_URL=memory://).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

/**
 * When REDIS_URL is set to "memory://" we run a tiny in-process map
 * with the same API. Used by `nx serve api` in dev environments
 * where a Redis daemon is unavailable.
 */
class MemoryStore {
  private map = new Map<string, { value: string; expiresAt: number | null }>();
  async get(k: string) {
    const entry = this.map.get(k);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.map.delete(k);
      return null;
    }
    return entry.value;
  }
  async set(k: string, v: string, ttlSeconds?: number) {
    this.map.set(k, {
      value: v,
      expiresAt: ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
    });
    return 'OK';
  }
  async setex(k: string, ttl: number, v: string) {
    return this.set(k, v, ttl);
  }
  async del(...keys: string[]) {
    let n = 0;
    for (const k of keys) if (this.map.delete(k)) n++;
    return n;
  }
  async incr(k: string) {
    const cur = parseInt((await this.get(k)) ?? '0', 10) + 1;
    await this.set(k, String(cur));
    return cur;
  }
  async expire(k: string, ttlSeconds: number) {
    const v = await this.get(k);
    if (v !== null) await this.set(k, v, ttlSeconds);
    return 1;
  }
  async keys(pattern: string) {
    const prefix = pattern.replace(/\*$/, '');
    return Array.from(this.map.keys()).filter((k) => k.startsWith(prefix));
  }
  async ping() {
    return 'PONG';
  }
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | MemoryStore;
  private readonly useMemory: boolean;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    if (url === 'memory://') {
      this.useMemory = true;
      this.redis = new MemoryStore();
    } else {
      this.useMemory = false;
      this.redis = new Redis(url, {
        lazyConnect: false,
        maxRetriesPerRequest: 2,
        enableOfflineQueue: false,
      });
      this.redis.on('error', (err: Error) => {
        this.logger.warn(`Redis error: ${err.message}`);
      });
    }
  }

  async onModuleInit() {
    this.logger.log(`Cache backend: ${this.useMemory ? 'in-memory (dev only)' : 'redis'}`);
  }

  async onModuleDestroy() {
    if (!this.useMemory) {
      await (this.redis as Redis).quit();
    }
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const { ttl = 3600, prefix = 'sj:' } = options;
    const fullKey = `${prefix}${key}`;
    const cached = await this.get(fullKey, '');
    if (cached !== null) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // fall through and re-fetch
      }
    }
    const data = await fetcher();
    await this.set(fullKey, data, ttl, '');
    return data;
  }

  async get(key: string, prefix = 'sj:'): Promise<string | null> {
    try {
      return await this.redis.get(`${prefix}${key}`);
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttl = 3600, prefix = 'sj:'): Promise<void> {
    try {
      const fullKey = `${prefix}${key}`;
      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, JSON.stringify(value));
      } else {
        await this.redis.set(fullKey, JSON.stringify(value));
      }
    } catch {
      // Cache is best-effort.
    }
  }

  async del(key: string, prefix = 'sj:'): Promise<void> {
    try {
      await this.redis.del(`${prefix}${key}`);
    } catch {
      // ignore
    }
  }

  async invalidatePattern(pattern: string, prefix = 'sj:'): Promise<void> {
    try {
      const fullPattern = `${prefix}${pattern}`;
      const keys = await this.redis.keys(fullPattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch {
      // ignore
    }
  }

  async invalidatePatterns(patterns: string[]): Promise<void> {
    await Promise.all(patterns.map((p) => this.invalidatePattern(p)));
  }

  async storeSession(userId: string, session: any, ttl = 3600): Promise<void> {
    await this.set(`session:${userId}`, session, ttl);
  }

  async getSession(userId: string): Promise<any | null> {
    const session = await this.get(`session:${userId}`);
    return session ? JSON.parse(session) : null;
  }

  async deleteSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  async rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    return current <= limit;
  }

  /**
   * Increment a counter and optionally (re)set its TTL.
   *
   * Three-arg form (key, by, ttlSeconds) — used by LockoutService.
   * Two-arg form (key, ttl) is preserved for backward compatibility.
   */
  async increment(key: string, byOrTtl?: number, ttlSeconds?: number): Promise<number> {
    const current = await this.redis.incr(key);
    const applyTtl = ttlSeconds ?? (typeof byOrTtl === 'number' ? byOrTtl : undefined);
    if (current === 1 && applyTtl) {
      await this.redis.expire(key, applyTtl);
    }
    return current;
  }

  async isConnected(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
