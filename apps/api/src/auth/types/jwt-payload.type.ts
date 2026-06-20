/**
 * File:        auth/types/jwt-payload.type.ts
 * Module:      Api · Auth · Types
 * Purpose:     Decoded JWT shape stored on `req.user` after validation
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { UserRole } from '../../graphql/types/user.type';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  /** Server-issued session id (rotated on refresh, present in access + refresh). */
  sid: string;
  /** Distinguishes access vs refresh tokens. */
  typ: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}