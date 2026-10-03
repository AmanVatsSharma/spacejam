/**
 * File:        apps/api/src/testing/fake-datasource.ts
 * Module:      API · Testing
 * Purpose:     A small in-memory stand-in for TypeORM's DataSource, for service
 *              specs that need to assert on WHAT ENDS UP PERSISTED rather than
 *              on which repository methods were called. It implements just the
 *              surface our services use:
 *                - getRepository(Entity) / manager methods (find, findOne, save,
 *                  create, update, delete, count)
 *                - where-matching with equality, arrays (OR), IsNull(), ILike(),
 *                  In()
 *                - transaction(cb) with REAL rollback (state is snapshotted and
 *                  restored if the callback throws)
 *                - unique constraints (throws a pg-style 23505 error)
 *                - simple relations (lead / customer / assignedTo / center)
 *              Pure TypeScript — no test-runner imports — so it can live in src/.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { randomUUID } from 'crypto';
import { FindOperator } from 'typeorm';

type Row = Record<string, any>;
type EntityClass = new (...args: any[]) => any;

/** Convert an ILIKE pattern (with backslash escapes) to a case-insensitive regex. */
function likeToRegex(pattern: string): RegExp {
  let out = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '\\' && i + 1 < pattern.length) {
      out += pattern[++i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    } else if (c === '%') {
      out += '.*';
    } else if (c === '_') {
      out += '.';
    } else {
      out += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${out}$`, 'is');
}

function matchValue(rowVal: any, cond: any): boolean {
  if (cond instanceof FindOperator) {
    switch (cond.type) {
      case 'isNull':
        return rowVal == null;
      case 'ilike':
      case 'like':
        return likeToRegex(String(cond.value)).test(String(rowVal ?? ''));
      case 'in':
        return (cond.value as any[]).includes(rowVal);
      case 'not':
        return !matchValue(rowVal, cond.value);
      default:
        throw new Error(`FakeDb: unsupported FindOperator "${cond.type}"`);
    }
  }
  if (cond instanceof Date) return rowVal instanceof Date && rowVal.getTime() === cond.getTime();
  return rowVal === cond;
}

function matches(row: Row, where?: Row | Row[]): boolean {
  if (!where) return true;
  if (Array.isArray(where)) return where.some((w) => matches(row, w));
  return Object.entries(where).every(([key, cond]) => cond === undefined || matchValue(row[key], cond));
}

export interface UniqueRule {
  entity: EntityClass;
  columns: string[];
  /** Only enforce when this returns true for the row (partial unique index). */
  when?: (row: Row) => boolean;
}

export class FakeDb {
  private tables = new Map<EntityClass, Row[]>();
  /** Per-entity hook applied on insert (defaults, timestamps). */
  private insertHooks = new Map<EntityClass, (row: Row) => void>();
  private uniques: UniqueRule[] = [];
  /** relation name → [target entity, foreign-key column on the source row] */
  private relations = new Map<string, [EntityClass, string]>();
  /** Writes can be made to fail to exercise rollback. */
  private failOnSave = new Map<EntityClass, Error>();

  // ── setup ──────────────────────────────────────────────────────────────
  seed<T extends Row>(entity: EntityClass, rows: T[]): this {
    const list = this.table(entity);
    for (const r of rows) {
      const row = Object.assign(new entity(), { ...r });
      if (!row.id) row.id = randomUUID();
      list.push(row);
    }
    return this;
  }
  onInsert(entity: EntityClass, hook: (row: Row) => void): this {
    this.insertHooks.set(entity, hook);
    return this;
  }
  unique(rule: UniqueRule): this {
    this.uniques.push(rule);
    return this;
  }
  relation(name: string, target: EntityClass, foreignKey: string): this {
    this.relations.set(name, [target, foreignKey]);
    return this;
  }
  /** Make the next/any save of `entity` throw — to test rollback. */
  failSavesOf(entity: EntityClass, error: Error): this {
    this.failOnSave.set(entity, error);
    return this;
  }
  clearFailures(): void {
    this.failOnSave.clear();
  }

  // ── inspection helpers for assertions ──────────────────────────────────
  all<T = any>(entity: EntityClass): T[] {
    return this.table(entity).map((r) => ({ ...r })) as T[];
  }
  count(entity: EntityClass): number {
    return this.table(entity).length;
  }
  byId<T = any>(entity: EntityClass, id: string): T | undefined {
    const row = this.table(entity).find((r) => r.id === id);
    return row ? ({ ...row } as T) : undefined;
  }

  // ── DataSource surface ─────────────────────────────────────────────────
  getRepository(entity: EntityClass) {
    return new FakeRepository(this, entity);
  }

  async transaction<T>(cb: (manager: FakeManager) => Promise<T>): Promise<T> {
    const snapshot = new Map<EntityClass, Row[]>();
    for (const [k, rows] of this.tables) snapshot.set(k, rows.map((r) => Object.assign(Object.create(Object.getPrototypeOf(r)), r)));
    try {
      return await cb(new FakeManager(this));
    } catch (err) {
      this.tables = snapshot; // real rollback
      throw err;
    }
  }

  // ── internals shared with FakeRepository / FakeManager ─────────────────
  table(entity: EntityClass): Row[] {
    let t = this.tables.get(entity);
    if (!t) {
      t = [];
      this.tables.set(entity, t);
    }
    return t;
  }

  insert(entity: EntityClass, input: Row): Row {
    const failure = this.failOnSave.get(entity);
    if (failure) throw failure;
    const row = input instanceof entity ? input : Object.assign(new entity(), input);
    if (!row.id) row.id = randomUUID();
    const now = new Date();
    if (row.createdAt === undefined) row.createdAt = now;
    if (row.updatedAt === undefined) row.updatedAt = now;
    this.insertHooks.get(entity)?.(row);
    for (const rule of this.uniques) {
      if (rule.entity !== entity) continue;
      if (rule.when && !rule.when(row)) continue;
      const key = rule.columns.map((c) => row[c]);
      if (key.some((v) => v == null)) continue;
      const dup = this.table(entity).some(
        (r) => r.id !== row.id && (!rule.when || rule.when(r)) && rule.columns.every((c, i) => r[c] === key[i]),
      );
      if (dup) {
        const err: any = new Error(`duplicate key value violates unique constraint on (${rule.columns.join(',')})`);
        err.code = '23505';
        throw err;
      }
    }
    this.table(entity).push(row);
    return row;
  }

  attachRelations(row: Row, relations?: string[] | Record<string, any>): Row {
    const out = Object.assign(Object.create(Object.getPrototypeOf(row)), row);
    const names = Array.isArray(relations) ? relations : relations ? Object.keys(relations) : [];
    for (const name of names) {
      const rel = this.relations.get(name);
      if (!rel) continue;
      const [target, fk] = rel;
      const found = this.table(target).find((r) => r.id === row[fk]);
      out[name] = found ? { ...found } : undefined;
    }
    return out;
  }
}

export class FakeRepository<T extends Row = any> {
  constructor(
    private readonly db: FakeDb,
    private readonly entity: EntityClass,
  ) {}

  create(plain: Partial<T>): T {
    return Object.assign(new this.entity(), plain) as T;
  }

  async find(opts: { where?: Row | Row[]; order?: Record<string, 'ASC' | 'DESC'>; take?: number; skip?: number; relations?: any } = {}): Promise<T[]> {
    let rows = this.db.table(this.entity).filter((r) => matches(r, opts.where));
    if (opts.order) {
      const [[key, dir]] = Object.entries(opts.order);
      rows = [...rows].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return dir === 'DESC' ? -cmp : cmp;
      });
    }
    if (opts.skip) rows = rows.slice(opts.skip);
    if (opts.take != null) rows = rows.slice(0, opts.take);
    return rows.map((r) => this.db.attachRelations(r, opts.relations)) as T[];
  }

  async findOne(opts: { where?: Row | Row[]; relations?: any; lock?: unknown } = {}): Promise<T | null> {
    const [first] = await this.find({ where: opts.where, relations: opts.relations, take: 1 });
    return first ?? null;
  }

  async count(opts: { where?: Row | Row[] } = {}): Promise<number> {
    return this.db.table(this.entity).filter((r) => matches(r, opts.where)).length;
  }

  async save(input: T): Promise<T> {
    const existing = input.id ? this.db.table(this.entity).find((r) => r.id === input.id) : undefined;
    if (existing) {
      Object.assign(existing, input, { updatedAt: new Date() });
      return existing as T;
    }
    return this.db.insert(this.entity, input) as T;
  }

  async update(criteria: string | Row, patch: Row): Promise<{ affected: number }> {
    const where = typeof criteria === 'string' ? { id: criteria } : criteria;
    let affected = 0;
    for (const row of this.db.table(this.entity)) {
      if (!matches(row, where)) continue;
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) row[k] = v;
      row.updatedAt = new Date();
      affected++;
    }
    return { affected };
  }

  async delete(criteria: string | Row): Promise<{ affected: number }> {
    const where = typeof criteria === 'string' ? { id: criteria } : criteria;
    const list = this.db.table(this.entity);
    const keep = list.filter((r) => !matches(r, where));
    const affected = list.length - keep.length;
    list.length = 0;
    list.push(...keep);
    return { affected };
  }
}

/** EntityManager-style facade over the same tables. */
export class FakeManager {
  constructor(private readonly db: FakeDb) {}

  getRepository(entity: EntityClass) {
    return this.db.getRepository(entity);
  }
  create(entity: EntityClass, plain: Row) {
    return this.db.getRepository(entity).create(plain);
  }
  find(entity: EntityClass, opts?: any) {
    return this.db.getRepository(entity).find(opts);
  }
  findOne(entity: EntityClass, opts?: any) {
    return this.db.getRepository(entity).findOne(opts);
  }
  count(entity: EntityClass, opts?: any) {
    return this.db.getRepository(entity).count(opts);
  }
  save(row: Row) {
    const entity = row.constructor as EntityClass;
    if (entity === Object) throw new Error('FakeManager.save needs an entity instance (use manager.create first)');
    return this.db.getRepository(entity).save(row);
  }
  update(entity: EntityClass, criteria: string | Row, patch: Row) {
    return this.db.getRepository(entity).update(criteria, patch);
  }
  delete(entity: EntityClass, criteria: string | Row) {
    return this.db.getRepository(entity).delete(criteria);
  }
}
