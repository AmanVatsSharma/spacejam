/**
 * File:        apps/api/src/integrations/razorpay.service.ts
 * Module:      API · Integrations · Payment
 * Purpose:     Razorpay payment integration skeleton. Reads credentials from
 *              IntegrationSettingsService so a super-admin configures them
 *              once via the Integrations settings page. Exposes order
 *              creation + signature verification; the booking/wallet flows
 *              will call these once a payment step is wired into mobile.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IntegrationSettingsService } from './integration-settings.service';

export interface RazorpayOrder {
  id: string;
  entity: 'order';
  amount: number; // paise
  currency: string;
  status: 'created' | 'attempted' | 'paid';
  receipt: string;
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);

  constructor(private readonly settings: IntegrationSettingsService) {}

  /** Create a Razorpay order for the given amount (rupees → paise).
   *  `notes` (e.g. { invoiceId }) is forwarded to the orders API so webhooks
   *  can correlate the captured payment back to internal entities. */
  async createOrder(
    amountRupees: number,
    receipt?: string,
    notes?: Record<string, string>,
  ): Promise<RazorpayOrder> {
    const cfg = await this.settings.getRazorpayConfig();
    if (!cfg.keyId || !cfg.keySecret) {
      throw new BadRequestException('Razorpay is not configured.');
    }
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64'),
      },
      body: JSON.stringify({
        amount: Math.round(amountRupees * 100), // paise
        currency: 'INR',
        ...(receipt ? { receipt } : {}),
        ...(notes ? { notes } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Razorpay order create failed (${res.status}): ${text}`);
    }
    const order = (await res.json()) as RazorpayOrder;
    this.logger.log(`Razorpay order ${order.id} created for ₹${amountRupees} (receipt ${receipt ?? '-'}).`);
    return order;
  }

  /** Verify the payment signature returned by the Razorpay checkout. */
  async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    const cfg = await this.settings.getRazorpayConfig();
    if (!cfg.keySecret) {
      throw new BadRequestException('Razorpay is not configured.');
    }
    const body = `${orderId}|${paymentId}`;
    // Razorpay signs HMAC-SHA256(orderId|paymentId, keySecret).
    const crypto = await import('crypto');
    const expected = crypto.createHmac('sha256', cfg.keySecret).update(body).digest('hex');
    const ok = expected === signature;
    if (!ok) this.logger.warn(`Razorpay signature mismatch for order ${orderId}.`);
    return ok;
  }
}
