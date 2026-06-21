/**
 * File:        apps/api/src/observability/metrics.controller.ts
 * Module:      API · Observability · Metrics
 * Purpose:     Expose /metrics in the Prometheus text exposition format.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Controller, Get, Header, Res } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { MetricsService } from './metrics.service';
import type { Response } from 'express';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'no-store')
  async scrape(@Res() res: Response) {
    res.setHeader('Content-Type', this.metrics.contentType());
    res.send(await this.metrics.render());
  }
}