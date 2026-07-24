/**
 * File:        apps/api/src/graphql/resolvers/notification-automation.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     NotificationAutomation CRUD — event-triggered notification
 *              rules for the Settings > Notifications > Automations tab.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-24
 */
import { Resolver, Query, Args, Mutation, ID } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationAutomation } from '../../typeorm/entities/notification-automation.entity';
import {
  CreateNotificationAutomationInput,
  UpdateNotificationAutomationInput,
} from '../inputs/notification-automation.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => NotificationAutomation)
export class NotificationAutomationResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(NotificationAutomation)
    private repo: Repository<NotificationAutomation>,
  ) {}

  @Query(() => [NotificationAutomation])
  async automations(
    @Args('centerId', { type: () => ID, nullable: true }) centerId?: string,
  ): Promise<NotificationAutomation[]> {
    const where = centerId ? { centerId } : {};
    return this.repo.find({
      where,
      relations: ['center'],
      order: { createdAt: 'DESC' },
    });
  }

  @Mutation(() => NotificationAutomation)
  async createAutomation(
    @Args('input') input: CreateNotificationAutomationInput,
  ): Promise<NotificationAutomation> {
    // The input exposes `variables` as a JSON string (GraphQL scalar); parse
    // it into the jsonb column value, mirroring how notification.resolver
    // handles its metadata field.
    const { variables, ...rest } = input as any;
    const payload: any = { ...rest };
    if (variables !== undefined && variables !== null) {
      try {
        payload.variables = typeof variables === 'string' ? JSON.parse(variables) : variables;
      } catch {
        payload.variables = null;
      }
    }
    const created = this.repo.create(payload);
    const saved = await this.repo.save(created);
    await this.cache.invalidatePattern('automations:*');
    return saved as unknown as NotificationAutomation;
  }

  @Mutation(() => NotificationAutomation)
  async updateAutomation(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateNotificationAutomationInput,
  ): Promise<NotificationAutomation> {
    const { variables, ...rest } = input as any;
    const patch: any = { ...rest };
    if (variables !== undefined) {
      try {
        patch.variables = typeof variables === 'string' ? JSON.parse(variables) : variables;
      } catch {
        patch.variables = null;
      }
    }
    await this.repo.update(id, patch);
    const updated = await this.repo.findOne({
      where: { id },
      relations: ['center'],
    });
    if (!updated) throw new Error('Automation not found');
    await this.cache.invalidatePattern('automations:*');
    return updated;
  }

  @Mutation(() => Boolean)
  async deleteAutomation(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const result = await this.repo.delete(id);
    await this.cache.invalidatePattern('automations:*');
    return (result.affected ?? 0) > 0;
  }
}
