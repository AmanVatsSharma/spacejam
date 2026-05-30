# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpaceJam is a coworking space management system built as an Nx monorepo with:
- **Frontend**: Next.js 16 (React 19) with Tailwind CSS v4 and CSS Modules
- **Backend**: NestJS (apps/api/) - endpoints built as features are added
- **Package manager**: npm (use `npm exec nx` or `npx nx` for Nx commands)
- **Dev server**: Port 3000 (auto-selects next available: 3001, etc.), Turbopack enabled

---

## Development Commands

### Running the App
```sh
npx nx dev web              # Start dev server
npx nx build web            # Production build
npx nx start web            # Start production server
```

### Nx Workspace
```sh
npx nx graph                # Visual project dependency graph
npx nx list                 # List all projects
npx nx sync                 # Sync TypeScript project references
```

### Testing
```sh
npx nx test web             # Run unit tests
npx nx e2e web              # Run E2E tests (Playwright)
```

### Troubleshooting
| Issue | Fix |
|-------|-----|
| Tailwind/PostCSS error | `npm install @tailwindcss/postcss --workspace=apps/web` |
| Build cache issues | `rm -rf apps/web/.next` then rebuild |
| Port 3000 occupied | Next.js auto-selects 3001, etc. |

---

## Architecture

### Dashboard Layout Pattern

The dashboard uses a nested layout system:

```
apps/web/src/app/
├── layout.tsx                 # Root layout (fonts, globals)
├── page.tsx                   # Redirects to /dashboard/inventory
├── globals.css                # CSS variables, Tailwind imports
├── dashboard/
│   ├── layout.tsx             # Dashboard wrapper: Header + Sidebar (all /dashboard/* routes)
│   ├── page.tsx               # Dashboard home
│   ├── inventory/page.tsx      # Inventory management
│   ├── bookings/page.tsx       # Full booking management
│   ├── floors/page.tsx         # Floor/seat grid visualization
│   ├── location/page.tsx        # Location management
│   ├── crm/page.tsx            # CRM (partial)
│   ├── revenue/page.tsx        # Revenue (partial)
│   ├── report/page.tsx         # Reports
│   ├── operations/page.tsx     # Operations (bookings table)
│   └── settings/page.tsx       # Settings (partial)
└── set-up-new-center/         # 5-step wizard modal component
```

### Sidebar Navigation

The sidebar (`components/ui/sidebar.tsx`) uses `usePathname()` for active states. When adding new routes, update the sidebar links array to include the new page.

Current routes:
- `/dashboard` → Dashboard home
- `/dashboard/crm` → CRM
- `/dashboard/revenue` → Revenue
- `/dashboard/operations` → Operations
- `/dashboard/report` → Reports
- `/dashboard/inventory` → Inventory
- `/dashboard/settings` → Settings
- `/dashboard/location` → Location Management
- `/dashboard/floors` → Floor & Seats
- `/dashboard/bookings` → Booking Management

### Component Pattern

```typescript
'use client';  // Required for components with hooks/event handlers

import styles from './ComponentName.module.css';

interface Props {
  active?: boolean;
  onAction?: () => void;
}

export default function ComponentName({ active, onAction }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Tailwind for layout/spacing */}
      {/* CSS Modules for component-specific styles */}
    </div>
  );
}
```

### CSS Module Pattern

Use CSS Modules for component-specific complex styles:
```css
.container { position: relative; padding: 16px; }
.header { font-size: 18px; font-weight: 600; color: #1F1F1F; }
```

---

## Design System

### Colors
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

### Typography
- Headings: SemiBold/Medium, 18-24px
- Body: Regular, 14-16px
- Small/labels: 12-14px

### Border Radius
- Cards: 14px (`rounded-2xl`)
- Buttons: 10-12px (`rounded-xl`)
- Small elements: 8px (`rounded-lg`)

### Component Styles
```css
/* Card */
background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 14px; padding: 16px 24px;

/* Primary button */
background: #FF6A2F; color: white; border-radius: 10px; padding: 10px 20px;

/* Table rows */
background: #F9FAFB; border-bottom: 1px solid #E5E7EB; padding: 12px 20px;
```

---

## Nx Workspace Configuration

The workspace uses Nx plugins configured in `nx.json`:
- `@nx/next/plugin` - Next.js apps (web)
- `@nx/nest/plugin` - NestJS apps (api)
- `@nx/js/typescript` - TypeScript library support
- `@nx/playwright/plugin` - E2E testing

Nx generators configured for `@nx/next`:
```json
"generators": {
  "@nx/next": {
    "application": { "style": "css", "linter": "none" }
  }
}
```

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

- **No emoji** in commit messages
- Use imperative mood: "Add feature" not "Added feature"
- Reference issue numbers if applicable

---

## Key Implementation Notes

1. **Set Up New Center Modal**: Lives in `apps/web/src/app/set-up-new-center/` as a multi-step wizard. Steps 3-5 (Floor Setup, Space Setup, Review) are partial placeholders.

2. **Mock Data Pattern**: All pages use mock data currently. Ready for NestJS backend integration as endpoints are built.

3. **CSS Modules + Tailwind**: Pages use CSS Modules for component styles and Tailwind for layout/spacing. Avoid mixing patterns inconsistently.

4. **Active State**: Sidebar uses `usePathname()` from `next/navigation` - no prop drilling needed.

5. **Frontend-only Mode**: The app currently runs as a standalone frontend. NestJS backend in `apps/api/` is not yet connected to the frontend.

---

## Figma Design Reference

URL: https://www.figma.com/design/9dp9Zo8fxieN6DLgMYdAhE/spacejam-Dv-Team-final--Copy-?node-id=0-1

Design sections:
1. Inventory - ✅ Complete
2. Location Management - ✅ Complete
3. Floor/Seats Overview - ✅ Complete
4. Booking Management - ✅ Complete
5. Revenue & Reports - ⚠️ Partial (needs real data)

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->
