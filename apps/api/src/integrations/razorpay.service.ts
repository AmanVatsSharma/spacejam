/**
 * File:        apps/api/src/integrations/razorpay.service.ts
 * Module:      API · Integrations · Payment
 * Purpose:     Razorpay gateway client. Credentials come from
 *              IntegrationSettingsService (a SUPER_ADMIN configures them once
 *              on the Integrations settings page) — never from the client.
 *
 *              Hardening over the original skeleton:
 *                - timing-safe signature comparison
 *                - request timeouts + sanitized errors (no key material or raw
 *                  gateway bodies leak to callers or logs)
 *                - fetchPayment / capturePayment so settlement can confirm the
 *                  payment really belongs to the order (and capture it when the
 *                  merchant account is on manual capture)
 *                - testConnection so a super-admin can validate keys on save
 *                - RAZORPAY_API_BASE override (sandbox / proxy / tests)
 *
 * Author:      ZCode (original) · Claude Sonnet 5.5 (hardening)
 * Last-updated: 2026-10-02
 */
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { IntegrationSettingsService } from './integration-settings.service';

export interface RazorpayOrder {
  id: string;
  entity: 'order';
  amount: number; // paise
  currency: string;
  status: 'created' | 'attempted' | 'paid';
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayPayment {
  id: string;
  entity: 'payment';
  amount: number; // paise
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string | null;
  method?: string;
  captured?: boolean;
  error_description?: string | null;
  notes?: Record<string, string> | unknown[];
}

export interface RazorpayConnectionResult {
  ok: boolean;
  message: string;
  /** 'test' | 'live', derived from the key id prefix. */
  mode: 'test' | 'live' | '';
}

const DEFAULT_API_BASE = 'https://api.razorpay.com';
const REQUEST_TIMEOUT_MS = 15_000;
/** Razorpay's minimum order is ₹1.00; the upper bound is a sanity limit, not a gateway rule. */
const MIN_AMOUNT_PAISE = 100;
const MAX_AMOUNT_PAISE = 10_000_000_00; // ₹1 crore

/** Constant-time string equality (false on length mismatch, never throws). */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Razorpay key ids look like rzp_test_XXXX / rzp_live_XXXX. */
export function razorpayModeFromKeyId(keyId: string): 'test' | 'live' | '' {
  const m = /^rzp_(test|live)_[A-Za-z0-9]+$/.exec(keyId ?? '');
  return m ? (m[1] as 'test' | 'live') : '';
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);

  constructor(private readonly settings: IntegrationSettingsService) {}

  private get apiBase(): string {
    return (process.env.RAZORPAY_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, '');
  }

  /** Create a Razorpay order for an amount in rupees. Kept for existing callers. */
  async createOrder(
    amountRupees: number,
    receipt?: string,
    notes?: Record<string, string>,
  ): Promise<RazorpayOrder> {
    if (!Number.isFinite(amountRupees)) {
      throw new BadRequestException('Amount must be a number.');
    }
    return this.createOrderPaise({
      amountPaise: Math.round((amountRupees + Number.EPSILON) * 100),
      receipt,
      notes,
    });
  }

  /**
   * Create a Razorpay order for an amount in paise. `notes` (e.g.
   * { onboardingId }) is forwarded so the dashboard / webhooks can correlate
   * the payment — but our own payment_orders ledger is the source of truth.
   */
  async createOrderPaise(params: {
    amountPaise: number;
    receipt?: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrder> {
    const { amountPaise, receipt, notes } = params;
    if (!Number.isInteger(amountPaise) || amountPaise < MIN_AMOUNT_PAISE) {
      throw new BadRequestException('Online payments must be at least ₹1.00.');
    }
    if (amountPaise > MAX_AMOUNT_PAISE) {
      throw new BadRequestException('Amount exceeds the maximum allowed for an online payment.');
    }
    const cfg = await this.requireConfig();
    const order = await this.request<RazorpayOrder>('POST', '/v1/orders', cfg, {
      amount: amountPaise,
      currency: 'INR',
      ...(receipt ? { receipt: receipt.slice(0, 40) } : {}),
      ...(notes ? { notes } : {}),
    });
    this.logger.log(
      `Razorpay order ${order.id} created for ${amountPaise} paise (receipt ${receipt ?? '-'}).`,
    );
    return order;
  }

  /** Pure signature check: HMAC-SHA256("orderId|paymentId", secret) === signature. */
  verifySignature(orderId: string, paymentId: string, signature: string, secret: string): boolean {
    if (!orderId || !paymentId || !signature || !secret) return false;
    const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return safeEqual(expected, signature);
  }

  /** Verify the signature the Razorpay checkout returned, using the configured key secret. */
  async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    const cfg = await this.settings.getRazorpayConfig();
    if (!cfg.keySecret) {
      throw new BadRequestException('Razorpay is not configured.');
    }
    const ok = this.verifySignature(orderId, paymentId, signature, cfg.keySecret);
    if (!ok) this.logger.warn(`Razorpay signature mismatch for order ${orderId}.`);
    return ok;
  }

  async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    if (!/^pay_[A-Za-z0-9]+$/.test(paymentId ?? '')) {
      throw new BadRequestException('Invalid Razorpay payment id.');
    }
    const cfg = await this.requireConfig();
    return this.request<RazorpayPayment>('GET', `/v1/payments/${paymentId}`, cfg);
  }

