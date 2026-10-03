/**
 * File:        apps/api/src/graphql/enums/onboarding-payment.enums.ts
 * Module:      API · GraphQL Enums
 * Purpose:     Enums for the onboarding payment lifecycle (how a new client
 *              pays, where that payment stands, and what the submit call
 *              produced). Plain enums only — registerEnumType lives in
 *              crm.module.ts so importing these into entities carries no
 *              GraphQL side-effects (see visit.enums.ts for the rationale).
 *
 *              Stored as varchar (not Postgres enums) so new values never
 *              need an ALTER TYPE migration — validated in the app layer.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */

/** How the client pays the amount due at onboarding. */
export enum OnboardingPaymentMethod {
  /** Online via Razorpay Checkout (UPI / cards / netbanking / wallets). */
  RAZORPAY = 'RAZORPAY',
  /** NEFT / RTGS / IMPS / UPI transfer to the center's bank account; staff record the UTR. */
  BANK_TRANSFER = 'BANK_TRANSFER',
  /** Cheque. The client is a COLD lead until the cheque clears. */
  CHEQUE = 'CHEQUE',
}

/** Where the onboarding's payment stands. */
export enum OnboardingPaymentStatus {
  /** Nothing to collect (zero deposit), or an onboarding created before payment tracking. */
  NOT_REQUIRED = 'NOT_REQUIRED',
  /** Online payment started (Razorpay order created) but not yet captured. */
  PENDING = 'PENDING',
  /** Cheque received and registered; waiting for the bank to clear it. */
  AWAITING_CLEARANCE = 'AWAITING_CLEARANCE',
  /** Money confirmed: verified online payment, staff-attested transfer, or cleared cheque. */
  PAID = 'PAID',
  /** Online payment failed/abandoned or cheque bounced — resumable with another attempt. */
  FAILED = 'FAILED',
}

/** What a submit / payment-confirmation call ended up doing. */
export enum OnboardingOutcome {
  /** Payment confirmed and the client has been provisioned. */
  ONBOARDED = 'ONBOARDED',
  /** Saved; waiting for the client to complete the Razorpay checkout. */
  PENDING_ONLINE_PAYMENT = 'PENDING_ONLINE_PAYMENT',
  /** Saved as a COLD lead + pending application; waiting for the cheque to clear. */
  AWAITING_CHEQUE_CLEARANCE = 'AWAITING_CHEQUE_CLEARANCE',
  /** Saved, but the last payment attempt failed or the cheque bounced — retry with any method. */
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

/** Why a payment_orders row exists — decides what settling it finalizes. */
export enum PaymentOrderPurpose {
  ONBOARDING = 'ONBOARDING',
  INVOICE = 'INVOICE',
  /** Staff-created, not bound to any record (settling it finalizes nothing). */
  GENERAL = 'GENERAL',
}

export enum PaymentOrderStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  FAILED = 'FAILED',
}
