# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpaceJam is a coworking space management system built as an Nx 22 monorepo with four apps:

| App | Project | Tech |
|-----|---------|------|
| Web | `web` | Next.js 16 (React 19), Apollo GraphQL, Tailwind v4, CSS Modules |
| API | `api` | NestJS 11, GraphQL (code-first), TypeORM, PostgreSQL, Redis |
| Mobile | `mobile` | Expo ~54 (Expo SDK 57), React Native |
| E2E | `web-e2e` | Playwright against the web app |

Package manager: npm workspaces. Nx commands use `npx nx` (Nx is a devDependency, not globally installed).

## Development Commands

### Running Apps

```sh
npx nx dev web          # Next.js dev server (port 3000)
npx nx serve api        # NestJS dev server (port 4000)
npx nx start mobile     # Expo dev server
```

### Building

```sh
npx nx build web        # Next.js production build
npx nx build api        # NestJS production build
```

### Tests

```sh
# Web unit tests (Vitest)
npx nx test web
npx nx test web -- --run path/to/file.test.ts    # single file, CI mode

# API tests (Vitest, configured at apps/api/vitest.config.ts)
npx nx test api

# Playwright E2E (web + api-e2e)
npx nx e2e web
npx nx e2e api-e2e
npx nx e2e web -- --grep="test name"             # single test by name
```

### Formatting

```sh
npx nx format:check      # Prettier dry-run across workspace
npx nx format:write      # Prettier fix across workspace
```

### Nx Utilities

```sh
npx nx show projects             # list all projects
npx nx graph                     # visual project dependency graph
npx nx sync                      # sync TypeScript project references
npx nx affected:test --base=main # run tests affected by changes
```

## Architecture

### Data Flow (Frontend)

1. **GraphQL-first**: Pages consume data via `useQuery`/`useMutation` from domain hook files under `apps/web/src/hooks/` (e.g., `use-operations.ts`, `use-inventory.ts`). All operations are defined in `apps/web/src/lib/apollo/operations.ts`.
2. **Auth**: JWT access + refresh tokens stored in cookies. `auth-context.tsx` manages user state. Apollo client attaches access tokens and refreshes silently on 401.
3. **Route guard**: `proxy.ts` (Next.js 16) checks cookies for auth tokens, redirects unauthenticated users, and enforces role-based access to admin routes. Not a middleware — it runs as a proxy.

### Backend

- **GraphQL schema**: SDL at `apps/api/src/graphql/schema.graphql` is the source of truth. Resolvers are code-first and mirror it.
- **Entities & migrations**: TypeORM entities in `apps/api/src/typeorm/entities/`. Migrations in `apps/api/src/typeorm/migrations/`. Run via TypeORM CLI (configured in `apps/api/package.json`).
- **Auth**: Passport + JWT strategy. Access tokens (15 min) + refresh tokens (7 days). 2FA via TOTP. Guards: `@UseGuards(GqlAuthGuard)` on resolvers, `@CurrentUser()` for user injection.
- **Caching**: Redis-backed with in-memory fallback. DataLoader batching for N+1 prevention.
- **Observability**: Pino logging (JSON), OpenTelemetry tracing, Prometheus metrics at `/api/metrics`.

### Key Conventions

