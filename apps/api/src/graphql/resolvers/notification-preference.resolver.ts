/**
 * File:        apps/api/src/graphql/resolvers/notification-preference.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Per-user notification preferences (persisted toggle state)
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { UseGuards } from '@nestjs/common';
import { Query, Mutation, Resolver, Args } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { NotificationPreference } from '../../typeorm/entities/notification-preference.entity';
import { UpdateNotificationPreferencesInput } from '../inputs/notification-preference.input';

@Resolver(() => NotificationPreference)
@UseGuards(GqlAuthGuard)
export class NotificationPreferenceResolver {
  constructor(
    @InjectRepository(NotificationPreference)
    private readonly prefRepo: Repository<NotificationPreference>,
  ) {}

  @Query(() => NotificationPreference, {
    description: 'Notification preferences for the current user (auto-created on first read)',
  })
  async myNotificationPreferences(
    @CurrentUser() current: JwtPayload,
  ): Promise<NotificationPreference> {
    let pref = await this.prefRepo.findOne({ where: { userId: current.sub } });
    if (!pref) {
      pref = await this.prefRepo.save({ userId: current.sub });
    }
    return pref;
  }

  @Mutation(() => NotificationPreference, {
    description: 'Update notification preferences (partial update)',
  })
  async updateNotificationPreferences(
    @CurrentUser() current: JwtPayload,
    @Args('input') input: UpdateNotificationPreferencesInput,
  ): Promise<NotificationPreference> {
    let pref = await this.prefRepo.findOne({ where: { userId: current.sub } });
    if (!pref) {
      pref = await this.prefRepo.save({ userId: current.sub });
    }
    Object.assign(pref, input);
    return this.prefRepo.save(pref);
  }
}