  /** Capture an authorized payment (merchant accounts on manual capture). */
  async capturePayment(paymentId: string, amountPaise: number, currency = 'INR'): Promise<RazorpayPayment> {
    if (!/^pay_[A-Za-z0-9]+$/.test(paymentId ?? '')) {
      throw new BadRequestException('Invalid Razorpay payment id.');
    }
    const cfg = await this.requireConfig();
    return this.request<RazorpayPayment>('POST', `/v1/payments/${paymentId}/capture`, cfg, {
      amount: amountPaise,
      currency,
    });
  }

  /**
   * Validate a key pair by listing one order. Uses the supplied credentials
   * when given (so a super-admin can test before saving), else the stored ones.
   * Never throws for credential problems — returns { ok:false, message }.
   */
  async testConnection(creds?: { keyId: string; keySecret: string }): Promise<RazorpayConnectionResult> {
    const stored = await this.settings.getRazorpayConfig();
    const keyId = creds?.keyId || stored.keyId;
    const keySecret = creds?.keySecret || stored.keySecret;
    const mode = razorpayModeFromKeyId(keyId);
    if (!keyId || !keySecret) {
      return { ok: false, message: 'Enter the Razorpay key id and key secret first.', mode };
    }
    if (!mode) {
      return {
        ok: false,
        message: 'The key id must look like rzp_test_xxxx or rzp_live_xxxx.',
        mode,
      };
    }
    try {
      await this.request('GET', '/v1/orders?count=1', { keyId, keySecret });
      return {
        ok: true,
        message: `Connected to Razorpay (${mode} mode).`,
        mode,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not reach Razorpay.';
      return { ok: false, message, mode };
    }
  }

  // ── internals ───────────────────────────────────────────────────────────

  private async requireConfig(): Promise<{ keyId: string; keySecret: string }> {
    const cfg = await this.settings.getRazorpayConfig();
    if (!cfg.keyId || !cfg.keySecret) {
      throw new BadRequestException(
        'Razorpay is not configured. A super admin can add the keys under Settings → Integrations.',
      );
    }
    return { keyId: cfg.keyId, keySecret: cfg.keySecret };
  }

  /**
   * One place for every gateway call: Basic auth, JSON, timeout, and error
   * translation. The raw response body is logged at debug only and is never
   * returned to the caller.
   */
  private async request<T = unknown>(
    method: 'GET' | 'POST',
    path: string,
    creds: { keyId: string; keySecret: string },
    body?: Record<string, unknown>,
  ): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.apiBase}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Basic ' + Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64'),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      this.logger.error(`Razorpay ${method} ${path} failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Razorpay is not reachable right now. Please try again.');
    }

    if (res.ok) {
      return (await res.json()) as T;
    }

    const raw = await res.text().catch(() => '');
    this.logger.warn(`Razorpay ${method} ${path} → ${res.status}: ${raw.slice(0, 300)}`);
    let description = '';
    try {
      description = JSON.parse(raw)?.error?.description ?? '';
    } catch {
      /* non-JSON body */
    }
    if (res.status === 401) {
      throw new BadRequestException(
        'Razorpay rejected the key id / key secret. Check that both come from the same mode (test or live) in Settings → Integrations.',
      );
    }
    if (res.status >= 500) {
      throw new ServiceUnavailableException('Razorpay is having trouble right now. Please try again.');
    }
    if (res.status === 429) {
      throw new ServiceUnavailableException('Razorpay is rate-limiting requests. Please retry in a moment.');
    }
    // Remaining 4xx: our request was rejected (permanent) — surface the gateway's reason.
    throw new BadRequestException(
      description ? `Razorpay: ${description}` : `Razorpay request failed (${res.status}).`,
    );
  }
}