- **Path alias**: `@/*` maps to `apps/web/src/*`.
- **Styling**: Tailwind for layout/spacing; CSS Modules for component-specific styles, animations, and complex selectors. Responsive breakpoint: `compact:` (max-width 1023.98px).
- **Tables**: wrap in `overflow-x-auto` for horizontal scroll at compact widths.
- **Design tokens** (use consistently, don't hardcode alternatives):
  - Primary orange `#FF6A2F`, background `#FBF6F4`, card `#FFFFFF`, border `#E5E7EB`
  - Text: `#1F1F1F` (dark), `#4A5565` (gray), `#6A7282` (muted)
  - Cards: `border-radius: 14px`, `padding: 16px 24px`. Buttons: `border-radius: 10px`, `padding: 10px 20px`.
- **File headers**: Every TS/TSX file should include the module/purpose/author/date header block.
- **Toasts**: use `toast` from `sonner` (mounted in dashboard layout).

### Mock-Fallback Convention

Many pages render mock data when the GraphQL response is empty: `const rows = data?.items?.length ? data.items : MOCK_ITEMS`. Preserve mock fallbacks unless the backend for that page is fully verified.

**Known limitation**: `/dashboard/page.tsx` is an unwired demo duplicate of `/dashboard/home/page.tsx` (hardcoded placeholder data, unwired Add modals). Settings pages (finance/notification/security + permissions tab) have no backend entity — toggles and Save buttons are purely cosmetic.

## Environment Variables

| Scope | File | Key vars |
|-------|------|----------|
| Backend | `apps/api/.env` | `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `REDIS_HOST`, `REDIS_PORT`, `PORT` (default 4000), `CORS_ORIGIN`, `NODE_ENV` |
| Frontend | `apps/web/.env.local` | `NEXT_PUBLIC_GRAPHQL_HTTP_URL`, `NEXT_PUBLIC_GRAPHQL_WS_URL` |
| Mobile | `apps/mobile/.env` | Expo/EAS vars |

## Production Server

### SSH Access

```sh
ssh -i "C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem" ubuntu@ec2-98-130-45-181.ap-south-2.compute.amazonaws.com
```

| Field | Value |
|---|---|
| Instance ID | `i-040fe592978e19408` |
| Region | `ap-south-2` |
| Public DNS | `ec2-98-130-45-181.ap-south-2.compute.amazonaws.com` |
| SSH user | `ubuntu` |
| Key | `C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem` |
| Production URL | `https://spacejam.vedpragya.com` |

Security group: inbound **22, 80, 443**. Outbound: default.

### Server Environment

| Component | Detail |
|---|---|
| PM2 process (frontend) | `spacejam-web` — port 3000, `HOSTNAME=0.0.0.0` |
| PM2 process (backend) | `spacejam-api` — port 4000 |
| Node version | v20.20.2 (NVM managed, path: `~/.nvm/versions/node/v20.20.2/`) |
| Repo path | `/home/ubuntu/spacejam` |
| Next.js binary | **Hoisted** to `/home/ubuntu/spacejam/node_modules/next/dist/bin/next` (NOT `apps/web/node_modules/next/...`) |

### PM2 Quirks (non-interactive SSH)

1. **Always prefix remote commands with `bash -lc`** — `pm2` and `node` are only on `$PATH` in a login shell that sources `~/.profile`:
   ```sh
   ssh -i "..." ubuntu@ec2-... 'bash -lc "pm2 status"'
   ```

2. **PM2 v7 PID file** — The auto-generated `pm2-ubuntu.service` uses `Type=forking` but PM2 v7 doesn't write the PID file. A drop-in override at `/etc/systemd/system/pm2-ubuntu.service.d/override.conf` fixes this (`Type=oneshot`, `PIDFile=` cleared). If you ever re-run `pm2 startup`, the override survives — verify with `systemctl cat pm2-ubuntu`.

3. **Hoisted `next` binary** — The correct path is `/home/ubuntu/spacejam/node_modules/next/dist/bin/next`. The PM2 process is launched with `--cwd /home/ubuntu/spacejam/apps/web` so Next's own resolution works. Do NOT use `apps/web/node_modules/next/dist/bin/next`.

### Deploy Workflow

```sh
# 1. Build locally
npx nx build web && npx nx build api

# 2. Archive and copy
cd <repo root>
git archive --format=tar.gz HEAD -o update.tar.gz
scp -i "C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem" update.tar.gz ubuntu@ec2-98-130-45-181.ap-south-2.compute.amazonaws.com:/home/ubuntu/

# 3. SSH in and deploy
ssh -i "C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem" ubuntu@ec2-98-130-45-181.ap-south-2.compute.amazonaws.com
# Then run:
bash /home/ubuntu/deploy.sh   # (uses /home/ubuntu/deploy.sh, not scripts/deploy.sh)
```

The `deploy.sh` script:
- Extracts the archive to `/home/ubuntu/spacejam`
- Writes `.env` files for both `apps/web` and `apps/api`
- Runs `npx nx build web` (frontend) and `tsc` (backend)
- Starts/restarts PM2 processes: `spacejam-web` (frontend) and `spacejam-api` (backend)
- Uses `pm2 resurrect` to restore the process list

### Environment Variables (Production)

Frontend (`apps/web/.env`):
- `NEXT_PUBLIC_GRAPHQL_HTTP_URL` — backend GraphQL endpoint (proxied by nginx)
- `NEXT_PUBLIC_GRAPHQL_WS_URL` — WebSocket endpoint for subscriptions

Backend (`apps/api/.env`):
- `DATABASE_URL` — PostgreSQL connection
- `JWT_SECRET` — JWT signing secret
- `REFRESH_TOKEN_SECRET` — Refresh token secret
- `REDIS_HOST` / `REDIS_PORT` — Redis connection
- `PORT=4000` — Backend port
- `CORS_ORIGIN` — Frontend origin for CORS
- `FRONTEND_URL` — Frontend URL
- `NODE_ENV=production`

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

## Mobile Notes

The mobile app uses Expo ~54 (SDK 57). Always check versioned Expo docs before writing mobile code: https://docs.expo.dev/versions/v57.0.0/

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
