/**
 * File:        apps/api/src/integrations/razorpay.service.spec.ts
 * Module:      API · Integrations · Payment · Tests
 * Purpose:     RazorpayService against a stubbed global fetch:
 *                - orders are created in PAISE from a rupee amount, with Basic
 *                  auth from the super-admin-configured keys, and bad amounts are
 *                  rejected before any network call
 *                - gateway errors are translated into the right exception class
 *                  (the webhook relies on 4xx = permanent, 5xx = transient) and
 *                  never leak key material
 *                - signature verification is HMAC-SHA256(order|payment) with a
 *                  constant-time compare
 *                - fetch / capture / testConnection behave as the settlement and
 *                  the Settings page need
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { RazorpayService, razorpayModeFromKeyId, safeEqual } from './razorpay.service';

const KEY_ID = 'rzp_test_AbCdEf123456';
const KEY_SECRET = 'sup3r-s3cret-key-value-1234';

const CFG = { keyId: KEY_ID, keySecret: KEY_SECRET, webhookSecret: 'whsec_12345678', mode: 'test' as const };

/** A minimal fetch Response double. */
const reply = (status: number, body: unknown = {}) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }) as any;

function build(cfg: Partial<typeof CFG> | null = CFG) {
  const settings = { getRazorpayConfig: vi.fn(async () => ({ keyId: '', keySecret: '', webhookSecret: '', mode: '', ...(cfg ?? {}) })) };
  return { service: new RazorpayService(settings as any), settings };
}

const sign = (orderId: string, paymentId: string, secret = KEY_SECRET) =>
  createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

