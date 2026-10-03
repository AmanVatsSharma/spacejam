/**
 * File:        apps/api/src/crm/onboarding.service.ts
 * Module:      API · CRM · Onboarding
 * Purpose:     Server-orchestrated client onboarding. Replaces the browser-side
 *              saga (≈10 separate calls, payment last, errors swallowed) with
 *              ONE atomic, idempotent, audited operation where PAYMENT GATES
 *              CONVERSION:
 *
 *                RAZORPAY       application saved (PENDING) + a server-created
 *                               order bound to it. The client is provisioned only
 *                               after the payment is verified — by the browser
 *                               (confirmOnboardingPayment) or, if the tab was
 *                               closed, by the signed webhook.
 *                BANK_TRANSFER  staff record the UTR; the client is provisioned
 *                               immediately with a PAID invoice (method +
 *                               reference), and the UTR can be used only once.
 *                CHEQUE         the lead is saved as COLD and the full application
 *                               is parked on the onboarding. NO client, login,
 *                               seats or paid invoice exist until staff confirm
 *                               the cheque cleared (confirmChequeCleared). A
 *                               bounce (markChequeBounced) leaves it a cold lead.
 *                zero deposit   nothing to collect → provisioned immediately.
 *
 *              Provisioning (customer, login, deposit, invoice, contract, seats,
 *              documents, lead conversion, onboarding → COMPLETED) is one
 *              transaction under a row lock on the onboarding, and re-running it
 *              is a no-op — so a webhook racing the browser, or a retry, can
 *              never create a second client or invoice.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { DataSource, EntityManager, ILike, IsNull, Repository } from 'typeorm';
import {
  ContractStatus,
  CustomerStatus,
  DepositStatus,
  DepositType,
  InvoiceStatus,
  LeadSource,
  LeadStatus,
  OnboardingStatus,
  PaymentMethod,
  UserRole,
} from '@enums';
import { CacheService } from '../cache/cache.service';
import { AuditService } from '../auth/services/audit.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { centerScope } from '../auth/helpers/center-scope.helper';
import { IntegrationSettingsService } from '../integrations/integration-settings.service';
import {
  PaymentOrdersService,
  SettleContext,
} from '../integrations/payment-orders.service';
import { Onboarding } from '../typeorm/entities/onboarding.entity';
import { Lead } from '../typeorm/entities/lead.entity';
import { Customer } from '../typeorm/entities/customer.entity';
import { Deposit } from '../typeorm/entities/deposit.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { Contract } from '../typeorm/entities/contract.entity';
import { CustomerDocument } from '../typeorm/entities/customer-document.entity';
import { PaymentOrder } from '../typeorm/entities/payment-order.entity';
import { Center } from '../typeorm/entities/center.entity';
import {
  OnboardingOutcome,
  OnboardingPaymentMethod,
  OnboardingPaymentStatus,
  PaymentOrderPurpose,
  PaymentOrderStatus,
} from '../graphql/enums/onboarding-payment.enums';
import type {
  OnboardingPaymentInput,
  SubmitOnboardingInput,
} from '../graphql/inputs/onboarding-submit.input';
import type {
  RazorpayCheckoutGql,
  SubmitOnboardingResult,
} from '../graphql/types/onboarding-submit.type';
import { allocateSeats, SeatAllocationOutcome } from '../booking/seat-allocation';
import { provisionLoginUser } from './provision-login-user';
import {
  appendNote,
  CYCLE_MONTHS,
  CYCLE_TO_FREQUENCY,
  escapeLike,
  normalizeApplication,
  normalizePayment,
  NormalizedPayment,
  OnboardingApplication,
  parseIsoDate,
  round2,
  toIsoDate,
} from './onboarding-application';

const STAFF_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.CENTER_MANAGER];

/** Thrown when money arrives for an onboarding staff already cancelled. */
export class OnboardingCancelledError extends ConflictException {
  constructor(onboardingId: string) {
    super(`Onboarding ${onboardingId} was cancelled.`);
  }
}

interface PaidFacts {
  invoiceMethod: PaymentMethod;
  /** UTR / cheque number / Razorpay payment id. */
  reference: string | null;
  paidAt: Date;
  verifiedById: string | null;
  source: 'bank-transfer' | 'cheque' | 'checkout' | 'webhook' | 'no-payment';
}

interface ProvisionResult {
  onboarding: Onboarding;
  customerId: string;
  seats: SeatAllocationOutcome | null;
  alreadyProvisioned: boolean;
  createdUser: boolean;
}

const METHOD_LABEL: Record<OnboardingPaymentMethod, string> = {
  [OnboardingPaymentMethod.RAZORPAY]: 'online',
  [OnboardingPaymentMethod.BANK_TRANSFER]: 'bank transfer',
  [OnboardingPaymentMethod.CHEQUE]: 'cheque',
};

const isUniqueViolation = (err: unknown): boolean =>
  (err as { code?: string; driverError?: { code?: string } })?.code === '23505' ||
  (err as { driverError?: { code?: string } })?.driverError?.code === '23505';

const ymd = (d: Date): string => toIsoDate(d).replace(/-/g, '');

function addMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setUTCMonth(x.getUTCMonth() + months);
  return x;
}

