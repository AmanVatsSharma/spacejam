/**
 * File:        apps/api/src/graphql/resolvers/offer.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Promo-code offers: list active, validate, redeem
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { Args, ID, Query, Mutation, Resolver, Float } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { Offer, OfferRedemption } from '../../typeorm/entities/offer.entity';

@Resolver(() => Offer)
@UseGuards(GqlAuthGuard)
export class OfferResolver {
  constructor(
    @InjectRepository(Offer) private readonly offerRepo: Repository<Offer>,
    @InjectRepository(OfferRedemption) private readonly redeemRepo: Repository<OfferRedemption>,
  ) {}

  @Query(() => [Offer], { description: 'Currently active, in-date, under-usage-limit offers' })
  async activeOffers(): Promise<Offer[]> {
    const now = new Date();
    return this.offerRepo.find({
      where: {
        isActive: true,
        validFrom: LessThanOrEqual(now),
        validUntil: MoreThanOrEqual(now),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /** Returns the discount amount for a code on a given order, or 0 if invalid. */
  @Query(() => Float, { description: 'Preview discount for a code without redeeming' })
  async validateOffer(
    @Args('code') code: string,
    @Args('orderAmount', { type: () => Float }) orderAmount: number,
  ): Promise<number> {
    const offer = await this.offerRepo.findOne({ where: { code: code.toUpperCase() } });
    if (!offer || !offer.isActive) return 0;
    const now = new Date();
    if (now < offer.validFrom || now > offer.validUntil) return 0;
    if (offer.usageLimit && offer.usageCount >= offer.usageLimit) return 0;
    if (offer.minOrderAmount && orderAmount < offer.minOrderAmount) return 0;

    let discount = 0;
    if (offer.type === 'PERCENTAGE') {
      discount = (orderAmount * offer.value) / 100;
      if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
    } else if (offer.type === 'FIXED') {
      discount = Math.min(offer.value, orderAmount);
    } else if (offer.type === 'TOKENS') {
      discount = 0; // token rewards applied to wallet, not order total
    }
    return Math.round(discount * 100) / 100;
  }

  @Mutation(() => OfferRedemption, { description: 'Redeem an offer code against a booking' })
  async redeemOffer(
    @CurrentUser() current: JwtPayload,
    @Args('code') code: string,
    @Args('bookingId', { type: () => ID, nullable: true }) bookingId: string | null,
    @Args('orderAmount', { type: () => Float, nullable: true }) orderAmount: number | null,
  ): Promise<OfferRedemption> {
    const offer = await this.offerRepo.findOne({ where: { code: code.toUpperCase() } });
    if (!offer || !offer.isActive) throw new NotFoundException('Offer not found');

    const now = new Date();
    if (now < offer.validFrom || now > offer.validUntil) {
      throw new BadRequestException('Offer has expired');
    }
    if (offer.usageLimit && offer.usageCount >= offer.usageLimit) {
      throw new BadRequestException('Offer usage limit reached');
    }
    const discount = orderAmount != null ? await this.validateOffer(code, orderAmount) : 0;

    const redemption = await this.redeemRepo.save({
      offerId: offer.id,
      userId: current.sub,
      bookingId: bookingId ?? null,
      discountAmount: discount,
      redeemedAt: now,
    });
    offer.usageCount += 1;
    await this.offerRepo.save(offer);
    return redemption;
  }
}
