/**
 * File:        apps/web/src/app/page.tsx
 * Module:      Web · Dashboard
 * Purpose:     Main dashboard redirect to inventory
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/dashboard/inventory");
}