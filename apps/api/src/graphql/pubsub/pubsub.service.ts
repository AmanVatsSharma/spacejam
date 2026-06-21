/**
 * File:        apps/api/src/graphql/pubsub/pubsub.service.ts
 * Module:      API · GraphQL · PubSub
 * Purpose:     Single shared in-process PubSub used by every resolver
 *              that needs to publish / subscribe to domain events.
 *
 *              Wraps `graphql-subscriptions` PubSub so it can be DI'd
 *              and (in production) swapped for a Redis-backed
 *              implementation without rewriting call sites.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

@Injectable()
export class PubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PubSubService.name);
  private pubsub: PubSub;

  onModuleInit() {
    this.pubsub = new PubSub();
    this.logger.log('PubSub backend: in-process (replace with graphql-redis-subscriptions for multi-instance)');
  }

  async onModuleDestroy() {
    if (this.pubsub) {
      await this.pubsub.close();
    }
  }

  async publish<T = unknown>(trigger: string, payload: T): Promise<void> {
    await this.pubsub.publish(trigger, payload as any);
  }

  asyncIterator<T = unknown>(triggers: string | string[]) {
    return this.pubsub.asyncIterator<T>(triggers);
  }
}
