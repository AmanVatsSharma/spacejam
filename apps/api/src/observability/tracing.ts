/**
 * File:        apps/api/src/observability/tracing.ts
 * Module:      API · Observability · Tracing
 * Purpose:     Boot the OpenTelemetry NodeSDK before NestJS starts.
 *
 *              This file is imported as a side-effect at the very top
 *              of main.ts. It pulls in @opentelemetry/sdk-node and
 *              auto-instrumentations-node so HTTP, Express, GraphQL,
 *              ioredis, typeorm, etc. all get traced out of the box.
 *
 *              Exporter choice:
 *                - If OTEL_EXPORTER_OTLP_ENDPOINT is set, send spans
 *                  there (e.g. Jaeger, Tempo, Honeycomb) using OTLP/HTTP
 *                - Otherwise, log every span via ConsoleSpanExporter so
 *                  traces are visible during local dev
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const serviceName = process.env.OTEL_SERVICE_NAME ?? 'spacejam-api';
const serviceVersion = process.env.npm_package_version ?? '0.0.1';
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

const traceExporter = otlpEndpoint
  ? new OTLPTraceExporter({ url: otlpEndpoint })
  : new ConsoleSpanExporter();

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // fs is extremely chatty; skip it to keep spans meaningful
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

// eslint-disable-next-line no-console
console.log(`[otel] tracing started (service=${serviceName} exporter=${otlpEndpoint ? 'otlp' : 'console'})`);

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('OpenTelemetry shutdown error', err);
      process.exit(1);
    });
});