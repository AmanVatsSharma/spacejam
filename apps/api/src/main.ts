/**
 * File:        apps/api/src/main.ts
 * Module:      API · Application Bootstrap
 * Purpose:     Production-grade application bootstrap with validation,
 *              OpenTelemetry tracing, structured (pino) logging, and
 *              Prometheus metrics.
 *
 *              IMPORTANT: The tracing import MUST be the first line
 *              so the OpenTelemetry SDK patches HTTP, Express, GraphQL,
 *              ioredis, etc. before NestJS has a chance to import them.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */

// Tracing MUST be imported first — it patches node modules at require time.
import './observability/tracing';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger as NestPinoLogger } from 'nestjs-pino';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Pino replaces Nest's default logger; reads LOG_LEVEL env.
    bufferLogs: true,
  });
  app.useLogger(app.get(NestPinoLogger));

  // Global prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? [corsOrigin] : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    maxAge: 3600,
  });

  // Body parser limits
  app.useBodyParser('json', { limit: '50mb' });
  app.useBodyParser('urlencoded', { limit: '50mb', extended: true });

  // Trust proxy (for rate limiting behind load balancer)
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  // Use the structured logger from here on
  const logger = app.get(NestPinoLogger);
  logger.log(
    `SpaceJam API listening at http://localhost:${port}/${globalPrefix} (graphql at /${globalPrefix}/graphql, metrics at /${globalPrefix}/metrics)`,
  );
}

bootstrap();
