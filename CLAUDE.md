# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpaceJam is a coworking space management system built as an Nx monorepo with:
- **Frontend**: Next.js 16 (React 19) with Tailwind CSS v4 and CSS Modules
- **Backend**: NestJS (apps/api/) - GraphQL API with TypeORM, Auth (JWT + 2FA), Redis caching
- **Package manager**: npm (use `npm exec nx` or `npx nx` for Nx commands)
- **Dev server**: Port 3001 by default

---

## Development Commands

### Running the App
```sh
npx nx dev web              # Start frontend dev server (port 3001)
npx nx serve api            # Start backend dev server (port 4000)
npx nx build web            # Production build
npx nx build api            # Backend production build
```

### Testing
```sh
npx nx test web             # Run frontend unit tests (vitest)
npx nx e2e web              # Run Playwright E2E tests
```

### Nx Workspace
```sh
npx nx graph                # Visual project dependency graph
npx nx list                 # List all projects
npx nx sync                 # Sync TypeScript project references
```

### Troubleshooting
| Issue | Fix |
|-------|-----|
| Tailwind/PostCSS error | `npm install @tailwindcss/postcss --workspace=apps/web` |
| Build cache issues | `rm -rf apps/web/.next` then rebuild |
| Port occupied | Next.js auto-selects next available port |

---

## Frontend Architecture

### App Structure

```
apps/web/src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout → wraps with Providers (Apollo + Auth)
│   ├── page.tsx              # Root redirect
│   ├── global-error.tsx      # Global error boundary
│   ├── api/                  # Route handlers (GraphQL proxy endpoint)
│   ├── dashboard/
│   │   ├── layout.tsx        # Dashboard shell: Header + Sidebar + Content
│   │   ├── page.tsx          # Dashboard home
│   │   ├── home/             # Main dashboard (stats, charts)
│   │   ├── crm/              # CRM: leads, customers, onboarding (nested routes)
│   │   ├── revenue/          # Revenue: contracts, deposits, invoices
│   │   ├── operations/       # Operations: bookings, requests, meeting rooms
│   │   ├── inventory/        # Inventory management
│   │   ├── floors/           # Floor/seat grid
│   │   ├── location/         # Location management
│   │   ├── report/           # Reports
│   │   └── settings/         # Settings tabs
│   └── set-up-new-center/    # 5-step wizard modal
├── components/
│   ├── ui/                   # Shared UI primitives (header, sidebar, cards)
│   └── Providers.tsx          # ApolloProvider + AuthProvider wrapper
├── contexts/
│   ├── auth-context.tsx       # Auth state (user, tokens, signin/signup/2FA)
│   └── apollo-provider-wrapper.tsx  # Client-side Apollo + Auth mount
├── lib/
│   ├── apollo/
│   │   ├── client.ts          # Apollo Client instance (auth, refresh tokens)
│   │   ├── operations.ts      # All GraphQL operations (queries + mutations)
│   │   └── token-storage.ts   # Cookie-based token storage
│   ├── api.ts                 # Convenience fetch wrapper (non-React contexts)
│   ├── mock-data/             # Mock data per domain (crm, operations, revenue)
│   └── constants/             # Shared constants
├── hooks/
│   └── use-operations.ts      # Domain-specific Apollo hooks (meeting rooms, events, etc.)
├── proxy.ts                   # Next.js 16 route guard (auth, role checks)
├── types/                     # Shared TypeScript types
└── globals.css                # CSS variables, Tailwind imports
```

### Data Flow

1. **GraphQL-first**: All data fetching uses Apollo Client (`@/lib/apollo/operations.ts`). Pages consume data via `useQuery`/`useMutation` hooks defined in domain-specific hook files (e.g., `hooks/use-operations.ts`).
2. **Auth**: JWT access + refresh tokens stored in cookies. `auth-context.tsx` manages user state and auth mutations. Apollo client automatically attaches access tokens and handles silent refresh on 401.
3. **Mock data**: Each domain has mock data files in `lib/mock-data/`. Pages fall back to mock data when no backend is wired. The pattern is `const { data, loading } = useQuery(...)` with mock fallback in the component.
4. **Proxy (not middleware)**: `proxy.ts` is the Next.js 16 route guard. It checks cookies for auth tokens, redirects unauthenticated users, and enforces role-based access to admin routes.

### Component Pattern

```tsx
'use client';  // Required for any file using hooks/event handlers

import styles from './ComponentName.module.css';

interface Props { /* inline or imported */ }

export default function ComponentName({ active, onAction }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Tailwind for layout/spacing */}
      {/* CSS Modules for component-specific styles */}
    </div>
  );
}
```

### Styling Rules

- **Tailwind**: layout, spacing, grid, flexbox
- **CSS Modules**: component-specific styles, animations, complex selectors
- **Responsive**: use the `compact:` variant (triggers at `max-width: 1023.98px`) for tablet layouts
- **Tables**: always wrap in `overflow-x-auto` for horizontal scroll at compact width

