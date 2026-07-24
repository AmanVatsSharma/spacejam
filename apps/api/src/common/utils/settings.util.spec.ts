/**
 * File:        apps/api/src/common/utils/settings.util.spec.ts
 * Module:      API · Common · Settings Utils · Tests
 * Purpose:     Verifies that deepMergeSettings preserves sibling groups
 *              (e.g., updating settings.finance never wipes settings.security).
 *              This is the contract every Settings page relies on when it
 *              calls UPDATE_CENTER_SETTINGS with a group-scoped partial.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */

import { describe, it, expect } from 'vitest';
import { deepMergeSettings } from './settings.util';

describe('deepMergeSettings', () => {
  it('preserves sibling keys not present in incoming', () => {
    const target = {
      finance: { verificationRequired: true },
      security: { twoFactor: false },
    };
    const incoming = { finance: { verificationRequired: false } };

    const result = deepMergeSettings(target, incoming);

    expect(result.finance.verificationRequired).toBe(false);
    expect(result.security).toEqual({ twoFactor: false });
  });

  it('adds new groups without affecting existing ones', () => {
    const target = { finance: { verificationRequired: true } };
    const incoming = {
      operations: { bookingRules: { advanceBookingDays: 14 } },
    };

    const result = deepMergeSettings(target, incoming);

    expect(result.finance).toEqual({ verificationRequired: true });
    expect(result.operations).toEqual({
      bookingRules: { advanceBookingDays: 14 },
    });
  });

  it('recurses into nested objects key-by-key', () => {
    const target = {
      operations: {
        bookingRules: { advanceBookingDays: 7, minimumDurationMinutes: 30 },
        roomDefaults: { defaultCapacity: 8 },
      },
    };
    const incoming = {
      operations: {
        bookingRules: { advanceBookingDays: 30 },
        maintenance: { enabled: true },
      },
    };

    const result = deepMergeSettings(target, incoming);

    expect(result.operations.bookingRules.advanceBookingDays).toBe(30);
    expect(result.operations.bookingRules.minimumDurationMinutes).toBe(30);
    expect(result.operations.roomDefaults).toEqual({ defaultCapacity: 8 });
    expect(result.operations.maintenance).toEqual({ enabled: true });
  });

  it('overwrites primitives (does not attempt to merge them)', () => {
    const target = { finance: { taxRate: 0.05, currency: 'USD' } };
    const incoming = { finance: { taxRate: 0.07 } };

    const result = deepMergeSettings(target, incoming);

    expect(result.finance.taxRate).toBe(0.07);
    expect(result.finance.currency).toBe('USD');
  });

  it('replaces arrays entirely (does not deep-merge them)', () => {
    const target = { notifications: { recipients: ['a@x.com', 'b@x.com'] } };
    const incoming = { notifications: { recipients: ['c@x.com'] } };

    const result = deepMergeSettings(target, incoming);

    expect(result.notifications.recipients).toEqual(['c@x.com']);
  });

  it('handles empty incoming as identity (returns a copy)', () => {
    const target = { finance: { x: 1 } };
    const incoming = {};

    const result = deepMergeSettings(target, incoming);

    expect(result).toEqual({ finance: { x: 1 } });
    expect(result).not.toBe(target);
  });

  it('does not mutate the target object', () => {
    const target = { finance: { x: 1 } };
    const incoming = { finance: { x: 2 } };

    deepMergeSettings(target, incoming);

    expect(target.finance.x).toBe(1);
  });

  it('merges nested objects key-by-key when both sides are objects', () => {
    const target = { center: { id: 'existing' } };
    const incoming = { center: { name: 'New' } };

    const result = deepMergeSettings(target, incoming);

    expect(result.center).toEqual({ id: 'existing', name: 'New' });
  });
});
