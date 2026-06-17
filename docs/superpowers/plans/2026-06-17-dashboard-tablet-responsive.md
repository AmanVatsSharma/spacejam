# Dashboard Tablet-Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SpaceJam dashboard render correctly at 768-1023px viewports (small tablet) without horizontal scroll, overflow, or visual breakage, while keeping the 1024px+ desktop layout unchanged.

**Architecture:** Register a single new Tailwind variant `compact:` that activates at `max-width: 1023.98px`. Add the variant via a Tailwind v3 plugin in `tailwind.config.js`. Update the three chrome components (sidebar, header, layout) and 7 dashboard pages to use `compact:` utility prefixes. Tables get wrapped in `overflow-x-auto` containers for horizontal scroll inside the page, not the viewport. No layout rearranging at the page level — the 3-column home grid stays 3-column, the 2-column inventory stays 2-column, just narrower.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v3 (with custom `compact:` plugin), TypeScript.

**Spec:** `docs/superpowers/specs/2026-06-17-dashboard-tablet-responsive-design.md`

**Dev port:** Server runs on `http://localhost:3001` (port 3000 is held by another workspace's `next start`).

---

## File Structure

### Files modified

1. `apps/web/tailwind.config.js` — register the `compact:` plugin
2. `apps/web/src/app/globals.css` — no changes (already imports tailwindcss)
3. `apps/web/src/components/ui/sidebar.tsx` — chrome: shrink 80→64px
4. `apps/web/src/components/ui/header.tsx` — chrome: collapse button + user card at compact
5. `apps/web/src/components/ui/location-sidebar.tsx` — right sidebar 320→200px
6. `apps/web/src/app/dashboard/layout.tsx` — main padding px-8→px-4
7. `apps/web/src/app/dashboard/page.tsx` — home: middle col 428→260px
8. `apps/web/src/app/dashboard/inventory/page.tsx` — outer gap, button icon-only
9. `apps/web/src/app/dashboard/operations/page.tsx` — table wraps, grid-cols-2 collapse
10. `apps/web/src/app/dashboard/revenue/page.tsx` — table wraps
11. `apps/web/src/app/dashboard/crm/customers/page.tsx` — table wrap, grid-cols-4 fallback
12. `apps/web/src/app/dashboard/crm/leads/page.tsx` — table wrap, grid-cols-4 fallback
13. `apps/web/src/app/dashboard/crm/customers/[id]/page.tsx` — back-to-list row stack, inner grid-cols-4
14. `apps/web/src/app/dashboard/crm/leads/[id]/page.tsx` — back-to-list row stack, inner grid-cols-4
15. `apps/web/src/app/dashboard/crm/[id]/page.tsx` — back-to-list row stack, inner grid-cols-4
16. `apps/web/src/app/dashboard/floors/page.tsx` — grid-cols-4 + grid-cols-3 collapse
17. `apps/web/src/app/dashboard/location/page.tsx` — grid-cols-3 collapse
18. `apps/web/src/app/dashboard/bookings/page.tsx` — table wrap (already has min-w on inner cells)
19. `apps/web/src/app/dashboard/report/page.tsx` — table wrap (if tables present)
20. `apps/web/CLAUDE.md` — append "Responsive Breakpoints" section

### No new files, no new dependencies

This change is pure utility-class additions. The Tailwind plugin is a 5-line `module.exports` addendum. No npm installs needed.

---

## Task 1: Register the `compact:` Tailwind variant

**Files:**
- Modify: `apps/web/tailwind.config.js`

- [ ] **Step 1: Verify the current config**

Read `apps/web/tailwind.config.js` (already known from recon — it's a v3 config with content paths under `src/app/**/*.{js,ts,jsx,tsx,mdx}` and `src/components/**/*.{js,ts,jsx,tsx,mdx}`). Confirm `plugins: []` on line 20.

- [ ] **Step 2: Add the `compact:` plugin**

Edit `apps/web/tailwind.config.js`. Replace the entire file with:

```js
/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF7847',
          light: '#FFF7ED',
          dark: '#FF6A3D',
        },
        background: '#FBF6F4',
        surface: '#FFFFFF',
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("compact", "@media (max-width: 1023.98px)");
    }),
  ],
};
```

- [ ] **Step 3: Verify the dev server picks up the change**

Run: `curl -sS http://localhost:3001/dashboard/inventory -o /dev/null -w "%{http_code}\n"`
Expected: `200`

If the server isn't running, start it: `NODE_OPTIONS="--max-old-space-size=1024" npx nx dev web` from the workspace root. It runs on port 3001.

- [ ] **Step 4: Commit**

```bash
git add apps/web/tailwind.config.js
git commit -m "feat(web): register compact: tailwind variant for tablet breakpoint

Adds a custom variant that activates at max-width: 1023.98px.
Used in subsequent tasks to apply density adjustments on tablet.

Co-authored-by: AmanVatsSharma"
```

---

## Task 2: Sidebar density adjustments (chrome)

**Files:**
- Modify: `apps/web/src/components/ui/sidebar.tsx`

- [ ] **Step 1: Add `compact:` classes to the outer `<nav>` element**

Find the `<nav>` opening tag on line 156. Its className is currently:

```
flex flex-col items-center py-4 px-3 bg-white rounded-3xl shadow-[0px_1px_2px_rgba(0,0,0,0.1)] w-[80px] h-[560px] ml-2 mt-4 sticky top-0
```

Replace it with (adds `compact:` variants for width, height, and padding):

```
flex flex-col items-center py-4 px-3 compact:py-3 compact:px-2 bg-white rounded-3xl shadow-[0px_1px_2px_rgba(0,0,0,0.1)] w-[80px] compact:w-[64px] h-[560px] compact:h-[480px] ml-2 mt-4 sticky top-0
```

- [ ] **Step 2: Add `compact:` classes to the inner scroll container**

Find the inner `<div>` on line 157. Its className is:

```
flex flex-col items-center gap-3 w-full overflow-y-auto scrollbar-hide
```

Replace with:

```
flex flex-col items-center gap-3 compact:gap-1.5 w-full overflow-y-auto scrollbar-hide
```

- [ ] **Step 3: Add `compact:` classes to each nav item link**

Find the `<Link>` element on lines 164-174. The relevant className (the icon hit-area) is:

```
flex items-center justify-center w-[48px] h-[48px] rounded-2xl cursor-pointer transition-all duration-200 no-underline
```

Replace with:

```
flex items-center justify-center w-[48px] h-[48px] compact:w-[40px] compact:h-[40px] rounded-2xl cursor-pointer transition-all duration-200 no-underline
```

- [ ] **Step 4: Add `compact:` classes to the nav item label**

Find the `<span>` on line 177. Its className is:

```
text-[10px] font-medium leading-none text-center
```

Replace with:

```
text-[10px] compact:text-[9px] font-medium leading-none text-center
```

- [ ] **Step 5: Verify the change**

Run: `curl -sS http://localhost:3001/dashboard -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect: open `http://localhost:3001/dashboard` in a browser, then resize to 900px width. The sidebar should be visibly narrower (64px) with tighter gaps and slightly smaller icon buttons. At 1280px, it should look identical to before.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ui/sidebar.tsx
git commit -m "feat(web): shrink sidebar at compact breakpoint

- 80px → 64px width
- 560px → 480px height
- 48px → 40px icon hit-area
- 10px → 9px label font
- 12px → 6px item gap

Co-authored-by: AmanVatsSharma"
```

---

## Task 3: Header density adjustments (chrome)

**Files:**
- Modify: `apps/web/src/components/ui/header.tsx`

- [ ] **Step 1: Reduce outer header padding at compact**

Find the `<header>` opening tag on line 30. Its className is:

```
h-[83px] flex justify-between items-center px-8 bg-[#FBF6F4] sticky top-0 z-50
```

Replace with:

```
h-[83px] flex justify-between items-center px-8 compact:px-4 bg-[#FBF6F4] sticky top-0 z-50
```

- [ ] **Step 2: Shrink the logo at compact**

Find the logo `<div>` on line 32. Its className is:

```
w-[120px] h-[50px]
```

Replace with:

```
w-[120px] h-[50px] compact:w-[100px] compact:h-[40px]
```

- [ ] **Step 3: Tighten center nav button padding and font at compact**

The three nav buttons (Location, Floor map, Table view) on lines 44-79 each have a className like:

```
px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
```

Replace each of the three with:

```
px-5 py-2 compact:px-3 compact:py-1.5 rounded-full text-sm compact:text-xs font-medium transition-all duration-200
```

- [ ] **Step 4: Hide the "Set Up New Center" button label at compact**

Find the button on lines 83-92. It has a `<span>Set Up New Center</span>` inside. Change the button's className from:

```
flex items-center gap-2 px-4 py-2.5 bg-[#FF6A2F] text-white rounded-xl font-medium text-sm hover:bg-[#E55A26] transition-colors shadow-sm
```

to:

```
flex items-center gap-2 px-4 py-2.5 compact:px-2.5 bg-[#FF6A2F] text-white rounded-xl font-medium text-sm hover:bg-[#E55A26] transition-colors shadow-sm
```

Then change the inner `<span>Set Up New Center</span>` to:

```tsx
<span className="compact:hidden">Set Up New Center</span>
```

- [ ] **Step 5: Hide the user name/role at compact**

Find the user-info `<div>` on lines 124-127. Its className is:

```
flex flex-col justify-center px-3 h-9
```

Replace with:

```
flex flex-col justify-center px-3 h-9 compact:hidden
```

- [ ] **Step 6: Verify the change**

Run: `curl -sS http://localhost:3001/dashboard -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px width. The header should show: smaller logo, tighter nav pill, "+" icon only (no "Set Up New Center" text), avatar + chevron only (no name/role). At 1280px, looks identical to before.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/ui/header.tsx
git commit -m "feat(web): condense header at compact breakpoint

- px-8 → px-4 outer padding
- logo 120×50 → 100×40
- nav pill 20px → 12px horizontal padding
- nav font sm → xs
- 'Set Up New Center' label hidden (icon only)
- user name/role hidden (avatar only)

Co-authored-by: AmanVatsSharma"
```

---

## Task 4: Layout main content padding (chrome)

**Files:**
- Modify: `apps/web/src/app/dashboard/layout.tsx`

- [ ] **Step 1: Reduce main content padding at compact**

Find the `<main>` element on line 42. Its className is:

```
flex-1 overflow-y-auto px-8 py-6
```

Replace with:

```
flex-1 overflow-y-auto px-8 py-6 compact:px-4 compact:py-4 min-w-0
```

Note: `min-w-0` is added to prevent the flex-1 main from refusing to shrink below its content's intrinsic min-width (a common cause of overflow with tables).

- [ ] **Step 2: Reduce outer flex row gap at compact**

Find the outer `<div className="flex">` on line 37. Change to:

```tsx
<div className="flex compact:gap-2">
```

- [ ] **Step 3: Verify**

Run: `curl -sS http://localhost:3001/dashboard/inventory -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px: the main content area should have noticeably tighter left/right padding.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/dashboard/layout.tsx
git commit -m "feat(web): reduce main content padding at compact

- px-8 → px-4, py-6 → py-4
- outer flex row gap 0 → 2 at compact
- min-w-0 on main to prevent overflow with tables

Co-authored-by: AmanVatsSharma"
```

---

## Task 5: Right sidebar (LocationSidebar) width reduction

**Files:**
- Modify: `apps/web/src/components/ui/location-sidebar.tsx`

- [ ] **Step 1: Reduce outer sidebar width at compact**

Find the `<aside>` opening tag on line 43. Its className is:

```
flex flex-col items-start py-6 px-6 gap-6 bg-white rounded-2xl shadow-sm w-[320px] h-[859px]
```

Replace with:

```
flex flex-col items-start py-6 px-6 compact:py-4 compact:px-3 compact:gap-3 bg-white rounded-2xl shadow-sm w-[320px] compact:w-[200px] h-[859px] compact:h-[480px] overflow-y-auto
```

- [ ] **Step 2: Adjust child button widths at compact**

Find the city button on line 50. Its className is:

```
flex items-center gap-2 w-[272px] h-[40px] px-3 rounded-xl bg-[#FFF5F2] hover:bg-[#FFEDE6] transition-colors
```

Replace with:

```
flex items-center gap-2 w-[272px] compact:w-full h-[40px] compact:h-[36px] px-3 compact:px-2 rounded-xl bg-[#FFF5F2] hover:bg-[#FFEDE6] transition-colors text-sm compact:text-xs
```

Find the center button on line 73. Its className is:

```
flex items-center gap-2 w-[325.8px] h-[40px] px-3 rounded-xl transition-colors text-left
```

Replace with:

```
flex items-center gap-2 w-[325.8px] compact:w-full h-[40px] compact:h-[36px] px-3 compact:px-2 rounded-xl transition-colors text-left
```

- [ ] **Step 3: Verify**

Run: `curl -sS http://localhost:3001/dashboard/inventory -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px: the location sidebar should be visibly narrower (200px) and fit on the right side of the inventory page without pushing content off-screen.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui/location-sidebar.tsx
git commit -m "feat(web): shrink location sidebar at compact

- 320px → 200px width
- 859px → 480px height (with overflow-y-auto)
- inner button widths 272/325.8 → w-full at compact
- padding 6 → 3, gap 6 → 3

Co-authored-by: AmanVatsSharma"
```

---

## Task 6: Dashboard home — middle column + welcome header

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`

- [ ] **Step 1: Reduce the 3-column main grid gap at compact**

Find the outer `<div className="flex gap-6 items-start">` on line 100. Replace with:

```tsx
<div className="flex gap-6 compact:gap-3 items-start">
```

- [ ] **Step 2: Reduce TotalLeadCard width at compact**

Find the `TotalLeadCard` on line 109. Its className is:

```
!w-[428px]
```

Replace with:

```
!w-[428px] compact:!w-[260px]
```

Note: the leading `!` (Tailwind important) needs to be preserved. The `compact:!w-[260px]` is the same `!` syntax to maintain the override.

- [ ] **Step 3: Reduce the Quick Actions card width at compact**

Find the `<div>` on line 110. Its className is:

```
bg-white rounded-[14px] shadow-sm p-5 w-[428px]
```

Replace with:

```
bg-white rounded-[14px] shadow-sm p-5 compact:p-3 w-[428px] compact:w-full
```

- [ ] **Step 4: Hide the "View Analytics" button at compact**

Find the "View Analytics" `<button>` on lines 87-89. Add `compact:hidden` to its className. Change from:

```
h-10 px-4 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#364152] hover:bg-gray-50 transition-colors
```

to:

```
h-10 px-4 compact:hidden bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#364152] hover:bg-gray-50 transition-colors
```

- [ ] **Step 5: Verify**

Run: `curl -sS http://localhost:3001/dashboard -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px: the 3-column home grid should still be 3-column but the middle column should be visibly narrower. "View Analytics" should be gone, "Add New Member" should remain. At 1280px, no change.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx
git commit -m "feat(web): tighten dashboard home grid at compact

- main grid gap 24 → 12
- TotalLeadCard 428 → 260
- Quick Actions card padding 5 → 3, width 428 → full
- 'View Analytics' button hidden

Co-authored-by: AmanVatsSharma"
```

---

## Task 7: Inventory page — outer gap + Add buttons icon-only

**Files:**
- Modify: `apps/web/src/app/dashboard/inventory/page.tsx`

- [ ] **Step 1: Reduce outer flex gap at compact**

Find `<div className="flex gap-6">` on line 98. Replace with:

```tsx
<div className="flex gap-6 compact:gap-3">
```

- [ ] **Step 2: Make "Add Center" button icon-only at compact**

Find the "Add Center" `<button>` on lines 109-114. Its className is:

```
flex items-center gap-2 bg-[#FF7847] text-white px-4 py-2 rounded-xl font-medium text-sm h-[36px] hover:bg-[#FF6A3D] transition-colors shadow-sm
```

Add `compact:px-2.5` and change the inner `<span>Add Center</span>` to `<span className="compact:hidden">Add Center</span>`. Final button:

```tsx
<button className="flex items-center gap-2 bg-[#FF7847] text-white px-4 py-2 compact:px-2.5 rounded-xl font-medium text-sm h-[36px] hover:bg-[#FF6A3D] transition-colors shadow-sm">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 3V13M3 8H13" />
  </svg>
  <span className="compact:hidden">Add Center</span>
</button>
```

- [ ] **Step 3: Make "Add Floor" button icon-only at compact**

Find the "Add Floor" `<button>` on lines 124-129. Apply the same treatment:

```tsx
<button className="flex items-center gap-2 bg-[#FF7847] text-white px-4 py-2 compact:px-2.5 rounded-xl font-medium text-sm h-[36px] hover:bg-[#FF6A3D] transition-colors shadow-sm">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 3V13M3 8H13" />
  </svg>
  <span className="compact:hidden">Add Floor</span>
</button>
```

- [ ] **Step 4: Verify**

Run: `curl -sS http://localhost:3001/dashboard/inventory -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px: the inventory page should show the main content + narrower right location sidebar side by side, both buttons icon-only. At 1280px, full text and original widths.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/dashboard/inventory/page.tsx
git commit -m "feat(web): tighten inventory layout at compact

- outer gap 24 → 12
- Add Center / Add Floor buttons: text hidden, padding tighter

Co-authored-by: AmanVatsSharma"
```

---

## Task 8: Operations page — table scroll wrapper + grid-cols-2 collapse

**Files:**
- Modify: `apps/web/src/app/dashboard/operations/page.tsx`

- [ ] **Step 1: Read the file to find table locations**

Run: `grep -n "table className" apps/web/src/app/dashboard/operations/page.tsx`

The file has 3 tables per the spec grep (lines 125, 178, 296). Read the surrounding 3 lines of each to find the parent wrapper.

- [ ] **Step 2: Wrap each `<table>` in `overflow-x-auto` container**

For each table found, the parent `<div>` immediately wrapping the `<table>` needs `overflow-x-auto` added. The pattern is:

Before:
```tsx
<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
  <table className="w-full">
```

After:
```tsx
<div className="bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
  <table className="w-full">
```

Apply this to all 3 tables in operations/page.tsx.

- [ ] **Step 3: Add `compact:grid-cols-1` to the `grid-cols-2` sub-section**

Find the `<div className="grid grid-cols-2 gap-6">` on line 357. Replace with:

```tsx
<div className="grid grid-cols-2 compact:grid-cols-1 gap-6 compact:gap-3">
```

- [ ] **Step 4: Verify**

Run: `curl -sS http://localhost:3001/dashboard/operations -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px: the 2-column "Pending Check-ins / Pending Check-outs" sub-section should stack vertically. The bookings table should scroll horizontally inside its container, not the page. The page-level "tab" selector row at the top should still fit.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/dashboard/operations/page.tsx
git commit -m "feat(web): wrap operations tables and stack 2-col at compact

- 3 tables wrapped in overflow-x-auto
- grid-cols-2 → compact:grid-cols-1 with tighter gap

Co-authored-by: AmanVatsSharma"
```

---

## Task 9: Revenue page — table scroll wrappers

**Files:**
- Modify: `apps/web/src/app/dashboard/revenue/page.tsx`

- [ ] **Step 1: Read to find table locations**

Run: `grep -n "table className" apps/web/src/app/dashboard/revenue/page.tsx`

The file has 3 tables per the spec grep (lines 178, 235, 296).

- [ ] **Step 2: Wrap each table's parent div in `overflow-x-auto`**

Same pattern as Task 8 step 2. For each:

Before:
```tsx
<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
  <table className="w-full">
```

After:
```tsx
<div className="bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
  <table className="w-full">
```

Apply to all 3 tables.

- [ ] **Step 3: Verify**

Run: `curl -sS http://localhost:3001/dashboard/revenue -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px: tables scroll horizontally inside their containers. Page should not have viewport-level horizontal scroll.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/dashboard/revenue/page.tsx
git commit -m "feat(web): wrap revenue tables in overflow-x-auto

3 tables wrapped for horizontal scroll inside container.

Co-authored-by: AmanVatsSharma"
```

---

## Task 10: CRM customers list — table wrap + grid-cols fallback

**Files:**
- Modify: `apps/web/src/app/dashboard/crm/customers/page.tsx`

- [ ] **Step 1: Read to find table and grid locations**

Run: `grep -n "table className\|grid-cols-" apps/web/src/app/dashboard/crm/customers/page.tsx`

The file has at least one table and the grids are at lines 141 (`grid-cols-4`), 156 (`grid-cols-3`).

- [ ] **Step 2: Wrap each `<table>`'s parent div in `overflow-x-auto`**

Same pattern as Task 8 step 2. Apply to all tables found.

- [ ] **Step 3: Add compact fallbacks to the stat-card grid**

Find `<div className="grid grid-cols-4 gap-4 mb-6">` on line 141. Replace with:

```tsx
<div className="grid grid-cols-4 compact:grid-cols-2 gap-4 compact:gap-3 mb-6">
```

- [ ] **Step 4: Add compact fallback to the 3-col grid**

Find `<div className="grid grid-cols-3 gap-6">` on line 156. Replace with:

```tsx
<div className="grid grid-cols-3 compact:grid-cols-2 gap-6 compact:gap-3">
```

- [ ] **Step 5: Verify**

Run: `curl -sS http://localhost:3001/dashboard/crm/customers -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px: 4 stat cards become 2x2 grid, 3-col customer cards become 2-col. Tables scroll inside their containers.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/dashboard/crm/customers/page.tsx
git commit -m "feat(web): tighten CRM customers list at compact

- stat-card grid-cols-4 → compact:grid-cols-2
- 3-col customer cards → compact:grid-cols-2
- tables wrapped in overflow-x-auto

Co-authored-by: AmanVatsSharma"
```

---

## Task 11: CRM leads list — table wrap + grid-cols fallback

**Files:**
- Modify: `apps/web/src/app/dashboard/crm/leads/page.tsx`

- [ ] **Step 1: Read to find table and grid locations**

Run: `grep -n "table className\|grid-cols-" apps/web/src/app/dashboard/crm/leads/page.tsx`

The file has at least one table; the grids are at lines 175 (`grid-cols-4`) and 191 (`grid-cols-3`).

- [ ] **Step 2: Wrap each `<table>`'s parent div in `overflow-x-auto`**

Same pattern as Task 8 step 2. Apply to all tables found.

- [ ] **Step 3: Add compact fallback to the 4-col stat grid**

Find `<div className="grid grid-cols-4 gap-4 mb-6">` on line 175. Replace with:

```tsx
<div className="grid grid-cols-4 compact:grid-cols-2 gap-4 compact:gap-3 mb-6">
```

- [ ] **Step 4: Add compact fallback to the 3-col grid**

Find `<div className="grid grid-cols-3 gap-6 mb-6">` on line 191. Replace with:

```tsx
<div className="grid grid-cols-3 compact:grid-cols-2 gap-6 compact:gap-3 mb-6">
```

- [ ] **Step 5: Verify**

Run: `curl -sS http://localhost:3001/dashboard/crm/leads -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px: stat cards become 2x2, lead cards become 2-col. Tables scroll inside their containers.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/dashboard/crm/leads/page.tsx
git commit -m "feat(web): tighten CRM leads list at compact

- stat-card grid-cols-4 → compact:grid-cols-2
- 3-col lead cards → compact:grid-cols-2
- tables wrapped in overflow-x-auto

Co-authored-by: AmanVatsSharma"
```

---

## Task 12: CRM detail pages — back-to-list row + inner grids

**Files:**
- Modify: `apps/web/src/app/dashboard/crm/customers/[id]/page.tsx`
- Modify: `apps/web/src/app/dashboard/crm/leads/[id]/page.tsx`
- Modify: `apps/web/src/app/dashboard/crm/[id]/page.tsx`

- [ ] **Step 1: Read each file's top to find the "back to list" header row**

For each of the 3 files, find the `<div className="flex justify-between ...">` or similar pattern near the top that contains the "Back to ..." link and action buttons.

- [ ] **Step 2: Make the back-to-list row stack vertically at compact**

For each of the 3 files, the header row pattern is roughly:

```tsx
<div className="flex justify-between items-center mb-6">
  <Link href="...">← Back to Customers</Link>
  <div className="flex gap-2">
    <button>Edit</button>
    <button>...</button>
  </div>
</div>
```

Add `compact:flex-col compact:items-start compact:gap-2` to the outer `<div>`. The change:

Before: `<div className="flex justify-between items-center mb-6">`
After: `<div className="flex justify-between items-center mb-6 compact:flex-col compact:items-start compact:gap-2">`

- [ ] **Step 3: Add compact fallback to the inner info grid**

For each of the 3 files, find the inner `grid-cols-4 gap-x-6 gap-y-4` (or similar) info-section grid. Per the spec, this stays at 4 columns if it fits (the page itself is full-width and 768px is workable), but adds `compact:gap-3` to be safe.

Before: `<div className="flex-1 grid grid-cols-4 gap-x-6 gap-y-4">`
After: `<div className="flex-1 grid grid-cols-4 gap-x-6 gap-y-4 compact:gap-3 compact:gap-y-2">`

If a particular file has a `grid-cols-3` or `grid-cols-2` inner section, apply the same `compact:gap-3` treatment without changing the column count.

- [ ] **Step 4: Verify all 3 detail pages**

Run:
```bash
curl -sS http://localhost:3001/dashboard/crm/customers/ankit -o /dev/null -w "%{http_code}\n"
curl -sS http://localhost:3001/dashboard/crm/leads/ankit -o /dev/null -w "%{http_code}\n"
```

Expected: `200` for each.

Visually inspect at 900px: the back-to-list row should stack (title above, action buttons below). The inner info grid should still be 4 columns but with slightly tighter gaps.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/dashboard/crm/customers/\[id\]/page.tsx \
        apps/web/src/app/dashboard/crm/leads/\[id\]/page.tsx \
        apps/web/src/app/dashboard/crm/\[id\]/page.tsx
git commit -m "feat(web): stack CRM detail header row at compact

3 detail pages: back-to-list + actions row stacks vertically
below 1024px. Inner info grids get tighter gaps.

Co-authored-by: AmanVatsSharma"
```

---

## Task 13: Floors page — grid-cols-4/3 collapse

**Files:**
- Modify: `apps/web/src/app/dashboard/floors/page.tsx`

- [ ] **Step 1: Read to find grid locations**

Run: `grep -n "grid-cols-" apps/web/src/app/dashboard/floors/page.tsx`

The file has grids at lines 139 (`grid-cols-4`), 183 (`grid-cols-3`), 205 (`grid-cols-4`).

- [ ] **Step 2: Add compact fallbacks**

For each `grid-cols-4`, change to `grid-cols-4 compact:grid-cols-2`:

- Line 139: `<div className="grid grid-cols-4 gap-4">` → `<div className="grid grid-cols-4 compact:grid-cols-2 gap-4 compact:gap-3">`
- Line 183: `<div className="grid grid-cols-3 gap-6">` → `<div className="grid grid-cols-3 compact:grid-cols-2 gap-6 compact:gap-3">`
- Line 205: `<div className="grid grid-cols-4 gap-3">` → `<div className="grid grid-cols-4 compact:grid-cols-2 gap-3">`

- [ ] **Step 3: Verify**

Run: `curl -sS http://localhost:3001/dashboard/floors -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px: stat cards become 2x2, sub-sections become 2-col.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/dashboard/floors/page.tsx
git commit -m "feat(web): collapse floors grids at compact

- grid-cols-4 → compact:grid-cols-2
- grid-cols-3 → compact:grid-cols-2
- gaps reduced 4/6 → 3

Co-authored-by: AmanVatsSharma"
```

---

## Task 14: Location page — grid-cols-3 collapse

**Files:**
- Modify: `apps/web/src/app/dashboard/location/page.tsx`

- [ ] **Step 1: Read to find grid locations**

Run: `grep -n "grid-cols-" apps/web/src/app/dashboard/location/page.tsx`

The file has grids at lines 212 (`grid-cols-3`) and 275 (`grid-cols-3`).

- [ ] **Step 2: Add compact fallbacks**

For each `grid-cols-3`, change to `grid-cols-3 compact:grid-cols-2`:

- Line 212: `<div className="grid grid-cols-3 gap-6">` → `<div className="grid grid-cols-3 compact:grid-cols-2 gap-6 compact:gap-3">`
- Line 275: `<div className="grid grid-cols-3 gap-4">` → `<div className="grid grid-cols-3 compact:grid-cols-2 gap-4 compact:gap-3">`

- [ ] **Step 3: Verify**

Run: `curl -sS http://localhost:3001/dashboard/location -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px: 3-col location cards become 2-col.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/dashboard/location/page.tsx
git commit -m "feat(web): collapse location grids at compact

- 2x grid-cols-3 → compact:grid-cols-2

Co-authored-by: AmanVatsSharma"
```

---

## Task 15: Bookings page — table wrap + min-w override

**Files:**
- Modify: `apps/web/src/app/dashboard/bookings/page.tsx`

- [ ] **Step 1: Read to find table locations**

Run: `grep -n "table className" apps/web/src/app/dashboard/bookings/page.tsx`

The file has at least one table. Read around it to find the parent wrapper.

- [ ] **Step 2: Wrap tables in `overflow-x-auto`**

Same pattern as Task 8 step 2. Apply to all tables found.

- [ ] **Step 3: Override the `min-w-[100px]` and `min-w-[150px]` on inner cells**

Find lines 470 and 472 from the spec's grep output:

Before:
```
className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-r border-gray-100 min-w-[100px]"
```
After:
```
className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-r border-gray-100 min-w-[100px] compact:min-w-0"
```

And:

Before:
```
className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-100 min-w-[150px]"
```
After:
```
className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-100 min-w-[150px] compact:min-w-0"
```

This lets the table scroll horizontally inside its container instead of fighting the `min-w` constraint.

- [ ] **Step 4: Add compact fallback to the stat-card grid**

Find `<div className="grid grid-cols-4 gap-4">` on line 217. Replace with:

```tsx
<div className="grid grid-cols-4 compact:grid-cols-2 gap-4 compact:gap-3">
```

- [ ] **Step 5: Add compact fallback to the inner 2-col grids**

Find both `grid grid-cols-2 gap-4` on lines 571 and 643. For each:

```tsx
<div className="grid grid-cols-2 compact:grid-cols-1 gap-4 compact:gap-3">
```

- [ ] **Step 6: Verify**

Run: `curl -sS http://localhost:3001/dashboard/bookings -o /dev/null -w "%{http_code}\n"`
Expected: `200`

Visually inspect at 900px: the time-grid bookings table (a key feature of this page) should scroll horizontally inside its container. Stat cards become 2x2. Sub-sections become single-column.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/dashboard/bookings/page.tsx
git commit -m "feat(web): wrap bookings tables and collapse grids at compact

- table wrapped in overflow-x-auto
- min-w-[100/150] overridden with compact:min-w-0
- stat-card grid-cols-4 → compact:grid-cols-2
- 2 sub-grids grid-cols-2 → compact:grid-cols-1

Co-authored-by: AmanVatsSharma"
```

---

## Task 16: Report page — table wrap (if applicable)

**Files:**
- Modify: `apps/web/src/app/dashboard/report/page.tsx`
- Possibly modify: `apps/web/src/app/dashboard/report/overview/page.tsx`

- [ ] **Step 1: Check if report pages have tables**

Run: `grep -rn "table className" apps/web/src/app/dashboard/report/`

If no tables found, skip this task and move to Task 17.

- [ ] **Step 2: If tables found, wrap them in `overflow-x-auto`**

Apply the same pattern as Task 8 step 2 to each.

- [ ] **Step 3: Verify**

Run: `curl -sS http://localhost:3001/dashboard/report -o /dev/null -w "%{http_code}\n"`
Expected: `200`

- [ ] **Step 4: Commit (only if changes were made)**

```bash
git add apps/web/src/app/dashboard/report/
git commit -m "feat(web): wrap report tables in overflow-x-auto

Co-authored-by: AmanVatsSharma"
```

If no changes, skip the commit.

---

## Task 17: Update CLAUDE.md with responsive breakpoints section

**Files:**
- Modify: `apps/web/CLAUDE.md` (or `CLAUDE.md` at root — verify which exists)

- [ ] **Step 1: Check which CLAUDE.md exists**

Run: `ls CLAUDE.md apps/web/CLAUDE.md 2>&1`

If only the root `CLAUDE.md` exists, append to that. If both exist, append to the root one (it's the canonical project doc).

- [ ] **Step 2: Read the file's end**

Run: `tail -20 CLAUDE.md` to see the existing closing sections.

- [ ] **Step 3: Append the new section**

Append to the end of the file:

```markdown

## Responsive Breakpoints

The dashboard uses a single `compact:` Tailwind variant registered in `apps/web/tailwind.config.js`. The variant activates at `max-width: 1023.98px` and applies tablet-density adjustments (smaller fonts, tighter padding, narrower sidebar, icon-only buttons).

- **Compact**: viewports from 768px to 1023px (small tablet, "compact-first" default).
- **Regular**: viewports ≥ 1024px (current desktop layout, unchanged from Figma).
- **Below 768px**: out of scope. Layout may overflow or scroll horizontally.

**Dev port note**: The dev server runs on port 3001 (port 3000 is held by another workspace's `next start`). URL: `http://localhost:3001`.

When adding a new dashboard page:
- Use `compact:` variants for any new component that should adapt to tablet width.
- Wrap tables in `overflow-x-auto` containers.
- Avoid hard-coded widths (`w-[NNNpx]`) — use Tailwind's responsive scale or arbitrary values with `compact:` overrides.
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add responsive breakpoints section to CLAUDE.md

Documents the compact: variant, 768px floor, and dev port 3001.

Co-authored-by: AmanVatsSharma"
```

---

## Task 18: Production build verification

**Files:** none (verification only)

- [ ] **Step 1: Run the production build**

Run: `npx nx build web`

Expected: Build succeeds. The build output should mention that classes like `compact:w-[64px]`, `compact:gap-3`, `compact:hidden`, `compact:grid-cols-2` were generated. If Tailwind purges any of these (because they're not in scanned source), the build will succeed but the compact state won't apply — a runtime check is needed in Task 19.

- [ ] **Step 2: Check for any TypeScript errors**

If the build fails with TS errors, fix them. The changes in this plan are utility-class additions, so TS errors are unlikely unless one of the arbitrary values (`w-[428px]`) was malformed.

- [ ] **Step 3: Commit if any fixes were made**

If you fixed anything, commit:
```bash
git add .
git commit -m "fix(web): resolve build/type issues from responsive changes

Co-authored-by: AmanVatsSharma"
```

---

## Task 19: Cross-page visual regression check

**Files:** none (manual verification only)

- [ ] **Step 1: Set up browser DevTools at 768px viewport**

Open `http://localhost:3001/dashboard/inventory` in Chrome. Open DevTools (F12), toggle device toolbar (Ctrl+Shift+M), set width to **768px**.

- [ ] **Step 2: Walk every modified page at 768px**

For each of the following, verify:
1. **No horizontal scrollbar on the viewport** (the `<html>` element should not show overflow-x).
2. **No content clipped or cut off**.
3. **Sidebar visible, narrower, all 11 icons + labels visible**.
4. **Header items visible without overlap** (logo, nav pill, + button, bell, avatar+chevron).
5. **Tables fit or scroll inside their container** (drag inside the table; should scroll, not the page).

Pages to check:
- `http://localhost:3001/dashboard` (home, 3-col grid)
- `http://localhost:3001/dashboard/inventory` (2-col with location sidebar)
- `http://localhost:3001/dashboard/operations` (3 tables, 2-col section)
- `http://localhost:3001/dashboard/revenue` (3 tables)
- `http://localhost:3001/dashboard/crm/customers` (table + cards)
- `http://localhost:3001/dashboard/crm/leads` (table + cards)
- `http://localhost:3001/dashboard/crm/customers/ankit` (detail)
- `http://localhost:3001/dashboard/crm/leads/ankit` (detail)
- `http://localhost:3001/dashboard/floors`
- `http://localhost:3001/dashboard/location`
- `http://localhost:3001/dashboard/bookings`
- `http://localhost:3001/dashboard/report`
- `http://localhost:3001/dashboard/settings`
- `http://localhost:3001/dashboard` (re-check after walking the rest)

- [ ] **Step 3: Repeat at 1280px to confirm no regression**

In DevTools, change viewport to **1280px**. Walk the same pages. They should look **identical** to before this work began (Figma fidelity preserved).

- [ ] **Step 4: Test the boundary at 1024px**

Set viewport to exactly **1024px**. Compact should NOT apply. Check that all `compact:` overrides are inactive.

- [ ] **Step 5: Document any issues found**

If a page fails any check, add a follow-up issue. Do not block this plan on it; surface as a follow-up:
```bash
echo "Found regression: [describe]"  # then handle in a follow-up
```

- [ ] **Step 6: Final commit if any follow-up fixes were made**

If you fixed anything during this check:
```bash
git add .
git commit -m "fix(web): responsive regressions caught in visual check

Co-authored-by: AmanVatsSharma"
```

---

## Self-Review

**1. Spec coverage:**

| Spec section | Task |
|--------------|------|
| Breakpoint definition (`compact:` variant at <1024px) | Task 1 |
| Sidebar density adjustments | Task 2 |
| Header density adjustments | Task 3 |
| Layout main content padding | Task 4 |
| LocationSidebar width reduction | Task 5 |
| Dashboard home 3-col grid + middle column | Task 6 |
| Inventory layout adjustments | Task 7 |
| Operations page tables + 2-col collapse | Task 8 |
| Revenue page tables | Task 9 |
| CRM customers list | Task 10 |
| CRM leads list | Task 11 |
| CRM detail pages (back-to-list stack + inner grids) | Task 12 |
| Floors page grids | Task 13 |
| Location page grids | Task 14 |
| Bookings page (tables + min-w override + grids) | Task 15 |
| Report page (conditional) | Task 16 |
| CLAUDE.md update | Task 17 |
| Build verification | Task 18 |
| Cross-page visual check | Task 19 |

All 17 spec items have a task. **No spec gaps.**

**2. Placeholder scan:** No "TBD", "TODO", "implement later", or vague "add appropriate" patterns. Every code block contains the actual class change.

**3. Type/method consistency:**
- The `compact:` variant is referenced consistently across all 19 tasks.
- The `[&>span]:hidden` pattern from the spec was simplified to `compact:hidden` (a Tailwind built-in) for the header button label and the dashboard home "View Analytics" button — both consistent.
- The `min-w-0` override on `<main>` and the table cells uses the same pattern.
- The `!w-[428px]` → `!w-[260px]` on the TotalLeadCard preserves the `!` (important) modifier.
- No function/method renames, no signature drift.

**4. Scope discipline check:**
- No new files created. No npm installs.
- No design-token or color changes.
- No page-level layout rearranging (3-col stays 3-col, 2-col stays 2-col).
- All changes are utility-class additions on existing JSX.

**5. Risk check (from spec):**
- Hard-coded `w-[NNNpx]` patterns: caught (home middle col, location sidebar). Handled with `compact:` variants.
- Tailwind class purging: not testable in this plan, but the build verification (Task 18) checks for purged classes by inspecting the build output. The manual check (Task 19) is the real test.
- CSS Modules: not touched in this plan (the spec said this was a low risk and inspection confirmed no layout-relevant rules in the module-CSS files).
- `min-w-[100/150px]` on bookings cells: explicitly handled in Task 15 with `compact:min-w-0`.

**Plan ready for execution.**
