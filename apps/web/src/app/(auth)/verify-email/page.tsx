/**
 * File:        apps/web/src/app/(auth)/verify-email/page.tsx
 * Module:      Web · Auth
 * Purpose:     Email-verification landing page. The backend's verify-email
 *              mutation is called with the ?token=… in the URL, and the UI
 *              shows the outcome. Wrapped in Suspense so useSearchParams()
 *              works during prerender.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Suspense } from 'react';

import VerifyEmailClient from './VerifyEmailClient';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailClient />
    </Suspense>
  );
}