/**
 * File:        apps/api/src/graphql/resolvers/notification.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Notification management resolvers (feed, stats, read-state,
 *              send/broadcast).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-11
 */

import { Resolver, Query, Args, Mutation, Context, ID, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../typeorm/entities/notification.entity';
import {
  NotificationType,
  NotificationPriority,
} from '../types/user.type';
import {
  CreateNotificationInput,
  SendNotificationInput,
  NotificationFiltersInput,
  NotificationStatistics,
} from '../inputs/notification.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => Notification)
export class NotificationResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
  ) {}

  // ────────────────────────────────────────────────────────
  // Queries
  // ────────────────────────────────────────────────────────

  @Query(() => [Notification])
  async notifications(
    @Args('filters', { nullable: true }) filters?: NotificationFiltersInput,
  ): Promise<Notification[]> {
    const where: any = {};

    if (filters) {
      if (filters.userId) where.userId = filters.userId;
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.type) where.type = filters.type;
      if (filters.priority) where.priority = filters.priority;
      if (typeof filters.read === 'boolean') where.read = filters.read;
      if (filters.unreadOnly) where.read = false;
    }

    return this.notifRepo.find({
      where,
      relations: ['user', 'center'],
      order: { createdAt: 'DESC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });
  }

  @Query(() => Notification, { nullable: true })
  async notification(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Notification | null> {
    return this.notifRepo.findOne({
      where: { id },
      relations: ['user', 'center'],
    });
  }

  @Query(() => NotificationStatistics)
  async notificationStats(
    @Args('userId', { nullable: true, type: () => ID }) userId?: string,
    @Args('centerId', { nullable: true, type: () => ID }) centerId?: string,
  ): Promise<NotificationStatistics> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (centerId) where.centerId = centerId;

    const total = await this.notifRepo.count({ where });
    const unread = await this.notifRepo.count({
      where: { ...where, read: false },
    });

    const byType = async (t: NotificationType) =>
      this.notifRepo.count({ where: { ...where, type: t } });

    return {
      total,
      unread,
      booking: await byType(NotificationType.BOOKING),
      payment: await byType(NotificationType.PAYMENT),
      deposit: await byType(NotificationType.DEPOSIT),
      lead: await byType(NotificationType.LEAD),
      request: await byType(NotificationType.REQUEST),
      event: await byType(NotificationType.EVENT),
      system: await byType(NotificationType.SYSTEM),
    };
  }

  @Query(() => [Notification])
  async myNotifications(
    @Context() context: any,
    @Args('unreadOnly', { nullable: true, type: () => Boolean }) unreadOnly?: boolean,
    @Args('limit', { nullable: true, type: () => Int }) limit?: number,
  ): Promise<Notification[]> {
    const user = context.req?.user;
    const where: any = { userId: user?.id };
    if (unreadOnly) where.read = false;

    return this.notifRepo.find({
      where,
      relations: ['user', 'center'],
      order: { createdAt: 'DESC' },
      take: limit ?? 50,
    });
  }

  // ────────────────────────────────────────────────────────
  // Mutations
  // ────────────────────────────────────────────────────────

  @Mutation(() => Notification)
  async createNotification(
    @Args('input') input: CreateNotificationInput,
  ): Promise<Notification> {
    const metadata = this.parseMetadata(input.metadata);

    const notif = this.notifRepo.create({
      userId: input.userId ?? null,
      centerId: input.centerId ?? null,
      title: input.title,
      message: input.message,
      type: input.type ?? NotificationType.SYSTEM,
      priority: input.priority ?? NotificationPriority.MEDIUM,
      actionUrl: input.actionUrl ?? null,
      metadata,
    });

    const saved = await this.notifRepo.save(notif);
    await this.cache.invalidatePattern('notifications:*');

    return this.notifRepo.findOne({
      where: { id: saved.id },
      relations: ['user', 'center'],
    }) as Promise<Notification>;
  }

  /**
   * Broadcast a notification to one or many recipients (used by the
   * "Send Notification" dialog). Returns the number created.
   */
  @Mutation(() => Int)
  async sendNotification(
    @Args('input') input: SendNotificationInput,
  ): Promise<number> {
    const metadata = this.parseMetadata(input.metadata);
    const base = {
      title: input.title,
      message: input.message,
      type: input.type ?? NotificationType.SYSTEM,
      priority: input.priority ?? NotificationPriority.MEDIUM,
      metadata,
    };

    // Resolve recipient set: explicit ids win; else center broadcast;
    // else nothing to send (return 0 so the caller can react honestly).
    let recipientIds: (string | null)[] = [];
    if (input.recipientIds && input.recipientIds.length > 0) {
      recipientIds = input.recipientIds;
    } else if (input.centerId) {
      recipientIds = [null]; // center-scoped broadcast (userId null)
    }

    if (recipientIds.length === 0 && !input.centerId) {
      return 0;
    }

    const rows = recipientIds.map((uid) =>
      this.notifRepo.create({
        ...base,
        userId: uid ?? null,
        centerId: input.centerId ?? null,
      }),
    );

    await this.notifRepo.save(rows);
    await this.cache.invalidatePattern('notifications:*');
    return rows.length;
  }

  @Mutation(() => Notification)
  async markNotificationRead(
    @Args('id', { type: () => ID }) id: string,
    @Args('read', { nullable: true, type: () => Boolean }) read?: boolean,
  ): Promise<Notification> {
    await this.notifRepo.update(id, { read: read ?? true });

    const updated = await this.notifRepo.findOne({
      where: { id },
      relations: ['user', 'center'],
    });

    await this.cache.invalidatePattern('notifications:*');
    return updated!;
  }

  @Mutation(() => Int)
  async markAllNotificationsRead(
    @Args('userId', { nullable: true, type: () => ID }) userId?: string,
    @Args('centerId', { nullable: true, type: () => ID }) centerId?: string,
  ): Promise<number> {
    const where: any = { read: false };
    if (userId) where.userId = userId;
    if (centerId) where.centerId = centerId;

    const result = await this.notifRepo.update(where, { read: true });
    await this.cache.invalidatePattern('notifications:*');
    return result.affected ?? 0;
  }

  @Mutation(() => Boolean)
  async deleteNotification(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.notifRepo.delete(id);
    await this.cache.invalidatePattern('notifications:*');
    return true;
  }

  // ────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────

  private parseMetadata(raw?: string): Record<string, any> | null {
    if (!raw) return null;
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : (raw as any);
    } catch {
      return { value: raw };
    }
  }
}
