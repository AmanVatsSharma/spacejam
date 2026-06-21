/**
 * File:        apps/api/src/auth/types/jwt-payload.type.ts
 * Module:      Api · Auth · Types
 * Purpose:     Decoded JWT shape stored on `req.user` after validation.
 *              Uses the canonical 5-tier entity enum so the access token
 *              carries enough info to do server-side authorization
 *              without a DB round-trip on every request.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { UserRole } from '../roles.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  /** Server-issued session id (rotated on refresh, present in access + refresh). */
  sid: string;
  /** Distinguishes access vs refresh tokens. */
  typ: 'access' | 'refresh';
  /** Whether the user has cleared 2FA for this session. */
  twoFactorVerified?: boolean;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  typ: 'refresh';
  iat?: number;
  exp?: number;
}

export interface ChallengeTokenPayload {
  sub: string;
  /** Marker so this token can never be confused with an access token. */
  kind: 'two-factor-challenge';
  iat?: number;
  exp?: number;
}
