/**
 * File:        apps/api/src/integrations/integration-settings.resolver.spec.ts
 * Module:      API · Integrations · Settings Resolver · Tests
 * Purpose:     What a SUPER_ADMIN can configure for payments, and the guarantees
 *              around it:
 *                - every operation is SUPER_ADMIN only (the old code referenced
 *                  a UserRole.ADMIN that no longer exists)
 *                - Razorpay: the key id must be rzp_test_/rzp_live_ and agree with
 *                  the mode; changed credentials are proven against Razorpay
 *                  before they are saved; masked/empty secrets keep the stored
 *                  value; secrets are never written to the audit trail
 *                - testRazorpayConnection reports, never throws
 *                - the receiving bank account and cheque payee are validated and
 *                  stored under payment.bank.* / payment.cheque.*
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserRole } from '@enums';
import {
  IntegrationSettingsResolver,
  SaveBankAccountConfigInput,
  SaveChequeConfigInput,
} from './integration-settings.resolver';

const SUPER: any = { sub: 'super-1', email: 's@x.test', role: UserRole.SUPER_ADMIN, centerId: null, sid: 's', typ: 'access' };

const STORED = { keyId: 'rzp_test_StoredKey1234', keySecret: 'stored-secret-value-9999', webhookSecret: 'stored-webhook-secret', mode: 'test' as const };

function build(stored: typeof STORED | { keyId: ''; keySecret: ''; webhookSecret: ''; mode: '' } = STORED) {
  const settings = {
    getRazorpayConfig: vi.fn(async () => stored),
    setMany: vi.fn(async () => {}),
    readGroup: vi.fn(async () => []),
    isSmsConfigured: vi.fn(async () => false),
    getSmsConfig: vi.fn(async () => ({ provider: '' })),
    isRazorpayConfigured: vi.fn(async () => !!stored.keyId && !!stored.keySecret),
    isEmailConfigured: vi.fn(async () => false),
    isWhatsappConfigured: vi.fn(async () => false),
    isQrPaymentConfigured: vi.fn(async () => false),
    isBankAccountConfigured: vi.fn(async () => false),
    isChequeConfigured: vi.fn(async () => false),
  };
  const razorpay = { testConnection: vi.fn(async () => ({ ok: true, message: 'Connected to Razorpay (test mode).', mode: 'test' })) };
  const audit = { record: vi.fn(async () => {}) };
  const resolver = new IntegrationSettingsResolver(settings as any, {} as any, razorpay as any, audit as any, {} as any);
  return { resolver, settings, razorpay, audit };
}

/** What setMany was asked to store, as { key: { value, secret } }. */
const stored = (h: ReturnType<typeof build>) =>
  Object.fromEntries((h.settings.setMany.mock.calls[0] as any)[1].map((e: any) => [e.key, { value: e.value, secret: !!e.secret }]));

