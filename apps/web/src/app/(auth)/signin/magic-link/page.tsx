/**
 * File:        apps/web/src/app/(auth)/signin/magic-link/page.tsx
 * Module:      Web · Auth
 * Purpose:     Public "send me a magic link" page. Asks for an email,
 *              fires requestMagicLink, and tells the user to check
 *              their inbox. Always shows the same "if an account
 *              exists" copy to avoid leaking which emails are real.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Suspense } from 'react';

import MagicLinkRequestClient from './MagicLinkRequestClient';

export const dynamic = 'force-dynamic';

export default function MagicLinkRequestPage() {
  return (
    <Suspense fallback={null}>
      <MagicLinkRequestClient />
    </Suspense>
  );
}
