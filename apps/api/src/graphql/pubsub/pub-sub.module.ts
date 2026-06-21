/**
 * File:        apps/api/src/graphql/pubsub/pub-sub.module.ts
 * Module:      API · GraphQL · PubSub
 * Purpose:     DI wrapper around PubSubService.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Module, Global } from '@nestjs/common';
import { PubSubService } from './pubsub.service';

@Global()
@Module({
  providers: [PubSubService],
  exports: [PubSubService],
})
export class PubSubModule {}
