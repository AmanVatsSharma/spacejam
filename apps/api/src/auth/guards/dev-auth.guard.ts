/**
 * File:        apps/api/src/auth/guards/dev-auth.guard.ts
 * Module:      API · Auth Guards
 * Purpose:     Development-only guard that accepts the fake dev-mode token
 *              and attaches a mock admin user to the request. Never registered
 *              in production — gated by APP_ENV !== 'production'.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-23
 */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.get('APP_ENV') === 'production') {
      return false;
    }

    const ctx = context.getArgByIndex(1) as any;
    const req = ctx?.req ?? ctx;
    const token = req?.headers?.authorization?.replace(/^Bearer\s+/i, '') || '';

    if (token && token !== 'dev-mode-fake-token') {
      return false;
    }

    req.user = {
      id: 'dev-admin',
      email: 'admin@dev.local',
      name: 'Dev Admin',
      role: 'ADMIN',
      active: true,
      emailVerified: true,
    };

    return true;
  }
}
