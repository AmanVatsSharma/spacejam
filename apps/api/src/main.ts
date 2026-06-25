/**
 * File:        apps/api/src/main.ts
 * Module:      API · Application Bootstrap
 * Purpose:     Production-grade application bootstrap with validation
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Cookies — required for refresh-token handling on the GraphQL path
  app.use(cookieParser());

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Apollo-Operation-Name'],
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

  console.log(
    `🚀 SpaceJam API running on: http://localhost:${port}/${globalPrefix}`,
    `\n📊 GraphQL endpoint: http://localhost:${port}/${globalPrefix}/graphql`,
  );
}

bootstrap();
