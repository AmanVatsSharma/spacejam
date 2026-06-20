/**
 * File:        apps/web/src/app/(auth)/signin/auth-form-wrapper.tsx
 * Module:      Web · Auth
 * Purpose:     Adapter that mounts the new SigninForm into the existing
 *              marketing-style sign-in page.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
'use client';

import { useSearchParams } from 'next/navigation';

import { SigninForm } from '@/components/auth/signin-form';

export default function AuthFormWrapper() {
  const search = useSearchParams();
  const defaultEmail = search?.get('email') ?? undefined;
  return <SigninForm defaultEmail={defaultEmail} />;
}
