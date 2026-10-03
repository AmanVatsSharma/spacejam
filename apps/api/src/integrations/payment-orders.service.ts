/**
 * File:        apps/api/src/integrations/payment-orders.service.ts
 * Module:      API · Integrations · Payment Orders
 * Purpose:     Gateway payment ledger + settlement.
 *
 *              Every Razorpay order the platform creates is recorded here,
 *              bound to the record it pays for (onboarding / invoice) and to
 *              the amount the SERVER computed. Checkout verification and the
 *              webhook both settle through `settle()`, which:
 *                1. checks the payment really belongs to the order (id, amount,
 *                   currency, status) — capturing it if the merchant account is
 *                   on manual capture;
 *                2. flips the ledger row CREATED → PAID with one guarded UPDATE
 *                   (`WHERE status <> 'PAID'`), so a replay or a browser/webhook
 *                   race cannot settle twice;
 *                3. ALWAYS runs the purpose's finalizer afterwards. Finalizers
 *                   are idempotent, so if the process died between 2 and 3 the
 *                   next webhook retry heals the half-finished state.
 *
 *              Finalizers are registered by purpose. INVOICE lives here; the
 *              CRM module registers ONBOARDING — the dependency points one way
 *              (CRM → Integrations), so there is no module cycle.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceStatus, PaymentMethod } from '@enums';
import { PaymentOrder } from '../typeorm/entities/payment-order.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import {
  PaymentOrderPurpose,
  PaymentOrderStatus,
} from '../graphql/enums/onboarding-payment.enums';
import { IntegrationSettingsService } from './integration-settings.service';
import { RazorpayService, RazorpayPayment } from './razorpay.service';

export interface SettleContext {
  paymentId: string;
  actorId?: string | null;
  source: 'checkout' | 'webhook';
}

export interface SettleResult {
  order: PaymentOrder;
  /** True when the ledger row was already PAID before this call (a replay). */
  alreadySettled: boolean;
}

/** Idempotent hook run after an order is settled. Must tolerate being called repeatedly. */
export type PaymentFinalizer = (order: PaymentOrder, ctx: SettleContext) => Promise<void>;

/** Thrown when the checkout signature does not verify. */
export class PaymentSignatureError extends BadRequestException {
  constructor() {
    super('Payment signature is invalid.');
  }
}

@Injectable()
export class PaymentOrdersService {
  private readonly logger = new Logger(PaymentOrdersService.name);
  private readonly finalizers = new Map<PaymentOrderPurpose, PaymentFinalizer>();

  constructor(
    @InjectRepository(PaymentOrder)
    private readonly orders: Repository<PaymentOrder>,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    private readonly razorpay: RazorpayService,
    private readonly settings: IntegrationSettingsService,
  ) {
    this.finalizers.set(PaymentOrderPurpose.INVOICE, (order, ctx) => this.finalizeInvoice(order, ctx));
  }

  /** Called by the module that owns a purpose (e.g. CRM → ONBOARDING) on init. */
  registerFinalizer(purpose: PaymentOrderPurpose, fn: PaymentFinalizer): void {
    this.finalizers.set(purpose, fn);
  }

  // ── order creation ──────────────────────────────────────────────────────

  /** Create the Razorpay order and record it in the ledger. */
  async createOrder(params: {
    purpose: PaymentOrderPurpose;
    amountPaise: number;
    receipt: string;
    onboardingId?: string | null;
    invoiceId?: string | null;
    centerId?: string | null;
    createdById?: string | null;
  }): Promise<PaymentOrder> {
    const notes: Record<string, string> = { purpose: params.purpose };
    if (params.onboardingId) notes.onboardingId = params.onboardingId;
    if (params.invoiceId) notes.invoiceId = params.invoiceId;

    const rzp = await this.razorpay.createOrderPaise({
      amountPaise: params.amountPaise,
      receipt: params.receipt,
      notes,
    });

    return this.orders.save(
      this.orders.create({
        provider: 'RAZORPAY',
        providerOrderId: rzp.id,
        amountPaise: rzp.amount,
        currency: rzp.currency,
        status: PaymentOrderStatus.CREATED,
        purpose: params.purpose,
        onboardingId: params.onboardingId ?? null,
        invoiceId: params.invoiceId ?? null,
        centerId: params.centerId ?? null,
        receipt: rzp.receipt ?? params.receipt,
        createdById: params.createdById ?? null,
      }),
    );
  }

