/**
 * File:        apps/api/src/subscription/billing-scheduler.ts
 * Module:      API · Subscription · Billing Scheduler
 * Purpose:     Runs processDueSubscriptions on a fixed interval so active
 *              subscriptions bill automatically each cycle (no admin button
 *              click needed). Uses a plain setInterval (no @nestjs/schedule
 *              dependency) — appropriate for the current single-instance
 *              deploy. For multi-instance, switch to a Redis-based lock.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BillingService } from './billing.service';

const RUN_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

@Injectable()
export class BillingScheduler implements OnModuleInit {
  private readonly logger = new Logger(BillingScheduler.name);

  constructor(private readonly billing: BillingService) {}

  onModuleInit(): void {
    // Don't block boot; run the first sweep shortly after start.
    setTimeout(() => this.runSweep().catch(() => {}), 60_000);
    const handle = setInterval(() => {
      this.runSweep().catch((err) => this.logger.warn(`sweep failed: ${err?.message}`));
    }, RUN_INTERVAL_MS);
    // Unref so the timer doesn't keep the process alive on shutdown.
    handle.unref?.();
    this.logger.log(`Billing scheduler armed — sweeps every ${RUN_INTERVAL_MS / 3600000}h.`);
  }

  private async runSweep(): Promise<void> {
    const results = await this.billing.processDueSubscriptions();
    const billed = results.filter((r) => !r.skipped).length;
    if (results.length > 0) {
      this.logger.log(`Scheduled sweep: processed ${billed} of ${results.length} due subscription(s).`);
    }
  }
}
