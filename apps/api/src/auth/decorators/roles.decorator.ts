/**
 * File:        auth/decorators/roles.decorator.ts
 * Module:      Api · Auth · Decorators
 * Purpose:     Comma-separated role list required to access a resolver.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { SetMetadata } from '@nestjs/common';

import { UserRole } from '../../graphql/types/user.type';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);