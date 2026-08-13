/**
 * File:        apps/api/src/graphql/types/calendar-item.type.ts
 * Module:      API · GraphQL Types
 * Purpose:     CalendarItem object type + CalendarItemKind enum, kept in a
 *              dedicated types file (not inline in the resolver) to avoid
 *              module-eval-order issues under webpack bundling.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-13
 */
import { ObjectType, Field, ID } from '@nestjs/graphql';

export enum CalendarItemKind {
  EVENT = 'EVENT',
  BOOKING = 'BOOKING',
  VISIT = 'VISIT',
  BIRTHDAY = 'BIRTHDAY',
}

@ObjectType('CalendarItem')
export class CalendarItem {
  @Field()
  id!: string;

  /** EVENT | BOOKING | VISIT | BIRTHDAY */
  @Field()
  kind!: string;

  @Field()
  title!: string;

  @Field()
  date!: string;

  @Field({ nullable: true })
  startTime?: string;

  @Field({ nullable: true })
  endTime?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  color?: string;

  @Field(() => ID, { nullable: true })
  referenceId?: string;

  @Field(() => String, { nullable: true })
  meta?: string;
}
