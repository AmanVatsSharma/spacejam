/**
 * File:        apps/api/src/graphql/inputs/notification.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     Input types for Notification mutations and filters
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-11
 */

import { ObjectType, Field, InputType, Int, Boolean } from '@nestjs/graphql';
import { NotificationType, NotificationPriority } from '../types/user.type';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  IsArray,
} from 'class-validator';

@InputType()
export class CreateNotificationInput {
  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  userId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  message!: string;

  @Field(() => NotificationType, { nullable: true })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @Field(() => NotificationPriority, { nullable: true })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metadata?: string;
}

/**
 * Used by the "Send Notification" dialog when broadcasting to multiple
 * recipients (e.g. selective customers, a whole center, or everyone).
 */
@InputType()
export class SendNotificationInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sendTo?: string;

  @Field(() => [ID], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recipientIds?: string[];

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  message!: string;

  @Field(() => NotificationType, { nullable: true })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @Field(() => NotificationPriority, { nullable: true })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  template?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metadata?: string;
}

@InputType()
export class NotificationFiltersInput {
  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  userId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field(() => NotificationType, { nullable: true })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @Field(() => NotificationPriority, { nullable: true })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  read?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  offset?: number;
}

@ObjectType()
export class NotificationStatistics {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  unread!: number;

  @Field(() => Int)
  booking!: number;

  @Field(() => Int)
  payment!: number;

  @Field(() => Int)
  deposit!: number;

  @Field(() => Int)
  lead!: number;

  @Field(() => Int)
  request!: number;

  @Field(() => Int)
  event!: number;

  @Field(() => Int)
  system!: number;
}