describe('IntegrationSettingsResolver', () => {
  let h: ReturnType<typeof build>;
  beforeEach(() => {
    h = build();
  });

  describe('access control', () => {
    it('EVERY operation is SUPER_ADMIN only — and no role slot is undefined', () => {
      const proto = IntegrationSettingsResolver.prototype as any;
      const guarded = Object.getOwnPropertyNames(proto).filter((n) => n !== 'constructor' && typeof proto[n] === 'function');
      expect(guarded.length).toBeGreaterThanOrEqual(10);
      for (const name of guarded) {
        const roles = Reflect.getMetadata('roles', proto[name]);
        expect(roles, `${name} must declare @Roles`).toEqual([UserRole.SUPER_ADMIN]);
      }
    });
  });

  describe('saveRazorpayConfig', () => {
    const input = (over: Record<string, unknown> = {}): any => ({
      keyId: 'rzp_live_NewLiveKey123456',
      keySecret: 'brand-new-secret-value-1234',
      webhookSecret: 'brand-new-webhook-secret',
      mode: 'live',
      ...over,
    });

    it('validates changed credentials against Razorpay, then saves them (secrets flagged) and derives the mode from the key', async () => {
      await h.resolver.saveRazorpayConfig(input(), SUPER);
      expect(h.razorpay.testConnection).toHaveBeenCalledWith({ keyId: 'rzp_live_NewLiveKey123456', keySecret: 'brand-new-secret-value-1234' });
      expect(stored(h)).toEqual({
        'razorpay.keyId': { value: 'rzp_live_NewLiveKey123456', secret: false },
        'razorpay.keySecret': { value: 'brand-new-secret-value-1234', secret: true },
        'razorpay.webhookSecret': { value: 'brand-new-webhook-secret', secret: true },
        'razorpay.mode': { value: 'live', secret: false },
      });
    });

    it('derives the mode from the key when none is sent', async () => {
      await h.resolver.saveRazorpayConfig(input({ mode: undefined, keyId: 'rzp_test_NewTestKey123456' }), SUPER);
      expect(stored(h)['razorpay.mode'].value).toBe('test');
    });

    it('does NOT save credentials Razorpay rejects — the super admin sees why', async () => {
      h.razorpay.testConnection.mockResolvedValueOnce({ ok: false, message: 'Razorpay rejected the key id / key secret.', mode: 'live' });
      await expect(h.resolver.saveRazorpayConfig(input(), SUPER)).rejects.toThrow('Razorpay rejected the key id / key secret.');
      expect(h.settings.setMany).not.toHaveBeenCalled();
      expect(h.audit.record).not.toHaveBeenCalled();
    });

    it('rejects a key id that is not rzp_test_/rzp_live_, and a mode that contradicts the key', async () => {
      await expect(h.resolver.saveRazorpayConfig(input({ keyId: 'my-key' }), SUPER)).rejects.toThrow(/rzp_test_xxxx or rzp_live_xxxx/);
      await expect(h.resolver.saveRazorpayConfig(input({ keyId: 'rzp_test_abc123456789', mode: 'live' }), SUPER)).rejects.toThrow(/test-mode key but "live" mode/);
      expect(h.razorpay.testConnection).not.toHaveBeenCalled();
      expect(h.settings.setMany).not.toHaveBeenCalled();
    });

    it('rejects secrets that are obviously wrong (too short)', async () => {
      await expect(h.resolver.saveRazorpayConfig(input({ keySecret: 'short' }), SUPER)).rejects.toThrow(/looks too short/);
      await expect(h.resolver.saveRazorpayConfig(input({ webhookSecret: 'abc' }), SUPER)).rejects.toThrow(/at least 8 characters/);
    });

    it('keeps the stored secrets when the UI sends the mask or nothing back — and skips the network check if nothing changed', async () => {
      await h.resolver.saveRazorpayConfig(
        { keyId: STORED.keyId, keySecret: '••••9999', webhookSecret: '••••cret', mode: 'test' } as any,
        SUPER,
      );
      expect(h.razorpay.testConnection).not.toHaveBeenCalled(); // same key id, secret unchanged
      expect(stored(h)['razorpay.keySecret'].value).toBe(STORED.keySecret);
      expect(stored(h)['razorpay.webhookSecret'].value).toBe(STORED.webhookSecret);
    });

    it('lets a super admin update just the webhook secret without re-testing the keys', async () => {
      await h.resolver.saveRazorpayConfig(
        { keyId: STORED.keyId, keySecret: '', webhookSecret: 'a-fresh-webhook-secret', mode: 'test' } as any,
        SUPER,
      );
      expect(h.razorpay.testConnection).not.toHaveBeenCalled();
      expect(stored(h)['razorpay.webhookSecret'].value).toBe('a-fresh-webhook-secret');
      expect(stored(h)['razorpay.keySecret'].value).toBe(STORED.keySecret);
    });

    it('requires a secret on first setup', async () => {
      const empty = build({ keyId: '', keySecret: '', webhookSecret: '', mode: '' });
      await expect(empty.resolver.saveRazorpayConfig({ keyId: 'rzp_test_abc123456789', keySecret: '' } as any, SUPER)).rejects.toThrow(/Enter the Razorpay key secret/);
    });

    it('skipValidation saves without calling Razorpay (offline setups)', async () => {
      await h.resolver.saveRazorpayConfig(input({ skipValidation: true }), SUPER);
      expect(h.razorpay.testConnection).not.toHaveBeenCalled();
      expect(h.settings.setMany).toHaveBeenCalled();
    });

    it('audits the change but NEVER writes a secret value into the trail', async () => {
      await h.resolver.saveRazorpayConfig(input(), SUPER);
      const entry = (h.audit.record.mock.calls[0] as any)[0];
      expect(entry).toMatchObject({
        action: 'INTEGRATION_SETTINGS_UPDATE',
        userId: SUPER.sub,
        entityType: 'razorpay',
        changes: { keyId: 'rzp_live_NewLiveKey123456', mode: 'live', keySecretUpdated: true, webhookSecretUpdated: true, validated: true },
      });
      const text = JSON.stringify(entry);
      expect(text).not.toContain('brand-new-secret-value-1234');
      expect(text).not.toContain('brand-new-webhook-secret');
    });
  });

  describe('testRazorpayConnection', () => {
    it('tests the entered key pair without saving anything', async () => {
      const res = await h.resolver.testRazorpayConnection('rzp_test_Entered123456', 'entered-secret-value-12345');
      expect(h.razorpay.testConnection).toHaveBeenCalledWith({ keyId: 'rzp_test_Entered123456', keySecret: 'entered-secret-value-12345' });
      expect(res.ok).toBe(true);
      expect(h.settings.setMany).not.toHaveBeenCalled();
    });

    it('falls back to the stored secret when the UI sends the mask / nothing, and to the stored key id', async () => {
      await h.resolver.testRazorpayConnection(undefined, '••••9999');
      expect(h.razorpay.testConnection).toHaveBeenLastCalledWith({ keyId: STORED.keyId, keySecret: STORED.keySecret });
      await h.resolver.testRazorpayConnection('  ', null);
      expect(h.razorpay.testConnection).toHaveBeenLastCalledWith({ keyId: STORED.keyId, keySecret: STORED.keySecret });
    });

    it('returns the failure instead of throwing', async () => {
      h.razorpay.testConnection.mockResolvedValueOnce({ ok: false, message: 'bad keys', mode: 'test' });
      expect(await h.resolver.testRazorpayConnection('rzp_test_x123456', 'x')).toEqual({ ok: false, message: 'bad keys', mode: 'test' });
    });
  });

  describe('bank account & cheque payee', () => {
    it('saves the receiving bank account under payment.bank.* (normalised) and audits only the last 4 digits', async () => {
      await h.resolver.saveBankAccountConfig(
        { accountName: ' SpaceJam Pvt Ltd ', accountNumber: '123456789012', ifsc: 'hdfc0001234', bankName: 'HDFC Bank', branch: ' Madhapur ' } as any,
        SUPER,
      );
      expect(stored(h)).toEqual({
        'payment.bank.accountName': { value: 'SpaceJam Pvt Ltd', secret: false },
        'payment.bank.accountNumber': { value: '123456789012', secret: false },
        'payment.bank.ifsc': { value: 'HDFC0001234', secret: false },
        'payment.bank.bankName': { value: 'HDFC Bank', secret: false },
        'payment.bank.branch': { value: 'Madhapur', secret: false },
      });
      const entry = (h.audit.record.mock.calls[0] as any)[0];
      expect(entry.changes).toEqual({ accountName: 'SpaceJam Pvt Ltd', ifsc: 'HDFC0001234', accountNumberLast4: '9012' });
      expect(JSON.stringify(entry)).not.toContain('123456789012');
    });

    it('saves the cheque payee and instructions under payment.cheque.*', async () => {
      await h.resolver.saveChequeConfig({ payeeName: ' SpaceJam Pvt Ltd ', instructions: ' Drop at the desk ' } as any, SUPER);
      expect(stored(h)).toEqual({
        'payment.cheque.payeeName': { value: 'SpaceJam Pvt Ltd', secret: false },
        'payment.cheque.instructions': { value: 'Drop at the desk', secret: false },
      });
    });

    it('validates bank details: 9–18 digit account number and a real IFSC shape', async () => {
      const check = async (over: Record<string, unknown>) =>
        (await validate(plainToInstance(SaveBankAccountConfigInput, { accountName: 'SpaceJam', accountNumber: '123456789012', ifsc: 'HDFC0001234', ...over }))).map((e) => e.property);

      expect(await check({})).toEqual([]);
      expect(await check({ accountNumber: '1234' })).toContain('accountNumber');
      expect(await check({ accountNumber: '12345678901234567890' })).toContain('accountNumber');
      expect(await check({ accountNumber: '12AB56789012' })).toContain('accountNumber');
      expect(await check({ ifsc: 'HDFC1001234' })).toContain('ifsc'); // 5th char must be 0
      expect(await check({ ifsc: 'HDF0001234' })).toContain('ifsc');
      expect(await check({ accountName: 'A' })).toContain('accountName');
    });

    it('validates the cheque payee', async () => {
      expect((await validate(plainToInstance(SaveChequeConfigInput, { payeeName: 'X' }))).map((e) => e.property)).toContain('payeeName');
      expect(await validate(plainToInstance(SaveChequeConfigInput, { payeeName: 'SpaceJam' }))).toHaveLength(0);
    });
  });

  describe('integrationStatus', () => {
    it('reports Razorpay, webhook, bank and cheque readiness', async () => {
      h.settings.isBankAccountConfigured.mockResolvedValueOnce(true);
      h.settings.isChequeConfigured.mockResolvedValueOnce(true);
      expect(await h.resolver.integrationStatus()).toMatchObject({
        razorpayConfigured: true,
        razorpayMode: 'test',
        razorpayWebhookConfigured: true,
        bankConfigured: true,
        chequeConfigured: true,
      });
    });

    it('flags a missing webhook secret (online payments would not auto-complete if the tab closes)', async () => {
      const noHook = build({ ...STORED, webhookSecret: '' } as any);
      expect(await noHook.resolver.integrationStatus()).toMatchObject({ razorpayConfigured: true, razorpayWebhookConfigured: false });
    });
  });
});
