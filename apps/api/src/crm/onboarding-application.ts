/**
 * File:        apps/api/src/crm/onboarding-application.ts
 * Module:      API · CRM · Onboarding
 * Purpose:     The onboarding "application": a validated, normalized snapshot of
 *              everything the wizard collected, plus the payment details for the
 *              chosen method. Pure functions (no I/O) so every rule is unit
 *              testable. OnboardingService is the only caller.
 *
 *              The snapshot is stored on onboardings.applicationData so a cheque
 *              or online-pending application can be provisioned LATER (when the
 *              cheque clears / the payment lands) without anyone re-typing it.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { BadRequestException } from '@nestjs/common';
import { PaymentFrequency } from '@enums';
import { OnboardingPaymentMethod } from '../graphql/enums/onboarding-payment.enums';
import type {
  OnboardingPaymentInput,
  SubmitOnboardingInput,
} from '../graphql/inputs/onboarding-submit.input';

export type BillingCycle = 'Monthly' | 'Quarterly' | 'Annually';

export const CYCLE_MONTHS: Record<BillingCycle, number> = {
  Monthly: 1,
  Quarterly: 3,
  Annually: 12,
};

/** Wizard billing cycle → the contracts.paymentFrequency enum (note "Annually" → "Yearly"). */
export const CYCLE_TO_FREQUENCY: Record<BillingCycle, PaymentFrequency> = {
  Monthly: PaymentFrequency.MONTHLY,
  Quarterly: PaymentFrequency.QUARTERLY,
  Annually: PaymentFrequency.YEARLY,
};

const SEAT_TYPES = ['HOT_DESK', 'DEDICATED', 'CABIN', 'MEETING_ROOM', 'ANY'];

/** A cheque is valid for ~3 months; post-dated cheques are accepted up to the same window. */
export const CHEQUE_WINDOW_DAYS = 90;
/** How far back a bank transfer may be dated. */
export const TRANSFER_MAX_AGE_DAYS = 90;

export interface ApplicationMember {
  name?: string;
  phone?: string;
  email?: string;
  department?: string;
  seatName?: string;
}

export interface ApplicationDocument {
  name: string;
  documentType: string;
  fileUrl: string;
  fileSize?: string;
  mimeType?: string;
}

export interface RefundAccount {
  holderName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
}

export interface OnboardingApplication {
  version: 1;
  contact: {
    name: string;
    email: string;
    phone: string;
    companyName: string;
    companyAddress?: string;
    gstNumber?: string;
    alternateEmail?: string;
    alternatePhone?: string;
    /** YYYY-MM-DD */
    dob?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    communicationChannel?: string;
  };
  notes?: string;
  plan: {
    planType: string;
    billingCycle: BillingCycle;
    seatType: string;
    seatCount: number;
    durationMonths: number;
    monthlyRent?: number;
    /** YYYY-MM-DD */
    startDate: string;
  };
  members: ApplicationMember[];
  finance: {
    depositAmount: number;
    refundAccount?: RefundAccount;
  };
  services: {
    autoRechargeEnabled?: boolean;
    autoRechargeContact?: string;
    autoRechargeThreshold?: number;
  };
  provisionLogin: boolean;
  documents: ApplicationDocument[];
}

export interface NormalizedPayment {
  method: OnboardingPaymentMethod;
  cheque?: { chequeNumber: string; bankName: string; chequeDate: string };
  bankTransfer?: { utr: string; transferDate: string; payerBankName?: string };
}

// ── helpers ─────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

const clean = (v?: string | null): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

/** Round to 2 decimals without float noise (1.005 → 1.01). */
export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Parse a strict YYYY-MM-DD string to a UTC-midnight Date, or null. */
export function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Reject rollovers like 2026-02-31 → 2026-03-03.
  if (d.toISOString().slice(0, 10) !== `${m[1]}-${m[2]}-${m[3]}`) return null;
  return d;
}

export const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);

const bad = (message: string): never => {
  throw new BadRequestException(message);
};

// ── application ─────────────────────────────────────────────────────────────

