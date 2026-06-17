# Dashboard Tablet-Responsive Design

**Date**: 2026-06-17
**Author**: AmanVatsSharma
**Status**: Draft
**Scope**: `/dashboard/*` routes only

## Problem

The SpaceJam dashboard is desktop-only. At tablet widths (768-1023px) the layout breaks: the 80px sidebar + 83px header + 64px main padding consume ~280px of horizontal chrome, and the remaining content area (~480-700px) cannot hold the existing 3-column home grid, the 2-column inventory layout, or tables with 5+ columns. There is no mobile support in scope.

## Goals

1. Dashboard pages render correctly from **768px to 1023px** ("small tablet" / "compact") without horizontal scroll, overflow, or visual breakage.
2. The existing **desktop layout at 1024px+ is unchanged** — same Figma fidelity, same element placement, same relationships.
3. The compact layout is the **default at the smallest supported width** (i.e. compact-first, desktop-second). This matches the user's "design is for tablet, not desktop" stance.
4. **No layout rearranging at the page level**: the 3-column home grid stays 3-column, the 2-column inventory stays 2-column, tables stay tables. Density is adjusted, not the primary column structure. (Internal sub-layouts — e.g. a 2-column "back-to-list + actions" row inside a detail page — may stack vertically at compact when needed to prevent overflow; this is sub-row wrapping, not page-level rearrangement.)
5. **No new interaction patterns**: no hamburger menus, no drawer toggles, no stacked mobile-style layouts. Sidebar stays always visible.

## Out of Scope

