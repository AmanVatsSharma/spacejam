# Floor Map Builder — Design

**Date:** 2026-08-25
**Status:** Approved
**Requested by:** Client (via PM) — "client able to make exact real map manually"

## Problem

The floor map today auto-places seat cards into a fixed decorative CSS grid
(`floorGrid` + unused `r1A…r4B` classes). It bears no relation to the physical
center, seats overflow and clip, and the client team cannot express their real
office layout. The client wants to manually arrange an exact, real map of each
floor: desks where desks actually are, rooms where rooms actually are.

## Decisions (from brainstorming)

- **Approach:** drag-only editor on a snap grid — no background image, no
  CAD-style wall drawing (client's choice).
- **Elements:** seats/desks (booking-clickable), resizable labeled zone
  rectangles (Meeting Room, Pantry, Washroom, Reception, Custom), and pinned
  free-text labels.
- **Editor placement:** "Edit Layout" toggle on the existing floor map page
  (single page, simplest for the client to find).
- **Implementation:** custom drag/resize with pointer events — **no new
  dependencies** (react-flow etc. rejected: new-dep risk in this workspaces
  monorepo + custom webpack build, generic look).

## Data Model

### Seats — `x`, `y` columns (nullable, float grid units)

- Migration `20260826000000-AddSeatPositionAndFloorLayout`:
  `ALTER TABLE seats ADD COLUMN IF NOT EXISTS x float NULL, y float NULL;`
- A seat with `x IS NULL` is **unplaced**: it renders in the tray (view +
  edit modes) and never on the map.
- `UpdateSeatInput` gains optional `x`, `y` so the editor can position seats
  through the existing `updateSeat` mutation.
- **Fallback:** floors whose seats have no positions keep the current
  auto-arranged grid rendering — no forced migration, nothing breaks.

### Floors — `layout` jsonb column

```jsonc
{
  "version": 3,                 // optimistic-concurrency counter
  "zones": [
    { "id": "z1", "x": 2, "y": 1, "w": 6, "h": 3,
      "label": "Meeting Room A", "kind": "MEETING_ROOM" }   // MEETING_ROOM | PANTRY | WASHROOM | RECEPTION | CUSTOM
  ],
  "labels": [ { "id": "l1", "x": 4, "y": 9, "text": "Entrance" } ]
}
```

- Same migration adds `ALTER TABLE floors ADD COLUMN IF NOT EXISTS layout jsonb NULL;`
- Zone/label `id`s are client-generated short ids (uuid or counter) — used
  only for React keys and diffing, not referenced elsewhere.
- Coordinates are grid units (1 unit = one grid cell, ~40px at zoom 1).

## API

### `updateFloorLayout(floorId: ID!, layout: String!): Floor`  (mutation)

- Roles: `ADMIN, SUPER_ADMIN, CENTER_OWNER, CENTER_MANAGER` +
  `@CenterScoped('floorId')` (derive the floor's centerId inline like
  createSeat does, since the guard compares a `centerId` arg — resolve the
  floor first, then compare against `caller.centerId` for scoped callers).
- Payload: JSON string, parsed and validated server-side:
  - top-level keys whitelisted to `{version, zones, labels}`; unknown keys
    dropped (warn-logged) — same pattern as `sanitizeSettings`;
  - `zones[].kind` whitelisted; `x/y/w/h` numeric and bounded (0 ≤ x,y < 500;
    1 ≤ w,h ≤ 200); `label`/`text` length ≤ 80;
  - counts capped: ≤ 100 zones, ≤ 100 labels; total payload ≤ 32 KB;
  - `version` required and must equal current `version + 1` **if a layout
    exists**; first save accepts any version (normalized to 1). Stale version
    → `ConflictException` with the current version in the message.
- Audit `FLOOR_LAYOUT_UPDATE` (keys only), invalidate `floor:*` +
  `center:*` caches, publish existing `floorUpdated` trigger.

`GET_FLOORS`/`floors` query exposes `layout` (JSON scalar passthrough, same
as `Center.settings` fix).

## Frontend

### View mode (`/dashboard/inventory/floor-map`, default)

- If **any seat on the floor has x/y or a layout exists** → render the custom
  map: absolutely positioned zone rectangles (styled per kind), text labels,
  and seats at their coordinates. Seats keep their current click behavior
  (AVAILABLE → booking modal, context menu) and status colors.
- Otherwise → existing auto-grid fallback (current rendering, retained).
- Unplaced seats render in a tray panel: "N seats not on map" with a
  role-gated "Place on map" shortcut that opens edit mode.
- Filter/search continue to filter rendered seats (non-matching seats dim).

### Edit mode ("Edit Layout" toggle — staff roles only)

Same canvas, editor chrome:

- **Toolbar:** Add Zone (kind picker), Add Label, snap on/off, zoom −/+/fit,
  unsaved-changes indicator, **Save** / **Discard**.
- **Seat tray:** unplaced seats as chips; drag chip onto canvas → seat gets
  x/y; drag placed seats to move; click placed seat → remove-from-map (back
  to tray) affordordance in its editor popover.
- **Zones:** drag to move, 8px corner handle to resize, inline rename,
  kind + delete in popover.
- **Labels:** drag to move, inline text edit, delete.
- Grid snap (1-unit steps) default on; hold-free toggle. Items clamped to
  canvas bounds; overlapping zones get a warning outline (non-blocking — real
  offices legitimately overlap labels).
- **Save** = one `updateFloorLayout` (zones+labels, version+1) + batched
  `updateSeat` x/y calls (only changed seats). Failure of the layout mutation
  → keep editor open, toast the conflict ("layout changed elsewhere, reload")
  with a Reload action; seat-position failures → per-seat retry list in toast.
- **Discard** = revert to server state (confirm if dirty).

### Files

- `apps/web/src/app/dashboard/inventory/floor-map/FloorMapEditor.tsx` (new) —
  editor canvas + toolbar; receives floor, seats, onSave hooks.
- `apps/web/src/app/dashboard/inventory/floor-map/floor-map.module.css` —
  editor + custom-map styles (zones per kind, tray, handles).
- `page.tsx` — mode state, custom-map view renderer, tray, wiring.
- `operations.ts` — `UPDATE_FLOOR_LAYOUT` mutation; extend floor/seat
  fragments with `x y layout`.

## Security & Robustness

- Layout writes: staff roles + center scoping (managers edit only their
  center's floors) + whitelist + caps + version conflict detection.
- Seat x/y writes go through existing `updateSeat` (auth unchanged).
- Layout never trusted for access decisions — display only.
- Audit every layout save; cache invalidation on floor + center keys.

## Testing

- **API:** `floor-layout.resolver.spec.ts` — sanitize/whitelist, bounds,
  caps, version conflict, manager cross-center block, audit shape.
- **Web:** build (type safety) + browser E2E: enter edit mode, place 2 seats,
  add zone + label, move/resize, save, reload → exact positions/zones render;
  stale-version conflict path; discard path; fallback rendering for a legacy
  floor.

## Out of Scope (explicit)

- Background floor-plan images, wall/door drawing, undo history, multi-user
  realtime co-editing, seat rotation, mobile touch editor polish (works, but
  not the design target).