export function normalizeApplication(input: SubmitOnboardingInput, now: Date): OnboardingApplication {
  const today = parseIsoDate(toIsoDate(now))!;

  const name = clean(input.contactName) ?? bad('Primary contact name is required.');
  const email = (clean(input.contactEmail) ?? bad('Email address is required.')).toLowerCase();
  const phone = clean(input.contactPhone) ?? bad('Phone number is required.');
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    bad('Enter a valid phone number (10–15 digits).');
  }
  const companyName = clean(input.companyName) ?? bad('Company name is required.');

  let dob: string | undefined;
  if (input.dob) {
    const d = parseIsoDate(input.dob) ?? bad('Date of birth is not a valid date.');
    if ((d as Date) > today) bad('Date of birth cannot be in the future.');
    if ((d as Date).getUTCFullYear() < 1900) bad('Date of birth is not a valid date.');
    dob = toIsoDate(d as Date);
  }

  const cycle = input.billingCycle as BillingCycle;
  if (!(cycle in CYCLE_MONTHS)) bad('Billing cycle must be Monthly, Quarterly or Annually.');

  const planType = clean(input.planType) ?? bad('Plan type is required.');
  const seatType = (clean(input.seatType) ?? (planType === 'Hot Desk' ? 'HOT_DESK' : 'ANY')).toUpperCase();
  if (!SEAT_TYPES.includes(seatType)) bad(`Seat type must be one of ${SEAT_TYPES.join(', ')}.`);

  // Team rows that name a person or reserve a seat. Seat-only rows = unnamed seats.
  const members: ApplicationMember[] = (input.members ?? [])
    .map((m) => ({
      name: clean(m.name),
      phone: clean(m.phone),
      email: clean(m.email)?.toLowerCase(),
      department: clean(m.department),
      seatName: clean(m.seatName),
    }))
    .filter((m) => m.name || m.seatName);

  const seatNames = members.map((m) => m.seatName?.toLowerCase()).filter(Boolean) as string[];
  if (new Set(seatNames).size !== seatNames.length) {
    bad('The same seat is assigned to more than one team member.');
  }

  const seatCount = Math.max(input.seatCount ?? 0, members.length, 1);
  const durationMonths = input.durationMonths ?? CYCLE_MONTHS[cycle];

  let startDate = toIsoDate(today);
  if (input.startDate) {
    const d = parseIsoDate(input.startDate) ?? bad('Start date is not a valid date.');
    const deltaDays = ((d as Date).getTime() - today.getTime()) / DAY_MS;
    if (deltaDays < -30 || deltaDays > 366) bad('Start date must be within the last 30 days or the next year.');
    startDate = toIsoDate(d as Date);
  }

  const depositAmount = round2(input.depositAmount);
  if (!Number.isFinite(depositAmount) || depositAmount < 0) bad('Security deposit must be zero or more.');

  let refundAccount: RefundAccount | undefined;
  if (input.refundAccount) {
    refundAccount = {
      holderName: input.refundAccount.holderName.trim(),
      accountNumber: input.refundAccount.accountNumber.replace(/\s/g, ''),
      ifsc: input.refundAccount.ifsc.trim().toUpperCase(),
      bankName: input.refundAccount.bankName.trim(),
    };
  }

  const documents: ApplicationDocument[] = [];
  const seenUrls = new Set<string>();
  for (const d of input.documents ?? []) {
    if (seenUrls.has(d.fileUrl)) continue;
    seenUrls.add(d.fileUrl);
    documents.push({
      name: d.name.trim(),
      documentType: d.documentType.trim(),
      fileUrl: d.fileUrl,
      fileSize: d.fileSize,
      mimeType: clean(d.mimeType),
    });
  }

  return {
    version: 1,
    contact: {
      name,
      email,
      phone,
      companyName,
      companyAddress: clean(input.companyAddress),
      gstNumber: clean(input.gstNumber)?.toUpperCase(),
      alternateEmail: clean(input.alternateEmail)?.toLowerCase(),
      alternatePhone: clean(input.alternatePhone),
      dob,
      emergencyContact: clean(input.emergencyContact),
      emergencyPhone: clean(input.emergencyPhone),
      communicationChannel: clean(input.communicationChannel),
    },
    notes: clean(input.notes),
    plan: {
      planType,
      billingCycle: cycle,
      seatType,
      seatCount,
      durationMonths,
      monthlyRent: input.monthlyRent != null ? round2(input.monthlyRent) : undefined,
      startDate,
    },
    members,
    finance: { depositAmount, refundAccount },
    services: {
      autoRechargeEnabled: input.autoRechargeEnabled,
      autoRechargeContact: clean(input.autoRechargeContact),
      autoRechargeThreshold: input.autoRechargeThreshold,
    },
    provisionLogin: input.provisionLogin ?? true,
    documents,
  };
}

