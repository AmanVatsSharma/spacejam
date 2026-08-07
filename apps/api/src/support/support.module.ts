/**
 * File:        apps/api/src/support/support.module.ts
 * Module:      API · Support Module
 * Purpose:     Support tickets feature module
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportResolver } from '../graphql/resolvers/support.resolver';
import { SupportTicket, SupportMessage } from '../typeorm/entities/support-ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicket, SupportMessage])],
  providers: [SupportResolver],
  exports: [SupportResolver],
})
export class SupportModule {}
