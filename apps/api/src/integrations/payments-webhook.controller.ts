/**
 * File:        apps/api/src/integrations/payments-webhook.controller.ts
 * Module:      API · Integrations · Payments Webhook
 * Purpose:     Public REST endpoint (POST /api/payments/webhook) receiving
 *              Razorpay webhook events. Verifies the x-razorpay-signature
 *              HMAC-SHA256 over the raw request body against the configured
 *              webhook secret; on payment.captured it marks the referenced
 *              invoice PAID (ONLINE), idempotently. Always 200 for valid
 *              signatures (Razorpay retries non-2xx aggressively).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-27
 */
import {
  Controller,
  Post,
  Req,
  HttpCode,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';

import { IntegrationSettingsService } from './integration-settings.service';
import { Public } from '../auth/decorators/public.decorator';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { InvoiceStatus, PaymentMethod } from '../graphql/types/user.type';

@Controller('payments')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(
    private readonly settings: IntegrationSettingsService,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  @Post('webhook')
  @Public()
  @HttpCode(200)
  async handleWebhook(@Req() req: RawBodyRequest<Request>): Promise<{ received: boolean }> {
    const cfg = await this.settings.getRazorpayConfig();
    if (!cfg.webhookSecret) {
      throw new BadRequestException('Razorpay webhook secret is not configured.');
    }

    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody;
    if (!rawBody || !rawBody.length) {
      throw new BadRequestException('Missing raw request body.');
    }
    if (typeof signature !== 'string' || !signature) {
      throw new UnauthorizedException('Missing webhook signature.');
    }

    // Razorpay signs HMAC-SHA256(rawBody, webhookSecret).
    const crypto = await import('crypto');
    const expected = crypto.createHmac('sha256', cfg.webhookSecret).update(rawBody).digest('hex');
    const valid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
    if (!valid) {
      this.logger.warn('Razorpay webhook signature mismatch — rejecting.');
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    // Signature is valid: always acknowledge 200, even if processing below
    // fails, so Razorpay doesn't retry a payload we already accepted.
    try {
      const payload = JSON.parse(rawBody.toString('utf8'));
      if (payload?.event === 'payment.captured') {
        const notes =
          payload?.payload?.payment?.entity?.notes ?? payload?.notes ?? undefined;
        const invoiceId = notes?.invoiceId;
        if (invoiceId) {
          await this.markInvoicePaid(invoiceId);
        }
      }
    } catch (err: any) {
      this.logger.error(`Razorpay webhook processing failed: ${err?.message}`);
    }
    return { received: true };
  }

  /** Idempotent: only updates when the invoice exists and is not yet PAID. */
  private async markInvoicePaid(invoiceId: string): Promise<void> {
    try {
      const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
      if (!invoice) {
        this.logger.warn(`Razorpay webhook: invoice ${invoiceId} not found.`);
        return;
      }
      if (invoice.status === InvoiceStatus.PAID) return;
      await this.invoiceRepo.update(invoiceId, {
        status: InvoiceStatus.PAID,
        paidDate: new Date(),
        paymentMethod: PaymentMethod.ONLINE,
      });
      this.logger.log(`Razorpay webhook marked invoice ${invoiceId} PAID.`);
    } catch (err: any) {
      this.logger.error(`Failed to mark invoice ${invoiceId} paid: ${err?.message}`);
    }
  }
}
