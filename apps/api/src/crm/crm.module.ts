/**
 * File:        apps/api/src/crm/crm.module.ts
 * Module:      API · CRM Module
 * Purpose:     CRM feature module with Lead management and customer tracking
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-01
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { CrmResolver } from '../graphql/resolvers/crm.resolver';
import { Lead } from '../typeorm/entities/lead.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead]),
    CacheModule,
  ],
  providers: [
    CrmResolver,
  ],
  exports: [CrmResolver],
})
export class CrmModule {}