/**
 * File:        apps/api/src/crm/onboarding.service.spec.ts
 * Module:      API · CRM · Onboarding · Tests
 * Purpose:     Behavioural tests for OnboardingService against an in-memory
 *              database with real transaction rollback. They assert what ends
 *              up PERSISTED for each payment path:
 *
 *                CHEQUE        → cold lead + parked application; NO client, login,
 *                                seats, deposit, contract or paid invoice until the
 *                                cheque is confirmed cleared (a bounce changes none
 *                                of that).
 *                BANK_TRANSFER → client provisioned at once with a PAID invoice
 *                                carrying the UTR; the UTR can be used only once.
 *                RAZORPAY      → application + server-side order only; the client
 *                                appears when the payment settles (browser or
 *                                webhook), exactly once.
 *
 *              plus atomic rollback, idempotent replays, duplicate guards, and
 *              role / center authorization.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ContractStatus,
  CustomerStatus,
  DepositStatus,
  InvoiceStatus,
  LeadSource,
  LeadStatus,
  OnboardingStatus,
  PaymentMethod,
  SeatStatus,
  UserRole,
} from '@enums';

// bcrypt at 12 rounds would make every login-provisioning test take ~250 ms.
vi.mock('bcryptjs', () => ({
  hash: vi.fn(async () => 'hashed'),
  default: { hash: vi.fn(async () => 'hashed') },
}));

import { OnboardingService } from './onboarding.service';
import { FakeDb } from '../testing/fake-datasource';
import {
  OnboardingOutcome,
  OnboardingPaymentMethod,
  OnboardingPaymentStatus,
  PaymentOrderPurpose,
  PaymentOrderStatus,
} from '../graphql/enums/onboarding-payment.enums';
import { Onboarding } from '../typeorm/entities/onboarding.entity';
import { Lead } from '../typeorm/entities/lead.entity';
import { Customer } from '../typeorm/entities/customer.entity';
import { Deposit } from '../typeorm/entities/deposit.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { Contract } from '../typeorm/entities/contract.entity';
import { CustomerDocument } from '../typeorm/entities/customer-document.entity';
import { CustomerEmployee } from '../typeorm/entities/customer-employee.entity';
import { Center } from '../typeorm/entities/center.entity';
import { User } from '../typeorm/entities/user.entity';
import { Seat } from '../typeorm/entities/seat.entity';
import { Booking } from '../typeorm/entities/booking.entity';

// ── fixtures ────────────────────────────────────────────────────────────────
const NOW = new Date('2026-10-02T09:30:00.000Z');
const CENTER_A = '11111111-1111-1111-1111-111111111111';
const CENTER_B = '22222222-2222-2222-2222-222222222222';

const caller = (role: UserRole, centerId: string | null = null, sub = `user-${role}`): any => ({
  sub,
  email: `${sub}@spacejam.test`,
  role,
  centerId,
  sid: 'sid',
  typ: 'access',
});
const SUPER = caller(UserRole.SUPER_ADMIN);
const MANAGER_A = caller(UserRole.CENTER_MANAGER, CENTER_A, 'mgr-a');
const MANAGER_B = caller(UserRole.CENTER_MANAGER, CENTER_B, 'mgr-b');
const MEMBER = caller(UserRole.MEMBER, CENTER_A, 'member-1');

let keySeq = 0;
const baseInput = (over: Record<string, unknown> = {}): any => ({
  idempotencyKey: `idem-${++keySeq}-abcdefgh`,
  centerId: CENTER_A,
  contactName: 'Asha Rao',
  contactEmail: 'asha@acme.test',
  contactPhone: '+91 98765 43210',
  companyName: 'Acme Pvt Ltd',
  planType: 'Hot Desk',
  billingCycle: 'Monthly',
  depositAmount: 50000,
  members: [
    { name: 'Asha Rao', email: 'asha@acme.test', seatName: 'A-1' },
    { name: 'Ravi Kumar', email: 'ravi@acme.test' },
  ],
  documents: [{ name: 'PAN Card', documentType: 'id_proof', fileUrl: '/uploads/pan.png', fileSize: '1024' }],
  ...over,
});

const CHEQUE = (over: Record<string, unknown> = {}): any => ({
  method: OnboardingPaymentMethod.CHEQUE,
  cheque: { chequeNumber: '123456', bankName: 'HDFC Bank', chequeDate: '2026-10-01', ...over },
});
const TRANSFER = (over: Record<string, unknown> = {}): any => ({
  method: OnboardingPaymentMethod.BANK_TRANSFER,
  bankTransfer: { utr: 'HDFCR5202610021234', transferDate: '2026-10-02', payerBankName: 'HDFC Bank', ...over },
});
const RAZORPAY: any = { method: OnboardingPaymentMethod.RAZORPAY };

// ── harness ─────────────────────────────────────────────────────────────────
function build(opts: { razorpayConfigured?: boolean } = {}) {
  const db = new FakeDb()
    .relation('lead', Lead, 'leadId')
    .relation('customer', Customer, 'customerId')
    .relation('assignedTo', User, 'assignedToId')
    .relation('center', Center, 'centerId')
    .unique({ entity: Onboarding, columns: ['idempotencyKey'] })
    .unique({ entity: User, columns: ['email'] })
    .onInsert(Onboarding, (r) => {
      r.status ??= OnboardingStatus.PENDING;
      r.paymentStatus ??= OnboardingPaymentStatus.NOT_REQUIRED;
    })
    .onInsert(Lead, (r) => {
      r.status ??= LeadStatus.NEW;
    })
    .onInsert(Customer, (r) => {
      r.status ??= CustomerStatus.ACTIVE;
    });

  db.seed(Center, [
    { id: CENTER_A, name: 'Hyderabad' },
    { id: CENTER_B, name: 'Pune' },
  ]);
  db.seed(
    Seat,
    ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'].map((name) => ({
      name,
      centerId: CENTER_A,
      seatType: 'HOT_DESK',
      status: SeatStatus.AVAILABLE,
      active: true,
      price: 8000,
    })),
  );

  const cache = { invalidatePattern: vi.fn(async () => {}), del: vi.fn(async () => {}) };
  const audit = { record: vi.fn(async () => {}) };
  const settings = {
    isRazorpayConfigured: vi.fn(async () => opts.razorpayConfigured ?? true),
    getRazorpayConfig: vi.fn(async () => ({
      keyId: 'rzp_test_AbCdEf123456',
      keySecret: 'secret-secret-secret-1234',
      webhookSecret: 'whsec_12345678',
      mode: 'test',
    })),
  };

  // Minimal PaymentOrdersService double that remembers the orders it created and
  // hands the registered finalizer back to the test (to play "webhook" / "verify").
  const orders: any[] = [];
  let finalizer: ((order: any, ctx: any) => Promise<void>) | undefined;
  const paymentOrders: any = {
    registerFinalizer: vi.fn((purpose: PaymentOrderPurpose, fn: any) => {
      if (purpose === PaymentOrderPurpose.ONBOARDING) finalizer = fn;
    }),
    createOrder: vi.fn(async (p: any) => {
      const order = {
        id: `po-${orders.length + 1}`,
        providerOrderId: `order_TEST${orders.length + 1}`,
        amountPaise: p.amountPaise,
        currency: 'INR',
        status: PaymentOrderStatus.CREATED,
        purpose: p.purpose,
        onboardingId: p.onboardingId,
        centerId: p.centerId,
        paidAt: null,
      };
      orders.push(order);
      return order;
    }),
    listForOnboarding: vi.fn(async (id: string) => orders.filter((o) => o.onboardingId === id)),
    confirmCheckout: vi.fn(),
  };

  const service = new OnboardingService(db as any, cache as any, paymentOrders, settings as any, audit as any);
  service.onModuleInit();
  return {
    db,
    service,
    cache,
    audit,
    settings,
    paymentOrders,
    orders,
    finalize: (order: any, ctx: any = { paymentId: 'pay_TEST1', source: 'webhook', actorId: null }) =>
      finalizer!({ ...order, paidAt: NOW }, ctx),
  };
}

/** Nothing a client would own exists yet. */
function expectNothingProvisioned(db: FakeDb) {
  expect(db.count(Customer)).toBe(0);
  expect(db.count(User)).toBe(0);
  expect(db.count(Deposit)).toBe(0);
  expect(db.count(Invoice)).toBe(0);
  expect(db.count(Contract)).toBe(0);
  expect(db.count(Booking)).toBe(0);
  expect(db.count(CustomerEmployee)).toBe(0);
  expect(db.count(CustomerDocument)).toBe(0);
  expect(db.all<any>(Seat).every((s) => s.status === SeatStatus.AVAILABLE)).toBe(true);
}