describe('RazorpayService', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    delete process.env.RAZORPAY_API_BASE;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RAZORPAY_API_BASE;
  });

  describe('createOrder', () => {
    it('converts rupees to paise and authenticates with the configured keys', async () => {
      fetchMock.mockResolvedValueOnce(reply(200, { id: 'order_1', amount: 5_000_000, currency: 'INR', status: 'created', receipt: 'rcpt' }));
      const { service } = build();
      const order = await service.createOrder(50000, 'rcpt', { onboardingId: 'ob-1' });

      expect(order.id).toBe('order_1');
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.razorpay.com/v1/orders');
      expect(init.method).toBe('POST');
      expect(init.headers.Authorization).toBe('Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64'));
      expect(JSON.parse(init.body)).toEqual({ amount: 5_000_000, currency: 'INR', receipt: 'rcpt', notes: { onboardingId: 'ob-1' } });
      expect(init.signal).toBeInstanceOf(AbortSignal); // a hung gateway cannot hang a request forever
    });

    it('rounds fractional rupees to the nearest paisa without float drift', async () => {
      fetchMock.mockResolvedValue(reply(200, { id: 'o' }));
      const { service } = build();
      await service.createOrder(1999.99);
      // 1.005 * 100 is 100.49999999999999 in IEEE-754 — it must still become 101 paise.
      await service.createOrder(1.005);
      const amounts = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body).amount);
      expect(amounts).toEqual([199_999, 101]);
    });

    it('rejects amounts under ₹1, over the cap, or non-numeric — before any network call', async () => {
      const { service } = build();
      await expect(service.createOrder(0.5)).rejects.toThrow(/at least ₹1/);
      await expect(service.createOrder(Number.NaN)).rejects.toThrow(BadRequestException);
      await expect(service.createOrder(Infinity)).rejects.toThrow(BadRequestException);
      await expect(service.createOrderPaise({ amountPaise: 10_000_000_01 })).rejects.toThrow(/maximum/);
      await expect(service.createOrderPaise({ amountPaise: 150.5 })).rejects.toThrow(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refuses cleanly when no keys are configured (and never calls Razorpay)', async () => {
      const { service } = build({ keyId: '', keySecret: '' });
      await expect(service.createOrder(500)).rejects.toThrow(/not configured/);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('honours RAZORPAY_API_BASE (sandbox / proxy / tests) and trims a trailing slash', async () => {
      process.env.RAZORPAY_API_BASE = 'http://127.0.0.1:9999/';
      fetchMock.mockResolvedValueOnce(reply(200, { id: 'o' }));
      await build().service.createOrder(500);
      expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:9999/v1/orders');
    });

    it('truncates an over-long receipt to Razorpay\'s 40-char limit', async () => {
      fetchMock.mockResolvedValueOnce(reply(200, { id: 'o' }));
      await build().service.createOrder(500, 'x'.repeat(80));
      expect(JSON.parse(fetchMock.mock.calls[0][1].body).receipt).toHaveLength(40);
    });
  });

  describe('gateway error translation', () => {
    it('401 → BadRequest about the keys, without echoing any key material', async () => {
      fetchMock.mockResolvedValueOnce(reply(401, { error: { description: 'Authentication failed' } }));
      const err: any = await build().service.createOrder(500).catch((e) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).toMatch(/key id \/ key secret/);
      expect(err.message).not.toContain(KEY_SECRET);
      expect(err.message).not.toContain(KEY_ID);
    });

    it('other 4xx → BadRequest (permanent) carrying the gateway reason', async () => {
      fetchMock.mockResolvedValueOnce(reply(400, { error: { description: 'Order amount less than minimum amount allowed' } }));
      await expect(build().service.createOrder(500)).rejects.toThrow('Razorpay: Order amount less than minimum amount allowed');
    });

    it('5xx and 429 → ServiceUnavailable (transient, so webhooks get retried)', async () => {
      fetchMock.mockResolvedValueOnce(reply(502, '<html>bad gateway</html>'));
      await expect(build().service.createOrder(500)).rejects.toThrow(ServiceUnavailableException);
      fetchMock.mockResolvedValueOnce(reply(429, {}));
      await expect(build().service.createOrder(500)).rejects.toThrow(/rate-limiting/);
    });

    it('a network failure or timeout → ServiceUnavailable', async () => {
      fetchMock.mockRejectedValueOnce(new Error('ECONNRESET'));
      await expect(build().service.createOrder(500)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('signature verification', () => {
    it('accepts HMAC-SHA256("orderId|paymentId") with the key secret', () => {
      const { service } = build();
      expect(service.verifySignature('order_1', 'pay_1', sign('order_1', 'pay_1'), KEY_SECRET)).toBe(true);
    });

    it('rejects a wrong signature, a signature for another payment/order, and a wrong secret', () => {
      const { service } = build();
      const good = sign('order_1', 'pay_1');
      expect(service.verifySignature('order_1', 'pay_1', good.replace(/.$/, good.endsWith('0') ? '1' : '0'), KEY_SECRET)).toBe(false);
      expect(service.verifySignature('order_1', 'pay_2', good, KEY_SECRET)).toBe(false);
      expect(service.verifySignature('order_2', 'pay_1', good, KEY_SECRET)).toBe(false);
      expect(service.verifySignature('order_1', 'pay_1', good, 'other-secret')).toBe(false);
    });

    it('never throws on malformed input (wrong length, empty, non-hex)', () => {
      const { service } = build();
      expect(service.verifySignature('order_1', 'pay_1', 'deadbeef', KEY_SECRET)).toBe(false);
      expect(service.verifySignature('order_1', 'pay_1', '', KEY_SECRET)).toBe(false);
      expect(service.verifySignature('', 'pay_1', sign('', 'pay_1'), KEY_SECRET)).toBe(false);
      expect(service.verifySignature('order_1', 'pay_1', 'zz'.repeat(32), KEY_SECRET)).toBe(false);
      expect(service.verifySignature('order_1', 'pay_1', sign('order_1', 'pay_1'), '')).toBe(false);
    });

    it('verifyPayment uses the stored secret, and refuses when unconfigured', async () => {
      const { service } = build();
      expect(await service.verifyPayment('order_1', 'pay_1', sign('order_1', 'pay_1'))).toBe(true);
      expect(await service.verifyPayment('order_1', 'pay_1', 'nope')).toBe(false);
      await expect(build({ keySecret: '' }).service.verifyPayment('o', 'p', 's')).rejects.toThrow(/not configured/);
    });

    it('safeEqual is constant-time-style equality that tolerates different lengths', () => {
      expect(safeEqual('abc', 'abc')).toBe(true);
      expect(safeEqual('abc', 'abd')).toBe(false);
      expect(safeEqual('abc', 'abcd')).toBe(false);
      expect(safeEqual('', '')).toBe(true);
    });
  });

  describe('fetchPayment / capturePayment', () => {
    it('GETs a payment by id', async () => {
      fetchMock.mockResolvedValueOnce(reply(200, { id: 'pay_1', status: 'captured' }));
      const p = await build().service.fetchPayment('pay_1');
      expect(p.status).toBe('captured');
      expect(fetchMock.mock.calls[0][0]).toBe('https://api.razorpay.com/v1/payments/pay_1');
      expect(fetchMock.mock.calls[0][1].method).toBe('GET');
    });

    it('rejects a malformed payment id before it can be used to build a URL', async () => {
      const { service } = build();
      await expect(service.fetchPayment('../orders')).rejects.toThrow(/Invalid Razorpay payment id/);
      await expect(service.capturePayment('pay_1/../x', 100)).rejects.toThrow(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('captures with the exact amount and currency', async () => {
      fetchMock.mockResolvedValueOnce(reply(200, { id: 'pay_1', status: 'captured' }));
      await build().service.capturePayment('pay_1', 5_000_000, 'INR');
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.razorpay.com/v1/payments/pay_1/capture');
      expect(JSON.parse(init.body)).toEqual({ amount: 5_000_000, currency: 'INR' });
    });
  });

  describe('testConnection', () => {
    it('validates a candidate key pair by listing one order, and reports the mode', async () => {
      fetchMock.mockResolvedValueOnce(reply(200, { entity: 'collection', items: [] }));
      const res = await build(null).service.testConnection({ keyId: KEY_ID, keySecret: KEY_SECRET });
      expect(res).toEqual({ ok: true, message: 'Connected to Razorpay (test mode).', mode: 'test' });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.razorpay.com/v1/orders?count=1');
      expect(init.headers.Authorization).toBe('Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64'));
    });

    it('falls back to the stored keys when none are supplied', async () => {
      fetchMock.mockResolvedValueOnce(reply(200, {}));
      const res = await build().service.testConnection();
      expect(res.ok).toBe(true);
    });

    it('reports (never throws) for bad credentials, malformed key ids, missing keys and outages', async () => {
      const { service } = build(null);
      fetchMock.mockResolvedValueOnce(reply(401, {}));
      expect(await service.testConnection({ keyId: KEY_ID, keySecret: 'wrong' })).toMatchObject({ ok: false, mode: 'test' });

      expect(await service.testConnection({ keyId: 'not-a-key', keySecret: 'x' })).toMatchObject({ ok: false, mode: '', message: expect.stringContaining('rzp_test_') });
      expect(await service.testConnection({ keyId: '', keySecret: '' })).toMatchObject({ ok: false });
      expect(fetchMock).toHaveBeenCalledTimes(1); // malformed/missing never hit the network

      fetchMock.mockRejectedValueOnce(new Error('offline'));
      expect(await service.testConnection({ keyId: KEY_ID, keySecret: KEY_SECRET })).toMatchObject({ ok: false, message: expect.stringContaining('not reachable') });
    });
  });

  it('razorpayModeFromKeyId recognises test and live keys only', () => {
    expect(razorpayModeFromKeyId('rzp_test_abc123')).toBe('test');
    expect(razorpayModeFromKeyId('rzp_live_ABC123xyz')).toBe('live');
    expect(razorpayModeFromKeyId('rzp_prod_abc')).toBe('');
    expect(razorpayModeFromKeyId('')).toBe('');
    expect(razorpayModeFromKeyId('rzp_test_')).toBe('');
  });
});
