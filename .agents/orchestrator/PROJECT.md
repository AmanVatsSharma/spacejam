# Project: Spacejam CRM Audit

## Architecture
- **Frontend Dashboard**: A NextJS application located in `apps/web`.
  - Defines sidebar routes under `apps/web/src/components/ui/sidebar.tsx` and maps pages under `apps/web/src/app/dashboard/...`.
- **Backend API**: A NestJS server in `apps/api`.
  - Provides REST and GraphQL (GraphQL resolvers under `apps/api/src/crm/` / rest controllers under `apps/api/src/revenue/`, etc.) endpoints for dashboard queries.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Route Discovery & Verification | Inspect `sidebar.tsx` and map all routes to NestJS controller/resolver endpoints in `apps/api`. | none | DONE |
| 2 | Backend Robustness Audit | Evaluate `apps/api` for validation, error handling, test coverage, and security, finding vulnerabilities. | none | DONE |
| 3 | Final Audit Report | Compile a comprehensive markdown report listing route statuses and robustness audit findings. | M1, M2 | DONE |

## Interface Contracts
- The frontend interacts with the backend using REST APIs and GraphQL.
- API endpoints are generally configured to point to `localhost:3000` (or configured via environment variables).
