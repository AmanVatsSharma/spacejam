/**
 * File:        apps/api/src/integrations/payment.resolver.ts
 * Module:      API · Integrations · Payment
 * Purpose:     Authenticated payment operations for the dashboard.
 *
 *                paymentConfig        — what the checkout UI needs (Razorpay key
 *                                       id + mode, UPI QR, and — for staff only —
 *                                       the center's bank account + cheque payee).
 *                createPaymentOrder   — Razorpay order for an INVOICE. The amount
 *                                       is always the invoice's own total; a
 *                                       client-supplied amount is only logged
 *                                       when it disagrees.
 *                verifyPayment        — verifies the checkout signature, then
 *                                       settles through the payment_orders ledger
 *                                       so ONLY the invoice the order was created
 *                                       for can be marked paid (previously any
 *                                       valid signature + any invoiceId would).
 *
 *              Mutations are staff-only (SUPER_ADMIN, CENTER_MANAGER) and a
 *              CENTER_MANAGER can only touch their own center's invoices.
 *
 * Author:      ZCode (original) · Claude Sonnet 5.5 (ledger-bound rewrite)
 * Last-updated: 2026-10-02
 */
import { Resolver, Mutation, Args, Query, ID } from '@nestjs/graphql';
import { Field, Float, ObjectType, InputType } from '@nestjs/graphql';
import { ForbiddenException, Logger, NotFoundException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsOptional, IsString } from 'class-validator';

import { IntegrationSettingsService } from './integration-settings.service';
import { PaymentOrdersService, PaymentSignatureError } from './payment-orders.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { centerScope } from '../auth/helpers/center-scope.helper';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { UserRole } from '@enums';
import { PaymentOrderPurpose } from '../graphql/enums/onboarding-payment.enums';

const STAFF_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.CENTER_MANAGER];

@ObjectType()
class PaymentConfigGql {
  @Field() configured!: boolean;
  @Field(() => String, { nullable: true }) keyId?: string | null;
  @Field(() => String, { nullable: true }) mode?: string | null;
  @Field() qrConfigured!: boolean;
  @Field(() => String, { nullable: true }) qrUpiId?: string | null;
  @Field(() => String, { nullable: true }) qrImagePath?: string | null;
  @Field(() => String, { nullable: true }) qrPayeeName?: string | null;
  /** Receiving bank account — populated for staff only. */
  @Field() bankConfigured!: boolean;
  @Field(() => String, { nullable: true }) bankAccountName?: string | null;
  @Field(() => String, { nullable: true }) bankAccountNumber?: string | null;
  @Field(() => String, { nullable: true }) bankIfsc?: string | null;
  @Field(() => String, { nullable: true }) bankName?: string | null;
  @Field(() => String, { nullable: true }) bankBranch?: string | null;
  /** Cheque payee + instructions — populated for staff only. */
  @Field() chequeConfigured!: boolean;
  @Field(() => String, { nullable: true }) chequePayeeName?: string | null;
  @Field(() => String, { nullable: true }) chequeInstructions?: string | null;
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
  private readonly logger = new Logger(PaymentResolver.name);

