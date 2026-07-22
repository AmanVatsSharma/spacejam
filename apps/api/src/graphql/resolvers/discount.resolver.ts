/**
 * File:        apps/api/src/graphql/resolvers/discount.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Discount management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-12
 */
import { Resolver, Query, Args, Mutation, ID } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discount as DiscountEntity } from '../../typeorm/entities/discount.entity';
import { CreateDiscountInput, UpdateDiscountInput } from '../inputs/discount.input';
import { CacheService } from '../../cache/cache.service';
import { Discount } from '../types/discount.type';

@Resolver(() => DiscountEntity)
export class DiscountResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(DiscountEntity)
    private discountRepo: Repository<DiscountEntity>,
  ) {}

  @Query(() => [Discount])
  async discounts(
    @Args('centerId', { nullable: true }) centerId?: string,
  ): Promise<Discount[]> {
    const where: any = {};
    if (centerId) where.centerId = centerId;

    return this.discountRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  @Query(() => Discount, { nullable: true })
  async discount(@Args('id', { type: () => ID }) id: string): Promise<Discount | null> {
    const discount = await this.discountRepo.findOne({ where: { id } });
    return discount;
  }

  @Mutation(() => Discount)
  async createDiscount(
    @Args('input') input: CreateDiscountInput,
  ): Promise<Discount> {
    const newDiscount = this.discountRepo.create(input);
    const discount = await this.discountRepo.save(newDiscount);
    await this.cache.invalidatePattern('discounts:*');
    return discount;
  }

  @Mutation(() => Discount)
  async updateDiscount(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDiscountInput,
  ): Promise<Discount> {
    await this.discountRepo.update(id, input);
    const discount = await this.discountRepo.findOne({ where: { id } });
    if (!discount) throw new NotFoundException('Discount not found');
    await this.cache.invalidatePattern('discounts:*');
    await this.cache.del(`discount:${id}`);
    return discount;
  }

  @Mutation(() => Boolean)
  async deleteDiscount(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.discountRepo.delete(id);
    await this.cache.invalidatePattern('discounts:*');
    await this.cache.del(`discount:${id}`);
    return true;
  }
}
