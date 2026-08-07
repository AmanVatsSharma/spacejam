/**
 * File:        apps/api/src/graphql/resolvers/referral.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Referral program: stats, invites, reward on signup
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { UseGuards } from '@nestjs/common';
import { Args, Query, Mutation, Resolver, ObjectType, Field, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { Referral } from '../../typeorm/entities/referral.entity';
import { User } from '../../typeorm/entities/user.entity';

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
}
