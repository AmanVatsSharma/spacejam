# CRM Backend Wire-Up Design

**Date:** 2026-07-01
**Module:** CRM — Customers, Leads, Onboarding
**Target:** Apps `api` + `web`

---

## Problem

The CRM frontend pages (`customers`, `leads`, `onboarding`, `onboarding-list`) are fully built UI with hardcoded mock arrays inside each `page.tsx`. There is no backend support — no TypeORM entities, no GraphQL resolvers, no services, no API hooks. The goal is to make these pages fully functional against a production backend while preserving a graceful fallback path with a visible "demo mode" badge.

---

## Architecture Overview

### Three-layer approach (frontend-first)

```
Frontend (web)
  │
  ├── [1] Shared types        apps/web/src/lib/graphql/types.ts
  ├── [2] GraphQL operations  apps/web/src/lib/graphql/crm.operations.ts
  ├── [3] React hooks         apps/web/src/lib/graphql/use-crm.ts
  ├── [4] Fallback constants  apps/web/src/lib/fallback/crm-fallback.ts
  └── [5] Page components     (unchanged, consume hooks)

Backend (api)
  │
  ├── [A] TypeORM entities    apps/api/src/typeorm/entities/
  │     ├── customer.entity.ts
  │     ├── lead.entity.ts
  │     └── onboarding.entity.ts
  ├── [B] Repositories        apps/api/src/typeorm/repositories/
  ├── [C] Services             apps/api/src/domain/crm/
  ├── [D] GraphQL resolvers    apps/api/src/graphql/resolvers/
  └── [E] Schema extensions    apps/api/src/graphql/schema.graphql
```

### Data fallback strategy

Each CRM page will use a React hook (`useCrmCustomers`, `useCrmLeads`, etc.) that:
1. Tries to fetch from the GraphQL API (Apollo Client)
2. On error / empty / no backend connection, falls back to the constants file
3. Renders a small **"Demo Data" badge** on the page when fallback is active

This keeps the UI working offline / during dev without the backend running, and makes the demo-vs-live state visible to users.

---

## Backend Design

### New Entities

**Customer** (`customer.entity.ts`)
```typescript
@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() name!: string;
  @Column({ nullable: true }) email!: string | null;
  @Column({ nullable: true }) phone!: string | null;
  @Column({ nullable: true }) company!: string | null;
  @Column({ type: 'int', default: 1 }) teamSize!: number;
  @Column() location!: string;
  @Column({ name: 'joinDate', type: 'date' }) joinDate!: Date;
  @Column({ type: 'enum', enum: BillingStatus, default: BillingStatus.PAID })
  billingStatus!: BillingStatus;
  @Column({ name: 'lastInvoice', type: 'date', nullable: true }) lastInvoice!: Date | null;
  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status!: CustomerStatus;
  @Column({ name: 'centerId' }) centerId!: string;
  @Column({ nullable: true }) notes!: string | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;

  @ManyToOne(() => Center) center!: Center;
}
```

Enums: `BillingStatus` (PAID, PENDING, OVERDUE), `CustomerStatus` (ACTIVE, UPGRADE, SEND_NOTICE, SEND_INVOICE, INACTIVE)

**Lead** (`lead.entity.ts`)
```typescript
@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() name!: string;
  @Column({ unique: true }) email!: string;
  @Column() phone!: string;
  @Column({ nullable: true }) company!: string | null;
  @Column({ nullable: true }) source!: string | null; // Website, Referral, Walk-in, Social, Email
  @Column({ nullable: true }) requirement!: string | null;
  @Column({ nullable: true }) budget!: string | null;
  @Column({ nullable: true }) location!: string | null;
  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW }) status!: LeadStatus;
  @Column({ name: 'lastContact', type: 'timestamp', nullable: true }) lastContact!: Date | null;
  @Column({ nullable: true }) notes!: string | null;
  @Column({ name: 'assignedTo', nullable: true }) assignedTo!: string | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
```

Enums: `LeadStatus` (NEW, VISITED, NEGOTIATION, CONVERTED, COLD)

