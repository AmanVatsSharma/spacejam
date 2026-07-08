"use client";

/**
 * File:        apps/web/src/app/dashboard/crm/page.tsx
 * Module:      Web · Dashboard · CRM Root
 * Purpose:     Redirect to customers tab (default CRM view).
 *              Uses client-side router.replace so the redirect works
 *              during client-side navigation (server-side redirect()
 *              fails in RSC payloads when auth is client-side only).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-08
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CRMPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/crm/customers");
  }, [router]);
  return null;
}