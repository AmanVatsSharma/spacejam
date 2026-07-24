/**
 * File:        apps/api/src/graphql/inputs/notification-automation.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     NotificationAutomation inputs (create/update).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-24
 */
import { Field, InputType, ID, Int } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  Min,
} from 'class-validator';
import {
  AutomationTrigger,
  AutomationChannel,
} from '../../typeorm/entities/notification-automation.entity';

@InputType()
export class CreateNotificationAutomationInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  centerId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => AutomationTrigger)
  @IsEnum(AutomationTrigger)
  triggerEvent!: AutomationTrigger;

  @Field(() => AutomationChannel)
  @IsEnum(AutomationChannel)
  channel!: AutomationChannel;

  @Field()
  @IsString()
  @IsNotEmpty()
  template!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  variables?: string;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  delayMinutes?: number;

  @Field({ defaultValue: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

@InputType()
export class UpdateNotificationAutomationInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field(() => AutomationTrigger, { nullable: true })
  @IsEnum(AutomationTrigger)
  @IsOptional()
  triggerEvent?: AutomationTrigger;

  @Field(() => AutomationChannel, { nullable: true })
  @IsEnum(AutomationChannel)
  @IsOptional()
  channel?: AutomationChannel;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  template?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  variables?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  delayMinutes?: number;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
