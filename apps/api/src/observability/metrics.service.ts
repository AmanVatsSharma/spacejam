/**
 * File:        apps/api/src/observability/metrics.service.ts
 * Module:      API · Observability · Metrics
 * Purpose:     Prometheus metrics via prom-client, exposed at /metrics.
 *
 *              Provides three domain-specific counters / histograms
 *              plus the default process / nodejs metrics that come
 *              for free with prom-client.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  readonly registry = new Registry();

  // HTTP request counter
  readonly httpRequestsTotal: Counter<string>;

  // GraphQL operation counter
  readonly graphqlOperationsTotal: Counter<string>;

  // GraphQL operation latency
  readonly graphqlOperationDuration: Histogram<string>;

  // Auth-specific counters (signins, signups, failures, lockouts)
  readonly authEventsTotal: Counter<string>;

  // Booking-domain counters (created, cancelled, failed)
  readonly bookingEventsTotal: Counter<string>;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Count of HTTP requests handled by the API',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.graphqlOperationsTotal = new Counter({
      name: 'graphql_operations_total',
      help: 'Count of GraphQL operations handled by the API',
      labelNames: ['operation', 'operation_type', 'result'],
      registers: [this.registry],
    });

    this.graphqlOperationDuration = new Histogram({
      name: 'graphql_operation_duration_seconds',
      help: 'Duration of GraphQL operations',
      labelNames: ['operation', 'operation_type'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.authEventsTotal = new Counter({
      name: 'auth_events_total',
      help: 'Count of authentication events',
      labelNames: ['event', 'result'],
      registers: [this.registry],
    });

    this.bookingEventsTotal = new Counter({
      name: 'booking_events_total',
      help: 'Count of booking domain events',
      labelNames: ['event', 'result'],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
    this.logger.log('Prometheus metrics registry initialized');
  }

  /**
   * Render all metrics in the Prometheus text exposition format.
   * Mounted at GET /metrics by MetricsController.
   */
  async render(): Promise<string> {
    return this.registry.metrics();
  }

  /** Content-Type header for the Prometheus scrape. */
  contentType(): string {
    return this.registry.contentType;
  }
}