  constructor(
    private readonly orders: PaymentOrdersService,
    private readonly settings: IntegrationSettingsService,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  /** Config the checkout UIs need. Bank/cheque details are staff-only. */
  @Query(() => PaymentConfigGql, {
    description:
      'Payment config for checkout UIs: Razorpay publishable key id + mode, UPI QR, and (staff only) the receiving bank account and cheque payee. The key secret is never exposed.',
  })
  @UseGuards(GqlAuthGuard)
  async paymentConfig(@CurrentUser() caller?: JwtPayload): Promise<PaymentConfigGql> {
    const [cfg, qr, bank, cheque] = await Promise.all([
      this.settings.getRazorpayConfig(),
      this.settings.getQrPaymentConfig(),
      this.settings.getBankAccountConfig(),
      this.settings.getChequeConfig(),
    ]);
    const isStaff = !!caller && STAFF_ROLES.includes(caller.role);
    return {
      configured: !!cfg.keyId && !!cfg.keySecret,
      keyId: cfg.keyId || null,
      mode: cfg.mode || null,
      qrConfigured: !!qr.upiId,
      qrUpiId: qr.upiId || null,
      qrImagePath: qr.imagePath || null,
      qrPayeeName: qr.payeeName || null,
      bankConfigured: isStaff && !!bank.accountName && !!bank.accountNumber && !!bank.ifsc,
      bankAccountName: isStaff ? bank.accountName || null : null,
      bankAccountNumber: isStaff ? bank.accountNumber || null : null,
      bankIfsc: isStaff ? bank.ifsc || null : null,
      bankName: isStaff ? bank.bankName || null : null,
      bankBranch: isStaff ? bank.branch || null : null,
      chequeConfigured: isStaff && !!cheque.payeeName,
      chequePayeeName: isStaff ? cheque.payeeName || null : null,
      chequeInstructions: isStaff ? cheque.instructions || null : null,
    };
  }

  @Mutation(() => String, {
    description:
      'Create a Razorpay order for an invoice and return the order id for the checkout SDK. The charged amount is ALWAYS the invoice total (the amount argument is ignored when it disagrees). Staff only.',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  async createPaymentOrder(
    @Args('amount', { type: () => Float }) amount: number,
    @Args('invoiceId', { type: () => ID, nullable: true }) invoiceId: string | undefined,
    @CurrentUser() caller: JwtPayload,
  ): Promise<string> {
    if (invoiceId) {
      const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice not found.');
      this.assertCenterAccess(caller, invoice.centerId);
      if (Math.abs(Number(invoice.totalAmount) - amount) > 0.005) {
        this.logger.warn(
          `createPaymentOrder: client amount ${amount} ≠ invoice ${invoice.id} total ${invoice.totalAmount}; charging the invoice total.`,
        );
      }
      const order = await this.orders.createInvoiceOrder(invoice, caller.sub);
      return order.providerOrderId;
    }

    // Amount-only order: recorded in the ledger but bound to nothing, so
    // settling it can never mark any invoice or onboarding paid.
    const order = await this.orders.createOrder({
      purpose: PaymentOrderPurpose.GENERAL,
      amountPaise: Math.round((amount + Number.EPSILON) * 100),
      receipt: `gen_${Date.now()}`,
      centerId: centerScope(caller) ?? null,
      createdById: caller.sub,
    });
    return order.providerOrderId;
  }

  @Mutation(() => Boolean, {
    description:
      'Verify a Razorpay checkout result. Returns false when the signature is invalid. On success only the invoice the order was created for is marked PAID (ONLINE). Staff only.',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  async verifyPayment(
    @Args('input') input: VerifyPaymentInput,
    @CurrentUser() caller: JwtPayload,
  ): Promise<boolean> {
    const order = await this.orders.findByProviderOrderId(input.razorpayOrderId);
    if (!order) throw new NotFoundException('Unknown payment order.');
    this.assertCenterAccess(caller, order.centerId);

    try {
      await this.orders.confirmCheckout({
        providerOrderId: input.razorpayOrderId,
        providerPaymentId: input.razorpayPaymentId,
        signature: input.razorpaySignature,
        bindTo: input.invoiceId ? { invoiceId: input.invoiceId } : undefined,
        actorId: caller.sub,
      });
      return true;
    } catch (err) {
      if (err instanceof PaymentSignatureError) return false;
      throw err;
    }
  }

  /** A CENTER_MANAGER may only act on their own center's records. */
  private assertCenterAccess(caller: JwtPayload, recordCenterId?: string | null): void {
    const scope = centerScope(caller);
    if (scope && recordCenterId && recordCenterId !== scope) {
      throw new ForbiddenException('This record belongs to a different center.');
    }
  }
}