**Onboarding** (`onboarding.entity.ts`)
```typescript
@Entity('onboardings')
export class Onboarding {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'leadId', unique: true, nullable: true }) leadId!: string | null;
  @Column() name!: string;
  @Column() email!: string;
  @Column() phone!: string;
  @Column({ nullable: true }) company!: string | null;
  @Column({ nullable: true }) requirement!: string | null;
  @Column({ nullable: true }) location!: string | null;
  @Column({ nullable: true }) source!: string | null;
  @Column({ type: 'enum', enum: OnboardingStatus, default: OnboardingStatus.NEW })
  status!: OnboardingStatus;
  @Column({ name: 'lastActivity', type: 'timestamp', nullable: true })
  lastActivity!: Date | null;
  @Column({ name: 'assignedTo', nullable: true }) assignedTo!: string | null;
  @Column({ type: 'jsonb', nullable: true }) steps!: Record<string, any> | null; // wizard state
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;

  @ManyToOne(() => Lead, { nullable: true }) lead!: Lead | null;
}
```

Enums: `OnboardingStatus` (NEW, IN_PROGRESS, COMPLETED, CANCELLED)

### GraphQL Schema Additions

```graphql
type Customer {
  id: ID!
  name: String!
  email: String
  phone: String
  company: String
  teamSize: Int!
  location: String!
  joinDate: DateTime!
  billingStatus: BillingStatus!
  lastInvoice: DateTime
  status: CustomerStatus!
  centerId: ID!
  notes: String
  createdAt: DateTime!
  updatedAt: DateTime!
  center: Center!
}

type Lead {
  id: ID!
  name: String!
  email: String!
  phone: String!
  company: String
  source: String
  requirement: String
  budget: String
  location: String
  status: LeadStatus!
  lastContact: DateTime
  notes: String
  assignedTo: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Onboarding {
  id: ID!
  leadId: ID
  name: String!
  email: String!
  phone: String!
  company: String
  requirement: String
  location: String
  source: String
  status: OnboardingStatus!
  lastActivity: DateTime
  assignedTo: String
  steps: Json
  createdAt: DateTime!
  updatedAt: DateTime!
  lead: Lead
}

# Enums
enum BillingStatus { PAID PENDING OVERDUE }
enum CustomerStatus { ACTIVE UPGRADE SEND_NOTICE SEND_INVOICE INACTIVE }
enum LeadStatus { NEW VISITED NEGOTIATION CONVERTED COLD }
enum OnboardingStatus { NEW IN_PROGRESS COMPLETED CANCELLED }

# Queries
extend type Query {
  customers(filters: CustomerFilters): [Customer!]!
  customer(id: ID!): Customer
  leads(filters: LeadFilters): [Lead!]!
  lead(id: ID!): Lead
  onboardings(filters: OnboardingFilters): [Onboarding!]!
  onboarding(id: ID!): Onboarding
}

input CustomerFilters {
  centerId: ID
  status: CustomerStatus
  search: String
}
input LeadFilters {
  status: LeadStatus
  source: String
  search: String
}
input OnboardingFilters {
  status: OnboardingStatus
  assignedTo: String
  search: String
}

# Mutations
extend type Mutation {
  # Customers
  createCustomer(input: CreateCustomerInput!): Customer!
  updateCustomer(id: ID!, input: UpdateCustomerInput!): Customer!
  deleteCustomer(id: ID!): Boolean!

  # Leads
  createLead(input: CreateLeadInput!): Lead!
  updateLead(id: ID!, input: UpdateLeadInput!): Lead!
  deleteLead(id: ID!): Boolean!
  convertLeadToCustomer(id: ID!): Customer!

  # Onboarding
  createOnboarding(input: CreateOnboardingInput!): Onboarding!
  updateOnboarding(id: ID!, input: UpdateOnboardingInput!): Onboarding!
  deleteOnboarding(id: ID!): Boolean!
  convertOnboardingToCustomer(id: ID!): Customer!
}

input CreateCustomerInput { ... }
input UpdateCustomerInput { ... }
input CreateLeadInput { ... }
input UpdateLeadInput { ... }
input CreateOnboardingInput { ... }
input UpdateOnboardingInput { ... }
```

### Backend Structure

