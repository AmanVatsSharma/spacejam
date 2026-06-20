/**
 * File:        apps/api/src/config/module.ts
 * Module:      API · Configuration Module
 * Purpose:     Environment configuration using NestJS ConfigModule
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (env) => {
        // Basic validation - add joi if installed
        return env;
      },
    }),
  ],
  exports: [ConfigModule],
})
export class ConfigModule {}