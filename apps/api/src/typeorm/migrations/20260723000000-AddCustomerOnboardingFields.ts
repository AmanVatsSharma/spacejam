/**
 * File:        apps/api/src/typeorm/migrations/20260723000000-AddCustomerOnboardingFields.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Create employees table (employees of a customer), audit_logs table,
 *              customer_documents table, add extended onboarding columns to customers.
 *              Uses DO blocks since prod PostgreSQL is < v11 (no CREATE TABLE IF NOT EXISTS).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-23
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerOnboardingFields20260723000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Extend customers table with onboarding-collected fields.
    //    Wrapped in DO blocks so the migration is idempotent — safe to re-run
    //    on prod (PostgreSQL < v11 has no CREATE TABLE IF NOT EXISTS).
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='gstNumber') THEN
          ALTER TABLE "customers" ADD COLUMN "gstNumber" varchar(100) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='companyAddress') THEN
          ALTER TABLE "customers" ADD COLUMN "companyAddress" varchar(100) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='companyType') THEN
          ALTER TABLE "customers" ADD COLUMN "companyType" varchar(50) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='employeeCount') THEN
          ALTER TABLE "customers" ADD COLUMN "employeeCount" int NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='industry') THEN
          ALTER TABLE "customers" ADD COLUMN "industry" varchar(100) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='website') THEN
          ALTER TABLE "customers" ADD COLUMN "website" varchar(255) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='planType') THEN
          ALTER TABLE "customers" ADD COLUMN "planType" varchar(100) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='alternateEmail') THEN
          ALTER TABLE "customers" ADD COLUMN "alternateEmail" varchar(255) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='alternatePhone') THEN
          ALTER TABLE "customers" ADD COLUMN "alternatePhone" varchar(50) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='dob') THEN
          ALTER TABLE "customers" ADD COLUMN "dob" date NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='emergencyContactName') THEN
          ALTER TABLE "customers" ADD COLUMN "emergencyContactName" varchar(255) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='emergencyContactPhone') THEN
          ALTER TABLE "customers" ADD COLUMN "emergencyContactPhone" varchar(50) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='communicationChannel') THEN
          ALTER TABLE "customers" ADD COLUMN "communicationChannel" varchar(50) NULL;
        END IF;
      END $$;
    `);

    // 2) Customer employees — people associated with the customer (HR/Users/team members)
    //    that get access to the space. Multiple employees per customer; a customer has one
    //    billing entity but many actual users.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_employees" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "customerId" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(50) NULL,
        "role" varchar(100) NOT NULL DEFAULT 'Member',
        "department" varchar(100) NULL,
        "seatNumber" varchar(50) NULL,
        "status" varchar(50) NOT NULL DEFAULT 'active',
        "invitedAt" timestamp NULL,
        "joinedAt" timestamp NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_customer_employees_customer" ON "customer_employees" ("customerId");`,
    );

    // 3) Customer documents — uploaded during onboarding (KYC, agreements, ID proof)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_documents" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "customerId" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "documentType" varchar(50) NOT NULL,
        "fileUrl" text NOT NULL,
        "fileSize" bigint NULL,
        "mimeType" varchar(100) NULL,
        "uploadedById" uuid NULL,
        "uploadedAt" timestamp NOT NULL DEFAULT now(),
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_customer_documents_customer" ON "customer_documents" ("customerId");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_documents";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_employees";`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "gstNumber";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "companyAddress";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "companyType";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "employeeCount";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "industry";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "website";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "planType";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "alternateEmail";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "alternatePhone";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "dob";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "emergencyContactName";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "emergencyContactPhone";
        ALTER TABLE "customers" DROP COLUMN IF EXISTS "communicationChannel";
      END $$;
    `);
  }
}
