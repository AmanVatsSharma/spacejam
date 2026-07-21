/**
 * File:        apps/api/src/graphql/inputs/scheduled-report.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     ScheduledReport inputs.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Field, InputType, ID, Int } from '@nestjs/graphql';
import { ReportType, ReportFrequency } from '../../typeorm/entities/scheduled-report.entity';

@InputType()
export class CreateScheduledReportInput {
  @Field(() => ID) userId!: string;
  @Field(() => ID) centerId!: string;
  @Field(() => ReportType) reportType!: ReportType;
  @Field(() => ReportFrequency) frequency!: ReportFrequency;
  @Field(() => Int, { nullable: true }) dayOfPeriod?: number;
  @Field(() => [String]) recipients!: string[];
  @Field({ nullable: true }) filters?: string;
}

@InputType()
export class UpdateScheduledReportInput {
  @Field(() => ReportType, { nullable: true }) reportType?: ReportType;
  @Field(() => ReportFrequency, { nullable: true }) frequency?: ReportFrequency;
  @Field(() => Int, { nullable: true }) dayOfPeriod?: number;
  @Field(() => [String], { nullable: true }) recipients?: string[];
  @Field({ nullable: true }) filters?: string;
  @Field({ nullable: true }) enabled?: boolean;
}
