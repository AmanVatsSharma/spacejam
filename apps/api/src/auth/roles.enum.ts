/**
 * File:        auth/roles.enum.ts
 * Module:      Api · Auth
 * Purpose:     Re-export the UserRole enum so service code can import from
 *              a stable path while the canonical definition lives in
 *              graphql/types/user.type.ts.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
export { UserRole } from '../graphql/types/user.type';