- Viewports below 768px (mobile is explicitly not in scope).
- The `/set-up-new-center` wizard, `/changelog` page, sign-up/login pages, root landing page.
- Color, typography, or design-token changes. The Figma palette stays.
- NestJS API integration (frontend uses mock data today; that doesn't change).
- Per-page functionality changes (no new filters, no new tabs, no behavior changes).

## Breakpoint

A **single** new Tailwind variant named `compact:` that activates at `max-width: 1023.98px`. This means:

| Viewport        | State     | Existing classes apply | `compact:` classes apply |
|-----------------|-----------|------------------------|--------------------------|
| `< 768px`       | out of scope | yes                | yes                      |
| `768-1023px`    | compact   | yes                    | **yes (overrides)**      |
| `1024px+`       | regular   | yes (no change)        | ignored                  |

Below 768px is explicitly **unsupported**: the layout may show horizontal scroll, content may overflow, and the user accepts this state. The implementation will not add `compact:` overrides below 768px — `compact:` activates at `<1024px`, so sub-768px inherits the same density as the 768-1023 range, but no extra protection is added.

### Implementation: Tailwind v4 `@variant` directive

The variant is registered in `apps/web/src/app/globals.css` (Tailwind v4) using:

```css
@custom-variant compact (@media (max-width: 1023.98px));
```

This makes `compact:gap-3`, `compact:w-[64px]`, etc. valid utility classes. No JS is needed for breakpoint detection — Tailwind generates the corresponding media query.

If the project uses Tailwind v3 syntax in any config file, an alternative path is adding the variant in `tailwind.config.ts`:

```ts
plugins: [
  plugin(({ addVariant }) => addVariant('compact', '@media (max-width: 1023.98px)')),
]
```

The plan will verify which path the project uses (v3 vs v4) before implementing.

## Density Adjustments (the "shrink" rules)

### Sidebar (`apps/web/src/components/ui/sidebar.tsx`)

| Element            | Regular (≥1024px) | Compact (<1024px)  | Width saved |
|--------------------|-------------------|--------------------|-------------|
| Outer container    | `w-[80px] h-[560px] px-3` | `compact:w-[64px] compact:h-[480px] compact:px-2` | 16px |
| Inner column gap   | `gap-3`           | `compact:gap-1.5`  | ~12px vertical |
| Icon hit-area      | `w-[48px] h-[48px]` | `compact:w-[40px] compact:h-[40px]` | 16px hit box |
| Label text         | `text-[10px]`     | `compact:text-[9px]` | tighter |
| Nav-item column gap| `gap-1`           | `compact:gap-0.5`  | ~4px |

### Header (`apps/web/src/components/ui/header.tsx`)

| Element                | Regular           | Compact                       | Width saved |
|------------------------|-------------------|-------------------------------|-------------|
| Outer padding          | `px-8 h-[83px]`   | `compact:px-4` (height unchanged) | 64px total |
| Logo                   | `w-[120px] h-[50px]` | `compact:w-[100px] compact:h-[40px]` | 20px |
| Center nav button padding | `px-5 py-2`     | `compact:px-3 compact:py-1.5` | 16px |
| Center nav button text | `text-sm`         | `compact:text-xs`             | tighter |
| "Set Up New Center" button | full label    | icon-only, `compact:[&>span]:hidden` | ~90px |
| User profile card      | avatar + name + role + chevron | avatar + chevron, hide name+role via `compact:hidden` | ~110px |
| Notification bell      | unchanged         | unchanged                     | 0 |

### Layout (`apps/web/src/app/dashboard/layout.tsx`)

| Element            | Regular           | Compact                          | Width saved |
|--------------------|-------------------|----------------------------------|-------------|
| Outer flex row gap | `flex` (default 0) | `compact:gap-2`                 | tighter |
| Main content padding | `px-8 py-6`     | `compact:px-4 compact:py-4`      | 64px horizontal |
| Main scroll        | `overflow-y-auto`  | unchanged                       | — |

**Net horizontal reclaim at 768px viewport: ~150-170px** (chrome shrinks) + **~64px** (content padding shrinks) = **~220px more content width** than today. This is what makes the 3-column home grid fit at 768px.

### Typography scale

Heading sizes drop one step at compact. Body and label sizes stay (they're already compact).

| Class               | Regular | Compact          |
|---------------------|---------|------------------|
| `text-[22px]` (page title) | 22px | `compact:text-[18px]` |
| `text-xl` (section title)  | 20px | `compact:text-base`  |
| `text-base`         | 16px    | unchanged        |
| `text-sm` (body)    | 14px    | unchanged        |
| `text-xs` (labels)  | 12px    | unchanged        |
| `text-[10px]` (sidebar label) | 10px | `compact:text-[9px]` |

## Per-page Adjustments

The chrome and layout adjustments above propagate to all 21 dashboard pages automatically. The pages below need **explicit** per-page changes because they use hard-coded widths that escape the chrome system.

### Dashboard home (`apps/web/src/app/dashboard/page.tsx`)

- **Line 100-147 main grid**: `flex gap-6` → `compact:gap-3`
- **Line 109-110 middle column** (`TotalLeadCard` and `Quick Actions`): `w-[428px]` → `compact:w-[260px]` for `TotalLeadCard`, and the inner `w-[428px]` card on line 110 becomes `compact:w-full`
- **Line 114 quick actions grid**: `grid-cols-2 gap-3` → unchanged (already tight enough)
- **Line 87-92 welcome header buttons**: at compact, the "View Analytics" button gets `compact:hidden` (keep only the primary "Add New Member" button), saving ~120px of horizontal button row

### Inventory (`apps/web/src/app/dashboard/inventory/page.tsx`)

- **Line 98 outer flex**: `flex gap-6` → `compact:gap-3`
- **LocationSidebar component** (`apps/web/src/components/ui/location-sidebar.tsx`): root container width is hard-coded — change to `compact:w-[200px]` (from whatever the regular width is, likely `w-[280px]`)
- **Line 124-129 "Add Floor" button**: label-only becomes icon-only at compact via the same `[&>span]:hidden` pattern

### Operations / Revenue / Customers / Leads (table-heavy pages)

Every page that renders `<table className="w-full">` needs the table's parent wrapper to have `overflow-x-auto compact:overflow-x-auto` (the class is just `overflow-x-auto` — the `compact:` prefix isn't needed if the wrapper has fixed constraints, but the wrapper itself needs to exist). Pattern to apply everywhere:

```tsx
// Before
<table className="w-full">...</table>

// After — wrap in scroll container
<div className="overflow-x-auto">
  <table className="w-full">...</table>
</div>
```

The `w-full` table inside the scroll container will keep its natural width; if it exceeds the container, the container scrolls horizontally. No columns are hidden.

**Pages requiring this wrap** (verified via grep `class="w-full"` on `<table>`):
- `apps/web/src/app/dashboard/operations/page.tsx` (3 tables, lines 125, 178, 296)
- `apps/web/src/app/dashboard/revenue/page.tsx` (3 tables, lines 178, 235, 296)
- `apps/web/src/app/dashboard/crm/customers/page.tsx`
- `apps/web/src/app/dashboard/crm/leads/page.tsx`
- `apps/web/src/app/dashboard/report/page.tsx` (if it has tables)
- `apps/web/src/app/dashboard/bookings/page.tsx` (if it has tables)

### Stat-card grids (`grid-cols-4`)

The `<StatCards />` component renders 4 cards in a `grid-cols-4 gap-4` row. At 768px content width minus 32px card padding = ~636px / 4 = ~159px per card, which is workable. If real-world testing shows crowding, the fallback is `compact:grid-cols-2` to get ~318px per card. The plan will test at 768px first, then decide whether the fallback is needed.

### CRM detail pages

`apps/web/src/app/dashboard/crm/customers/[id]/page.tsx` and `apps/web/src/app/dashboard/crm/leads/[id]/page.tsx`:

- The "back to list" + title row: `flex justify-between` → `compact:flex-col compact:gap-2` so the action buttons wrap below the title instead of competing for horizontal space.
- Internal info sections rendered as 2-column `grid-cols-2 gap-6` → `compact:grid-cols-1 compact:gap-3`. (The outer "list of customers/leads" pages keep 2-column because they're full-width tables; only the detail page's internal info grid is 2-column.)

### Floors (`apps/web/src/app/dashboard/floors/page.tsx`)

- The floor/seat grid is currently a `grid grid-cols-...` with implicit column counts. Inspect the file and add `compact:grid-cols-1` if it's currently 2+ columns, to avoid horizontal squeeze.

### Location (`apps/web/src/app/dashboard/location/page.tsx`)

- Same treatment as Inventory: if it has a right sidebar, drop its width at compact and tighten outer gaps.

## Files Changed

### High-touch (3 files — chrome)
1. `apps/web/src/components/ui/sidebar.tsx`
2. `apps/web/src/components/ui/header.tsx`
3. `apps/web/src/app/dashboard/layout.tsx`

### Per-page (5-7 files)
4. `apps/web/src/app/dashboard/page.tsx` (home — 3-column grid)
5. `apps/web/src/app/dashboard/inventory/page.tsx`
6. `apps/web/src/app/dashboard/operations/page.tsx` (table wraps + grid-cols-2 collapse)
7. `apps/web/src/app/dashboard/revenue/page.tsx` (table wraps)
8. `apps/web/src/app/dashboard/crm/customers/page.tsx` (table wrap)
9. `apps/web/src/app/dashboard/crm/leads/page.tsx` (table wrap)
10. `apps/web/src/app/dashboard/crm/customers/[id]/page.tsx` (detail layout)
11. `apps/web/src/app/dashboard/crm/leads/[id]/page.tsx` (detail layout)
12. `apps/web/src/app/dashboard/floors/page.tsx` (if multi-col grid)
13. `apps/web/src/app/dashboard/location/page.tsx` (if right sidebar)
14. `apps/web/src/components/ui/location-sidebar.tsx` (right sidebar width)

### Tailwind variant registration (1 file)
15. `apps/web/src/app/globals.css` (Tailwind v4 `@custom-variant`) OR `apps/web/tailwind.config.ts` (v3 plugin)

### Documentation (1 file)
16. `apps/web/CLAUDE.md` — append a "Responsive Breakpoints" section noting the `compact:` variant and 768px floor

**Total: ~15-16 files** depending on what floors/location/bookings/report reveal during implementation.

## Validation

### Manual test cases

For each modified page, the implementation must be visually verified at:
- **768px width** (iPad portrait) — the "smallest supported" target
- **1024px width** (iPad landscape) — the breakpoint boundary
- **1280px width** (small desktop) — must look identical to today

Verification per page:
1. No horizontal scrollbar on the viewport.
2. No content cut off / clipped / overlapping.
3. Sidebar still readable (icons recognizable, labels legible).
4. Tables either fit fully or scroll horizontally inside their container, not the viewport.
5. Right-side widgets (Location tree, Tasks card) still visible and not broken.
6. Header items (logo, nav pill, action buttons, profile) all visible without overlap.

### Tooling

Use the dev server (`npx nx dev web`) and Chrome DevTools device-emulation at 768px and 1024px viewport widths. Capture a screenshot at each width for each page and compare against the desktop baseline. The dev server runs on **port 3001** (changed from 3000 because the MailZen monorepo's `next start` production server holds port 3000 on this machine). URL for verification: `http://localhost:3001/dashboard/inventory`.

### Regression check

After implementation, build the production bundle to ensure no Tailwind class-purging issues:
```sh
npx nx build web
```
Then visually verify the home page at 1280px hasn't changed from today's screenshot.

## Risks

1. **Hard-coded widths in unexpected places**: pages we haven't inspected (floors, location, settings, bookings) may have their own `w-[XXXpx]` patterns. The plan will grep for `w-\[\d` across `apps/web/src/app/dashboard/**/*.tsx` to find all of them up front.
2. **Tailwind class purging**: with v4, classes used only inside ternary expressions or only added in a future commit may be purged. We'll verify the build output contains the `compact:` variants we use.
3. **CSS Modules interaction**: a few components use CSS Modules (e.g. `set-up-new-center.module.css`). If responsive overrides are needed in those, they need `@media` rules in the module file, not Tailwind variants. The plan will check the few module-CSS files for any layout-relevant rules.
4. **Hard-coded `min-w-[XXXpx]` on cards/rows**: some cards have `min-w-[320px]` or similar to prevent shrinking below readable size. At compact, this can fight the table's horizontal scroll. The plan will identify and override these where needed (`compact:min-w-0`).

## Decisions Log

- **Single `compact:` variant** instead of two breakpoints (compact at 768, regular at 1024): one breakpoint is simpler to reason about and matches the user's "modest density bump" preference. Two breakpoints would force us to define and validate a third density tier.
- **Sidebar stays always visible**: ruled out hamburger/drawer because the sidebar is a primary navigation surface and hiding it adds interaction cost. Compress width instead.
- **Tables get horizontal scroll inside their container**: ruled out hide-columns-on-mobile because CRM/operations data is read-only and hiding columns hides data. Horizontal scroll preserves all data with no markup loss.
- **No JS for breakpoint detection**: ruled out body-class swap because it causes flash-of-unstyled-content. Pure Tailwind variant generates the media query at build time with zero runtime cost.

## Open Questions (resolved during brainstorming)

- ~~Which breakpoint?~~ → `<1024px` is compact, `≥1024px` is regular.
- ~~Sidebar behavior?~~ → stays visible, shrinks 80→64px.
- ~~Right sidebars?~~ → stay in their column, get narrower, no drawer/stack.
- ~~Tables?~~ → horizontal scroll inside container, all columns visible.
- ~~Density level?~~ → modest (one-step font reduction, 24→16 padding, 24→16 gap).

## Acceptance Criteria

The implementation is complete when:

- [ ] `compact:` Tailwind variant is registered and produces utility classes.
- [ ] All 21 dashboard pages render without horizontal scroll at 768px viewport in Chrome DevTools.
- [ ] All 21 dashboard pages look identical to today at 1280px viewport.
- [ ] The 3-column home grid still has 3 columns at 768px (just narrower).
- [ ] The 2-column inventory layout still has 2 columns at 768px (just narrower).
- [ ] All data tables either fit fully at 768px or scroll horizontally inside a contained wrapper.
- [ ] The `npx nx build web` production build succeeds.
- [ ] CLAUDE.md has a "Responsive Breakpoints" section.
