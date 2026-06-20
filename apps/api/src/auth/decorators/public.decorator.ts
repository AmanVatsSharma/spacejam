/**
 * File:        auth/decorators/public.decorator.ts
 * Module:      Api · Auth · Decorators
 * Purpose:     Marks a GraphQL resolver or REST handler as public so the
 *              global GqlAuthGuard (when attached) skips authentication.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);