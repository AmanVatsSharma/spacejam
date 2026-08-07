/**
 * File:        apps/api/src/user/user.module.ts
 * Module:      API · User Module
 * Purpose:     User feature module
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-04
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { UserRepositoryModule } from '../typeorm/repositories/user.repository.module';
import { UserSessionRepositoryModule } from '../typeorm/repositories/user-session.repository.module';
import { UserResolver } from '../graphql/resolvers/user.resolver';
import { User } from '../typeorm/entities/user.entity';
import { WalletTransaction } from '../typeorm/entities/wallet-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, WalletTransaction]),
    CacheModule,
    UserRepositoryModule,
    UserSessionRepositoryModule,
  ],
  providers: [
    UserResolver,
  ],
  exports: [UserResolver],
})
export class UserModule {}