  /** Order for an invoice: the amount is the INVOICE's total, never a client value. */
  async createInvoiceOrder(invoice: Invoice, createdById?: string | null): Promise<PaymentOrder> {
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('This invoice is already paid.');
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('This invoice was cancelled.');
    }
    const amountPaise = Math.round((Number(invoice.totalAmount) + Number.EPSILON) * 100);
    return this.createOrder({
      purpose: PaymentOrderPurpose.INVOICE,
      amountPaise,
      receipt: `inv_${invoice.invoiceNumber}`.slice(0, 40),
      invoiceId: invoice.id,
      centerId: invoice.centerId ?? null,
      createdById,
    });
  }

  findByProviderOrderId(providerOrderId: string): Promise<PaymentOrder | null> {
    return this.orders.findOne({ where: { providerOrderId } });
  }

  /** Latest ledger rows for an onboarding (newest first). */
  listForOnboarding(onboardingId: string): Promise<PaymentOrder[]> {
    return this.orders.find({ where: { onboardingId }, order: { createdAt: 'DESC' } });
  }

  // ── settlement ──────────────────────────────────────────────────────────

  /**
   * Settle from the browser's checkout result. Verifies the HMAC signature with
   * the configured key secret and (optionally) that the order belongs to the
   * record the caller claims, then confirms the payment with Razorpay.
   */
  async confirmCheckout(params: {
    providerOrderId: string;
    providerPaymentId: string;
    signature: string;
    /** When given, the order must be bound to exactly this record. */
    bindTo?: { onboardingId?: string; invoiceId?: string };
    actorId?: string | null;
  }): Promise<SettleResult> {
    const order = await this.findByProviderOrderId(params.providerOrderId);
    if (!order) throw new NotFoundException('Unknown payment order.');

    if (params.bindTo?.onboardingId && order.onboardingId !== params.bindTo.onboardingId) {
      throw new ForbiddenException('This payment belongs to a different onboarding.');
    }
    if (params.bindTo?.invoiceId && order.invoiceId !== params.bindTo.invoiceId) {
      throw new ForbiddenException('This payment belongs to a different invoice.');
    }

    const cfg = await this.settings.getRazorpayConfig();
    if (!cfg.keySecret) {
      throw new BadRequestException('Razorpay is not configured.');
    }
    if (
      !this.razorpay.verifySignature(
        order.providerOrderId,
        params.providerPaymentId,
        params.signature,
        cfg.keySecret,
      )
    ) {
      this.logger.warn(`Razorpay signature mismatch for order ${order.providerOrderId}.`);
      throw new PaymentSignatureError();
    }

    const payment = await this.razorpay.fetchPayment(params.providerPaymentId);
    return this.settle(order, payment, {
      paymentId: payment.id,
      actorId: params.actorId ?? null,
      source: 'checkout',
    });
  }

  /**
   * Settle from a (signature-verified) webhook payment entity. Returns null when
   * the order isn't ours — e.g. another system sharing the same Razorpay account.
   */
  async settleFromWebhook(payment: RazorpayPayment): Promise<SettleResult | null> {
    if (!payment?.order_id) return null;
    const order = await this.findByProviderOrderId(payment.order_id);
    if (!order) {
      this.logger.warn(`Webhook payment ${payment.id} references unknown order ${payment.order_id}; ignoring.`);
      return null;
    }
    return this.settle(order, payment, { paymentId: payment.id, source: 'webhook' });
  }

  /** Record a failed attempt (the order stays open — the customer may retry). */
  async recordFailure(payment: RazorpayPayment): Promise<void> {
    if (!payment?.order_id) return;
    const order = await this.findByProviderOrderId(payment.order_id);
    if (!order || order.status === PaymentOrderStatus.PAID) return;
    await this.orders.update(order.id, {
      failureReason: (payment.error_description ?? 'Payment failed').slice(0, 500),
    });
  }

  private async settle(
    order: PaymentOrder,
    payment: RazorpayPayment,
    ctx: SettleContext,
  ): Promise<SettleResult> {
    if (payment.order_id !== order.providerOrderId) {
      throw new BadRequestException('This payment does not belong to the order.');
    }
    if (payment.amount !== order.amountPaise || payment.currency !== order.currency) {
      this.logger.error(
        `Amount mismatch on ${order.providerOrderId}: order ${order.amountPaise} ${order.currency} vs payment ${payment.amount} ${payment.currency}.`,
      );
      throw new BadRequestException('The paid amount does not match the order.');
    }

    let effective = payment;
    if (payment.status === 'authorized') {
      // Re-read the payment first: on auto-capture accounts it flips to
      // `captured` within moments, and capturing twice would be rejected.
      const latest = await this.razorpay.fetchPayment(payment.id);
      effective =
        latest.status === 'authorized'
          // Manual-capture account: take the money now, or it auto-refunds.
          ? await this.razorpay.capturePayment(payment.id, order.amountPaise, order.currency)
          : latest;
    }
    if (effective.status !== 'captured') {
      throw new BadRequestException(`The payment is not complete yet (status: ${effective.status}).`);
    }

    // Single guarded transition — the only place an order becomes PAID.
    const res = await this.orders
      .createQueryBuilder()
      .update(PaymentOrder)
      .set({
        status: PaymentOrderStatus.PAID,
        providerPaymentId: effective.id,
        paidAt: new Date(),
        signatureVerifiedAt: ctx.source === 'checkout' ? new Date() : null,
        failureReason: null,
      })
      .where('"id" = :id AND "status" <> :paid', { id: order.id, paid: PaymentOrderStatus.PAID })
      .execute();
    const firstSettlement = (res.affected ?? 0) > 0;

    const fresh = await this.orders.findOne({ where: { id: order.id } });
    if (!fresh) throw new NotFoundException('Payment order disappeared.');

    if (!firstSettlement && fresh.providerPaymentId && fresh.providerPaymentId !== effective.id) {
      // A second, different payment hit an already-settled order: money was
      // taken twice. Do NOT re-finalize; surface it for a manual refund.
      this.logger.error(
        `Order ${fresh.providerOrderId} already settled by ${fresh.providerPaymentId}; extra payment ${effective.id} needs a manual refund.`,
      );
      return { order: fresh, alreadySettled: true };
    }

    // Always run the finalizer: it is idempotent, and re-running it is what
    // heals a crash between the ledger update above and the finalize below.
    await this.runFinalizer(fresh, { ...ctx, paymentId: effective.id });
    return { order: fresh, alreadySettled: !firstSettlement };
  }

  private async runFinalizer(order: PaymentOrder, ctx: SettleContext): Promise<void> {
    if (order.purpose === PaymentOrderPurpose.GENERAL) return;
    const fn = this.finalizers.get(order.purpose);
    if (!fn) {
      throw new Error(`No finalizer registered for payment purpose ${order.purpose}`);
    }
    await fn(order, ctx);
  }

  // ── INVOICE finalizer ───────────────────────────────────────────────────

  private async finalizeInvoice(order: PaymentOrder, ctx: SettleContext): Promise<void> {
    if (!order.invoiceId) return;
    const invoice = await this.invoices.findOne({ where: { id: order.invoiceId } });
    if (!invoice) {
      this.logger.warn(`Settled order ${order.providerOrderId}: invoice ${order.invoiceId} not found.`);
      return;
    }
    if (invoice.status === InvoiceStatus.PAID) return;
    const invoicePaise = Math.round((Number(invoice.totalAmount) + Number.EPSILON) * 100);
    if (invoicePaise !== order.amountPaise) {
      // The invoice was edited after the order was created. The money is real
      // but doesn't match — leave the invoice open for manual reconciliation.
      this.logger.error(
        `Invoice ${invoice.id} total (${invoicePaise} paise) no longer matches settled order ${order.providerOrderId} (${order.amountPaise}); not auto-marking paid.`,
      );
      return;
    }
    await this.invoices.update(invoice.id, {
      status: InvoiceStatus.PAID,
      paidDate: new Date(),
      paymentMethod: PaymentMethod.ONLINE,
      paymentReference: ctx.paymentId.slice(0, 100),
    });
    this.logger.log(`Invoice ${invoice.id} marked PAID via ${ctx.source} (${ctx.paymentId}).`);
  }
}
