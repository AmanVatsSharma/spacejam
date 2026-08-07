/**
 * File:        apps/api/src/offer/offer.module.ts
 * Module:      API · Offer Module
 * Purpose:     Promo-code offers feature module
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfferResolver } from '../graphql/resolvers/offer.resolver';
import { Offer, OfferRedemption } from '../typeorm/entities/offer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, OfferRedemption])],
  providers: [OfferResolver],
  exports: [OfferResolver],
})
export class OfferModule {}