```
apps/api/src/typeorm/entities/
├── customer.entity.ts        (new)
├── lead.entity.ts            (new)
└── onboarding.entity.ts      (new)

apps/api/src/typeorm/repositories/
├── customer.repository.ts    (new)
├── lead.repository.ts        (new)
└── onboarding.repository.ts  (new)

apps/api/src/domain/crm/
├── crm.module.ts             (new — umbrella module)
├── customers/
│   ├── customers.service.ts
│   ├── customers.resolver.ts
│   └── dto/
│       ├── create-customer.dto.ts
│       └── update-customer.dto.ts
├── leads/
│   ├── leads.service.ts
│   ├── leads.resolver.ts
│   └── dto/
│       ├── create-lead.dto.ts
│       └── update-lead.dto.ts
└── onboarding/
    ├── onboarding.service.ts
    ├── onboarding.resolver.ts
    └── dto/
        ├── create-onboarding.dto.ts
        └── update-onboarding.dto.ts
```

---

## Frontend Design

### Fallback Constants File

`apps/web/src/lib/fallback/crm-fallback.ts`

```typescript
/**
 * Demo / fallback data used when the GraphQL API is unavailable.
 * Every consumer should use the hook layer (use-crm.ts), NOT this file directly.
 * A "Demo Data" badge is shown to users when fallback is active.
 */
export const FALLBACK_CUSTOMERS: Customer[] = [ /* current hardcoded data */ ];
export const FALLBACK_LEADS: Lead[] = [ /* current hardcoded data */ ];
export const FALLBACK_ONBOARDING: OnboardingLead[] = [ /* current hardcoded data */ ];
```

### Shared Types

`apps/web/src/lib/graphql/types.ts`

```typescript
export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  teamSize: number;
  location: string;
  joinDate: string;
  billingStatus: BillingStatus;
  lastInvoice: string | null;
  status: CustomerStatus;
  centerId: string;
  notes: string | null;
}
// ... Lead, Onboarding types mirror backend
```

### GraphQL Operations

`apps/web/src/lib/graphql/crm.operations.ts`

```typescript
import { gql } from '@apollo/client';

export const GET_CUSTOMERS = gql`query GetCustomers($filters: CustomerFilters) { ... }`;
export const GET_CUSTOMER = gql`query GetCustomer($id: ID!) { ... }`;
export const CREATE_CUSTOMER = gql`mutation CreateCustomer($input: CreateCustomerInput!) { ... }`;
export const UPDATE_CUSTOMER = gql`mutation UpdateCustomer($id: ID!, $input: UpdateCustomerInput!) { ... }`;
export const DELETE_CUSTOMER = gql`mutation DeleteCustomer($id: ID!) { ... }`;

// Similar for Leads and Onboarding...
```

### React Hook Layer

`apps/web/src/lib/graphql/use-crm.ts`

```typescript
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { GET_CUSTOMERS, CREATE_CUSTOMER, ... } from './crm.operations';
import { FALLBACK_CUSTOMERS } from '../fallback/crm-fallback';

export function useCrmCustomers(filters?: CustomerFilters) {
  const { data, loading, error } = useQuery(GET_CUSTOMERS, { variables: { filters } });
  const isFallback = !!error || !data;
  return {
    customers: isFallback ? FALLBACK_CUSTOMERS : data.customers,
    loading,
    isFallback,
    // ... mutations
  };
}
```

### Page Integration Pattern

Each page will import the hook and swap `const customersData` → the hook return value. The `isFallback` boolean controls the demo badge visibility. Example:

```typescript
// Before (customers/page.tsx)
const customersData: Customer[] = [ /* hardcoded */ ];

// After
const { customers: customersData, isFallback, loading } = useCrmCustomers();
```

---

## Migration Path

1. **Phase 1 — Backend entities + schema**: Create TypeORM entities, extend schema.graphql, run migration
2. **Phase 2 — Repositories + services**: Implement data access and business logic
3. **Phase 3 — GraphQL resolvers**: Wire queries/mutations to services
4. **Phase 4 — Frontend shared layer**: Types, operations, fallback constants, hooks
5. **Phase 5 — Page migration**: Replace hardcoded data with hooks, add demo badge
6. **Phase 6 — Validation**: End-to-end test each CRM page

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Fallback placement | Frontend `lib/fallback/` | Backend is source of truth; fallback is dev/offline safety net |
| Demo badge | Always visible when fallback | Users immediately know they're seeing demo data |
| Data sync | One-directional (backend → frontend) | Backend is authoritative; frontend never writes to fallback |
| Lead→Customer conversion | Backend mutation | Business logic belongs server-side |
| Onboarding→Customer | Backend mutation with lead linkage | Preserves lead attribution chain |
| Existing entities reused | Customer/Lead/Onboarding are NEW | No existing entity maps to CRM data; clean separation |