@Injectable()
export class OnboardingService implements OnModuleInit {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly cache: CacheService,
    private readonly paymentOrders: PaymentOrdersService,
    private readonly settings: IntegrationSettingsService,
    private readonly audit: AuditService,
  ) {}

  /** Let the payment ledger finish onboardings when their Razorpay order settles. */
  onModuleInit(): void {
    this.paymentOrders.registerFinalizer(PaymentOrderPurpose.ONBOARDING, (order, ctx) =>
      this.finalizeOnlinePayment(order, ctx),
    );
  }

  // ── repositories ──────────────────────────────────────────────────────────
  private onboardings(): Repository<Onboarding> {
    return this.dataSource.getRepository(Onboarding);
  }
  private leads(): Repository<Lead> {
    return this.dataSource.getRepository(Lead);
  }
  private customers(): Repository<Customer> {
    return this.dataSource.getRepository(Customer);
  }
  private invoices(): Repository<Invoice> {
    return this.dataSource.getRepository(Invoice);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════

  /** The whole wizard in one call. Safe to retry with the same idempotencyKey. */
  async submit(input: SubmitOnboardingInput, caller: JwtPayload): Promise<SubmitOnboardingResult> {
    this.assertStaff(caller);
    const centerId = this.resolveCenter(input.centerId, caller);

    // A retried/double-clicked submit returns what the first one produced.
    const replay = await this.onboardings().findOne({ where: { idempotencyKey: input.idempotencyKey } });
    if (replay) {
      this.assertCenterAccess(caller, replay.centerId);
      return this.describe(replay);
    }

    const now = new Date();
    const app = normalizeApplication(input, now);
    const payment = normalizePayment(input.payment, app.finance.depositAmount, now);

    await this.assertCenterExists(centerId);
    const lead = await this.loadLeadForSubmit(input.leadId, centerId);
    await this.assertNoDuplicateClient(app.contact.email, centerId, lead);
    if (payment?.method === OnboardingPaymentMethod.CHEQUE) await this.assertChequeUnused(payment.cheque!);
    if (payment?.method === OnboardingPaymentMethod.BANK_TRANSFER) await this.assertUtrUnused(payment.bankTransfer!.utr);
    if (payment?.method === OnboardingPaymentMethod.RAZORPAY) await this.assertRazorpayReady();

    try {
      // Bank transfer / nothing-to-collect: insert + provision in ONE transaction,
      // so there is never a half-created application to clean up.
      if (!payment || payment.method === OnboardingPaymentMethod.BANK_TRANSFER) {
        const facts = this.factsForImmediate(payment, now, caller.sub);
        const provisioned = await this.dataSource.transaction(async (m) => {
          const { onboarding } = await this.insertApplication(m, { input, app, payment, centerId, lead, caller });
          return this.provisionInTx(m, onboarding.id, facts);
        });
        await this.afterProvision(provisioned, caller.sub, 'ONBOARDING_SUBMIT', {
          method: payment?.method ?? 'NONE',
          amount: app.finance.depositAmount,
        });
        return this.describe(provisioned.onboarding, { seats: provisioned.seats });
      }

      // Cheque / Razorpay: park the application; money has not been confirmed yet.
      const { onboarding } = await this.dataSource.transaction((m) =>
        this.insertApplication(m, { input, app, payment, centerId, lead, caller }),
      );
      await this.audit.record({
        action: 'ONBOARDING_SUBMIT',
        userId: caller.sub,
        entityType: 'onboarding',
        entityId: onboarding.id,
        centerId,
        changes: { method: payment.method, amount: app.finance.depositAmount },
      });
      await this.invalidateCaches(centerId, false);

      if (payment.method === OnboardingPaymentMethod.CHEQUE) {
        return this.describe(onboarding);
      }
      return this.startOnlinePayment(onboarding, caller);
    } catch (err) {
      // Two simultaneous submits with the same key: the loser re-reads the winner.
      if (isUniqueViolation(err)) {
        const winner = await this.onboardings().findOne({ where: { idempotencyKey: input.idempotencyKey } });
        if (winner) return this.describe(winner);
      }
      throw err;
    }
  }

  /** The browser finished Razorpay Checkout: verify, settle, and provision. */
  async confirmOnlinePayment(
    params: { onboardingId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
    caller: JwtPayload,
  ): Promise<SubmitOnboardingResult> {
    this.assertStaff(caller);
    const row = await this.loadOrFail(params.onboardingId);
    this.assertCenterAccess(caller, row.centerId);
    if (row.customerId && row.status === OnboardingStatus.COMPLETED) return this.describe(row);

    // Verifies the signature, checks the order is THIS onboarding's, confirms the
    // payment with Razorpay, settles the ledger, and runs our registered
    // finalizer — which provisions the client.
    await this.paymentOrders.confirmCheckout({
      providerOrderId: params.razorpayOrderId,
      providerPaymentId: params.razorpayPaymentId,
      signature: params.razorpaySignature,
      bindTo: { onboardingId: row.id },
      actorId: caller.sub,
    });

    const fresh = await this.loadOrFail(row.id);
    if (!(fresh.customerId && fresh.status === OnboardingStatus.COMPLETED)) {
      // Money is settled in the ledger but provisioning didn't finish. Retrying
      // this call (or the webhook) completes it — surface that clearly.
      throw new ConflictException(
        'Your payment was received but onboarding could not be completed yet. Please retry in a moment — you have not been charged twice.',
      );
    }
    return this.describe(fresh);
  }

  /**
   * (Re)take payment on a pending application — after a failed/abandoned online
   * payment, a bounced cheque, or when the client wants to pay another way.
   */
  async collectPayment(
    onboardingId: string,
    paymentInput: OnboardingPaymentInput,
    caller: JwtPayload,
  ): Promise<SubmitOnboardingResult> {
    this.assertStaff(caller);
    const row = await this.loadOrFail(onboardingId);
    this.assertCenterAccess(caller, row.centerId);
    if (row.cancelledAt) throw new BadRequestException('This onboarding was cancelled.');
    if (row.customerId) throw new ConflictException('This client is already onboarded.');
    const app = this.applicationOf(row);

    const now = new Date();
    const amount = round2(Number(row.paymentAmount ?? 0));
    const payment = normalizePayment(paymentInput, amount, now);
    if (!payment) throw new BadRequestException('There is no amount to collect on this onboarding.');

    if (payment.method === OnboardingPaymentMethod.CHEQUE) {
      await this.assertChequeUnused(payment.cheque!, row.id);
      await this.dataSource.transaction(async (m) => {
        const lead = await this.ensureColdLead(m, row.leadId ? await m.findOne(Lead, { where: { id: row.leadId } }) : null, app, row.centerId!, caller, payment.cheque!.chequeNumber);
        await m.update(Onboarding, { id: row.id }, {
          leadId: lead.id,
          paymentMethod: OnboardingPaymentMethod.CHEQUE,
          paymentStatus: OnboardingPaymentStatus.AWAITING_CLEARANCE,
          paymentReference: payment.cheque!.chequeNumber,
          chequeNumber: payment.cheque!.chequeNumber,
          chequeBank: payment.cheque!.bankName,
          chequeDate: payment.cheque!.chequeDate,
          chequeClearedAt: null,
          transferDate: null,
          payerBank: null,
          failureReason: null,
        });
      });
      await this.invalidateCaches(row.centerId, false);
      return this.describe(await this.loadOrFail(row.id));
    }

    if (payment.method === OnboardingPaymentMethod.BANK_TRANSFER) {
      await this.assertUtrUnused(payment.bankTransfer!.utr);
      const facts = this.factsForImmediate(payment, now, caller.sub);
      const provisioned = await this.dataSource.transaction(async (m) => {
        await m.update(Onboarding, { id: row.id }, {
          paymentMethod: OnboardingPaymentMethod.BANK_TRANSFER,
          paymentReference: payment.bankTransfer!.utr,
          transferDate: payment.bankTransfer!.transferDate,
          payerBank: payment.bankTransfer!.payerBankName ?? null,
          chequeNumber: null,
          chequeBank: null,
          chequeDate: null,
          chequeClearedAt: null,
        });
        return this.provisionInTx(m, row.id, facts);
      });
      await this.afterProvision(provisioned, caller.sub, 'ONBOARDING_PAYMENT_CONFIRMED', {
        method: 'BANK_TRANSFER',
        amount,
      });
      return this.describe(provisioned.onboarding, { seats: provisioned.seats });
    }

    // RAZORPAY
    await this.assertRazorpayReady();
    await this.onboardings().update(row.id, {
      paymentMethod: OnboardingPaymentMethod.RAZORPAY,
      paymentStatus: OnboardingPaymentStatus.PENDING,
      chequeNumber: null,
      chequeBank: null,
      chequeDate: null,
      failureReason: null,
    });
    return this.startOnlinePayment(await this.loadOrFail(row.id), caller);
  }

  /** Staff confirm the bank cleared the cheque → the client is provisioned now. */
  async confirmChequeCleared(
    onboardingId: string,
    params: { clearedOn?: string | null; remarks?: string | null },
    caller: JwtPayload,
  ): Promise<SubmitOnboardingResult> {
    this.assertStaff(caller);
    const row = await this.loadOrFail(onboardingId);
    this.assertCenterAccess(caller, row.centerId);
    if (row.customerId && row.status === OnboardingStatus.COMPLETED) return this.describe(row);
    if (row.cancelledAt) throw new BadRequestException('This onboarding was cancelled.');
    if (
      row.paymentMethod !== OnboardingPaymentMethod.CHEQUE ||
      row.paymentStatus !== OnboardingPaymentStatus.AWAITING_CLEARANCE
    ) {
      throw new BadRequestException('Only an onboarding that is awaiting cheque clearance can be confirmed.');
    }

    const now = new Date();
    let clearedAt = now;
    if (params.clearedOn) {
      const d = parseIsoDate(params.clearedOn) ?? this.invalid('Cleared-on date is not a valid date.');
      if (d.getTime() - now.getTime() > 24 * 60 * 60 * 1000) this.invalid('The clearance date cannot be in the future.');
      clearedAt = toIsoDate(d) === toIsoDate(now) ? now : d;
    }

    const facts: PaidFacts = {
      invoiceMethod: PaymentMethod.CHEQUE,
      reference: row.chequeNumber ?? row.paymentReference ?? null,
      paidAt: clearedAt,
      verifiedById: caller.sub,
      source: 'cheque',
    };
    const provisioned = await this.dataSource.transaction(async (m) => {
      await m.update(Onboarding, { id: row.id }, {
        chequeClearedAt: clearedAt,
        ...(params.remarks?.trim()
          ? { notes: appendNote(row.notes, `Cheque cleared: ${params.remarks.trim()}`, now) }
          : {}),
      });
      return this.provisionInTx(m, row.id, facts);
    });
    await this.afterProvision(provisioned, caller.sub, 'ONBOARDING_CHEQUE_CLEARED', {
      chequeNumber: row.chequeNumber,
      amount: row.paymentAmount,
    });
    return this.describe(provisioned.onboarding, { seats: provisioned.seats });
  }

  /** The cheque bounced: payment FAILED, the lead stays COLD, nothing is provisioned. */
  async markChequeBounced(onboardingId: string, reason: string, caller: JwtPayload): Promise<Onboarding> {
    this.assertStaff(caller);
    const row = await this.loadOrFail(onboardingId);
    this.assertCenterAccess(caller, row.centerId);
    if (
      row.paymentMethod !== OnboardingPaymentMethod.CHEQUE ||
      row.paymentStatus !== OnboardingPaymentStatus.AWAITING_CLEARANCE ||
      row.customerId
    ) {
      throw new BadRequestException('Only a cheque that is awaiting clearance can be marked as bounced.');
    }
    const why = reason?.trim();
    if (!why) throw new BadRequestException('Enter the reason the cheque bounced.');

    const now = new Date();
    await this.dataSource.transaction(async (m) => {
      await m.update(Onboarding, { id: row.id }, {
        paymentStatus: OnboardingPaymentStatus.FAILED,
        failureReason: `Cheque ${row.chequeNumber ?? ''} bounced: ${why}`.replace(/\s+/g, ' ').trim(),
      });
      if (row.leadId) {
        const lead = await m.findOne(Lead, { where: { id: row.leadId } });
        if (lead) {
          await m.update(Lead, { id: lead.id }, {
            status: LeadStatus.COLD,
            notes: appendNote(lead.notes, `Cheque ${row.chequeNumber ?? ''} bounced: ${why}`, now),
          });
        }
      }
    });
    await this.audit.record({
      action: 'ONBOARDING_CHEQUE_BOUNCED',
      userId: caller.sub,
      entityType: 'onboarding',
      entityId: row.id,
      centerId: row.centerId,
      changes: { chequeNumber: row.chequeNumber, reason: why },
    });
    await this.invalidateCaches(row.centerId, false);
    return this.loadOrFail(row.id, true);
  }

  /** Abandon a pending application. A provisioned client cannot be cancelled here. */
  async cancel(onboardingId: string, reason: string | undefined, caller: JwtPayload): Promise<Onboarding> {
    this.assertStaff(caller);
    const row = await this.loadOrFail(onboardingId);
    this.assertCenterAccess(caller, row.centerId);
    if (row.customerId) throw new ConflictException('This client is already onboarded and cannot be cancelled here.');
    if (row.cancelledAt) return this.loadOrFail(row.id, true);

    await this.onboardings().update(row.id, {
      cancelledAt: new Date(),
      failureReason: reason?.trim() || 'Cancelled by staff',
    });
    await this.audit.record({
      action: 'ONBOARDING_CANCELLED',
      userId: caller.sub,
      entityType: 'onboarding',
      entityId: row.id,
      centerId: row.centerId,
      changes: { reason: reason?.trim() ?? null, paymentStatus: row.paymentStatus },
    });
    await this.invalidateCaches(row.centerId, false);
    return this.loadOrFail(row.id, true);
  }

  /**
   * Guard for the manual lead → client conversion paths: a lead whose cheque is
   * still clearing must be converted by confirming the cheque, not by clicking
   * "convert". This is what keeps cheque clients cold leads until the money is real.
   */
  async assertLeadConvertible(leadId: string): Promise<void> {
    const pending = await this.onboardings().find({
      where: { leadId, paymentStatus: OnboardingPaymentStatus.AWAITING_CLEARANCE, cancelledAt: IsNull() },
    });
    if (pending.length > 0) {
      throw new ConflictException(
        `This lead has a cheque (${pending[0].chequeNumber ?? 'pending'}) awaiting clearance. It becomes a client when the cheque clears — confirm it from the Onboarding page.`,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Payment finalizer (registered with the ledger)
  // ══════════════════════════════════════════════════════════════════════════

  /** Runs when a Razorpay order for an onboarding settles (browser OR webhook). Idempotent. */
  private async finalizeOnlinePayment(order: PaymentOrder, ctx: SettleContext): Promise<void> {
    if (!order.onboardingId) return;
    const facts: PaidFacts = {
      invoiceMethod: PaymentMethod.ONLINE,
      reference: ctx.paymentId,
      paidAt: order.paidAt ?? new Date(),
      verifiedById: ctx.actorId ?? null,
      source: ctx.source,
    };
    let provisioned: ProvisionResult;
    try {
      provisioned = await this.dataSource.transaction((m) => this.provisionInTx(m, order.onboardingId!, facts));
    } catch (err) {
      if (err instanceof OnboardingCancelledError) {
        // Money arrived for an application staff had cancelled. Don't create a
        // client against their wishes — flag it loudly for a refund decision.
        this.logger.error(
          `Payment ${ctx.paymentId} settled for CANCELLED onboarding ${order.onboardingId}; not provisioning — needs a manual refund/review.`,
        );
        return;
      }
      throw err;
    }
    if (!provisioned.alreadyProvisioned) {
      await this.afterProvision(provisioned, ctx.actorId ?? null, 'ONBOARDING_PAYMENT_CONFIRMED', {
        method: 'RAZORPAY',
        source: ctx.source,
        paymentId: ctx.paymentId,
        amountPaise: order.amountPaise,
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Provisioning — the one place a client is created
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create everything a new client needs, atomically, under a lock on the
   * onboarding row. Calling it again for an already-provisioned onboarding is a
   * no-op (`alreadyProvisioned`), which is what makes webhook retries, double
   * submits and browser/webhook races safe.
   */
  private async provisionInTx(
    m: EntityManager,
    onboardingId: string,
    facts: PaidFacts,
  ): Promise<ProvisionResult> {
    const row = await m.findOne(Onboarding, {
      where: { id: onboardingId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!row) throw new NotFoundException('Onboarding not found.');
    if (row.customerId && row.status === OnboardingStatus.COMPLETED) {
      return { onboarding: row, customerId: row.customerId, seats: null, alreadyProvisioned: true, createdUser: false };
    }
    if (row.cancelledAt) throw new OnboardingCancelledError(row.id);

    const app = this.applicationOf(row);
    const centerId = row.centerId;
    if (!centerId) throw new BadRequestException('This onboarding has no center.');
    const amount = round2(Number(row.paymentAmount ?? app.finance.depositAmount ?? 0));
    const ref = `${ymd(facts.paidAt)}-${row.id.slice(0, 8).toUpperCase()}`;

    // 1) The client. Reuse one that already exists for this lead / email+center
    //    (a race or a re-run) rather than ever creating a duplicate.
    const lead = row.leadId
      ? await m.findOne(Lead, { where: { id: row.leadId }, lock: { mode: 'pessimistic_write' } })
      : null;
    let customer: Customer | null = lead?.customerId
      ? await m.findOne(Customer, { where: { id: lead.customerId } })
      : null;
    if (!customer) {
      customer = await m.findOne(Customer, {
        where: { email: ILike(escapeLike(app.contact.email)), centerId },
      });
    }

    let createdUser = false;
    if (customer) {
      this.logger.warn(`Onboarding ${row.id}: linking to existing client ${customer.id} instead of creating a duplicate.`);
    } else {
      let userId: string | null = null;
      if (app.provisionLogin) {
        const login = await provisionLoginUser(m, {
          email: app.contact.email,
          name: app.contact.name,
          phone: app.contact.phone,
          centerId,
        });
        userId = login.userId;
        createdUser = login.created;
      }
      const address = app.contact.companyAddress;
      customer = await m.save(
        m.create(Customer, {
          name: app.contact.name,
          email: app.contact.email,
          phone: app.contact.phone,
          company: app.contact.companyName,
          location: address,
          notes: app.notes,
          centerId,
          status: CustomerStatus.ACTIVE,
          joinDate: facts.paidAt,
          totalBookings: 0,
          totalSpent: 0,
          gstNumber: app.contact.gstNumber,
          // customers.companyAddress is varchar(100); the full text lives in `location`.
          companyAddress: address?.slice(0, 100),
          planType: app.plan.planType,
          employeeCount: app.members.length || undefined,
          alternateEmail: app.contact.alternateEmail,
          alternatePhone: app.contact.alternatePhone,
          dob: app.contact.dob ? (parseIsoDate(app.contact.dob) ?? undefined) : undefined,
          emergencyContactName: app.contact.emergencyContact,
          emergencyContactPhone: app.contact.emergencyPhone,
          communicationChannel: app.contact.communicationChannel,
          ...(app.services.autoRechargeEnabled !== undefined
            ? { autoRechargeEnabled: app.services.autoRechargeEnabled }
            : {}),
          ...(app.services.autoRechargeContact ? { autoRechargeContact: app.services.autoRechargeContact } : {}),
          ...(app.services.autoRechargeThreshold != null
            ? { autoRechargeThreshold: app.services.autoRechargeThreshold }
            : {}),
          userId,
          ...(app.finance.refundAccount
            ? {
                refundAccountHolder: app.finance.refundAccount.holderName,
                refundAccountNumber: app.finance.refundAccount.accountNumber,
                refundIfsc: app.finance.refundAccount.ifsc,
                refundBankName: app.finance.refundAccount.bankName,
              }
            : {}),
        } as any) as unknown as Customer,
      );
    }
    const customerId = customer.id;
    const customerName = app.contact.name;

    // 2) Money records — all attributed to the center (the old client-side saga
    //    never set centerId, so these were invisible to center managers).
    let depositId: string | null = null;
    let invoiceId: string | null = null;
    if (amount > 0) {
      const deposit = await m.save(
        m.create(Deposit, {
          customerId,
          customerName,
          centerId,
          amount,
          depositType: DepositType.SECURITY,
          status: DepositStatus.HELD,
          referenceNumber: `DEP-${ref}`,
          receivedDate: facts.paidAt,
          notes: `Security deposit collected at onboarding (${this.methodText(facts.invoiceMethod)}${facts.reference ? ` · ${facts.reference}` : ''})`,
        } as any) as unknown as Deposit,
      );
      depositId = deposit.id;

      const invoice = await m.save(
        m.create(Invoice, {
          invoiceNumber: `INV-${ref}`,
          customerId,
          customerName,
          customerEmail: app.contact.email,
          centerId,
          planName: app.plan.planType,
          amount,
          tax: 0,
          totalAmount: amount,
          status: InvoiceStatus.PAID,
          issueDate: facts.paidAt,
          dueDate: facts.paidAt,
          paidDate: facts.paidAt,
          paymentMethod: facts.invoiceMethod,
          paymentReference: facts.reference?.slice(0, 100),
          notes: 'Security deposit — collected at onboarding',
        } as any) as unknown as Invoice,
      );
      invoiceId = invoice.id;
    }

    // 3) Seats (row-locked; a shortfall is reported, not fatal).
    const start = parseIsoDate(app.plan.startDate) ?? facts.paidAt;
    const seats = await allocateSeats(m, {
      customerId,
      centerId,
      seatType: app.plan.seatType,
      months: CYCLE_MONTHS[app.plan.billingCycle],
      count: app.plan.seatCount,
      members: app.members,
      actorId: facts.verifiedById,
      startDate: start,
      noteSuffix: `(onboarding ${row.id.slice(0, 8)})`,
    });

    // 4) Contract: per-billing-cycle amount = agreed monthly rent (custom deal)
    //    or the booked seats' list prices; falls back to the deposit if neither
    //    is known (the legacy behaviour) so the row is never zero.
    const monthly = app.plan.monthlyRent ?? seats.monthlySeatTotal;
    const perCycle = Math.min(round2(monthly * CYCLE_MONTHS[app.plan.billingCycle]), 99_999_999.99);
    const contract = await m.save(
      m.create(Contract, {
        contractNumber: `CNT-${ref}`,
        customerId,
        customerName,
        centerId,
        planName: app.plan.planType,
        startDate: start,
        endDate: addMonths(start, app.plan.durationMonths),
        status: ContractStatus.ACTIVE,
        amount: perCycle > 0 ? perCycle : amount,
        paymentFrequency: CYCLE_TO_FREQUENCY[app.plan.billingCycle],
        autoRenew: false,
      } as any) as unknown as Contract,
    );

    // 5) Documents the staff uploaded before submitting.
    for (const doc of app.documents) {
      await m.save(
        m.create(CustomerDocument, {
          customerId,
          name: doc.name,
          documentType: doc.documentType,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          uploadedAt: facts.paidAt,
        } as any) as unknown as CustomerDocument,
      );
    }

    // 6) Close the loop: lead → CONVERTED, onboarding → COMPLETED. The refund
    //    account now lives on the customer, so drop it from the snapshot.
    if (lead) {
      await m.update(Lead, { id: lead.id }, { status: LeadStatus.CONVERTED, customerId });
    }
    const scrubbed = { ...app, finance: { ...app.finance, refundAccount: undefined } };
    await m.update(Onboarding, { id: row.id }, {
      customerId,
      status: OnboardingStatus.COMPLETED,
      completedAt: facts.paidAt,
      paymentStatus: amount > 0 ? OnboardingPaymentStatus.PAID : OnboardingPaymentStatus.NOT_REQUIRED,
      paymentReference: facts.reference?.slice(0, 100) ?? row.paymentReference ?? null,
      invoiceId,
      depositId,
      contractId: contract.id,
      verifiedById: amount > 0 ? facts.verifiedById : null,
      verifiedAt: amount > 0 ? new Date() : null,
      failureReason: null,
      // jsonb: TypeORM's update typing can't express a deep Record
      applicationData: scrubbed as any,
    });

    const updated = await m.findOne(Onboarding, { where: { id: row.id } });
    return { onboarding: updated!, customerId, seats, alreadyProvisioned: false, createdUser };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Internals
  // ══════════════════════════════════════════════════════════════════════════

  private invalid(message: string): never {
    throw new BadRequestException(message);
  }

  private methodText(m: PaymentMethod): string {
    return m === PaymentMethod.ONLINE ? 'online' : m === PaymentMethod.BANK_TRANSFER ? 'bank transfer' : m === PaymentMethod.CHEQUE ? 'cheque' : String(m).toLowerCase();
  }

  private applicationOf(row: Onboarding): OnboardingApplication {
    const app = row.applicationData as unknown as OnboardingApplication | null;
    if (!app || app.version !== 1) {
      throw new BadRequestException('This onboarding has no saved application to work from.');
    }
    return app;
  }

  private assertStaff(caller: JwtPayload): void {
    if (!caller || !STAFF_ROLES.includes(caller.role)) {
      throw new ForbiddenException('Only center staff can onboard clients.');
    }
  }

  /** A CENTER_MANAGER is pinned to their own center; others pick any. */
  private resolveCenter(requested: string, caller: JwtPayload): string {
    const scope = centerScope(caller);
    if (scope && requested !== scope) {
      throw new ForbiddenException('You can only onboard clients into your own center.');
    }
    return scope ?? requested;
  }

  private assertCenterAccess(caller: JwtPayload, recordCenterId?: string | null): void {
    const scope = centerScope(caller);
    if (scope && recordCenterId && recordCenterId !== scope) {
      throw new ForbiddenException('This onboarding belongs to a different center.');
    }
  }

  private async assertCenterExists(centerId: string): Promise<void> {
    const center = await this.dataSource.getRepository(Center).findOne({ where: { id: centerId } });
    if (!center) throw new NotFoundException('Center not found.');
  }

  private async loadOrFail(id: string, withRelations = false): Promise<Onboarding> {
    const row = await this.onboardings().findOne({
      where: { id },
      ...(withRelations ? { relations: ['lead', 'customer', 'assignedTo', 'center'] } : {}),
    });
    if (!row) throw new NotFoundException('Onboarding not found.');
    return row;
  }

  private async loadLeadForSubmit(leadId: string | undefined, centerId: string): Promise<Lead | null> {
    if (!leadId) return null;
    const lead = await this.leads().findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');
    if (lead.centerId && lead.centerId !== centerId) {
      throw new BadRequestException('That lead belongs to a different center than the one selected.');
    }
    if (lead.status === LeadStatus.CONVERTED && lead.customerId) {
      throw new ConflictException('This lead is already converted to a client.');
    }
    return lead;
  }

  /** No second client for the same email in a center, and no second open application. */
  private async assertNoDuplicateClient(email: string, centerId: string, lead: Lead | null): Promise<void> {
    const pattern = ILike(escapeLike(email));
    const existing = await this.customers().findOne({ where: { email: pattern, centerId } });
    if (existing && existing.id !== lead?.customerId) {
      throw new ConflictException(`A client with the email ${email} already exists in this center.`);
    }
    const open = await this.onboardings().find({
      where: { contactEmail: pattern, centerId, customerId: IsNull(), cancelledAt: IsNull() },
    });
    if (open.length > 0) {
      throw new ConflictException(
        `There is already a pending onboarding for ${email}. Resume it from the Onboarding page instead of starting a new one.`,
      );
    }
  }

  private async assertChequeUnused(
    cheque: NonNullable<NormalizedPayment['cheque']>,
    exceptOnboardingId?: string,
  ): Promise<void> {
    const same = await this.onboardings().find({ where: { chequeNumber: cheque.chequeNumber } });
    const clash = same.find(
      (o) =>
        o.id !== exceptOnboardingId &&
        !o.cancelledAt &&
        (o.paymentStatus === OnboardingPaymentStatus.AWAITING_CLEARANCE || o.paymentStatus === OnboardingPaymentStatus.PAID) &&
        (o.chequeBank ?? '').trim().toLowerCase() === cheque.bankName.trim().toLowerCase(),
    );
    if (clash) {
      throw new ConflictException(
        `Cheque ${cheque.chequeNumber} (${cheque.bankName}) is already registered against another onboarding.`,
      );
    }
  }

  private async assertUtrUnused(utr: string): Promise<void> {
    const [onboarding, invoice] = await Promise.all([
      this.onboardings().findOne({
        where: {
          paymentReference: utr,
          paymentMethod: OnboardingPaymentMethod.BANK_TRANSFER,
          paymentStatus: OnboardingPaymentStatus.PAID,
        },
      }),
      this.invoices().findOne({ where: { paymentReference: utr } }),
    ]);
    if (onboarding || invoice) {
      throw new ConflictException(`UTR ${utr} has already been used to record a payment.`);
    }
  }

  private async assertRazorpayReady(): Promise<void> {
    if (!(await this.settings.isRazorpayConfigured())) {
      throw new BadRequestException(
        'Online payment is not set up. A super admin can add the Razorpay keys under Settings → Integrations — or choose bank transfer / cheque.',
      );
    }
  }

  private factsForImmediate(
    payment: NormalizedPayment | null,
    now: Date,
    actorId: string,
  ): PaidFacts {
    if (!payment) {
      return { invoiceMethod: PaymentMethod.CASH, reference: null, paidAt: now, verifiedById: actorId, source: 'no-payment' };
    }
    const transferDay = parseIsoDate(payment.bankTransfer!.transferDate)!;
    return {
      invoiceMethod: PaymentMethod.BANK_TRANSFER,
      reference: payment.bankTransfer!.utr,
      // The money moved on the transfer date; "today" keeps the real timestamp.
      paidAt: toIsoDate(transferDay) === toIsoDate(now) ? now : transferDay,
      verifiedById: actorId,
      source: 'bank-transfer',
    };
  }

  /** Insert the application row (and, for a cheque, make the lead COLD) inside `m`. */
  private async insertApplication(
    m: EntityManager,
    p: {
      input: SubmitOnboardingInput;
      app: OnboardingApplication;
      payment: NormalizedPayment | null;
      centerId: string;
      lead: Lead | null;
      caller: JwtPayload;
    },
  ): Promise<{ onboarding: Onboarding; lead: Lead | null }> {
    const { input, app, payment, centerId, caller } = p;
    let lead = p.lead;
    if (payment?.method === OnboardingPaymentMethod.CHEQUE) {
      lead = await this.ensureColdLead(m, lead, app, centerId, caller, payment.cheque!.chequeNumber);
    }

    const row = m.create(Onboarding, {
      leadId: lead?.id ?? null,
      customerId: null,
      status: OnboardingStatus.PENDING,
      companyName: app.contact.companyName,
      companyAddress: app.contact.companyAddress,
      gstNumber: app.contact.gstNumber,
      planType: app.plan.planType,
      seatCount: app.plan.seatCount,
      contactName: app.contact.name,
      contactEmail: app.contact.email,
      contactPhone: app.contact.phone,
      emergencyContact: app.contact.emergencyContact,
      emergencyPhone: app.contact.emergencyPhone,
      notes: app.notes,
      assignedToId: lead?.assignedToId ?? caller.sub,
      centerId,
      submittedById: caller.sub,
      idempotencyKey: input.idempotencyKey,
      applicationData: app as unknown as Record<string, unknown>,
      paymentAmount: app.finance.depositAmount,
      paymentMethod: payment?.method ?? null,
      paymentStatus: !payment
        ? OnboardingPaymentStatus.NOT_REQUIRED
        : payment.method === OnboardingPaymentMethod.CHEQUE
          ? OnboardingPaymentStatus.AWAITING_CLEARANCE
          : OnboardingPaymentStatus.PENDING,
      ...(payment?.cheque
        ? {
            chequeNumber: payment.cheque.chequeNumber,
            chequeBank: payment.cheque.bankName,
            chequeDate: payment.cheque.chequeDate,
            paymentReference: payment.cheque.chequeNumber,
          }
        : {}),
      ...(payment?.bankTransfer
        ? {
            paymentReference: payment.bankTransfer.utr,
            transferDate: payment.bankTransfer.transferDate,
            payerBank: payment.bankTransfer.payerBankName,
          }
        : {}),
    } as any) as unknown as Onboarding;
    const saved = await m.save(row);
    return { onboarding: saved, lead };
  }

  /** Make (or create) the lead COLD — the state a cheque client holds until it clears. */
  private async ensureColdLead(
    m: EntityManager,
    lead: Lead | null,
    app: OnboardingApplication,
    centerId: string,
    caller: JwtPayload,
    chequeNumber: string,
  ): Promise<Lead> {
    const note = `Cheque ${chequeNumber} received — onboarding on hold until it clears.`;
    if (lead) {
      await m.update(Lead, { id: lead.id }, {
        status: LeadStatus.COLD,
        centerId: lead.centerId ?? centerId,
        notes: appendNote(lead.notes, note),
      });
      return (await m.findOne(Lead, { where: { id: lead.id } }))!;
    }
    return m.save(
      m.create(Lead, {
        name: app.contact.name,
        email: app.contact.email,
        phone: app.contact.phone,
        company: app.contact.companyName,
        status: LeadStatus.COLD,
        source: LeadSource.WALK_IN,
        notes: appendNote(null, note),
        centerId,
        assignedToId: caller.sub,
      } as any) as unknown as Lead,
    );
  }

  /** Create (or reuse) the Razorpay order for an onboarding and describe the result. */
  private async startOnlinePayment(row: Onboarding, caller: JwtPayload): Promise<SubmitOnboardingResult> {
    const amountPaise = Math.round((Number(row.paymentAmount ?? 0) + Number.EPSILON) * 100);
    try {
      const existing = (await this.paymentOrders.listForOnboarding(row.id)).find(
        (o) => o.status === PaymentOrderStatus.CREATED && o.amountPaise === amountPaise,
      );
      const order =
        existing ??
        (await this.paymentOrders.createOrder({
          purpose: PaymentOrderPurpose.ONBOARDING,
          amountPaise,
          receipt: `onb_${row.id.slice(0, 8)}_${Date.now().toString(36)}`,
          onboardingId: row.id,
          centerId: row.centerId,
          createdById: caller.sub,
        }));
      await this.onboardings().update(row.id, {
        paymentMethod: OnboardingPaymentMethod.RAZORPAY,
        paymentStatus: OnboardingPaymentStatus.PENDING,
        failureReason: null,
      });
      return this.describe(await this.loadOrFail(row.id), { order });
    } catch (err) {
      const message =
        err instanceof HttpException ? err.message : 'Online payment could not be started.';
      this.logger.error(`Starting online payment for onboarding ${row.id} failed: ${message}`);
      await this.onboardings().update(row.id, {
        paymentMethod: OnboardingPaymentMethod.RAZORPAY,
        paymentStatus: OnboardingPaymentStatus.FAILED,
        failureReason: message,
      });
      // The application is saved; report the failure as a resumable state.
      return this.describe(await this.loadOrFail(row.id));
    }
  }

  private async afterProvision(
    result: ProvisionResult,
    actorId: string | null,
    action: 'ONBOARDING_SUBMIT' | 'ONBOARDING_PAYMENT_CONFIRMED' | 'ONBOARDING_CHEQUE_CLEARED',
    detail: Record<string, unknown>,
  ): Promise<void> {
    if (result.alreadyProvisioned) return;
    await this.audit.record({
      action,
      userId: actorId,
      entityType: 'onboarding',
      entityId: result.onboarding.id,
      centerId: result.onboarding.centerId,
      changes: { ...detail, customerId: result.customerId, provisioned: true },
    });
    await this.invalidateCaches(result.onboarding.centerId, result.createdUser);
  }

  private async invalidateCaches(centerId?: string | null, userCreated = false): Promise<void> {
    await Promise.all([
      this.cache.invalidatePattern('leads:*'),
      this.cache.invalidatePattern('customers:*'),
      this.cache.invalidatePattern('onboardings:*'),
      this.cache.invalidatePattern('invoices:*'),
      this.cache.invalidatePattern('deposits:*'),
      this.cache.invalidatePattern('contracts:*'),
      ...(userCreated ? [this.cache.invalidatePattern('users:*')] : []),
      ...(centerId ? [this.cache.invalidatePattern(`center:${centerId}`)] : []),
    ]);
  }

  // ── result shaping ────────────────────────────────────────────────────────

  private outcomeFor(row: Onboarding): OnboardingOutcome {
    if (row.customerId && row.status === OnboardingStatus.COMPLETED) return OnboardingOutcome.ONBOARDED;
    switch (row.paymentStatus) {
      case OnboardingPaymentStatus.AWAITING_CLEARANCE:
        return OnboardingOutcome.AWAITING_CHEQUE_CLEARANCE;
      case OnboardingPaymentStatus.FAILED:
        return OnboardingOutcome.PAYMENT_FAILED;
      default:
        return OnboardingOutcome.PENDING_ONLINE_PAYMENT;
    }
  }

  private messageFor(row: Onboarding, outcome: OnboardingOutcome): string {
    const inr = (n?: number | null) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`;
    switch (outcome) {
      case OnboardingOutcome.ONBOARDED:
        return row.paymentStatus === OnboardingPaymentStatus.PAID
          ? `Client onboarded. ${inr(row.paymentAmount)} received${row.paymentMethod ? ` by ${METHOD_LABEL[row.paymentMethod]}` : ''}.`
          : 'Client onboarded.';
      case OnboardingOutcome.AWAITING_CHEQUE_CLEARANCE:
        return `Saved as a Cold lead. The client will be onboarded once cheque ${row.chequeNumber ?? ''} clears — confirm it from the Onboarding page.`.replace(/\s+/g, ' ');
      case OnboardingOutcome.PAYMENT_FAILED:
        return row.failureReason ?? 'The last payment attempt failed. Retry from the Onboarding page.';
      default:
        return 'Application saved. Waiting for the online payment to complete.';
    }
  }

  /** Build the API result for a row in whatever state it is now in. */
  private async describe(
    row: Onboarding,
    extra?: { seats?: SeatAllocationOutcome | null; order?: PaymentOrder },
  ): Promise<SubmitOnboardingResult> {
    const full = await this.onboardings().findOne({
      where: { id: row.id },
      relations: ['lead', 'customer', 'assignedTo', 'center'],
    });
    const onboarding = full ?? row;
    const outcome = this.outcomeFor(onboarding);

    let razorpay: RazorpayCheckoutGql | null = null;
    if (outcome === OnboardingOutcome.PENDING_ONLINE_PAYMENT) {
      const order =
        extra?.order ??
        (await this.paymentOrders.listForOnboarding(onboarding.id)).find(
          (o) => o.status === PaymentOrderStatus.CREATED,
        );
      if (order) razorpay = await this.checkoutFor(onboarding, order);
    }

    return {
      outcome,
      message: this.messageFor(onboarding, outcome),
      onboarding,
      lead: onboarding.lead ?? null,
      customer: onboarding.customer ?? null,
      razorpay,
      seats: extra?.seats
        ? { requested: extra.seats.requested, booked: extra.seats.booked, shortfall: extra.seats.shortfall }
        : null,
    };
  }

  private async checkoutFor(row: Onboarding, order: PaymentOrder): Promise<RazorpayCheckoutGql> {
    const cfg = await this.settings.getRazorpayConfig();
    return {
      orderId: order.providerOrderId,
      keyId: cfg.keyId,
      amountPaise: order.amountPaise,
      currency: order.currency,
      description: `Onboarding — ${row.companyName ?? row.contactName ?? 'new client'}`.slice(0, 250),
      prefillName: row.contactName ?? null,
      prefillEmail: row.contactEmail ?? null,
      prefillContact: row.contactPhone ?? null,
    };
  }
}
