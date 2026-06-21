/**
 * File:        apps/web/src/app/(auth)/magic-link/page.tsx
 * Module:      Web · Auth
 * Purpose:     Magic-link landing page. The backend's verifyMagicLink
 *              mutation is called with the ?token=… in the URL. On
 *              success, we install the tokens via auth context and
 *              redirect into the dashboard. Wrapped in Suspense so
 *              useSearchParams() works during prerender.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Suspense } from 'react';

import MagicLinkClient from './MagicLinkClient';

export const dynamic = 'force-dynamic';

export default function MagicLinkPage() {
  return (
    <Suspense fallback={null}>
      <MagicLinkClient />
    </Suspense>
  );
}
