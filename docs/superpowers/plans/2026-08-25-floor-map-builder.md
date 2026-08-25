# Floor Map Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff drag seats, zones, and labels onto a snap grid so each floor's map mirrors the real office, with a validated/versioned layout API and a graceful legacy fallback.

**Architecture:** Seats get nullable `x`/`y` grid-unit columns; floors get a validated `layout` jsonb (`{version, zones, labels}`) exposed via the JSON scalar. A new `FloorMapEditor` component (pointer-event drag, no new deps) drops into the existing floor-map page behind an "Edit Layout" toggle; view mode renders the custom map when positions/layout exist, else today's auto-grid.

**Tech Stack:** NestJS 11 code-first GraphQL + TypeORM (postgres), Next.js 16 / React 19, CSS Modules, Apollo. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-25-floor-map-builder-design.md`

## Global Constraints

- No new npm dependencies.
- Prod PG < v11: every migration statement idempotent (`ADD COLUMN IF NOT EXISTS`).
- Prod runs `synchronize: false` — schema changes need the migration + manual SQL application via the established script pattern.
- GraphQL scalars on jsonb columns MUST be the JSON passthrough scalar (`apps/api/src/graphql/scalars/json.scalar.ts`) — a `String` scalar on jsonb crashes serialization (this exact bug shipped twice already).
- Layout writes: `@Roles(ADMIN, SUPER_ADMIN, CENTER_OWNER, CENTER_MANAGER)` + inline center-scope check; payload ≤ 32 KB; ≤ 100 zones; ≤ 100 labels; text ≤ 80 chars; `0 ≤ x,y < 500`; `1 ≤ w,h ≤ 200`; zone `kind` ∈ {MEETING_ROOM, PANTRY, WASHROOM, RECEPTION, CUSTOM}.
- API tests: `cd apps/api && npx vitest run <file> --reporter=dot` (no nx target exists).
- Web typecheck: `cd apps/web && npm run build` (ignore the known `_global-error` prerender failure message; "Compiled successfully" is the pass signal).
- File headers follow the repo format (`File/Module/Purpose/Author/Last-updated`).

---

### Task 1: Migration — seats x/y + floors.layout safety

**Files:**
- Create: `apps/api/src/typeorm/migrations/20260826000000-AddSeatPositionAndFloorLayout.ts`

**Interfaces:**
- Produces: DB columns `seats.x float NULL`, `seats.y float NULL`, `floors.layout jsonb NULL` (the floors.layout column may already exist from early entity sync — `IF NOT EXISTS` covers both DBs).

- [ ] **Step 1: Write the migration**

```typescript
/**
 * File:        typeorm/migrations/20260826000000-AddSeatPositionAndFloorLayout.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Backs the manual floor map builder: seats get nullable x/y
 *              grid-unit coordinates (NULL = unplaced, sits in the editor
 *              tray), floors get the layout jsonb (zones + labels +
 *              version). Idempotent — prod is synchronize:false on PG <11.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-26
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeatPositionAndFloorLayout20260826000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seats"
        ADD COLUMN IF NOT EXISTS "x" float,
        ADD COLUMN IF NOT EXISTS "y" float;
    `);
    await queryRunner.query(`
      ALTER TABLE "floors"
        ADD COLUMN IF NOT EXISTS "layout" jsonb;
    `);
    await queryRunner.query(`
      INSERT INTO "migrations" (timestamp, name)
      VALUES (20260826000000, 'AddSeatPositionAndFloorLayout20260826000000')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "seats" DROP COLUMN IF EXISTS "x";`);
    await queryRunner.query(`ALTER TABLE "seats" DROP COLUMN IF EXISTS "y";`);
    await queryRunner.query(`ALTER TABLE "floors" DROP COLUMN IF EXISTS "layout";`);
  }
}
```

- [ ] **Step 2: Apply locally (raw SQL, same pattern as previous deploys)**

```bash
cd <repo root>
node -e "
const { Client } = require('./apps/api/node_modules/pg');
(async () => {
  const c = new Client({connectionString:'postgresql://spacejam:spacejam@localhost:5432/spacejam'});
  await c.connect();
  await c.query('ALTER TABLE seats ADD COLUMN IF NOT EXISTS x float, ADD COLUMN IF NOT EXISTS y float');
  await c.query('ALTER TABLE floors ADD COLUMN IF NOT EXISTS layout jsonb');
  const s = await c.query(\"SELECT column_name FROM information_schema.columns WHERE table_name='seats' AND column_name IN ('x','y')\");
  console.log('seat cols:', s.rows.map(r => r.column_name).join(','));
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); })
"
```
Expected: `seat cols: x,y`

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/typeorm/migrations/20260826000000-AddSeatPositionAndFloorLayout.ts
git commit -m "feat(floor-map): migration for seat x/y and floor layout"
```

---

### Task 2: Entities + inputs — JSON scalar on Floor.layout, Seat x/y, UpdateSeatInput

**Files:**
- Modify: `apps/api/src/typeorm/entities/floor.entity.ts` (layout field decorator)
- Modify: `apps/api/src/typeorm/entities/seat.entity.ts` (add x/y)
- Modify: `apps/api/src/graphql/inputs/center.input.ts` (`UpdateSeatInput` add x/y)

**Interfaces:**
- Produces: `Seat.x?: number | null`, `Seat.y?: number | null` GraphQL Float fields; `Floor.layout` exposed as JSON scalar; `UpdateSeatInput.x?: number; y?: number`.

- [ ] **Step 1: Floor.entity — fix the String-on-jsonb scalar (crash bug)**

In `floor.entity.ts` add the import next to the existing `@nestjs/graphql` import:

```typescript
import { JsonScalar } from '../../graphql/scalars/json.scalar';
```

Replace:

```typescript
  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  layout!: Record<string, any> | null;
```

with:

```typescript
  // JSON scalar (not String): the jsonb column hydrates to an object and the
  // String scalar's serializer rejects objects — GET_FLOORS{layout} would
  // crash for every user once a layout is saved (same bug class as
  // Center.settings).
  @Field(() => JsonScalar, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  layout!: Record<string, any> | null;
```

- [ ] **Step 2: Seat.entity — add x/y after the `location` column**

In `seat.entity.ts`, ensure the Float import covers it (`import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';` — extend if `Float` is missing) and add after the `location` property:

```typescript
  /** Manual map position in grid units (1 unit ≈ 40px at zoom 1). NULL = unplaced (tray). */
  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  x!: number | null;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  y!: number | null;
```

- [ ] **Step 3: UpdateSeatInput — add x/y after `price`**

In `center.input.ts` `UpdateSeatInput` (after the `price?` field):

```typescript
  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  x?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  y?: number;
