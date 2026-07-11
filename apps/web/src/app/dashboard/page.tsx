import { redirect } from "next/navigation";

/**
 * File:        apps/web/src/app/dashboard/page.tsx
 * Module:      Web · Dashboard · Overview Redirect
 * Purpose:     Redirect /dashboard → /dashboard/home.
 *
 *              The previous Overview page was a dead demo duplicate of
 *              /dashboard/home (hardcoded "Jhon Doe", *Demo cards with
 *              no data, and Add Lead/Add Client modals rendered without
 *              an onAdd handler). /dashboard/home is the canonical,
 *              fully-wired implementation (live dashboardMetrics,
 *              leadCount, leads, deposits + create mutations).
 *              Rather than maintain two near-identical pages, the root
 *              dashboard route now redirects to the wired home screen.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-11
 */
export default function DashboardPage() {
  redirect("/dashboard/home");
}
