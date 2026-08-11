/**
 * File:        auth/audit.module.ts
 * Module:      Api · Auth · Audit
 * Purpose:     Tiny module that provides and exports AuditService. Depends
 *              only on TypeOrmModule.forFeature([AuditLog]) — no auth deps —
 *              so importing it into CenterModule/UserModule cannot create a
 *              DI cycle with AuthModule.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-10
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../typeorm/entities/audit-log.entity';
import { AuditService } from './services/audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
