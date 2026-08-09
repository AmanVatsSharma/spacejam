/**
 * File:        apps/api/src/integrations/payment.resolver.ts
 * Module:      API · Integrations · Payment
 * Purpose:     Authenticated payment mutations wrapping RazorpayService so
 *              the mobile/web client can create a Razorpay order and verify
 *              a payment signature. Any authenticated user may pay; the
 *              super-admin configures the keys separately (Integrations page).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { Field, Float, ObjectType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { RazorpayService } from './razorpay.service';
import { IntegrationSettingsService } from './integration-settings.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@ObjectType()
class RazorpayOrderGql {
  @Field() id!: string;
  @Field() entity!: string;
  @Field(() => Float) amount!: number;
  @Field() currency!: string;
  @Field() status!: string;
  @Field() receipt!: string;
}

@ObjectType()
class PaymentConfigGql {
  @Field() configured!: boolean;
  @Field(() => String, { nullable: true }) keyId?: string | null;
  @Field(() => String, { nullable: true }) mode?: string | null;
}

@Resolver()
export class PaymentResolver {
  constructor(
    private readonly razorpay: RazorpayService,
    private readonly settings: IntegrationSettingsService,
  ) {}

  /** Public-ish config the client uses to initialise the Razorpay checkout SDK. */
  @Query(() => PaymentConfigGql, { description: 'Razorpay publishable config (key id + mode) for the checkout SDK. Key secret never exposed.' })
  @UseGuards(GqlAuthGuard)
  async paymentConfig(): Promise<PaymentConfigGql> {
    const cfg = await this.settings.getRazorpayConfig();
    return {
      configured: !!cfg.keyId && !!cfg.keySecret,
      keyId: cfg.keyId || null,
      mode: cfg.mode || null,
    };
  }

  @Mutation(() => RazorpayOrderGql, { description: 'Create a Razorpay order for the given amount (rupees). Returns the order id the client passes to the checkout SDK.' })
  @UseGuards(GqlAuthGuard)
  async createPaymentOrder(
    @Args('amount', { type: () => Float }) amount: number,
    @Args('receipt') receipt: string,
  ): Promise<RazorpayOrderGql> {
    const order = await this.razorpay.createOrder(amount, receipt);
    return order as RazorpayOrderGql;
  }

  @Mutation(() => Boolean, { description: 'Verify a Razorpay payment signature after checkout. Returns true if valid.' })
  @UseGuards(GqlAuthGuard)
  async verifyPayment(
    @Args('orderId') orderId: string,
    @Args('paymentId') paymentId: string,
    @Args('signature') signature: string,
  ): Promise<boolean> {
    return this.razorpay.verifyPayment(orderId, paymentId, signature);
  }
}
