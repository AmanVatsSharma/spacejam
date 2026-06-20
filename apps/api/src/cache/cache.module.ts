/**
 * File:        apps/api/src/cache/cache.module.ts
 * Module:      API · Cache Module
 * Purpose:     Redis caching module configuration
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService]
})
export class CacheModule {}