```

- [ ] **Step 4: Verify with existing specs (module wiring untouched)**

```bash
cd apps/api && npx vitest run src/graphql/resolvers/center.resolver.spec.ts --reporter=dot
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/typeorm/entities/floor.entity.ts apps/api/src/typeorm/entities/seat.entity.ts apps/api/src/graphql/inputs/center.input.ts
git commit -m "feat(floor-map): seat x/y fields, floor layout via JSON scalar"
```

---

### Task 3: Layout sanitizer util (TDD)

**Files:**
- Create: `apps/api/src/common/utils/floor-layout.util.ts`
- Test: `apps/api/src/common/utils/floor-layout.util.spec.ts`

**Interfaces:**
- Produces:
  - `type FloorLayout = { version: number; zones: FloorZone[]; labels: FloorLabel[] }`
  - `type FloorZone = { id: string; x: number; y: number; w: number; h: number; label: string; kind: ZoneKind }` (`ZoneKind = 'MEETING_ROOM'|'PANTRY'|'WASHROOM'|'RECEPTION'|'CUSTOM'`)
  - `type FloorLabel = { id: string; x: number; y: number; text: string }`
  - `sanitizeFloorLayout(incoming: unknown): FloorLayout` — throws `BadRequestException` on structurally invalid input; clamps/rejects out-of-bounds values.

- [ ] **Step 1: Write the failing spec**

```typescript
/**
 * File:        common/utils/floor-layout.util.spec.ts
 * Module:      API · Floor Layout Util Tests
 * Purpose:     Validation rules for the floor layout blob: whitelist,
 *              bounds, caps, text length, version handling.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-26
 */
import { BadRequestException } from '@nestjs/common';
import { sanitizeFloorLayout } from './floor-layout.util';

