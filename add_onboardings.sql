CREATE TYPE onboardings_status_enum AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE IF NOT EXISTS onboardings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "leadId" uuid,
    "customerId" uuid,
    status onboardings_status_enum DEFAULT 'PENDING',
    "companyName" varchar,
    "companyAddress" text,
    "gstNumber" varchar,
    "planType" varchar,
    "seatCount" int,
    "contactName" varchar,
    "contactEmail" varchar,
    "contactPhone" varchar,
    "emergencyContact" varchar,
    "emergencyPhone" varchar,
    "idProofUrl" text,
    "agreementUrl" text,
    "completedAt" date,
    notes text,
    "assignedToId" uuid,
    "centerId" uuid,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_ONBOARDINGS_STATUS" ON onboardings (status);
CREATE INDEX IF NOT EXISTS "IDX_ONBOARDINGS_LEAD_ID" ON onboardings ("leadId");
CREATE INDEX IF NOT EXISTS "IDX_ONBOARDINGS_CUSTOMER_ID" ON onboardings ("customerId");
