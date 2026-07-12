/**
 * File:        apps/api/src/typeorm/repositories/user-session.repository.module.ts
 * Module:      API · TypeORM · UserSession Repository
 * Purpose:     Dedicated module for UserSessionRepository so it can be imported
 *              by UserModule without creating circular dependencies.
 *
 * Author:      Claude (AI Agent)
 * Last-updated: 2026-07-12
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSession } from '../entities/user-session.entity';
import { UserSessionRepository } from './user-session.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserSession])],
  providers: [UserSessionRepository],
  exports: [UserSessionRepository],
})
export class UserSessionRepositoryModule {}