describe('sanitizeFloorLayout', () => {
  const zone = (over: Partial<any> = {}) => ({
    id: 'z1', x: 1, y: 2, w: 4, h: 3, label: 'Meeting Room A', kind: 'MEETING_ROOM',
    ...over,
  });

  it('accepts a valid layout and normalizes the first version to 1', () => {
    const out = sanitizeFloorLayout({ zones: [zone()], labels: [{ id: 'l1', x: 2, y: 2, text: 'Entrance' }] });
    expect(out.version).toBe(1);
    expect(out.zones[0].label).toBe('Meeting Room A');
    expect(out.labels[0].text).toBe('Entrance');
  });

  it('rejects non-object input', () => {
    expect(() => sanitizeFloorLayout('nope')).toThrow(BadRequestException);
  });

  it('drops unknown top-level keys but keeps valid ones', () => {
    const out = sanitizeFloorLayout({ zones: [], labels: [], evil: { x: 1 } }) as any;
    expect(out.evil).toBeUndefined();
    expect(out.zones).toEqual([]);
  });

  it('rejects a zone with an unknown kind', () => {
    expect(() => sanitizeFloorLayout({ zones: [zone({ kind: 'VOLCANO' })] })).toThrow(BadRequestException);
  });

  it('rejects zones out of bounds', () => {
    expect(() => sanitizeFloorLayout({ zones: [zone({ x: -1 })] })).toThrow(BadRequestException);
    expect(() => sanitizeFloorLayout({ zones: [zone({ x: 500 })] })).toThrow(BadRequestException);
    expect(() => sanitizeFloorLayout({ zones: [zone({ w: 0 })] })).toThrow(BadRequestException);
    expect(() => sanitizeFloorLayout({ zones: [zone({ h: 201 })] })).toThrow(BadRequestException);
  });

  it('truncates long text and label strings to 80 chars', () => {
    const out = sanitizeFloorLayout({ zones: [zone({ label: 'x'.repeat(120) })] });
    expect(out.zones[0].label.length).toBe(80);
  });

  it('caps zones and labels at 100 each', () => {
    const many = Array.from({ length: 101 }, (_, i) => zone({ id: 'z' + i }));
    expect(() => sanitizeFloorLayout({ zones: many })).toThrow(BadRequestException);
    const manyLabels = Array.from({ length: 101 }, (_, i) => ({ id: 'l' + i, x: 1, y: 1, text: 't' }));
    expect(() => sanitizeFloorLayout({ zones: [], labels: manyLabels })).toThrow(BadRequestException);
  });

  it('rejects NaN coordinates', () => {
    expect(() => sanitizeFloorLayout({ zones: [zone({ x: 'abc' as any })] })).toThrow(BadRequestException);
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
cd apps/api && npx vitest run src/common/utils/floor-layout.util.spec.ts --reporter=dot
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
/**
 * File:        common/utils/floor-layout.util.ts
 * Module:      API · Common · Floor Layout Util
 * Purpose:     Validate + normalize the Floor.layout jsonb written by the
 *              manual floor map editor. Defense-in-depth: the editor also
 *              clamps, but the server never trusts the client blob.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-26
 */
import { BadRequestException } from '@nestjs/common';

export type ZoneKind = 'MEETING_ROOM' | 'PANTRY' | 'WASHROOM' | 'RECEPTION' | 'CUSTOM';

export interface FloorZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  kind: ZoneKind;
}

export interface FloorLabel {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface FloorLayout {
  version: number;
  zones: FloorZone[];
  labels: FloorLabel[];
}

const ZONE_KINDS = new Set<ZoneKind>(['MEETING_ROOM', 'PANTRY', 'WASHROOM', 'RECEPTION', 'CUSTOM']);
const MAX_ITEMS = 100;
const MAX_TEXT = 80;
const MAX_POS = 500;
const MAX_SIZE = 200;
const MAX_JSON_BYTES = 32 * 1024;

const isNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const clampText = (v: unknown, fallback: string): string => {
  const s = typeof v === 'string' ? v.trim() : '';
  return (s || fallback).slice(0, MAX_TEXT);
};

export function sanitizeFloorLayout(incoming: unknown): FloorLayout {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    throw new BadRequestException('Layout must be a JSON object');
  }
  if (JSON.stringify(incoming).length > MAX_JSON_BYTES) {
    throw new BadRequestException(`Layout exceeds ${MAX_JSON_BYTES} bytes`);
  }

  const raw = incoming as Record<string, any>;
  const rawZones = Array.isArray(raw.zones) ? raw.zones : [];
  const rawLabels = Array.isArray(raw.labels) ? raw.labels : [];
  if (rawZones.length > MAX_ITEMS || rawLabels.length > MAX_ITEMS) {
    throw new BadRequestException(`Layout allows at most ${MAX_ITEMS} zones and ${MAX_ITEMS} labels`);
  }

  const zones: FloorZone[] = rawZones.map((z: any, i: number) => {
    if (!z || typeof z !== 'object') throw new BadRequestException(`zones[${i}] must be an object`);
    const kind = (typeof z.kind === 'string' ? z.kind : 'CUSTOM') as ZoneKind;
    if (!ZONE_KINDS.has(kind)) throw new BadRequestException(`zones[${i}].kind "${z.kind}" is not allowed`);
    for (const k of ['x', 'y', 'w', 'h'] as const) {
      if (!isNum(z[k])) throw new BadRequestException(`zones[${i}].${k} must be a number`);
    }
    if (z.x < 0 || z.y < 0 || z.x >= MAX_POS || z.y >= MAX_POS) {
      throw new BadRequestException(`zones[${i}] position out of bounds (0..${MAX_POS - 1})`);
    }
    if (z.w < 1 || z.h < 1 || z.w > MAX_SIZE || z.h > MAX_SIZE) {
      throw new BadRequestException(`zones[${i}] size out of bounds (1..${MAX_SIZE})`);
    }
    return {
      id: String(z.id ?? `z${i}`).slice(0, 40),
      x: Math.round(z.x),
      y: Math.round(z.y),
      w: Math.round(z.w),
      h: Math.round(z.h),
      label: clampText(z.label, 'Zone'),
      kind,
    };
  });

  const labels: FloorLabel[] = rawLabels.map((l: any, i: number) => {
    if (!l || typeof l !== 'object') throw new BadRequestException(`labels[${i}] must be an object`);
    for (const k of ['x', 'y'] as const) {
      if (!isNum(l[k])) throw new BadRequestException(`labels[${i}].${k} must be a number`);
    }
    if (l.x < 0 || l.y < 0 || l.x >= MAX_POS || l.y >= MAX_POS) {
      throw new BadRequestException(`labels[${i}] position out of bounds`);
    }
    return {
      id: String(l.id ?? `l${i}`).slice(0, 40),
      x: Math.round(l.x),
      y: Math.round(l.y),
      text: clampText(l.text, 'Label'),
    };
  });

  // First save normalizes to version 1; subsequent saves carry the
  // optimistic-concurrency counter (checked by the resolver).
  const version = isNum(raw.version) && raw.version > 0 ? Math.floor(raw.version) : 1;

  return { version, zones, labels };
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd apps/api && npx vitest run src/common/utils/floor-layout.util.spec.ts --reporter=dot
```
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/common/utils/floor-layout.util.ts apps/api/src/common/utils/floor-layout.util.spec.ts
git commit -m "feat(floor-map): layout sanitizer with bounds, caps, whitelist"
```

---

### Task 4: `updateFloorLayout` mutation (TDD)

**Files:**
- Modify: `apps/api/src/graphql/resolvers/center.resolver.ts` (FloorResolver class)
- Test: `apps/api/src/graphql/resolvers/floor-layout.resolver.spec.ts`

**Interfaces:**
- Consumes: `sanitizeFloorLayout` from Task 3; `JsonScalar`-typed `Floor.layout` from Task 2.
- Produces: GraphQL `updateFloorLayout(floorId: ID!, layout: String!): Floor` returning the updated floor (layout included). Throws `ConflictException('Floor layout was modified elsewhere (current version N)')` on stale version.

- [ ] **Step 1: Write the failing spec**

```typescript
/**
 * File:        graphql/resolvers/floor-layout.resolver.spec.ts
 * Module:      API · Floor Layout Resolver Tests
 * Purpose:     updateFloorLayout — sanitization pass-through, version
 *              conflict, center scoping, audit, cache invalidation.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-26
 */
import { Test } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CenterResolver, } from './center.resolver';
import { AuditService } from '../../auth/services/audit.service';
import { CacheService } from '../../cache/cache.service';
import { PubSubService } from '../pubsub/pubsub.service';
import { Floor } from '../../typeorm/entities/floor.entity';
import { Center } from '../../typeorm/entities/center.entity';
import { Location } from '../../typeorm/entities/location.entity';
import { UserRole } from '../types/user.type';

describe('FloorResolver.updateFloorLayout', () => {
  let resolver: any;
  let floorRepo: any;
  let auditRecord: jest.Mock;
  let cacheInvalidate: jest.Mock;

  const layoutJson = (v: number) =>
    JSON.stringify({ version: v, zones: [{ id: 'z1', x: 1, y: 1, w: 4, h: 3, label: 'Meeting Room', kind: 'MEETING_ROOM' }], labels: [] });

  beforeEach(async () => {
    floorRepo = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    auditRecord = jest.fn().mockResolvedValue(undefined);
    cacheInvalidate = jest.fn().mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: CenterResolver, useValue: {} },
        {
          provide: 'FloorResolverHarness',
          useFactory: () => {
            // Import the real resolver class lazily to keep this spec tight.
            const mod = require('./center.resolver');
            return new mod.FloorResolver(
              { invalidatePattern: cacheInvalidate },
              floorRepo,
              { publish: jest.fn() },
              { record: auditRecord },
            );
          },
        },
      ],
    }).compile();
    resolver = moduleRef.get('FloorResolverHarness');
  });

  const caller = (role: UserRole, centerId?: string | null) =>
    ({ sub: 'u1', email: 'u@x.io', role, centerId: centerId ?? null }) as any;

  it('saves a first layout (any incoming version normalized to 1) and audits', async () => {
    floorRepo.findOne.mockResolvedValue({ id: 'f1', centerId: 'c1', layout: null });
    const floor = await resolver.updateFloorLayout(
      'f1',
      layoutJson(99),
      caller(UserRole.CENTER_MANAGER, 'c1'),
    );
    expect(floorRepo.update).toHaveBeenCalledWith(
      'f1',
      expect.objectContaining({ layout: expect.objectContaining({ version: 1 }) }),
    );
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'FLOOR_LAYOUT_UPDATE', entityId: 'f1', centerId: 'c1' }),
    );
    expect(cacheInvalidate).toHaveBeenCalledWith('floor:f1');
  });

  it('accepts version current+1 and persists it', async () => {
    floorRepo.findOne.mockResolvedValue({ id: 'f1', centerId: 'c1', layout: { version: 3, zones: [], labels: [] } });
    const floor = await resolver.updateFloorLayout('f1', layoutJson(4), caller(UserRole.SUPER_ADMIN));
    expect(floorRepo.update).toHaveBeenCalledWith(
      'f1',
      expect.objectContaining({ layout: expect.objectContaining({ version: 4 }) }),
    );
  });

  it('rejects a stale version with ConflictException carrying the current version', async () => {
    floorRepo.findOne.mockResolvedValue({ id: 'f1', centerId: 'c1', layout: { version: 5, zones: [], labels: [] } });
    await expect(
      resolver.updateFloorLayout('f1', layoutJson(3), caller(UserRole.SUPER_ADMIN)),
    ).rejects.toThrow(/current version 5/);
  });

  it('blocks a CENTER_MANAGER from another center floor', async () => {
    floorRepo.findOne.mockResolvedValue({ id: 'f1', centerId: 'other', layout: null });
    await expect(
      resolver.updateFloorLayout('f1', layoutJson(1), caller(UserRole.CENTER_MANAGER, 'c1')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFound for a missing floor', async () => {
    floorRepo.findOne.mockResolvedValue(null);
    await expect(
      resolver.updateFloorLayout('nope', layoutJson(1), caller(UserRole.SUPER_ADMIN)),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an invalid layout payload with BadRequest', async () => {
    floorRepo.findOne.mockResolvedValue({ id: 'f1', centerId: 'c1', layout: null });
    await expect(
      resolver.updateFloorLayout('f1', JSON.stringify({ zones: [{ kind: 'VOLCANO' }] }), caller(UserRole.SUPER_ADMIN)),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
cd apps/api && npx vitest run src/graphql/resolvers/floor-layout.resolver.spec.ts --reporter=dot
```
Expected: FAIL (`updateFloorLayout is not a function`).

- [ ] **Step 3: Implement in `FloorResolver` (center.resolver.ts)**

Add imports at the top of `center.resolver.ts`:

```typescript
import { ConflictException } from '@nestjs/common';   // merge into the existing @nestjs/common import
import { sanitizeFloorLayout } from '../../common/utils/floor-layout.util';
```

Change `FloorResolver`'s constructor to inject `AuditService` (it currently takes `cache, floorRepo, pubSub`):

```typescript
@Resolver(() => FloorEntity)
export class FloorResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(FloorEntity)
    private floorRepo: Repository<FloorEntity>,

    private readonly pubSub: PubSubService,
    private readonly audit: AuditService,
  ) {}
```

Add the mutation after `updateFloor`:

```typescript
  /**
   * Replace a floor's layout (zones + labels) with a validated blob.
   * Optimistic concurrency: incoming version must be current+1 (any value
   * is accepted for the first save and normalized to 1). CENTER_MANAGER
   * callers may only edit floors of their own center.
   */
  @Mutation(() => FloorEntity)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
  async updateFloorLayout(
    @Args('floorId', { type: () => ID }) floorId: string,
    @Args('layout', { type: () => String }) layout: string,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<FloorEntity> {
    const floor = await this.floorRepo.findOne({ where: { id: floorId } });
    if (!floor) throw new NotFoundException('Floor not found');

    // Inline center scoping (the guard's @CenterScoped arg must be a
    // centerId; our arg is a floorId, so compare here).
    const scope = caller ? centerScope(caller) : undefined;
    if (scope && floor.centerId !== scope) {
      throw new ForbiddenException('Not allowed to edit this floor');
    }

    let incoming: unknown;
    try {
      incoming = layout ? JSON.parse(layout) : null;
    } catch {
      throw new BadRequestException('Layout must be valid JSON');
    }
    const sanitized = sanitizeFloorLayout(incoming);

    const current = floor.layout as { version?: number } | null;
    if (current?.version) {
      if (sanitized.version !== current.version + 1) {
        throw new ConflictException(
          `Floor layout was modified elsewhere (current version ${current.version}). Reload and retry.`,
        );
      }
    } else {
      sanitized.version = 1;
    }

    await this.floorRepo.update(floorId, { layout: sanitized } as any);
    await this.cache.invalidatePattern(`floor:${floorId}`);
    await this.cache.invalidatePattern(`center:${floor.centerId}`);
    await this.pubSub.publish(CENTER_TRIGGERS.floorUpdated, {
      floorUpdated: { ...floor, layout: sanitized },
    });

    this.audit.record({
      action: 'FLOOR_LAYOUT_UPDATE',
      userId: caller?.sub ?? null,
      entityType: 'Floor',
      entityId: floorId,
      centerId: floor.centerId,
      changes: { zones: sanitized.zones.length, labels: sanitized.labels.length, version: sanitized.version },
    }).catch(() => { /* record() already swallows; belt-and-suspenders */ });

    const updated = await this.floorRepo.findOne({ where: { id: floorId }, relations: ['seats'] });
    return updated!;
  }
```

Note: `BadRequestException`, `ForbiddenException`, `Roles`, `UserRole`, `centerScope`, `CurrentUser`, `JwtPayload` are already imported in this file.

- [ ] **Step 4: Run — verify pass**

```bash
cd apps/api && npx vitest run src/graphql/resolvers/floor-layout.resolver.spec.ts src/graphql/resolvers/center.resolver.spec.ts --reporter=dot
```
Expected: all pass (6 new + existing center specs).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/graphql/resolvers/center.resolver.ts apps/api/src/graphql/resolvers/floor-layout.resolver.spec.ts
git commit -m "feat(floor-map): updateFloorLayout mutation with validation, versioning, scoping"
```

---

### Task 5: Web GraphQL operations

**Files:**
- Modify: `apps/web/src/lib/apollo/operations.ts`

**Interfaces:**
- Produces: `UPDATE_FLOOR_LAYOUT` mutation document; `GET_SEATS`/`GET_FLOORS` seat fragments now include `x y`.

- [ ] **Step 1: Add x/y to seat selections**

In `GET_FLOORS` (seats block) and `GET_SEATS` (root seat block), add `x` and `y` lines right after `location`:

```graphql
      seats {
        id
        name
        seatType
        status
        price
        amenities
        location
        x
        y
      }
```

and in `GET_SEATS`:

```graphql
    seats(floorId: $floorId) {
      id
      name
      seatType
      status
      price
      amenities
      location
      x
      y
      createdAt
      updatedAt
      floor {
        id
        name
      }
    }
```

- [ ] **Step 2: Add the mutation after `UPDATE_SEAT`**

```typescript
export const UPDATE_FLOOR_LAYOUT = gql`
  mutation UpdateFloorLayout($floorId: ID!, $layout: String!) {
    updateFloorLayout(floorId: $floorId, layout: $layout) {
      id
      name
      layout
      updatedAt
    }
  }
`;
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/apollo/operations.ts
git commit -m "feat(floor-map): web operations for layout + seat positions"
```

---

### Task 6: FloorMapEditor component + styles

**Files:**
- Create: `apps/web/src/app/dashboard/inventory/floor-map/FloorMapEditor.tsx`
- Modify: `apps/web/src/app/dashboard/inventory/floor-map/floor-map.module.css` (append editor styles)

**Interfaces:**
- Consumes: seat objects with `id,name,seatType,status,x,y`; floor with `layout`.
- Produces: `export function FloorMapEditor({ floor, seats, initialPositions, onSaveLayout, saving, dirtyExternal }: {...})` — a self-contained editor canvas; parent supplies `onSaveLayout(layout, seatPositions)` which performs the mutations and resolves/rejects.

- [ ] **Step 1: Create `FloorMapEditor.tsx` (complete file)**

```tsx
"use client";

/**
 * File:        apps/web/src/app/dashboard/inventory/floor-map/FloorMapEditor.tsx
 * Module:      Web · Dashboard · Floor Map Editor
 * Purpose:     Manual drag-and-drop layout editor — place seats from the
 *              tray, add/resize zone rectangles, add text labels, snap to
 *              grid, save via the parent's mutation callbacks. No external
 *              drag libraries; plain pointer events.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-26
 */

import { useCallback, useMemo, useRef, useState } from "react";
import styles from "./floor-map.module.css";

export const GRID = 40; // px per grid unit at zoom 1
export const CANVAS_COLS = 24;
export const CANVAS_ROWS = 16;

export type ZoneKind = "MEETING_ROOM" | "PANTRY" | "WASHROOM" | "RECEPTION" | "CUSTOM";

export interface EditorZone {
  id: string;
  x: number; y: number; w: number; h: number;
  label: string;
  kind: ZoneKind;
}
export interface EditorLabel { id: string; x: number; y: number; text: string; }
export interface EditorLayout { version: number; zones: EditorZone[]; labels: EditorLabel[]; }
export interface SeatLike { id: string; name: string; seatType?: string; status?: string; x?: number | null; y?: number | null; }
export interface SeatPosition { id: string; x: number; y: number; }

const ZONE_KIND_LABELS: Record<ZoneKind, string> = {
  MEETING_ROOM: "Meeting Room",
  PANTRY: "Pantry",
  WASHROOM: "Washroom",
  RECEPTION: "Reception",
  CUSTOM: "Custom Zone",
};

const newId = (p: string) => `${p}${Math.random().toString(36).slice(2, 9)}`;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

interface DragState {
  kind: "seat" | "zone" | "zoneResize" | "label" | "chip";
  id: string;
  offX: number;
  offY: number;
  startX: number;
  startY: number;
  orig: { x: number; y: number; w?: number; h?: number };
}

export function FloorMapEditor({
  floor,
  seats,
  onSaveLayout,
  saving,
}: {
  floor: { id: string; name: string; layout: EditorLayout | null };
  seats: SeatLike[];
  onSaveLayout: (layout: EditorLayout, seatPositions: SeatPosition[]) => Promise<void>;
  saving: boolean;
}) {
  const serverLayout: EditorLayout = floor.layout ?? { version: 1, zones: [], labels: [] };
  const [zones, setZones] = useState<EditorZone[]>(serverLayout.zones);
  const [labels, setLabels] = useState<EditorLabel[]>(serverLayout.labels);
  // Local positions: undefined = untouched, {x,y} = set (including removal → null)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number } | null>>({});
  const [snap, setSnap] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const seatPos = useCallback(
    (s: SeatLike) => positions[s.id] !== undefined ? positions[s.id] : (s.x != null && s.y != null ? { x: s.x, y: s.y } : null),
    [positions],
  );

  const placed = useMemo(() => seats.filter((s) => seatPos(s)), [seats, seatPos]);
  const tray = useMemo(() => seats.filter((s) => !seatPos(s)), [seats, seatPos]);

  const dirty =
    JSON.stringify(zones) !== JSON.stringify(serverLayout.zones) ||
    JSON.stringify(labels) !== JSON.stringify(serverLayout.labels) ||
    Object.keys(positions).length > 0;

  const toGrid = (e: PointerEvent | React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const gx = (e.clientX - rect.left) / (GRID * zoom);
    const gy = (e.clientY - rect.top) / (GRID * zoom);
    return {
      x: snap ? clamp(Math.round(gx), 0, CANVAS_COLS - 1) : clamp(gx, 0, CANVAS_COLS - 1),
      y: snap ? clamp(Math.round(gy), 0, CANVAS_ROWS - 1) : clamp(gy, 0, CANVAS_ROWS - 1),
    };
  };

  const onItemPointerDown = (
    e: React.PointerEvent,
    kind: DragState["kind"],
    id: string,
    orig: DragState["orig"],
  ) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const g = toGrid(e);
    dragRef.current = { kind, id, offX: g.x - orig.x, offY: g.y - orig.y, startX: g.x, startY: g.y, orig };
    setSelected(id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const g = toGrid(e);
    if (d.kind === "seat") {
      setPositions((p) => ({ ...p, [d.id]: { x: clamp(g.x - d.offX, 0, CANVAS_COLS - 1), y: clamp(g.y - d.offY, 0, CANVAS_ROWS - 1) } }));
    } else if (d.kind === "zone" || d.kind === "label") {
      const nx = clamp(g.x - d.offX, 0, CANVAS_COLS - 1);
      const ny = clamp(g.y - d.offY, 0, CANVAS_ROWS - 1);
      if (d.kind === "zone") setZones((zs) => zs.map((z) => (z.id === d.id ? { ...z, x: nx, y: ny } : z)));
      else setLabels((ls) => ls.map((l) => (l.id === d.id ? { ...l, x: nx, y: ny } : l)));
    } else if (d.kind === "zoneResize") {
      const w = clamp(Math.round(g.x - d.orig.x + (d.orig.w ?? 1)), 1, CANVAS_COLS - d.orig.x);
      const h = clamp(Math.round(g.y - d.orig.y + (d.orig.h ?? 1)), 1, CANVAS_ROWS - d.orig.y);
      setZones((zs) => zs.map((z) => (z.id === d.id ? { ...z, w, h } : z)));
    }
  };

  const onPointerUp = () => { dragRef.current = null; };

  const addZone = (kind: ZoneKind) => {
    setZones((zs) => [...zs, { id: newId("z"), x: 1, y: 1, w: 4, h: 3, label: ZONE_KIND_LABELS[kind], kind }]);
  };
  const addLabel = () => {
    setLabels((ls) => [...ls, { id: newId("l"), x: 2, y: 2, text: "Label" }]);
  };
  const deleteSelected = () => {
    if (!selected) return;
    setZones((zs) => zs.filter((z) => z.id !== selected));
    setLabels((ls) => ls.filter((l) => l.id !== selected));
    setSelected(null);
  };

  const handleSave = async () => {
    const layout: EditorLayout = { version: serverLayout.version + 1, zones, labels };
    const seatPositions: SeatPosition[] = [];
    for (const s of seats) {
      const pos = positions[s.id];
      if (pos) seatPositions.push({ id: s.id, x: pos.x, y: pos.y });
    }
    await onSaveLayout(layout, seatPositions);
    setPositions({});
  };

  return (
    <div className={styles.editorWrap}>
      <div className={styles.editorToolbar}>
        <span className={styles.editorTitle}>Editing: {floor.name}</span>
        <select
          aria-label="Add zone"
          defaultValue=""
          onChange={(e) => { if (e.target.value) { addZone(e.target.value as ZoneKind); e.target.value = ""; } }}
          className={styles.editorBtn}
        >
          <option value="">+ Add Zone…</option>
          {(Object.keys(ZONE_KIND_LABELS) as ZoneKind[]).map((k) => (
            <option key={k} value={k}>{ZONE_KIND_LABELS[k]}</option>
          ))}
        </select>
        <button type="button" className={styles.editorBtn} onClick={addLabel}>+ Label</button>
        <button type="button" className={styles.editorBtn} onClick={() => setSnap((v) => !v)}>{snap ? "Snap: On" : "Snap: Off"}</button>
        <button type="button" className={styles.editorBtn} onClick={() => setZoom((z) => clamp(Math.round((z - 0.1) * 10) / 10, 0.5, 2))}>−</button>
        <span className={styles.editorZoom}>{Math.round(zoom * 100)}%</span>
        <button type="button" className={styles.editorBtn} onClick={() => setZoom((z) => clamp(Math.round((z + 0.1) * 10) / 10, 0.5, 2))}>+</button>
        {selected && <button type="button" className={styles.editorBtnDanger} onClick={deleteSelected}>Delete selected</button>}
        <span className={styles.editorDirty}>{dirty ? "● unsaved changes" : "no changes"}</span>
        <div className={styles.editorToolbarRight}>
          <button
            type="button"
            className={styles.editorSave}
            disabled={!dirty || saving}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save Layout"}
          </button>
        </div>
      </div>

      <div className={styles.editorBody}>
        <div className={styles.editorTray}>
          <p className={styles.trayTitle}>Seats not on map ({tray.length})</p>
          <div className={styles.trayChips}>
            {tray.length === 0 && <span className={styles.trayEmpty}>All seats placed ✓</span>}
            {tray.map((s) => (
              <div
                key={s.id}
                className={styles.trayChip}
                title="Drag onto the map"
                onPointerDown={(e) => {
                  e.preventDefault();
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  dragRef.current = { kind: "chip", id: s.id, offX: 0, offY: 0, startX: 0, startY: 0, orig: { x: 0, y: 0 } };
                  setSelected(null);
                }}
              >
                {s.name}
              </div>
            ))}
          </div>
          <p className={styles.trayHint}>Drag a chip onto the grid to place the seat.</p>
        </div>

        <div className={styles.editorCanvasOuter}>
          <div
            ref={canvasRef}
            className={styles.editorCanvas}
            style={{
              width: CANVAS_COLS * GRID * zoom,
              height: CANVAS_ROWS * GRID * zoom,
              backgroundImage: `linear-gradient(#F3F4F6 1px, transparent 1px), linear-gradient(90deg, #F3F4F6 1px, transparent 1px)`,
              backgroundSize: `${GRID * zoom}px ${GRID * zoom}px`,
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {zones.map((z) => (
              <div
                key={z.id}
                className={`${styles.editorZone} ${styles[`zone_${z.kind}`] ?? ""} ${selected === z.id ? styles.editorSelected : ""}`}
                style={{
                  left: z.x * GRID * zoom,
                  top: z.y * GRID * zoom,
                  width: z.w * GRID * zoom,
                  height: z.h * GRID * zoom,
                  fontSize: `${12 * zoom}px`,
                }}
                onPointerDown={(e) => onItemPointerDown(e, "zone", z.id, { x: z.x, y: z.y })}
                onDoubleClick={() => {
                  const next = window.prompt("Zone name", z.label);
                  if (next != null) setZones((zs) => zs.map((zz) => (zz.id === z.id ? { ...zz, label: next.slice(0, 80) } : zz)));
                }}
              >
                <span className={styles.zoneLabel}>{z.label}</span>
                <span className={styles.zoneKind}>{ZONE_KIND_LABELS[z.kind]}</span>
                <span
                  className={styles.zoneResizeHandle}
                  onPointerDown={(e) => onItemPointerDown(e, "zoneResize", z.id, { x: z.x, y: z.y, w: z.w, h: z.h })}
                />
              </div>
            ))}

            {labels.map((l) => (
              <div
                key={l.id}
                className={`${styles.editorLabel} ${selected === l.id ? styles.editorSelected : ""}`}
                style={{ left: l.x * GRID * zoom, top: l.y * GRID * zoom, fontSize: `${12 * zoom}px` }}
                onPointerDown={(e) => onItemPointerDown(e, "label", l.id, { x: l.x, y: l.y })}
                onDoubleClick={() => {
                  const next = window.prompt("Label text", l.text);
                  if (next != null) setLabels((ls) => ls.map((ll) => (ll.id === l.id ? { ...ll, text: next.slice(0, 80) } : ll)));
                }}
              >
                📍 {l.text}
              </div>
            ))}

            {placed.map((s) => {
              const pos = seatPos(s)!;
              return (
                <div
                  key={s.id}
                  className={`${styles.editorSeat} ${selected === s.id ? styles.editorSelected : ""}`}
                  style={{ left: pos.x * GRID * zoom, top: pos.y * GRID * zoom, width: GRID * zoom - 4, height: GRID * zoom - 4 }}
                  onPointerDown={(e) => onItemPointerDown(e, "seat", s.id, { x: pos.x, y: pos.y })}
                  onDoubleClick={() => setPositions((p) => ({ ...p, [s.id]: null }))}
                  title={`${s.name} — double-click to remove from map`}
                >
                  <span className={styles.seatName} style={{ fontSize: `${10 * zoom}px` }}>{s.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className={styles.editorFooterHint}>
        Drag to move · double-click a seat to remove it from the map · double-click zones/labels to rename · corner handle resizes zones
      </p>
    </div>
  );
}
```

**"chip" drag handling** — extend `onPointerMove` so a chip dropped on the canvas places the seat. Add at the top of the `if (!d) return;` block in `onPointerMove`:

```typescript
    if (d.kind === "chip") {
      // Chip is captured by the chip element; once the pointer enters the
      // canvas bounds, live-preview by placing at cursor.
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const g = toGrid(e);
        setPositions((p) => ({ ...p, [d.id]: { x: g.x, y: g.y } }));
      }
      return;
    }
```

(chip enters `positions` as soon as it crosses the canvas; further moves are handled by the normal "seat" branch on subsequent drags.)

- [ ] **Step 2: Append editor styles to `floor-map.module.css`**

```css
/* ---------------- Manual Layout Editor ---------------- */
.editorWrap { display: flex; flex-direction: column; gap: 12px; }
.editorToolbar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px; padding: 10px 12px;
}
.editorTitle { font-size: 13px; font-weight: 700; color: #1F2937; margin-right: 6px; }
.editorBtn {
  border: 1px solid #E5E7EB; background: #FFFFFF; color: #374151;
  border-radius: 8px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer;
}
.editorBtn:hover { background: #F9FAFB; }
.editorBtnDanger { border-color: #FECACA; background: #FEF2F2; color: #DC2626; border-radius: 8px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer; }
.editorZoom { font-size: 12px; color: #6B7280; min-width: 38px; text-align: center; }
.editorDirty { font-size: 11px; color: #D97706; font-weight: 600; }
.editorToolbarRight { margin-left: auto; }
.editorSave {
  background: #FF6A2F; color: #FFFFFF; border: none; border-radius: 8px;
  padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer;
}
.editorSave:disabled { background: #F3F4F6; color: #9CA3AF; cursor: not-allowed; }
.editorBody { display: flex; gap: 12px; align-items: flex-start; }
.editorTray { width: 220px; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px; padding: 12px; }
.trayTitle { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 8px; }
.trayChips { display: flex; flex-direction: column; gap: 6px; max-height: 420px; overflow-y: auto; }
.trayChip {
  border: 1px dashed #FF6A2F; color: #C2410C; background: #FFF7ED;
  border-radius: 8px; padding: 6px 8px; font-size: 12px; font-weight: 600;
  cursor: grab; user-select: none; touch-action: none;
}
.trayEmpty { font-size: 12px; color: #059669; font-weight: 600; }
.trayHint { font-size: 11px; color: #9CA3AF; margin-top: 8px; }
.editorCanvasOuter { flex: 1; overflow: auto; }
.editorCanvas {
  position: relative; background: #FFFFFF;
  border: 2px solid #E5E7EB; border-radius: 12px;
  touch-action: none; user-select: none;
}
.editorZone {
  position: absolute; border: 2px solid #93C5FD; background: rgba(191, 219, 254, 0.35);
  border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between;
  padding: 6px 8px; cursor: move; touch-action: none;
}
.zone_MEETING_ROOM { border-color: #93C5FD; background: rgba(191, 219, 254, 0.35); }
.zone_PANTRY { border-color: #86EFAC; background: rgba(187, 247, 208, 0.4); }
.zone_WASHROOM { border-color: #A5B4FC; background: rgba(199, 210, 254, 0.4); }
.zone_RECEPTION { border-color: #FCA5A5; background: rgba(254, 205, 211, 0.4); }
.zone_CUSTOM { border-color: #D1D5DB; background: rgba(229, 231, 235, 0.4); }
.zoneLabel { font-weight: 700; color: #1F2937; pointer-events: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.zoneKind { font-size: 10px; color: #6B7280; pointer-events: none; }
.zoneResizeHandle {
  position: absolute; right: -6px; bottom: -6px; width: 14px; height: 14px;
  background: #FF6A2F; border: 2px solid #FFFFFF; border-radius: 50%; cursor: nwse-resize;
  touch-action: none;
}
.editorLabel {
  position: absolute; font-weight: 600; color: #1F2937;
  background: rgba(255, 255, 255, 0.85); padding: 2px 6px; border-radius: 6px;
  cursor: move; touch-action: none; white-space: nowrap;
}
.editorSeat {
  position: absolute; background: #ECFDF5; border: 2px solid #34D399;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  cursor: move; touch-action: none;
}
.editorSeat .seatName { color: #065F46; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 2px; }
.editorSelected { outline: 2px solid #FF6A2F; outline-offset: 2px; }
.editorFooterHint { font-size: 11px; color: #9CA3AF; }
```

- [ ] **Step 3: Typecheck via build**

```bash
cd apps/web && npm run build 2>&1 | grep -E "Compiled successfully|error"
```
Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/dashboard/inventory/floor-map/FloorMapEditor.tsx apps/web/src/app/dashboard/inventory/floor-map/floor-map.module.css
git commit -m "feat(floor-map): drag-and-drop layout editor component"
```

---

### Task 7: Floor map page — view mode custom map, edit toggle, tray, fallback

**Files:**
- Modify: `apps/web/src/app/dashboard/inventory/floor-map/page.tsx`

**Interfaces:**
- Consumes: `FloorMapEditor`, `GRID`, `CANVAS_COLS/ROWS`, `EditorLayout`, `SeatPosition` from Task 6; `UPDATE_FLOOR_LAYOUT`, seat `x/y` from Task 5; `useAuth` for role gating.

- [ ] **Step 1: Imports**

Add to the page's imports:

```typescript
import { useMutation } from "@apollo/client";          // merge if already imported
import { useAuth } from "@/contexts/auth-context";
import { UPDATE_FLOOR_LAYOUT, UPDATE_SEAT } from "@/lib/apollo/operations";
import { FloorMapEditor, GRID, CANVAS_COLS, CANVAS_ROWS, type EditorLayout, type SeatPosition } from "./FloorMapEditor";
```

(Check `UPDATE_SEAT` exists in operations.ts — it does, next to `CREATE_SEAT`.)

- [ ] **Step 2: State + mode + save handler (inside the component, after the seat queries)**

```typescript
  const { user } = useAuth();
  const STAFF = new Set(["ADMIN", "SUPER_ADMIN", "CENTER_OWNER", "CENTER_MANAGER", "FINANCE", "SUPPORT"]);
  const canEdit = STAFF.has(user?.role ?? "");
  const [editMode, setEditMode] = useState(false);

  const [updateFloorLayout] = useMutation(UPDATE_FLOOR_LAYOUT);
  const [updateSeatPosition] = useMutation(UPDATE_SEAT);

  const activeFloorLayout = (activeFloor as any)?.layout ?? null;
  const hasCustomMap =
    !!activeFloorLayout ||
    (seats as any[]).some((s) => s.x != null && s.y != null);

  const handleSaveLayout = async (layout: EditorLayout, seatPositions: SeatPosition[]) => {
    try {
      await updateFloorLayout({
        variables: { floorId: activeFloorId, layout: JSON.stringify(layout) },
      });
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message ?? err?.message ?? "";
      if (/current version/i.test(msg)) {
        toast.error("This floor's layout changed elsewhere. Reloading…");
        await refetchSeats(); // + refetch floors query if present
        setEditMode(false);
      } else {
        toast.error(`Could not save layout: ${msg || "unknown error"}`);
      }
      throw err;
    }
    // Best-effort seat positions; failures surface as a warning.
    const failed: string[] = [];
    for (const p of seatPositions) {
      try {
        await updateSeatPosition({ variables: { id: p.id, input: { x: p.x, y: p.y } } });
      } catch {
        failed.push(p.id);
      }
    }
    if (failed.length) toast.warning(`${failed.length} seat position(s) failed to save — try again.`);
    else toast.success("Floor layout saved");
    setEditMode(false);
    // refetch seats so x/y round-trips
    await refetchSeats();
  };
```

(Use the page's existing seat query refetch function name — check how the `GET_SEATS` query result is destructured; if it's `const { data: seatsData } = useQuery(GET_SEATS, …)`, add `refetch: refetchSeats` to that destructuring. Same for the floors query if present.)

- [ ] **Step 3: Header buttons**

Next to the existing header controls in the map header add (only when a floor is selected):

```tsx
{activeFloorId && canEdit && !editMode && (
  <button type="button" className={styles.editLayoutBtn} onClick={() => setEditMode(true)}>
    ✏️ Edit Layout
  </button>
)}
{editMode && (
  <button type="button" className={styles.editLayoutBtn} onClick={() => setEditMode(false)}>
    ✕ Exit Editor
  </button>
)}
```

- [ ] **Step 4: Render branch**

Where the map canvas currently renders, wrap:

```tsx
{editMode ? (
  <FloorMapEditor
    floor={{ id: activeFloorId!, name: activeFloor?.name ?? "Floor", layout: activeFloorLayout }}
    seats={seats as any}
    onSaveLayout={handleSaveLayout}
    saving={false}
  />
) : hasCustomMap ? (
  <CustomMapView
    layout={activeFloorLayout}
    seats={seats as any[]}
    onSeatClick={(seat) => {
      // reuse the page's existing seat click behavior:
      // AVAILABLE → open booking modal; otherwise select
      if (normalizeStatus(seat.status) === "AVAILABLE") {
        setBookingSeat(seat);           // adapt to the page's existing modal opener
      } else {
        setSelectedSeatId(seat.id);
      }
    }}
    canEdit={canEdit}
    onEdit={() => setEditMode(true)}
  />
) : (
  /* existing auto-grid fallback JSX stays untouched here */
)}
```

(Adapt `setBookingSeat`/`setSelectedSeatId` to the page's real handlers — find the seat `onClick` in the existing grid JSX and call the same functions.)

- [ ] **Step 5: Add `CustomMapView` (same file, above the default export)**

```tsx
function CustomMapView({
  layout, seats, onSeatClick, canEdit, onEdit,
}: {
  layout: EditorLayout | null;
  seats: any[];
  onSeatClick: (seat: any) => void;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const placed = seats.filter((s) => s.x != null && s.y != null);
  const tray = seats.filter((s) => s.x == null || s.y == null);
  return (
    <div className={styles.customMapWrap}>
      {canEdit && tray.length > 0 && (
        <div className={styles.customMapTrayBar}>
          {tray.length} seat{tray.length === 1 ? "" : "s"} not on the map.
          <button type="button" className={styles.editLayoutBtn} onClick={onEdit}>Place them</button>
        </div>
      )}
      <div
        className={styles.customMapCanvas}
        style={{
          width: CANVAS_COLS * GRID,
          height: CANVAS_ROWS * GRID,
          backgroundImage:
            "linear-gradient(#F9FAFB 1px, transparent 1px), linear-gradient(90deg, #F9FAFB 1px, transparent 1px)",
          backgroundSize: `${GRID}px ${GRID}px`,
        }}
      >
        {(layout?.zones ?? []).map((z) => (
          <div
            key={z.id}
            className={`${styles.editorZone} ${styles[`zone_${z.kind}`] ?? ""}`}
            style={{ left: z.x * GRID, top: z.y * GRID, width: z.w * GRID, height: z.h * GRID }}
          >
            <span className={styles.zoneLabel}>{z.label}</span>
          </div>
        ))}
        {(layout?.labels ?? []).map((l) => (
          <div key={l.id} className={styles.editorLabel} style={{ left: l.x * GRID, top: l.y * GRID }}>
            📍 {l.text}
          </div>
        ))}
        {placed.map((s) => (
          <div
            key={s.id}
            className={`${styles.customMapSeat} ${
              normalizeStatus(s.status) === "AVAILABLE"
                ? styles.customMapSeatAvailable
                : normalizeStatus(s.status) === "OCCUPIED" || normalizeStatus(s.status) === "BOOKED"
                ? styles.customMapSeatOccupied
                : styles.customMapSeatOther
            }`}
            style={{ left: s.x * GRID, top: s.y * GRID, width: GRID - 4, height: GRID - 4 }}
            onClick={() => onSeatClick(s)}
            title={`${s.name} · ${s.status}`}
          >
            <span className={styles.seatName}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Add matching view styles (append to the CSS module):

```css
.customMapWrap { display: flex; flex-direction: column; gap: 10px; }
.customMapTrayBar {
  display: flex; align-items: center; gap: 10px; font-size: 13px; color: #92400E;
  background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 8px 12px;
}
.customMapCanvas { position: relative; background: #FFFFFF; border: 2px solid #E5E7EB; border-radius: 12px; overflow: auto; }
.customMapSeat {
  position: absolute; border-radius: 8px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; border: 2px solid; transition: transform 0.1s;
}
.customMapSeat:hover { transform: scale(1.06); }
.customMapSeatAvailable { background: #ECFDF5; border-color: #34D399; }
.customMapSeatAvailable .seatName { color: #065F46; }
.customMapSeatOccupied { background: #FEF2F2; border-color: #F87171; }
.customMapSeatOccupied .seatName { color: #991B1B; }
.customMapSeatOther { background: #F3F4F6; border-color: #9CA3AF; }
.customMapSeatOther .seatName { color: #374151; }
.customMapSeat .seatName { font-size: 10px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 2px; }
.editLayoutBtn {
  background: #FFFFFF; border: 1px solid #E5E7EB; color: #C2410C;
  border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer;
}
.editLayoutBtn:hover { background: #FFF7ED; }
```

- [ ] **Step 6: Typecheck via build**

```bash
cd apps/web && npm run build 2>&1 | grep -E "Compiled successfully|error"
```
Expected: `✓ Compiled successfully`.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/dashboard/inventory/floor-map/page.tsx apps/web/src/app/dashboard/inventory/floor-map/floor-map.module.css
git commit -m "feat(floor-map): custom map view, edit toggle, unplaced-seat tray"
```

---

### Task 8: Local end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Start servers**

```bash
npm exec nx run api:serve:development &   # wait for "successfully started", API on :3100
cd apps/web && npx next dev -p 3000 &
```

- [ ] **Step 2: API smoke (GraphQL directly)**

```bash
node -e "
(async () => {
  const API = 'http://localhost:3100/graphql';
  const gql = async (query, variables, token) => {
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify({ query, variables }) });
    return res.json();
  };
  const s = await gql('mutation S(\$input: SigninInput!) { signin(input: \$input) { accessToken user { centerId } } }', { input: { email: 'manager@spacejam.com', password: 'Manager@123' } });
  const token = s.data.signin.accessToken;
  const floors = await gql('query F(\$c: ID) { floors(centerId: \$c) { id name layout seats { id x y } } }', { c: s.data.signin.user.centerId }, token);
  const floor = floors.data.floors[0];
  console.log('floor:', floor.id, floor.name, 'layout:', floor.layout, 'seats:', floor.seats.length);
  const save = await gql('mutation U(\$f: ID!, \$l: String!) { updateFloorLayout(floorId: \$f, layout: \$l) { id layout { version } } }', { f: floor.id, l: JSON.stringify({ version: 1, zones: [{ id: 'z1', x: 2, y: 1, w: 5, h: 3, label: 'Meeting Room A', kind: 'MEETING_ROOM' }], labels: [{ id: 'l1', x: 10, y: 8, text: 'Entrance' }] }) }, token);
  console.log('save v1:', JSON.stringify(save.data?.updateFloorLayout?.layout ?? save.errors));
  const stale = await gql('mutation U(\$f: ID!, \$l: String!) { updateFloorLayout(floorId: \$f, layout: \$l) { id } }', { f: floor.id, l: JSON.stringify({ version: 1, zones: [], labels: [] }) }, token);
  console.log('stale version blocked:', !!stale.errors, stale.errors?.[0]?.message?.slice(0, 60));
})()"
```
Expected: floor listed; `save v1` shows `{"version":1}`; stale blocked with "current version 1".

- [ ] **Step 3: Browser E2E**

1. Sign in at `http://localhost:3000` as `manager@spacejam.com / Manager@123`
2. Inventory → floor map → **Edit Layout** appears → click it
3. Drag a seat chip from the tray onto the grid → chip disappears from tray, seat renders on grid
4. Add Zone → drag + resize via corner handle → double-click to rename
5. Add Label → move it
6. **Save Layout** → toast "Floor layout saved"
7. Reload page → custom map renders with the zone, label, and seat at the exact saved spots; seat still clickable
8. Edit Layout again → move seat → Save → verify moved
9. Unplaced-seat tray bar shows count on a floor with unplaced seats

- [ ] **Step 4: Commit any fixes discovered; run full API suite**

```bash
cd apps/api && npx vitest run --reporter=dot 2>&1 | tail -3
```
Expected: only the 16 pre-existing crm/subscription failures; everything else passes.

---

### Task 9: Production deploy + verification

- [ ] **Step 1: Push + archive + upload**

```bash
git push origin main
git archive --format=tar.gz HEAD -o update.tar.gz
scp -i "C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem" update.tar.gz ubuntu@ec2-18-60-107-5.ap-south-2.compute.amazonaws.com:/home/ubuntu/
```

- [ ] **Step 2: Apply migration SQL on prod (script-file pattern, then deploy)**

Upload and run (same pattern as prior migrations — idempotent SQL + `INSERT INTO migrations`), then:

```bash
ssh -i "C:\...\Ap-south-2.pem" ubuntu@ec2-18-60-107-5.ap-south-2.compute.amazonaws.com 'bash -lc "bash /home/ubuntu/deploy.sh"'
```

- [ ] **Step 3: Prod smoke**

Repeat Task 8 Step 2's node script against `https://spacejam.vedpragya.com/api/graphql` with the prod manager credentials (`manager@spacejam.com / Manager@123`), then browser-verify Edit Layout on the live site, save, reload.

- [ ] **Step 4: Clean up temp files, close the `bd` issue, report**

---

## Self-Review Notes

- Spec coverage: data model (Tasks 1–2), API validation/versioning/scoping (3–4), web ops (5), editor (6), view mode + tray + fallback (7), testing (4, 8), deploy (9). Floor.layout String-scalar crash fix folded into Task 2 (spec §API "JSON scalar passthrough"). ✔
- Types consistent: `EditorLayout`/`SeatPosition` names match between Tasks 6 and 7; `sanitizeFloorLayout` signature matches Task 3↔4. ✔
- Task 7 Step 4 references page handlers (`setBookingSeat`, `setSelectedSeatId`, `refetchSeats`) — the executor must adapt names to the real ones in `page.tsx` (explicitly noted in the task). ✔
