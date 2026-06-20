/**
 * File:        apps/api/src/health/health.service.ts
 * Module:      API · Health Service
 * Purpose:     System health check service
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

interface HealthCheckResult {
  status: string;
  timestamp: string;
  uptime: number;
  services: {
    database: { status: string; latency?: number };
    redis: { status: string; latency?: number };
    memory: { used: number; total: number };
  };
}

@Injectable()
export class HealthCheckService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService
  ) {}

  async check(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['services'] = {
      database: { status: 'checking' },
      redis: { status: 'checking' },
      memory: { used: 0, total: 0 }
    };

    // Check database
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = {
        status: 'healthy',
        latency: Date.now() - start
      };
    } catch (err) {
      checks.database = { status: 'unhealthy' };
    }

    // Check Redis
    try {
      const start = Date.now();
      const connected = await this.cache.isConnected();
      checks.redis = {
        status: connected ? 'healthy' : 'unhealthy',
        latency: connected ? Date.now() - start : 0
      };
    } catch {
      checks.redis = { status: 'unhealthy' };
    }

    // Memory info
    const memUsage = process.memoryUsage();
    checks.memory = {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal
    };

    const allHealthy = checks.database.status === 'healthy' && checks.redis.status === 'healthy';

    return {
      status: allHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: checks
    };
  }
}