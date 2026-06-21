/**
 * File:        apps/api/src/auth/services/audit.service.ts
 * Module:      API · Auth · Services
 * Purpose:     Append-only event ledger for security-relevant actions.
 *              Every auth and privileged action flows through here.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 *
 *  Events recorded (non-exhaustive):
 *    AUTH_SIGNUP, AUTH_SIGNIN_SUCCESS, AUTH_SIGNIN_FAIL,
 *    AUTH_SIGNOUT, AUTH_TOKEN_REFRESH, AUTH_PASSWORD_RESET_REQUEST,
 *    AUTH_PASSWORD_RESET_SUCCESS, AUTH_PASSWORD_CHANGE,
 *    AUTH_2FA_ENABLE, AUTH_2FA_DISABLE, AUTH_2FA_VERIFY_FAIL,
 *    AUTH_RECOVERY_CODE_USED, AUTH_ACCOUNT_LOCKED,
 *    AUTH_LOGIN_FROM_NEW_DEVICE, AUTH_MAGIC_LINK_SENT,
 *    AUTH_MAGIC_LINK_USED,
 *    PERMISSION_DENIED, ROLE_ESCALATION_BLOCKED,
 *    DATA_EXPORT, DATA_DELETE,
 *    BOOKING_CREATE, BOOKING_CANCEL,
 *    PAYMENT_CREATE, PAYMENT_REFUND.
 *
 *  Designed so that an SRE can answer "who did what when" by
 *  querying the audit_log table with `userId` + `action` + date range.
 *  No PII other than the actor and target id; everything else is the
 *  diff (JSON `changes`) and the request metadata.
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog } from '../../typeorm/entities/audit-log.entity';

export type AuditAction =
  | 'AUTH_SIGNUP'
  | 'AUTH_SIGNIN_SUCCESS'
  | 'AUTH_SIGNIN_FAIL'
  | 'AUTH_SIGNOUT'
  | 'AUTH_TOKEN_REFRESH'
  | 'AUTH_PASSWORD_RESET_REQUEST'
  | 'AUTH_PASSWORD_RESET_SUCCESS'
  | 'AUTH_PASSWORD_CHANGE'
  | 'AUTH_2FA_ENABLE'
  | 'AUTH_2FA_DISABLE'
  | 'AUTH_2FA_VERIFY_FAIL'
  | 'AUTH_RECOVERY_CODE_USED'
  | 'AUTH_ACCOUNT_LOCKED'
  | 'AUTH_LOGIN_FROM_NEW_DEVICE'
  | 'AUTH_MAGIC_LINK_SENT'
  | 'AUTH_MAGIC_LINK_USED'
  | 'PERMISSION_DENIED'
  | 'DATA_EXPORT'
  | 'DATA_DELETE'
  | 'BOOKING_CREATE'
  | 'BOOKING_CANCEL'
  | 'PAYMENT_CREATE'
  | 'PAYMENT_REFUND';

export interface AuditEntry {
  action: AuditAction;
  userId?: string | null;
  entityType?: string;
  entityId?: string;
  changes?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /**
   * Persist a single audit event. Fire-and-forget at the call site —
   * this method never throws, so a transient DB failure during an auth
   * flow does not break the user experience. The downside is that an
   * event may be lost; in production this is the right trade-off
   * because audit loss should not break the auth path.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      const row = this.repo.create({
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        changes: entry.changes ?? entry.metadata ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      });
      await this.repo.save(row);
    } catch (err) {
      this.logger.error(
        `Failed to record audit event ${entry.action}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Read recent events for a user. Used by the security dashboard and
   * the "where am I signed in" UI.
   */
  async recentForUser(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }

  /**
   * Read the most recent N signin events across the whole tenant —
   * used by the SOC dashboard.
   */
  async recentGlobal(limit = 100): Promise<AuditLog[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }
}
