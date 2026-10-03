/**
 * File:        apps/api/src/graphql/types/onboarding-submit.type.ts
 * Module:      API · GraphQL · Types
 * Purpose:     Result payloads for the onboarding mutations. `outcome` tells the
 *              client which screen to show (onboarded / pay online / cold lead
 *              awaiting a cheque / retry payment); `razorpay` carries everything
 *              the checkout SDK needs for an open order, so the browser never
 *              invents an amount or an order id.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { OnboardingOutcome } from '../enums/onboarding-payment.enums';
import { Onboarding } from '../../typeorm/entities/onboarding.entity';
import { Lead } from '../../typeorm/entities/lead.entity';
import { Customer } from '../../typeorm/entities/customer.entity';

@ObjectType()
export class RazorpayCheckoutGql {
  @Field(() => ID, { description: 'Razorpay order id (order_xxx) to pass to Checkout.' })
  orderId!: string;

  /** Publishable key id (rzp_test_… / rzp_live_…). The secret never leaves the server. */
  @Field()
  keyId!: string;

  @Field(() => Int, { description: 'Amount in paise, fixed by the server.' })
  amountPaise!: number;

  @Field()
  currency!: string;

  @Field()
  description!: string;

  @Field(() => String, { nullable: true })
  prefillName?: string | null;

  @Field(() => String, { nullable: true })
  prefillEmail?: string | null;

  @Field(() => String, { nullable: true })
  prefillContact?: string | null;
}

@ObjectType()
export class OnboardingSeatSummaryGql {
  @Field(() => Int)
  requested!: number;

  @Field(() => Int)
  booked!: number;

  @Field(() => Int, { description: 'Seats that could not be reserved because inventory ran out.' })
  shortfall!: number;
}

@ObjectType()
export class SubmitOnboardingResult {
  @Field(() => OnboardingOutcome)
  outcome!: OnboardingOutcome;

  /** Human-readable summary of what happened (safe to show in a toast). */
  @Field()
  message!: string;

  @Field(() => Onboarding)
  onboarding!: Onboarding;

  /** The lead, when the onboarding came from / created one (always set for cheque → COLD). */
  @Field(() => Lead, { nullable: true })
  lead?: Lead | null;

  /** Only set once the client has actually been provisioned (payment confirmed). */
  @Field(() => Customer, { nullable: true })
  customer?: Customer | null;

  /** Present while an online payment is open. */
  @Field(() => RazorpayCheckoutGql, { nullable: true })
  razorpay?: RazorpayCheckoutGql | null;

  @Field(() => OnboardingSeatSummaryGql, { nullable: true })
  seats?: OnboardingSeatSummaryGql | null;
}
