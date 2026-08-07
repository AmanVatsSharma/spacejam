/**
 * File:        apps/api/src/statement/statement.module.ts
 * Module:      API · Statement Module
 * Purpose:     Account statements + notification preferences feature module
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatementResolver } from '../graphql/resolvers/statement.resolver';
import { NotificationPreferenceResolver } from '../graphql/resolvers/notification-preference.resolver';
import { WalletTransaction } from '../typeorm/entities/wallet-transaction.entity';
import { NotificationPreference } from '../typeorm/entities/notification-preference.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletTransaction, NotificationPreference]),
  ],
  providers: [StatementResolver, NotificationPreferenceResolver],
  exports: [StatementResolver, NotificationPreferenceResolver],
})
export class StatementModule {}
