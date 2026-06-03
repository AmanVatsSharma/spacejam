/**
 * File:        apps/web/src/app/dashboard/crm/page.tsx
 * Module:      Web · Dashboard · CRM Root
 * Purpose:     Redirect to customers tab (default CRM view)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

import { redirect } from "next/navigation";

export default function CRMPage() {
  redirect("/dashboard/crm/customers");
}