/**
 * File:        apps/api/src/graphql/inputs/notification-preference.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     Notification preference input DTO (partial updates)
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateNotificationPreferencesInput {
  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  meetingReminders?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  billingAlerts?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  specialOffers?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  eventUpdates?: boolean;
}
