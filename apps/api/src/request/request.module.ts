/**
 * File:        apps/api/src/request/request.module.ts
 * Module:      API · Request Module
 * Purpose:     Request feature module
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-04
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { RequestResolver } from '../graphql/resolvers/request.resolver';
import { Request } from '../typeorm/entities/request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Request]),
    CacheModule,
  ],
  providers: [
    RequestResolver,
  ],
  exports: [RequestResolver],
})
export class RequestModule {}
