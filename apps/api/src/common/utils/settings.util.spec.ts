import { sanitizeSettings, deepMergeSettings } from './settings.util';
import { BadRequestException } from '@nestjs/common';

describe('sanitizeSettings', () => {
  it('keeps whitelisted top-level keys', () => {
    const out = sanitizeSettings({ finance: { a: 1 }, operations: { b: 2 } });
    expect(out).toEqual({ finance: { a: 1 }, operations: { b: 2 } });
  });

  it('drops non-whitelisted top-level keys', () => {
    const out = sanitizeSettings({ finance: { a: 1 }, evil: 'x', __proto__: null } as any);
    expect(out).toEqual({ finance: { a: 1 } });
    expect(out).not.toHaveProperty('evil');
  });

  it('throws when payload exceeds 64KB', () => {
    const big = { finance: { blob: 'x'.repeat(70 * 1024) } };
    expect(() => sanitizeSettings(big)).toThrow(BadRequestException);
  });

  it('preserves nested values inside a whitelisted key', () => {
    const out = sanitizeSettings({ managerConfig: { finance: { reminderTiming: 'weekly' } } });
    expect(out.managerConfig.finance.reminderTiming).toBe('weekly');
  });
});

describe('deepMergeSettings (with depth limit)', () => {
  it('merges sibling objects without clobbering', () => {
    const merged = deepMergeSettings({ finance: { a: 1 }, security: { x: 9 } }, { finance: { b: 2 } });
    expect(merged).toEqual({ finance: { a: 1, b: 2 }, security: { x: 9 } });
  });

  it('overwrites primitives and arrays', () => {
    const merged = deepMergeSettings({ a: 1, arr: [1] }, { a: 2, arr: [2, 3] });
    expect(merged).toEqual({ a: 2, arr: [2, 3] });
  });

  it('throws when nesting exceeds the depth cap (default 5)', () => {
    // depth 6: {a:{b:{c:{d:{e:{f:1}}}}}} — six levels of object nesting.
    const nested = { a: { b: { c: { d: { e: { f: 1 } } } } } };
    expect(() => deepMergeSettings({}, nested)).toThrow(BadRequestException);
  });
});
