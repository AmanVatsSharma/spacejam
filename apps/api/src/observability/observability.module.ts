/**
 * File:        apps/api/src/observability/observability.module.ts
 * Module:      API · Observability
 * Purpose:     Bundles the MetricsService + MetricsController.
 *              Tracing is initialized as a side-effect from main.ts
 *              (it must run before NestJS bootstrap), and structured
 *              logging is configured via nestjs-pino in main.ts too.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class ObservabilityModule {}