# Project: Spacejam CRM E2E Integration

## Architecture
Spacejam CRM consists of:
1. **Frontend App (`apps/web`)**: Next.js (App Router) client utilizing Apollo Client for GraphQL state management.
2. **Backend API (`apps/api`)**: NestJS application using GraphQL (Apollo Server) and TypeORM with SQLite.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Audit & Exploration | Initial audit of routing, security, and test suite. | None | DONE |
| 2 | Robustness Upgrades | Add class-validator to inputs, replace generic errors, fix Vitest configuration. | None | IN_PROGRESS (054ddb3d-5451-4f9e-8dfa-dcb0d64d473c) |
| 3 | Dashboard & Report | Wire up Dashboard and Report routes to backend analytics. | M2 | PLANNED |
| 4 | CRM & Customers | Wire up Customers routes, implement missing CRM resolvers, unblock mutations. | M3 | PLANNED |
| 5 | Operations & Inventory | Wire up Operations and Inventory pages to active GraphQL queries. | M4 | PLANNED |
| 6 | Settings | Wire up Settings and Security pages (profile, password changes). | M5 | PLANNED |
| 7 | Seeding & Verification | Implement database seeds and perform final verification. | M6 | PLANNED |

## Interface Contracts
- GraphQL endpoints should return standard Apollo errors with correct GraphQL formats.
- DTO Validation errors must throw `BadRequestException` (or similar) triggering formatted user-friendly messages.
