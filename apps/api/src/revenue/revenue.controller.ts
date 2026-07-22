/**
 * File:        apps/api/src/revenue/revenue.controller.ts
 * Module:      API · Revenue Controller
 * Purpose:     Revenue endpoints
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Controller, Get } from '@nestjs/common';
import { RevenueService } from './revenue.service';

@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get()
  getRevenue() {
    return this.revenueService.getRevenue();
  }

  @Get('invoices')
  getInvoices() {
    return this.revenueService.getInvoices();
  }
}