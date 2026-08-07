/**
 * File:        apps/api/src/print/print.module.ts
 * Module:      API · Print Module
 * Purpose:     Print jobs feature module (GraphQL resolver + REST upload)
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintJobResolver } from '../graphql/resolvers/print-job.resolver';
import { PrintJob } from '../typeorm/entities/print-job.entity';
import { PrintController } from './print.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PrintJob])],
  controllers: [PrintController],
  providers: [PrintJobResolver],
  exports: [PrintJobResolver],
})
export class PrintModule {}
