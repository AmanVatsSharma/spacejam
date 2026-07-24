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
import { CustomerEmployeeResolver } from '../graphql/resolvers/customer-employee.resolver';
import { CustomerDocumentResolver } from '../graphql/resolvers/customer-document.resolver';
import { Lead } from '../typeorm/entities/lead.entity';
import { Customer } from '../typeorm/entities/customer.entity';
import { Onboarding } from '../typeorm/entities/onboarding.entity';
import { CustomerEmployee } from '../typeorm/entities/customer-employee.entity';
import { CustomerDocument } from '../typeorm/entities/customer-document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      Customer,
      Onboarding,
      CustomerEmployee,
      CustomerDocument,
    ]),
    CacheModule,
  ],
  providers: [
    CrmResolver,
    CustomerResolver,
    OnboardingResolver,
    CustomerEmployeeResolver,
    CustomerDocumentResolver,
  ],
  exports: [
    CrmResolver,
    CustomerResolver,
    OnboardingResolver,
    CustomerEmployeeResolver,
    CustomerDocumentResolver,
  ],
})
export class CrmModule { }
