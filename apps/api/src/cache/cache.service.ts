/**
 * File:        apps/api/src/cache/cache.service.ts
 * Module:      API · Cache Service
 * Purpose:     Redis-based caching service for hot data
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async onModuleInit() {
    console.log('Redis connection established');
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * Get from cache or fetch and set
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = 3600, prefix = 'sj:' } = options;
    const fullKey = `${prefix}${key}`;

    try {
      const cached = await this.redis.get(fullKey);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      console.warn(`Cache read failed for ${fullKey}, fetching fresh`);
    }

    const data = await fetcher();

    try {
      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, JSON.stringify(data));
      } else {
        await this.redis.set(fullKey, JSON.stringify(data));
      }
    } catch (err) {
      console.warn(`Cache write failed for ${fullKey}`);
    }

    return data;
  }

  /**
   * Get raw value from cache
   */
  async get(key: string, prefix = 'sj:'): Promise<string | null> {
    try {
      return await this.redis.get(`${prefix}${key}`);
    } catch {
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl = 3600, prefix = 'sj:'): Promise<void> {
    try {
      if (ttl > 0) {
        await this.redis.setex(`${prefix}${key}`, ttl, JSON.stringify(value));
      } else {
        await this.redis.set(`${prefix}${key}`, JSON.stringify(value));
      }
    } catch (err) {
      console.warn(`Cache write failed for ${prefix}${key}`);
    }
  }

  /**
   * Delete specific key
   */
  async del(key: string, prefix = 'sj:'): Promise<void> {
    try {
      await this.redis.del(`${prefix}${key}`);
    } catch {
      // Silently fail
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async invalidatePattern(pattern: string, prefix = 'sj:'): Promise<void> {
    try {
      const fullPattern = `${prefix}${pattern}`;
      const keys = await this.redis.keys(fullPattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      console.warn(`Cache invalidation failed for pattern ${prefix}${pattern}`);
    }
  }

  /**
   * Invalidate multiple patterns
   */
  async invalidatePatterns(patterns: string[]): Promise<void> {
    await Promise.all(patterns.map(p => this.invalidatePattern(p)));
  }

  /**
   * Store session
   */
  async storeSession(userId: string, session: any, ttl = 3600): Promise<void> {
    await this.set(`session:${userId}`, session, ttl);
  }

  /**
   * Get session
   */
  async getSession(userId: string): Promise<any | null> {
    const session = await this.get(`session:${userId}`);
    return session ? JSON.parse(session) : null;
  }

  /**
   * Delete session
   */
  async deleteSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  /**
   * Rate limiting helper
   */
  async rateLimit(key: string, limit: number, window: number): Promise<boolean> {
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, window);
    }

    return current <= limit;
  }

  /**
   * Get or increment counter
   */
  async increment(key: string, ttl?: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1 && ttl) {
      await this.redis.expire(key, ttl);
    }
    return count;
  }

  /**
   * Health check
   */
  async isConnected(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Get memory info
   */
  async getMemoryInfo(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      const lines = info.split('\r\n');
      const memInfo: any = {};
      for (const line of lines) {
        const [key, value] = line.split(':');
        if (key && value) {
          memInfo[key] = value;
        }
      }
      return memInfo;
    } catch {
      return null;
    }
  }
}