// ── payment ─────────────────────────────────────────────────────────────────

/**
 * Validate the payment details for the chosen method. Returns null when there is
 * nothing to collect (zero deposit) — a method sent alongside is ignored.
 */
export function normalizePayment(
  payment: OnboardingPaymentInput | undefined | null,
  amount: number,
  now: Date,
): NormalizedPayment | null {
  if (amount <= 0) return null;
  if (!payment) bad('Choose how the security deposit is being paid.');
  const p = payment as OnboardingPaymentInput;
  const today = parseIsoDate(toIsoDate(now))!;

  switch (p.method) {
    case OnboardingPaymentMethod.RAZORPAY:
      return { method: p.method };

    case OnboardingPaymentMethod.CHEQUE: {
      const c = p.cheque ?? bad('Enter the cheque number, bank and date.');
      const chequeDate = parseIsoDate((c as NonNullable<typeof p.cheque>).chequeDate) ?? bad('Cheque date is not a valid date.');
      const deltaDays = ((chequeDate as Date).getTime() - today.getTime()) / DAY_MS;
      if (deltaDays < -CHEQUE_WINDOW_DAYS) {
        bad(`This cheque is stale (dated more than ${CHEQUE_WINDOW_DAYS} days ago) — banks won't honour it. Ask for a fresh cheque.`);
      }
      if (deltaDays > CHEQUE_WINDOW_DAYS) {
        bad(`A post-dated cheque can be at most ${CHEQUE_WINDOW_DAYS} days ahead.`);
      }
      const cc = c as NonNullable<typeof p.cheque>;
      return {
        method: p.method,
        cheque: {
          chequeNumber: cc.chequeNumber.trim(),
          bankName: cc.bankName.trim(),
          chequeDate: toIsoDate(chequeDate as Date),
        },
      };
    }

    case OnboardingPaymentMethod.BANK_TRANSFER: {
      const t = p.bankTransfer ?? bad('Enter the UTR / reference of the transfer and its date.');
      const tt = t as NonNullable<typeof p.bankTransfer>;
      const transferDate = parseIsoDate(tt.transferDate) ?? bad('Transfer date is not a valid date.');
      const deltaDays = ((transferDate as Date).getTime() - today.getTime()) / DAY_MS;
      if (deltaDays > 1) bad('The transfer date cannot be in the future.');
      if (deltaDays < -TRANSFER_MAX_AGE_DAYS) {
        bad(`The transfer is older than ${TRANSFER_MAX_AGE_DAYS} days — check the date and UTR.`);
      }
      return {
        method: p.method,
        bankTransfer: {
          utr: tt.utr.trim().toUpperCase(),
          transferDate: toIsoDate(transferDate as Date),
          payerBankName: clean(tt.payerBankName),
        },
      };
    }

    default:
      return bad('Unsupported payment method.');
  }
}

/** Escape LIKE/ILIKE wildcards so an email is matched literally. */
export const escapeLike = (s: string): string => s.replace(/[\\%_]/g, '\\$&');

/** Append a dated line to a free-text notes column. */
export function appendNote(existing: string | null | undefined, line: string, now = new Date()): string {
  const stamped = `[${toIsoDate(now)}] ${line}`;
  return existing?.trim() ? `${existing.trim()}\n${stamped}` : stamped;
}
