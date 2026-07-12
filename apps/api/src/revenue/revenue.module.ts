/**
 * File:        apps/api/src/revenue/revenue.module.ts
 * Module:      API · Revenue Module
 * Purpose:     Revenue feature module
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';
import { InvoiceResolver } from '../graphql/resolvers/revenue.resolver';
import { DepositResolver } from '../graphql/resolvers/revenue.resolver';
import { ContractResolver } from '../graphql/resolvers/revenue.resolver';
import { DiscountResolver } from '../graphql/resolvers/discount.resolver';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { Deposit } from '../typeorm/entities/deposit.entity';
import { Contract } from '../typeorm/entities/contract.entity';
import { Discount } from '../typeorm/entities/discount.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Deposit, Contract, Discount]),
    CacheModule,
  ],
  controllers: [RevenueController],
  providers: [
    RevenueService,
    InvoiceResolver,
    DepositResolver,
    ContractResolver,
    DiscountResolver,
  ],
  exports: [RevenueService],
})
export class RevenueModule {}