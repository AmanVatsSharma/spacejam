/**
 * File:        apps/api/src/typeorm/repositories/user.repository.module.ts
 * Module:      API · TypeORM · User Repository
 * Purpose:     Dedicated module for UserRepository so it can be imported
 *              by AuthModule without creating a circular dependency
 *              with AppModule.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserRepository } from './user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class UserRepositoryModule {}
