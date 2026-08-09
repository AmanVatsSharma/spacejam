/**
 * File:        apps/api/src/graphql/resolvers/referral.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Referral program: stats, invites, reward on signup
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { UseGuards } from '@nestjs/common';
import { Args, Query, Mutation, Resolver, ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { Referral } from '../../typeorm/entities/referral.entity';
import { User } from '../../typeorm/entities/user.entity';
import { WalletTransaction } from '../../typeorm/entities/wallet-transaction.entity';

@ObjectType()
export class ReferralStats {
  @Field(() => Int) successful!: number;
  @Field(() => Int) pending!: number;
  @Field(() => Int) totalEarned!: number;
  @Field() referralCode!: string;
}

@Resolver(() => Referral)
@UseGuards(GqlAuthGuard)
export class ReferralResolver {
  constructor(
    @InjectRepository(Referral) private readonly referralRepo: Repository<Referral>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(WalletTransaction) private readonly walletTxRepo: Repository<WalletTransaction>,
  ) {}

  @Query(() => [Referral], { description: 'Referrals made by the current user' })
  async myReferrals(@CurrentUser() current: JwtPayload): Promise<Referral[]> {
    return this.referralRepo.find({
      where: { referrerId: current.sub },
      order: { createdAt: 'DESC' },
    });
  }

  @Query(() => ReferralStats, { description: 'Aggregated referral stats for the current user' })
  async myReferralStats(@CurrentUser() current: JwtPayload): Promise<ReferralStats> {
    const refs = await this.referralRepo.find({ where: { referrerId: current.sub } });
    const user = await this.userRepo.findOne({ where: { id: current.sub } });
    const successful = refs.filter((r) => r.status === 'SUCCESSFUL' || r.status === 'REWARDED').length;
    const pending = refs.filter((r) => r.status === 'PENDING').length;
    const totalEarned = refs
      .filter((r) => r.status === 'REWARDED')
      .reduce((sum, r) => sum + r.rewardAmount, 0);
    // Derive a stable referral code from the user's id prefix + name.
    const code = `SPACE-${(user?.name || user?.email || current.sub).slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '0')}`;
    return { successful, pending, totalEarned, referralCode: code };
  }

  @Mutation(() => Referral, { description: 'Invite a friend by email (creates a PENDING referral)' })
  async createReferral(
    @CurrentUser() current: JwtPayload,
    @Args('referredEmail') referredEmail: string,
  ): Promise<Referral> {
    const user = await this.userRepo.findOne({ where: { id: current.sub } });
    const code = `SPACE-${(user?.name || current.sub).slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '0')}`;
    return this.referralRepo.save({
      referrerId: current.sub,
      referredEmail,
      code,
      status: 'PENDING',
    });
  }

  /**
   * Claim rewards for all SUCCESSFUL-but-unclaimed referrals. Credits the
   * referrer's wallet (tokenBalance) for each, records a WalletTransaction,
   * and flips the referrals to REWARDED. Returns the total credited.
   */
  @Mutation(() => Float, { description: 'Claim token rewards for all successful referrals. Returns total credited.' })
  async claimReferralRewards(@CurrentUser() current: JwtPayload): Promise<number> {
    const claimable = await this.referralRepo.find({
      where: { referrerId: current.sub, status: 'SUCCESSFUL' },
    });
    if (claimable.length === 0) return 0;

    const total = claimable.reduce((sum, r) => sum + r.rewardAmount, 0);
    // Credit the referrer's wallet.
    const user = await this.userRepo.findOne({ where: { id: current.sub } });
    if (!user) return 0;
    const newBalance = (user.tokenBalance ?? 0) + total;
    await this.userRepo.update(current.sub, { tokenBalance: newBalance });
    await this.walletTxRepo.save(
      this.walletTxRepo.create({
        userId: current.sub,
        type: 'CREDIT',
        amount: total,
        balanceAfter: newBalance,
        reference: `REFERRAL-REWARD-${Date.now()}`,
        description: `Reward for ${claimable.length} successful referral(s)`,
      } as any),
    );
    // Flip each to REWARDED.
    for (const r of claimable) {
      await this.referralRepo.update(r.id, { status: 'REWARDED' });
    }
    return total;
  }

  /**
   * Mark a referral as SUCCESSFUL when the referred user converts (e.g.
   * makes their first booking). Called by the booking/billing flow with the
   * referred user's id — resolves the referrer via referredEmail/referredUserId.
   */
  async markSuccessfulForUser(userId: string, email: string): Promise<void> {
    const pending = await this.referralRepo.find({
      where: { referredEmail: email.toLowerCase(), status: 'PENDING' },
    });
    for (const r of pending) {
      await this.referralRepo.update(r.id, { status: 'SUCCESSFUL', referredUserId: userId });
    }
  }
}
