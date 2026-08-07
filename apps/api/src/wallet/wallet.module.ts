/**
 * File:        apps/api/src/wallet/wallet.module.ts
 * Module:      API · Wallet Module
 * Purpose:     Wallet transaction history feature module
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletResolver } from '../graphql/resolvers/wallet.resolver';
import { WalletTransaction } from '../typeorm/entities/wallet-transaction.entity';
import { User } from '../typeorm/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WalletTransaction, User])],
  providers: [WalletResolver],
  exports: [WalletResolver],
})
export class WalletModule {}
