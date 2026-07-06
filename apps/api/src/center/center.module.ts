/**
 * File:        apps/api/src/center/center.module.ts
 * Module:      API · Center Module
 * Purpose:     Center feature module
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-04
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { CenterResolver, LocationResolver, FloorResolver, SeatResolver } from '../graphql/resolvers/center.resolver';
import { Center } from '../typeorm/entities/center.entity';
import { Location } from '../typeorm/entities/location.entity';
import { Floor } from '../typeorm/entities/floor.entity';
import { Seat } from '../typeorm/entities/seat.entity';
import { PubSubModule } from '../graphql/pubsub/pub-sub.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Center, Location, Floor, Seat]),
    CacheModule,
    PubSubModule,
  ],
  providers: [
    CenterResolver,
    LocationResolver,
    FloorResolver,
    SeatResolver,
  ],
  exports: [CenterResolver],
})
export class CenterModule {}