### Design Tokens

| Purpose | Value |
|---------|-------|
| Primary orange | `#FF6A2F` (use consistently, not `#FF7847`) |
| Text dark | `#1F1F1F` / `#101828` |
| Text gray | `#4A5565` |
| Text muted | `#6A7282` / `#9CA3AF` |
| Background | `#FBF6F4` (warm cream) |
| Card background | `#FFFFFF` |
| Border | `#E5E7EB` |
| Success | `#10B981` |
| Error | `#EF4444` |

| Element | Style |
|---------|-------|
| Cards | `border-radius: 14px`, `padding: 16px 24px` |
| Buttons | `border-radius: 10px`, `padding: 10px 20px` |
| Table rows | `background: #F9FAFB`, `border-bottom: 1px solid #E5E7EB` |

### Path Alias

`@/*` maps to `apps/web/src/*` (configured in `apps/web/tsconfig.json`).

---

## Backend Architecture

```
apps/api/src/
├── main.ts                    # NestJS bootstrap (CORS, validation, body parser)
├── app/
│   └── app.module.ts          # Root module
├── auth/                      # Auth module (JWT, 2FA, magic link, password reset)
├── user/                      # User entity + service
├── crm/                       # Customer/lead management
├── booking/                   # Booking entity + service
├── meeting-room/              # Meeting room + events
├── request/                   # Booking requests
├── revenue/                   # Contracts, deposits, invoices
├── center/                    # Center/location management
├── event/                     # Events module
├── analytics/                 # Analytics module
├── health/                    # Health checks
├── cache/                     # Redis caching layer
├── observability/             # OpenTelemetry + Prometheus metrics
├── config/                    # Configuration module
├── graphql/
│   ├── schema.graphql         # SDL schema (source of truth)
│   ├── resolvers/             # GraphQL resolvers (one per domain)
│   ├── inputs/                # GraphQL input types
│   ├── types/                 # GraphQL output types
│   ├── guards/                # GraphQL auth guards (field-level + global)
│   ├── plugins/               # GraphQL plugins (rate limiting, complexity)
│   ├── dataloaders/           # DataLoader batching for N+1 prevention
│   └── pubsub/                # Subscription pub/sub (Redis-backed)
├── typeorm/                    # TypeORM entities, migrations, connections
└── prisma/                     # Legacy Prisma (migrated to TypeORM, being phased out)
```

### Key Backend Patterns

- **GraphQL-first**: Schema defined in SDL (`graphql/schema.graphql`), code-first resolvers mirror it
- **TypeORM**: Entities in `typeorm/` directory. Migrations run via TypeORM CLI.
- **Auth**: Passport + JWT strategy. Access tokens (15m) + refresh tokens (7d). 2FA via TOTP. Guard pattern: `@UseGuards(GqlAuthGuard)` on resolvers, `@CurrentUser()` for user injection.
- **Caching**: Redis-backed with in-memory fallback. DataLoader pattern for batching entity lookups.
- **Observability**: Pino logging (JSON), OpenTelemetry tracing, Prometheus metrics at `/api/metrics`.

---

## Environment Variables

The backend reads from `.env` (root). Key vars:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing secret
- `REDIS_HOST` / `REDIS_PORT` - Redis connection
- `PORT` - Backend port (default 4000)
- `FRONTEND_URL` - Frontend origin for CORS
- `NODE_ENV` - environment mode

The frontend reads from `apps/web/.env.local`:
- `NEXT_PUBLIC_GRAPHQL_HTTP_URL` - backend GraphQL endpoint

---

## Deployment

Production is a single EC2 instance (ap-south-2) running both frontend and backend behind nginx.
- Frontend: PM2 process `spacejam-web`, port 3000
- Backend: PM2 process `spacejam-api`, port 4000
- Nginx: reverse proxy + SSL termination
- Database: PostgreSQL (local or RDS)
- Cache: Redis (local or ElastiCache)

Update workflow: `git archive` → `scp` → extract on server → `npm install && npx nx build web` → `pm2 restart`

---

## File Header Format

All TypeScript/TSX files should include this header:

```typescript
/**
 * File:        path/to/file.tsx
 * Module:      Web · Dashboard · PageName
 * Purpose:     Brief description
 *
 * Author:      AmanVatsSharma
 * Last-updated: YYYY-MM-DD
 */
```

---

## Commit Conventions

- No emoji in commit messages
- Use imperative mood: "Add feature" not "Added feature"
- Reference issue numbers if applicable

---

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` for the full workflow reference.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

- Use `bd` for ALL task tracking -- do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Use `bd remember` for persistent knowledge -- do NOT use MEMORY.md files
- Issues live in a local Dolt DB; sync uses `refs/dolt/data` on the git remote; `.beads/issues.jsonl` is a passive export
