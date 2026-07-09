/**
 * File:        apps/web/src/app/dashboard/report/page.tsx
 * Module:      Web · Dashboard · Report · Index
 * Purpose:     Redirects /dashboard/report to /dashboard/report/overview
 *              so the "Overview" nav tab lands on the canonical overview
 *              page. The previous version rendered a separate legacy
 *              "Reports Overview" (CSS-module) page that duplicated the
 *              Tailwind overview page at /dashboard/report/overview.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-09
 */

import { redirect } from "next/navigation";

export default function ReportIndexPage() {
  redirect("/dashboard/report/overview");
}
