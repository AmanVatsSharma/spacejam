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
import { CustomerResolver } from '../graphql/resolvers/customer.resolver';
import { OnboardingResolver } from '../graphql/resolvers/onboarding.resolver';
import { Lead } from '../typeorm/entities/lead.entity';
import { Customer } from '../typeorm/entities/customer.entity';
import { Onboarding } from '../typeorm/entities/onboarding.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Customer, Onboarding]),
    CacheModule,
  ],
  providers: [
    CrmResolver,
    CustomerResolver,
    OnboardingResolver,
  ],
  exports: [CrmResolver, CustomerResolver, OnboardingResolver],
})
export class CrmModule { }