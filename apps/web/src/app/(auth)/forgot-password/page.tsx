/**
 * File:        apps/web/src/app/(auth)/forgot-password/page.tsx
 * Module:      Web · Auth
 * Purpose:     Password-reset request page. Always shows a success state
 *              after submit to avoid leaking which emails are registered.
 *              Marked force-dynamic so it doesn't try to prerender without
 *              the auth context.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Suspense } from 'react';

import ForgotPasswordClient from './ForgotPasswordClient';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordClient />
    </Suspense>
  );
}