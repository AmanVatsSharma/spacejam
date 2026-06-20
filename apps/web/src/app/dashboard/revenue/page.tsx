/**
 * File:        apps/web/src/app/dashboard/revenue/page.tsx
 * Module:      Web · Dashboard · Revenue Index
 * Purpose:     Revenue is now a section with sub-routes (Invoices / Deposit /
 *              Contracts). The sub-tab nav lives in the global header — see
 *              `dashboard/layout.tsx`. The default landing for the section
 *              is the Invoices view at `/dashboard/invoices`, so we redirect
 *              there to keep existing links working.
 *
 * Exports:
 *   - default: RevenueIndex — server-side redirect
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { redirect } from "next/navigation";

export default function RevenueIndex() {
  redirect("/dashboard/invoices");
}
