/**
 * File:        auth/user-role.enum.ts
 * Module:      Api · Auth
 * Purpose:     Canonical UserRole enum — extracted to break the circular
 *              dependency between graphql/types/user.type.ts and
 *              typeorm/entities/user.entity.ts. Import from here (or via
 *              the re-exports in graphql/types/user.type.ts and auth/roles.enum.ts).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-09-30
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  CENTER_OWNER = 'CENTER_OWNER',
  CENTER_MANAGER = 'CENTER_MANAGER',
  MEMBER = 'MEMBER',
  STAFF = 'STAFF',
  FINANCE = 'FINANCE',
  SUPPORT = 'SUPPORT',
  EMPLOYEE = 'EMPLOYEE',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
}
