/**
 * File:        apps/api/src/referral/referral.module.ts
 * Module:      API · Referral Module
 * Purpose:     Referral program feature module
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralResolver } from '../graphql/resolvers/referral.resolver';
import { Referral } from '../typeorm/entities/referral.entity';
import { User } from '../typeorm/entities/user.entity';
import { WalletTransaction } from '../typeorm/entities/wallet-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Referral, User, WalletTransaction])],
  providers: [ReferralResolver],
  exports: [ReferralResolver],
})
export class ReferralModule {}
