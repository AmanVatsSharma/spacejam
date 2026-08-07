/**
 * File:        apps/api/src/graphql/resolvers/wallet.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Wallet transaction history queries
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { UseGuards, NotFoundException } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { WalletTransaction } from '../../typeorm/entities/wallet-transaction.entity';

@Resolver(() => WalletTransaction)
@UseGuards(GqlAuthGuard)
export class WalletResolver {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly txRepo: Repository<WalletTransaction>,
  ) {}

  @Query(() => [WalletTransaction], {
    description: 'Wallet transaction history for the current user',
  })
  async myWalletTransactions(
    @CurrentUser() current: JwtPayload,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
    @Args('type', { type: () => String, nullable: true }) type?: 'CREDIT' | 'DEBIT',
  ): Promise<WalletTransaction[]> {
    const where: any = { userId: current.sub };
    if (type) where.type = type;
    return this.txRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 200),
      skip: offset,
    });
  }

  @Query(() => WalletTransaction, { nullable: true })
  async walletTransaction(
    @CurrentUser() current: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<WalletTransaction | null> {
    const tx = await this.txRepo.findOne({ where: { id, userId: current.sub } });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }
}
