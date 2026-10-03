/**
 * File:        apps/api/src/crm/provision-login-user.ts
 * Module:      API · CRM · Onboarding
 * Purpose:     Provision (or reuse) the login User for a newly onboarded client,
 *              inside the caller's transaction. Same behaviour as the existing
 *              CRM conversion path:
 *                - a User with that email already exists → link it, never duplicate;
 *                - otherwise create a MEMBER with a random one-time password the
 *                  client replaces through the normal password-reset / phone-OTP
 *                  flow (the plaintext is never stored or logged).
 *
 * Author:      Claude Sonnet 5.5 (extracted from crm.resolver.ts)
 * Last-updated: 2026-10-02
 */
import { EntityManager } from 'typeorm';
// @ts-ignore — bcryptjs ships no bundled types in this workspace
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserRole } from '@enums';
import { User } from '../typeorm/entities/user.entity';

export async function provisionLoginUser(
  manager: EntityManager,
  params: {
    email: string;
    name?: string | null;
    phone?: string | null;
    centerId?: string | null;
  },
): Promise<{ userId: string; created: boolean }> {
  const email = params.email.toLowerCase().trim();
  const existing = await manager.findOne(User, { where: { email } });
  if (existing) return { userId: existing.id, created: false };

  const tempPassword = crypto.randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const user = manager.create(User, {
    email,
    name: params.name ?? email.split('@')[0],
    passwordHash,
    role: UserRole.MEMBER,
    active: true,
    emailVerified: false,
    ...(params.phone ? { phone: params.phone } : {}),
    ...(params.centerId ? { centerId: params.centerId } : {}),
  } as any);
  const saved = (await manager.save(user)) as unknown as User;
  return { userId: saved.id, created: true };
}
