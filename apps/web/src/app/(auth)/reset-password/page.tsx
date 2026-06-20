/**
 * File:        apps/web/src/app/(auth)/reset-password/page.tsx
 * Module:      Web · Auth
 * Purpose:     Reset-password completion page. Accepts ?token=… in the URL
 *              and POSTs the new password through the AuthContext.
 *              Wrapped in Suspense so useSearchParams() works during prerender.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Suspense } from 'react';

import ResetPasswordClient from './ResetPasswordClient';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
