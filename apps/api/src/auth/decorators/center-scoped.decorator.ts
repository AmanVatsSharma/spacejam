/**
 * File:        auth/decorators/center-scoped.decorator.ts
 * Module:      Api · Auth · Decorators
 * Purpose:     Marks a resolver as center-scoped — a CENTER_MANAGER caller
 *              may only invoke it for their own center. The argument names
 *              which arg holds the centerId to check against caller.centerId.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-10
 */
import { SetMetadata } from '@nestjs/common';

export const CENTER_SCOPED_KEY = 'centerScopedArg';
/**
 * @param argName The name of the resolver arg carrying the centerId.
 *                Defaults to 'centerId'.
 */
export const CenterScoped = (argName = 'centerId') =>
  SetMetadata(CENTER_SCOPED_KEY, argName);
