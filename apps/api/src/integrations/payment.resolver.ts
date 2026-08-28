/**
 * File:        apps/api/src/integrations/payment.resolver.ts
 * Module:      API · Integrations · Payment
 * Purpose:     Authenticated payment mutations wrapping RazorpayService so
 *              the mobile/web client can create a Razorpay order and verify
 *              a payment signature. When an invoiceId is supplied it is
 *              attached to the order notes and a successful verification
 *              marks that invoice PAID (paymentMethod ONLINE).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-27
 */
import { Resolver, Mutation, Args, Query, ID } from '@nestjs/graphql';
import { Field, Float, ObjectType, InputType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsOptional, IsString } from 'class-validator';

import { RazorpayService } from './razorpay.service';
import { IntegrationSettingsService } from './integration-settings.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { InvoiceStatus, PaymentMethod } from '../graphql/types/user.type';

@ObjectType()
class PaymentConfigGql {
  @Field() configured!: boolean;
  @Field(() => String, { nullable: true }) keyId?: string | null;
  @Field(() => String, { nullable: true }) mode?: string | null;
  @Field() qrConfigured!: boolean;
  @Field(() => String, { nullable: true }) qrUpiId?: string | null;
  @Field(() => String, { nullable: true }) qrImagePath?: string | null;
  @Field(() => String, { nullable: true }) qrPayeeName?: string | null;
}

@InputType()
class VerifyPaymentInput {
  @Field()
  @IsString()
  razorpayOrderId!: string;

  @Field()
  @IsString()
  razorpayPaymentId!: string;

  @Field()
  @IsString()
  razorpaySignature!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  invoiceId?: string;
}

@Resolver()
export class PaymentResolver {
  constructor(
    private readonly razorpay: RazorpayService,
    private readonly settings: IntegrationSettingsService,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  /** Public-ish config the client uses to initialise the Razorpay checkout SDK. */
  @Query(() => PaymentConfigGql, { description: 'Razorpay publishable config (key id + mode) for the checkout SDK. Key secret never exposed.' })
  @UseGuards(GqlAuthGuard)
  async paymentConfig(): Promise<PaymentConfigGql> {
    const cfg = await this.settings.getRazorpayConfig();
    const qr = await this.settings.getQrPaymentConfig();
    return {
      configured: !!cfg.keyId && !!cfg.keySecret,
      keyId: cfg.keyId || null,
      mode: cfg.mode || null,
      qrConfigured: !!qr.upiId,
      qrUpiId: qr.upiId || null,
      qrImagePath: qr.imagePath || null,
      qrPayeeName: qr.payeeName || null,
    };
  }

  @Mutation(() => String, { description: 'Create a Razorpay order for the given amount (rupees). Returns the order id the client passes to the checkout SDK. Optional invoiceId is embedded in the order notes so the webhook can reconcile the payment.' })
  @UseGuards(GqlAuthGuard)
  async createPaymentOrder(
    @Args('amount', { type: () => Float }) amount: number,
    @Args('invoiceId', { type: () => ID, nullable: true }) invoiceId?: string,
  ): Promise<string> {
    const order = await this.razorpay.createOrder(
      amount,
      `rcpt_${Date.now()}`,
      invoiceId ? { invoiceId } : undefined,
    );
    return order.id;
  }

  @Mutation(() => Boolean, { description: 'Verify a Razorpay payment signature after checkout. Returns true if valid; marks the referenced invoice PAID (ONLINE) when an invoiceId is supplied.' })
  @UseGuards(GqlAuthGuard)
  async verifyPayment(@Args('input') input: VerifyPaymentInput): Promise<boolean> {
    const ok = await this.razorpay.verifyPayment(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
    );
    if (!ok) return false;

    if (input.invoiceId) {
      // Idempotent: skip when the invoice is already PAID so a replayed
      // verification doesn't move paidDate.
      const invoice = await this.invoiceRepo.findOne({ where: { id: input.invoiceId } });
      if (invoice && invoice.status !== InvoiceStatus.PAID) {
        await this.invoiceRepo.update(input.invoiceId, {
          status: InvoiceStatus.PAID,
          paidDate: new Date(),
          paymentMethod: PaymentMethod.ONLINE,
        });
      }
    }
    return true;
  }
}
