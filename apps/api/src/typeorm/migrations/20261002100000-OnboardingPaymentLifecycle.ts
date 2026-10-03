/**
 * File:        typeorm/migrations/20261002100000-OnboardingPaymentLifecycle.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Enterprise onboarding payments.
 *                - onboardings: payment method/status/amount/reference, cheque
 *                  and bank-transfer details, the full application snapshot
 *                  (so a cheque / online-pending application can be provisioned
 *                  later without re-entry), idempotency key, links to the
 *                  invoice/deposit/contract it produced, who verified, and
 *                  cancellation.
 *                - customers: the client's refund bank account (collected in
 *                  the wizard; previously discarded). Not exposed via GraphQL.
 *                - payment_orders: gateway ledger binding every Razorpay order
 *                  to the onboarding/invoice it pays for.
 *                - invoices.paymentReference index for duplicate-UTR checks.
 *              All new status columns are varchar (validated in the app) so
 *              no ALTER TYPE is ever needed. Fully idempotent / re-runnable.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class OnboardingPaymentLifecycle20261002100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── onboardings ───────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "onboardings"
        ADD COLUMN IF NOT EXISTS "paymentMethod"    varchar(24)   NULL,
        ADD COLUMN IF NOT EXISTS "paymentStatus"    varchar(24)   NOT NULL DEFAULT 'NOT_REQUIRED',
        ADD COLUMN IF NOT EXISTS "paymentAmount"    numeric(12,2) NULL,
        ADD COLUMN IF NOT EXISTS "paymentReference" varchar(100)  NULL,
        ADD COLUMN IF NOT EXISTS "chequeNumber"     varchar(20)   NULL,
        ADD COLUMN IF NOT EXISTS "chequeBank"       varchar(120)  NULL,
        ADD COLUMN IF NOT EXISTS "chequeDate"       date          NULL,
        ADD COLUMN IF NOT EXISTS "chequeClearedAt"  timestamp     NULL,
        ADD COLUMN IF NOT EXISTS "transferDate"     date          NULL,
        ADD COLUMN IF NOT EXISTS "payerBank"        varchar(120)  NULL,
        ADD COLUMN IF NOT EXISTS "applicationData"  jsonb         NULL,
        ADD COLUMN IF NOT EXISTS "idempotencyKey"   varchar(80)   NULL,
        ADD COLUMN IF NOT EXISTS "invoiceId"        uuid          NULL,
        ADD COLUMN IF NOT EXISTS "depositId"        uuid          NULL,
        ADD COLUMN IF NOT EXISTS "contractId"       uuid          NULL,
        ADD COLUMN IF NOT EXISTS "submittedById"    uuid          NULL,
        ADD COLUMN IF NOT EXISTS "verifiedById"     uuid          NULL,
        ADD COLUMN IF NOT EXISTS "verifiedAt"       timestamp     NULL,
        ADD COLUMN IF NOT EXISTS "failureReason"    text          NULL,
        ADD COLUMN IF NOT EXISTS "cancelledAt"      timestamp     NULL;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ONBOARDINGS_IDEMPOTENCY_KEY"
        ON "onboardings" ("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ONBOARDINGS_PAYMENT_STATUS"
        ON "onboardings" ("paymentStatus");
    `);

    // ── customers: refund bank account (never exposed via GraphQL) ────────
    await queryRunner.query(`
      ALTER TABLE "customers"
        ADD COLUMN IF NOT EXISTS "refundAccountHolder" varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS "refundAccountNumber" varchar(34)  NULL,
        ADD COLUMN IF NOT EXISTS "refundIfsc"          varchar(11)  NULL,
        ADD COLUMN IF NOT EXISTS "refundBankName"      varchar(120) NULL;
    `);

    // ── payment_orders: gateway ledger ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_orders" (
        "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "provider"            varchar(20)  NOT NULL DEFAULT 'RAZORPAY',
        "providerOrderId"     varchar(64)  NOT NULL,
        "amountPaise"         bigint       NOT NULL,
        "currency"            varchar(3)   NOT NULL DEFAULT 'INR',
        "status"              varchar(16)  NOT NULL DEFAULT 'CREATED',
        "purpose"             varchar(20)  NOT NULL,
        "onboardingId"        uuid         NULL,
        "invoiceId"           uuid         NULL,
        "centerId"            uuid         NULL,
        "receipt"             varchar(64)  NULL,
        "providerPaymentId"   varchar(64)  NULL,
        "signatureVerifiedAt" timestamp    NULL,
        "paidAt"              timestamp    NULL,
        "failureReason"       text         NULL,
        "createdById"         uuid         NULL,
        "createdAt"           timestamp    NOT NULL DEFAULT now(),
        "updatedAt"           timestamp    NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_PAYMENT_ORDERS_PROVIDER_ORDER"
        ON "payment_orders" ("providerOrderId");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_PAYMENT_ORDERS_PROVIDER_PAYMENT"
        ON "payment_orders" ("providerPaymentId") WHERE "providerPaymentId" IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PAYMENT_ORDERS_ONBOARDING" ON "payment_orders" ("onboardingId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PAYMENT_ORDERS_INVOICE" ON "payment_orders" ("invoiceId");
    `);

    // ── invoices: fast duplicate-UTR / cheque-number lookups ──────────────
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_INVOICES_PAYMENT_REFERENCE" ON "invoices" ("paymentReference");
    `);

    await queryRunner.query(`
      INSERT INTO "migrations" (timestamp, name)
      SELECT 20261002100000, 'OnboardingPaymentLifecycle20261002100000'
      WHERE NOT EXISTS (
        SELECT 1 FROM "migrations" WHERE name = 'OnboardingPaymentLifecycle20261002100000'
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_INVOICES_PAYMENT_REFERENCE";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_orders";`);
    await queryRunner.query(`
      ALTER TABLE "customers"
        DROP COLUMN IF EXISTS "refundAccountHolder",
        DROP COLUMN IF EXISTS "refundAccountNumber",
        DROP COLUMN IF EXISTS "refundIfsc",
        DROP COLUMN IF EXISTS "refundBankName";
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ONBOARDINGS_PAYMENT_STATUS";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_ONBOARDINGS_IDEMPOTENCY_KEY";`);
    await queryRunner.query(`
      ALTER TABLE "onboardings"
        DROP COLUMN IF EXISTS "paymentMethod",
        DROP COLUMN IF EXISTS "paymentStatus",
        DROP COLUMN IF EXISTS "paymentAmount",
        DROP COLUMN IF EXISTS "paymentReference",
        DROP COLUMN IF EXISTS "chequeNumber",
        DROP COLUMN IF EXISTS "chequeBank",
        DROP COLUMN IF EXISTS "chequeDate",
        DROP COLUMN IF EXISTS "chequeClearedAt",
        DROP COLUMN IF EXISTS "transferDate",
        DROP COLUMN IF EXISTS "payerBank",
        DROP COLUMN IF EXISTS "applicationData",
        DROP COLUMN IF EXISTS "idempotencyKey",
        DROP COLUMN IF EXISTS "invoiceId",
        DROP COLUMN IF EXISTS "depositId",
        DROP COLUMN IF EXISTS "contractId",
        DROP COLUMN IF EXISTS "submittedById",
        DROP COLUMN IF EXISTS "verifiedById",
        DROP COLUMN IF EXISTS "verifiedAt",
        DROP COLUMN IF EXISTS "failureReason",
        DROP COLUMN IF EXISTS "cancelledAt";
    `);
  }
}