describe('OnboardingService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('CHEQUE → cold lead, not a client', () => {
    it('saves a walk-in as a COLD lead and parks the application — no client, login, seats, deposit, contract or paid invoice', async () => {
      const { service, db } = build();
      const res = await service.submit(baseInput({ payment: CHEQUE() }), SUPER);

      expect(res.outcome).toBe(OnboardingOutcome.AWAITING_CHEQUE_CLEARANCE);
      expect(res.customer).toBeNull();
      expectNothingProvisioned(db);

      const lead = db.all<any>(Lead)[0];
      expect(lead.status).toBe(LeadStatus.COLD);
      expect(lead.customerId).toBeFalsy();
      expect(lead.source).toBe(LeadSource.WALK_IN);
      expect(lead.centerId).toBe(CENTER_A);
      expect(lead.email).toBe('asha@acme.test');

      const ob = db.all<any>(Onboarding)[0];
      expect(ob.status).toBe(OnboardingStatus.PENDING);
      expect(ob.paymentStatus).toBe(OnboardingPaymentStatus.AWAITING_CLEARANCE);
      expect(ob.paymentMethod).toBe(OnboardingPaymentMethod.CHEQUE);
      expect(ob.chequeNumber).toBe('123456');
      expect(ob.chequeBank).toBe('HDFC Bank');
      expect(ob.paymentAmount).toBe(50000);
      expect(ob.leadId).toBe(lead.id);
      expect(ob.customerId).toBeNull();
      // The whole application is kept so nobody has to re-type it later.
      expect(ob.applicationData.contact.email).toBe('asha@acme.test');
      expect(ob.applicationData.members).toHaveLength(2);
      expect(ob.applicationData.documents).toHaveLength(1);
    });

    it('flips an EXISTING lead to COLD instead of converting it, and notes the cheque on it', async () => {
      const { service, db } = build();
      db.seed(Lead, [
        { id: 'lead-1', name: 'Asha Rao', email: 'asha@acme.test', status: LeadStatus.NEGOTIATION, centerId: CENTER_A, assignedToId: 'u1', notes: 'Wants 2 desks' },
      ]);
      const res = await service.submit(baseInput({ leadId: 'lead-1', payment: CHEQUE() }), MANAGER_A);

      expect(res.outcome).toBe(OnboardingOutcome.AWAITING_CHEQUE_CLEARANCE);
      const lead = db.byId<any>(Lead, 'lead-1')!;
      expect(lead.status).toBe(LeadStatus.COLD);
      expect(lead.customerId).toBeFalsy();
      expect(lead.notes).toContain('Wants 2 desks');
      expect(lead.notes).toContain('Cheque 123456 received');
      expect(db.count(Lead)).toBe(1); // no duplicate lead created
      expectNothingProvisioned(db);
    });

    it('rejects a stale cheque and persists nothing', async () => {
      const { service, db } = build();
      await expect(service.submit(baseInput({ payment: CHEQUE({ chequeDate: '2026-05-01' }) }), SUPER)).rejects.toThrow(/stale/);
      expect(db.count(Onboarding)).toBe(0);
      expect(db.count(Lead)).toBe(0);
    });

    it('rejects a cheque number+bank already registered on another onboarding', async () => {
      const { service, db } = build();
      await service.submit(baseInput({ payment: CHEQUE() }), SUPER);
      await expect(
        service.submit(baseInput({ contactEmail: 'other@acme.test', payment: CHEQUE({ bankName: 'hdfc bank' }) }), SUPER),
      ).rejects.toThrow(ConflictException);
      expect(db.count(Onboarding)).toBe(1);
    });

    it('requires the cheque details', async () => {
      const { service } = build();
      await expect(
        service.submit(baseInput({ payment: { method: OnboardingPaymentMethod.CHEQUE } }), SUPER),
      ).rejects.toThrow(/cheque number/i);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('confirmChequeCleared → the client is created now', () => {
    async function withPendingCheque() {
      const h = build();
      const submitted = await h.service.submit(baseInput({ payment: CHEQUE() }), MANAGER_A);
      return { ...h, onboardingId: submitted.onboarding.id };
    }

    it('provisions the full client: login, deposit, PAID invoice (method CHEQUE + cheque no.), contract, seats, documents — and converts the lead', async () => {
      const { service, db, onboardingId } = await withPendingCheque();
      const res = await service.confirmChequeCleared(onboardingId, { remarks: 'Credited by HDFC' }, MANAGER_A);

      expect(res.outcome).toBe(OnboardingOutcome.ONBOARDED);
      expect(res.customer).toBeTruthy();

      const customer = db.all<any>(Customer)[0];
      expect(customer).toMatchObject({ status: CustomerStatus.ACTIVE, email: 'asha@acme.test', company: 'Acme Pvt Ltd', centerId: CENTER_A });
      expect(customer.userId).toBeTruthy();
      expect(db.count(User)).toBe(1);

      const invoice = db.all<any>(Invoice)[0];
      expect(invoice).toMatchObject({
        status: InvoiceStatus.PAID,
        paymentMethod: PaymentMethod.CHEQUE,
        paymentReference: '123456',
        totalAmount: 50000,
        centerId: CENTER_A, // the old browser saga never set this
        customerId: customer.id,
      });
      expect(db.all<any>(Deposit)[0]).toMatchObject({ amount: 50000, status: DepositStatus.HELD, centerId: CENTER_A });
      expect(db.all<any>(Contract)[0]).toMatchObject({ status: ContractStatus.ACTIVE, paymentFrequency: 'Monthly', centerId: CENTER_A });
      expect(db.count(Booking)).toBe(2);
      expect(db.count(CustomerEmployee)).toBe(2);
      expect(db.all<any>(Seat).filter((s) => s.status === SeatStatus.RESERVED)).toHaveLength(2);
      expect(db.all<any>(Seat).find((s) => s.name === 'A-1').status).toBe(SeatStatus.RESERVED); // the named seat
      expect(db.count(CustomerDocument)).toBe(1);

      const lead = db.all<any>(Lead)[0];
      expect(lead.status).toBe(LeadStatus.CONVERTED);
      expect(lead.customerId).toBe(customer.id);

      const ob = db.all<any>(Onboarding)[0];
      expect(ob).toMatchObject({
        status: OnboardingStatus.COMPLETED,
        paymentStatus: OnboardingPaymentStatus.PAID,
        customerId: customer.id,
        verifiedById: MANAGER_A.sub,
      });
      expect(ob.invoiceId).toBe(invoice.id);
      expect(ob.notes).toContain('Credited by HDFC');
    });

    it('is idempotent — confirming twice never creates a second client or invoice', async () => {
      const { service, db, onboardingId } = await withPendingCheque();
      await service.confirmChequeCleared(onboardingId, {}, MANAGER_A);
      const again = await service.confirmChequeCleared(onboardingId, {}, MANAGER_A);
      expect(again.outcome).toBe(OnboardingOutcome.ONBOARDED);
      expect(db.count(Customer)).toBe(1);
      expect(db.count(Invoice)).toBe(1);
      expect(db.count(Booking)).toBe(2);
    });

    it('refuses when the onboarding is not awaiting a cheque', async () => {
      const { service, db } = build();
      const r = await service.submit(baseInput({ payment: TRANSFER() }), SUPER);
      db.seed(Onboarding, [{ id: 'ob-razor', centerId: CENTER_A, paymentMethod: OnboardingPaymentMethod.RAZORPAY, paymentStatus: OnboardingPaymentStatus.PENDING, status: OnboardingStatus.PENDING }]);
      await expect(service.confirmChequeCleared('ob-razor', {}, SUPER)).rejects.toThrow(/awaiting cheque clearance/);
      expect(r.outcome).toBe(OnboardingOutcome.ONBOARDED);
    });

    it('records the date the bank cleared it and rejects a future clearance date', async () => {
      const { service, db, onboardingId } = await withPendingCheque();
      await expect(service.confirmChequeCleared(onboardingId, { clearedOn: '2026-12-25' }, SUPER)).rejects.toThrow(/future/);
      expect(db.count(Customer)).toBe(0);
      await service.confirmChequeCleared(onboardingId, { clearedOn: '2026-10-01' }, SUPER);
      expect(db.all<any>(Invoice)[0].paidDate.toISOString().slice(0, 10)).toBe('2026-10-01');
    });

    it('only staff of the same center may confirm', async () => {
      const { service, db, onboardingId } = await withPendingCheque();
      await expect(service.confirmChequeCleared(onboardingId, {}, MANAGER_B)).rejects.toThrow(ForbiddenException);
      await expect(service.confirmChequeCleared(onboardingId, {}, MEMBER)).rejects.toThrow(ForbiddenException);
      expect(db.count(Customer)).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('markChequeBounced', () => {
    it('fails the payment, keeps the lead COLD and provisions nothing — and another method can then be used', async () => {
      const { service, db } = build();
      const submitted = await service.submit(baseInput({ payment: CHEQUE() }), SUPER);
      const bounced = await service.markChequeBounced(submitted.onboarding.id, 'Insufficient funds', SUPER);

      expect(bounced.paymentStatus).toBe(OnboardingPaymentStatus.FAILED);
      expect(bounced.failureReason).toContain('Insufficient funds');
      expectNothingProvisioned(db);
      const lead = db.all<any>(Lead)[0];
      expect(lead.status).toBe(LeadStatus.COLD);
      expect(lead.notes).toContain('bounced: Insufficient funds');

      // A bounced onboarding can no longer be "cleared"…
      await expect(service.confirmChequeCleared(submitted.onboarding.id, {}, SUPER)).rejects.toThrow(BadRequestException);

      // …but the client can pay another way on the SAME application.
      const res = await service.collectPayment(submitted.onboarding.id, TRANSFER({ utr: 'UTRBOUNCE00112233' }), SUPER);
      expect(res.outcome).toBe(OnboardingOutcome.ONBOARDED);
      expect(db.count(Customer)).toBe(1);
      expect(db.all<any>(Invoice)[0]).toMatchObject({ paymentMethod: PaymentMethod.BANK_TRANSFER, paymentReference: 'UTRBOUNCE00112233' });
      expect(db.all<any>(Lead)[0].status).toBe(LeadStatus.CONVERTED);
    });

    it('needs a reason and an awaiting cheque', async () => {
      const { service } = build();
      const submitted = await service.submit(baseInput({ payment: CHEQUE() }), SUPER);
      await expect(service.markChequeBounced(submitted.onboarding.id, '   ', SUPER)).rejects.toThrow(/reason/);
      await service.markChequeBounced(submitted.onboarding.id, 'Signature mismatch', SUPER);
      await expect(service.markChequeBounced(submitted.onboarding.id, 'again', SUPER)).rejects.toThrow(BadRequestException);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('BANK_TRANSFER → provisioned immediately, UTR recorded', () => {
    it('creates the client with a PAID invoice carrying the method and UTR, all attributed to the center', async () => {
      const { service, db } = build();
      const res = await service.submit(
        baseInput({
          payment: TRANSFER(),
          refundAccount: { holderName: 'Acme Pvt Ltd', accountNumber: '123456789012', ifsc: 'hdfc0001234', bankName: 'HDFC Bank' },
        }),
        MANAGER_A,
      );

      expect(res.outcome).toBe(OnboardingOutcome.ONBOARDED);
      expect(res.seats).toEqual({ requested: 2, booked: 2, shortfall: 0 });
      const customer = db.all<any>(Customer)[0];
      expect(customer).toMatchObject({
        status: CustomerStatus.ACTIVE,
        centerId: CENTER_A,
        // refund bank account is persisted (it used to live only in browser localStorage)
        refundAccountHolder: 'Acme Pvt Ltd',
        refundAccountNumber: '123456789012',
        refundIfsc: 'HDFC0001234',
        refundBankName: 'HDFC Bank',
      });
      expect(db.all<any>(Invoice)[0]).toMatchObject({
        status: InvoiceStatus.PAID,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentReference: 'HDFCR5202610021234',
        centerId: CENTER_A,
      });
      expect(db.all<any>(Deposit)[0]).toMatchObject({ amount: 50000, status: DepositStatus.HELD, centerId: CENTER_A });
      const ob = db.all<any>(Onboarding)[0];
      expect(ob).toMatchObject({
        status: OnboardingStatus.COMPLETED,
        paymentStatus: OnboardingPaymentStatus.PAID,
        paymentMethod: OnboardingPaymentMethod.BANK_TRANSFER,
        paymentReference: 'HDFCR5202610021234',
        transferDate: '2026-10-02',
        verifiedById: MANAGER_A.sub,
      });
      // The account number moved to the customer; it must not linger in the snapshot.
      expect(ob.applicationData.finance.refundAccount).toBeUndefined();
    });

    it('prices the contract from the booked seats and maps Annually → Yearly', async () => {
      const { service, db } = build();
      await service.submit(baseInput({ billingCycle: 'Annually', payment: TRANSFER() }), SUPER);
      const contract = db.all<any>(Contract)[0];
      expect(contract.paymentFrequency).toBe('Yearly');
      expect(contract.amount).toBe(2 * 8000 * 12); // 2 seats × ₹8,000 × 12 months
    });

    it('uses the agreed monthly rent for a custom deal', async () => {
      const { service, db } = build();
      await service.submit(baseInput({ planType: 'Custom', monthlyRent: 40000, billingCycle: 'Quarterly', durationMonths: 12, payment: TRANSFER() }), SUPER);
      const contract = db.all<any>(Contract)[0];
      expect(contract.amount).toBe(120000); // 40,000 × 3 months per cycle
      expect(contract.paymentFrequency).toBe('Quarterly');
    });

    it('rejects a UTR that was already used to record a payment', async () => {
      const { service, db } = build();
      await service.submit(baseInput({ payment: TRANSFER() }), SUPER);
      await expect(
        service.submit(baseInput({ contactEmail: 'second@acme.test', payment: TRANSFER() }), SUPER),
      ).rejects.toThrow(/already been used/);
      expect(db.count(Customer)).toBe(1);
    });

    it('requires the UTR and transfer date', async () => {
      const { service, db } = build();
      await expect(
        service.submit(baseInput({ payment: { method: OnboardingPaymentMethod.BANK_TRANSFER } }), SUPER),
      ).rejects.toThrow(/UTR/);
      expect(db.count(Onboarding)).toBe(0);
    });

    it('reports a seat shortfall without failing the onboarding', async () => {
      const { service, db } = build();
      const res = await service.submit(baseInput({ seatCount: 8, payment: TRANSFER() }), SUPER);
      expect(res.outcome).toBe(OnboardingOutcome.ONBOARDED);
      expect(res.seats).toEqual({ requested: 8, booked: 5, shortfall: 3 });
      expect(db.count(Booking)).toBe(5);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('atomicity', () => {
    it('rolls EVERYTHING back if any step fails — no half-onboarded client, login, invoice, booking or seat hold', async () => {
      const { service, db } = build();
      db.failSavesOf(Contract, new Error('contract insert failed'));
      await expect(service.submit(baseInput({ payment: TRANSFER() }), SUPER)).rejects.toThrow('contract insert failed');

      expectNothingProvisioned(db);
      expect(db.count(Onboarding)).toBe(0); // not even the application row survives

      // …and the same submit succeeds cleanly once the fault is gone.
      db.clearFailures();
      const ok = await service.submit(baseInput({ payment: TRANSFER() }), SUPER);
      expect(ok.outcome).toBe(OnboardingOutcome.ONBOARDED);
      expect(db.count(Customer)).toBe(1);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('zero deposit', () => {
    it('provisions immediately with no payment, no invoice and no deposit', async () => {
      const { service, db } = build();
      const res = await service.submit(baseInput({ depositAmount: 0 }), SUPER);
      expect(res.outcome).toBe(OnboardingOutcome.ONBOARDED);
      expect(db.count(Customer)).toBe(1);
      expect(db.count(Invoice)).toBe(0);
      expect(db.count(Deposit)).toBe(0);
      expect(db.all<any>(Onboarding)[0].paymentStatus).toBe(OnboardingPaymentStatus.NOT_REQUIRED);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('RAZORPAY → client only after the payment is verified', () => {
    it('saves the application and creates a SERVER-side order for the deposit — no client yet', async () => {
      const { service, db, orders, paymentOrders } = build();
      const res = await service.submit(baseInput({ payment: RAZORPAY }), MANAGER_A);

      expect(res.outcome).toBe(OnboardingOutcome.PENDING_ONLINE_PAYMENT);
      expect(res.razorpay).toMatchObject({
        orderId: 'order_TEST1',
        keyId: 'rzp_test_AbCdEf123456',
        amountPaise: 5_000_000, // ₹50,000 fixed by the server
        currency: 'INR',
        prefillEmail: 'asha@acme.test',
      });
      // The order is bound to the onboarding and created with the stored amount.
      expect(paymentOrders.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          purpose: PaymentOrderPurpose.ONBOARDING,
          amountPaise: 5_000_000,
          onboardingId: res.onboarding.id,
          centerId: CENTER_A,
        }),
      );
      expect(orders).toHaveLength(1);
      expectNothingProvisioned(db);
      expect(db.all<any>(Onboarding)[0]).toMatchObject({
        status: OnboardingStatus.PENDING,
        paymentStatus: OnboardingPaymentStatus.PENDING,
        paymentMethod: OnboardingPaymentMethod.RAZORPAY,
        customerId: null,
      });
    });

    it('refuses cleanly (and saves nothing) when Razorpay is not configured', async () => {
      const { service, db } = build({ razorpayConfigured: false });
      await expect(service.submit(baseInput({ payment: RAZORPAY }), SUPER)).rejects.toThrow(/not set up/);
      expect(db.count(Onboarding)).toBe(0);
    });

    it('keeps the saved application and reports PAYMENT_FAILED when the gateway is down', async () => {
      const { service, db, paymentOrders } = build();
      paymentOrders.createOrder.mockRejectedValueOnce(new ServiceUnavailableException('Razorpay is not reachable right now. Please try again.'));
      const res = await service.submit(baseInput({ payment: RAZORPAY }), SUPER);
      expect(res.outcome).toBe(OnboardingOutcome.PAYMENT_FAILED);
      expect(res.message).toContain('not reachable');
      expect(res.razorpay).toBeNull();
      expect(db.all<any>(Onboarding)[0].paymentStatus).toBe(OnboardingPaymentStatus.FAILED);
      expectNothingProvisioned(db);
    });

    it('the settlement finalizer provisions the client — and replaying it never creates a second one', async () => {
      const { service, db, orders, finalize } = build();
      const res = await service.submit(baseInput({ payment: RAZORPAY }), SUPER);

      await finalize(orders[0], { paymentId: 'pay_ABC123', source: 'webhook', actorId: null });
      await finalize(orders[0], { paymentId: 'pay_ABC123', source: 'webhook', actorId: null }); // Razorpay retry
      await finalize(orders[0], { paymentId: 'pay_ABC123', source: 'checkout', actorId: SUPER.sub }); // browser racing it

      expect(db.count(Customer)).toBe(1);
      expect(db.count(User)).toBe(1);
      expect(db.count(Invoice)).toBe(1);
      expect(db.count(Deposit)).toBe(1);
      expect(db.count(Contract)).toBe(1);
      expect(db.count(Booking)).toBe(2);
      expect(db.all<any>(Invoice)[0]).toMatchObject({
        status: InvoiceStatus.PAID,
        paymentMethod: PaymentMethod.ONLINE,
        paymentReference: 'pay_ABC123',
      });
      expect(db.byId<any>(Onboarding, res.onboarding.id)).toMatchObject({
        status: OnboardingStatus.COMPLETED,
        paymentStatus: OnboardingPaymentStatus.PAID,
      });
    });

    it('does NOT provision a client for money that arrives after staff cancelled the application', async () => {
      const { service, db, orders, finalize } = build();
      const res = await service.submit(baseInput({ payment: RAZORPAY }), SUPER);
      await service.cancel(res.onboarding.id, 'Client changed their mind', SUPER);
      await expect(finalize(orders[0])).resolves.toBeUndefined(); // must not throw (the webhook would loop)
      expectNothingProvisioned(db);
    });

    it('confirmOnlinePayment verifies against THIS onboarding and returns the onboarded client', async () => {
      const { service, db, orders, paymentOrders, finalize } = build();
      const res = await service.submit(baseInput({ payment: RAZORPAY }), SUPER);
      paymentOrders.confirmCheckout.mockImplementationOnce(async (p: any) => {
        await finalize(orders[0], { paymentId: p.providerPaymentId, source: 'checkout', actorId: p.actorId });
        return { order: orders[0], alreadySettled: false };
      });

      const done = await service.confirmOnlinePayment(
        { onboardingId: res.onboarding.id, razorpayOrderId: 'order_TEST1', razorpayPaymentId: 'pay_XYZ', razorpaySignature: 'sig' },
        SUPER,
      );
      expect(paymentOrders.confirmCheckout).toHaveBeenCalledWith(
        expect.objectContaining({ bindTo: { onboardingId: res.onboarding.id }, providerOrderId: 'order_TEST1', signature: 'sig' }),
      );
      expect(done.outcome).toBe(OnboardingOutcome.ONBOARDED);
      expect(done.customer).toBeTruthy();
      expect(db.count(Customer)).toBe(1);
    });

    it('can retry the payment after a failure — reusing the open order instead of orphaning new ones', async () => {
      const { service, orders } = build();
      const res = await service.submit(baseInput({ payment: RAZORPAY }), SUPER);
      const again = await service.collectPayment(res.onboarding.id, RAZORPAY, SUPER);
      expect(again.outcome).toBe(OnboardingOutcome.PENDING_ONLINE_PAYMENT);
      expect(again.razorpay?.orderId).toBe('order_TEST1');
      expect(orders).toHaveLength(1);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('idempotency & duplicates', () => {
    it('a retried submit with the same key returns the same onboarding and creates nothing twice', async () => {
      const { service, db } = build();
      const input = baseInput({ payment: TRANSFER() });
      const first = await service.submit(input, SUPER);
      const second = await service.submit({ ...input }, SUPER);
      expect(second.onboarding.id).toBe(first.onboarding.id);
      expect(second.outcome).toBe(OnboardingOutcome.ONBOARDED);
      expect(db.count(Onboarding)).toBe(1);
      expect(db.count(Customer)).toBe(1);
      expect(db.count(Invoice)).toBe(1);
    });

    it('two simultaneous submits with one key: the loser re-reads the winner instead of failing', async () => {
      const { service, db } = build();
      db.seed(Onboarding, [
        { id: 'winner', idempotencyKey: 'idem-race-abcdefgh', centerId: CENTER_A, contactEmail: 'someone@else.test', status: OnboardingStatus.PENDING, paymentStatus: OnboardingPaymentStatus.AWAITING_CLEARANCE },
      ]);
      // Make the first (replay) lookup miss, as if the winner committed a moment later.
      const real = db.getRepository.bind(db);
      let hidden = false;
      (db as any).getRepository = (entity: any) => {
        const repo: any = real(entity);
        if (entity === Onboarding && !hidden) {
          hidden = true;
          const find = repo.findOne.bind(repo);
          repo.findOne = async (o: any) => (o?.where?.idempotencyKey ? null : find(o));
        }
        return repo;
      };
      const res = await service.submit(baseInput({ idempotencyKey: 'idem-race-abcdefgh', payment: CHEQUE({ chequeNumber: '999999' }) }), SUPER);
      expect(res.onboarding.id).toBe('winner');
      expect(db.count(Onboarding)).toBe(1);
    });

    it('rejects a second client with the same email in the center (case-insensitive)', async () => {
      const { service, db } = build();
      db.seed(Customer, [{ id: 'existing', email: 'Asha@Acme.test', name: 'Asha', centerId: CENTER_A }]);
      await expect(service.submit(baseInput({ payment: TRANSFER() }), SUPER)).rejects.toThrow(/already exists in this center/);
      expect(db.count(Onboarding)).toBe(0);
    });

    it('allows the same email in a different center', async () => {
      const { service, db } = build();
      // The email is already a client of center A; onboarding into center B is fine.
      db.seed(Customer, [{ id: 'existing', email: 'asha@acme.test', name: 'Asha', centerId: CENTER_A }]);
      db.seed(Seat, [{ name: 'P-1', centerId: CENTER_B, seatType: 'HOT_DESK', status: SeatStatus.AVAILABLE, active: true, price: 5000 }]);
      const res = await service.submit(baseInput({ centerId: CENTER_B, payment: TRANSFER() }), SUPER);
      expect(res.outcome).toBe(OnboardingOutcome.ONBOARDED);
    });

    it('blocks a new application while the same person already has one pending (resume it instead)', async () => {
      const { service } = build();
      await service.submit(baseInput({ payment: CHEQUE() }), SUPER);
      await expect(
        service.submit(baseInput({ payment: CHEQUE({ chequeNumber: '777777' }) }), SUPER),
      ).rejects.toThrow(/already a pending onboarding/);
    });

    it('allows a fresh application once the earlier pending one was cancelled', async () => {
      const { service } = build();
      const first = await service.submit(baseInput({ payment: CHEQUE() }), SUPER);
      await service.cancel(first.onboarding.id, undefined, SUPER);
      const second = await service.submit(baseInput({ payment: CHEQUE({ chequeNumber: '777777' }) }), SUPER);
      expect(second.outcome).toBe(OnboardingOutcome.AWAITING_CHEQUE_CLEARANCE);
    });

    it('refuses to onboard a lead that is already a client', async () => {
      const { service, db } = build();
      db.seed(Lead, [{ id: 'lead-9', name: 'X', email: 'x@y.test', status: LeadStatus.CONVERTED, customerId: 'cust-1', centerId: CENTER_A }]);
      await expect(service.submit(baseInput({ leadId: 'lead-9', payment: TRANSFER() }), SUPER)).rejects.toThrow(/already converted/);
    });

    it('refuses a lead from another center', async () => {
      const { service, db } = build();
      db.seed(Lead, [{ id: 'lead-b', name: 'X', email: 'x@y.test', status: LeadStatus.NEW, centerId: CENTER_B }]);
      await expect(service.submit(baseInput({ leadId: 'lead-b', payment: TRANSFER() }), SUPER)).rejects.toThrow(/different center/);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('cancel', () => {
    it('cancels a pending application but never a provisioned client', async () => {
      const { service, db } = build();
      const pending = await service.submit(baseInput({ payment: CHEQUE() }), SUPER);
      const cancelled = await service.cancel(pending.onboarding.id, 'Went with another space', SUPER);
      expect(cancelled.cancelledAt).toBeTruthy();
      expect(cancelled.failureReason).toBe('Went with another space');
      await expect(service.confirmChequeCleared(pending.onboarding.id, {}, SUPER)).rejects.toThrow(/cancelled/);
      expect(db.count(Customer)).toBe(0);

      const done = await service.submit(baseInput({ contactEmail: 'bob@acme.test', payment: TRANSFER() }), SUPER);
      await expect(service.cancel(done.onboarding.id, 'oops', SUPER)).rejects.toThrow(ConflictException);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('authorization', () => {
    it('only center staff can onboard', async () => {
      const { service, db } = build();
      await expect(service.submit(baseInput({ payment: TRANSFER() }), MEMBER)).rejects.toThrow(ForbiddenException);
      await expect(service.submit(baseInput({ payment: TRANSFER() }), caller(UserRole.EMPLOYEE, CENTER_A))).rejects.toThrow(ForbiddenException);
      expect(db.count(Onboarding)).toBe(0);
    });

    it('a center manager cannot onboard into another center', async () => {
      const { service, db } = build();
      await expect(service.submit(baseInput({ centerId: CENTER_B, payment: TRANSFER() }), MANAGER_A)).rejects.toThrow(/own center/);
      expect(db.count(Onboarding)).toBe(0);
    });

    it('a center manager cannot see or act on another center\'s onboarding', async () => {
      const { service } = build();
      const pending = await service.submit(baseInput({ payment: CHEQUE() }), MANAGER_A);
      await expect(service.markChequeBounced(pending.onboarding.id, 'x', MANAGER_B)).rejects.toThrow(ForbiddenException);
      await expect(service.cancel(pending.onboarding.id, 'x', MANAGER_B)).rejects.toThrow(ForbiddenException);
      await expect(service.collectPayment(pending.onboarding.id, TRANSFER(), MANAGER_B)).rejects.toThrow(ForbiddenException);
    });

    it('rejects an unknown center', async () => {
      const { service } = build();
      await expect(
        service.submit(baseInput({ centerId: '99999999-9999-9999-9999-999999999999', payment: TRANSFER() }), SUPER),
      ).rejects.toThrow(/Center not found/);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('assertLeadConvertible (keeps cheque clients cold)', () => {
    it('blocks manual conversion while a cheque is clearing, and allows it afterwards', async () => {
      const { service, db } = build();
      db.seed(Lead, [{ id: 'lead-1', name: 'Asha', email: 'asha@acme.test', status: LeadStatus.NEW, centerId: CENTER_A, assignedToId: 'u1' }]);
      const pending = await service.submit(baseInput({ leadId: 'lead-1', payment: CHEQUE() }), SUPER);

      await expect(service.assertLeadConvertible('lead-1')).rejects.toThrow(/awaiting clearance/);

      await service.markChequeBounced(pending.onboarding.id, 'Stopped by drawer', SUPER);
      await expect(service.assertLeadConvertible('lead-1')).resolves.toBeUndefined(); // bounced → convertible again
    });

    it('ignores cancelled applications and unrelated leads', async () => {
      const { service, db } = build();
      db.seed(Lead, [{ id: 'lead-1', name: 'Asha', email: 'asha@acme.test', status: LeadStatus.NEW, centerId: CENTER_A }]);
      const pending = await service.submit(baseInput({ leadId: 'lead-1', payment: CHEQUE() }), SUPER);
      await service.cancel(pending.onboarding.id, undefined, SUPER);
      await expect(service.assertLeadConvertible('lead-1')).resolves.toBeUndefined();
      await expect(service.assertLeadConvertible('some-other-lead')).resolves.toBeUndefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  describe('audit & caches', () => {
    it('records an audit entry per money event and busts the affected caches', async () => {
      const { service, audit, cache } = build();
      const pending = await service.submit(baseInput({ payment: CHEQUE() }), MANAGER_A);
      await service.confirmChequeCleared(pending.onboarding.id, {}, MANAGER_A);

      const actions = audit.record.mock.calls.map((c: any[]) => c[0].action);
      expect(actions).toEqual(['ONBOARDING_SUBMIT', 'ONBOARDING_CHEQUE_CLEARED']);
      expect(audit.record).toHaveBeenLastCalledWith(
        expect.objectContaining({ userId: MANAGER_A.sub, entityType: 'onboarding', entityId: pending.onboarding.id, centerId: CENTER_A }),
      );
      const patterns = cache.invalidatePattern.mock.calls.map((c: any[]) => c[0]);
      expect(patterns).toEqual(expect.arrayContaining(['leads:*', 'customers:*', 'onboardings:*', 'invoices:*', 'users:*']));
    });
  });
});
