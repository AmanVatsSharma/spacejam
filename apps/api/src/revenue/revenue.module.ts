/**
 * File:        apps/api/src/revenue/revenue.module.ts
 * Module:      API · Revenue Module
 * Purpose:     Revenue feature module
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Module } from '@nestjs/common';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';

@Module({
  controllers: [RevenueController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}