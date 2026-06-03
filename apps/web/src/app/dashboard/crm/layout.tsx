/**
 * File:        apps/web/src/app/dashboard/crm/layout.tsx
 * Module:      Web · Dashboard · CRM Layout
 * Purpose:     CRM layout with tabs for Customers, Leads, and Onboarding
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { name: "Customers", href: "/dashboard/crm/customers" },
  { name: "Leads", href: "/dashboard/crm/leads" },
  { name: "Onboarding", href: "/dashboard/crm/onboarding" },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname.includes("/customers")) return "Customers";
    if (pathname.includes("/leads")) return "Leads";
    if (pathname.includes("/onboarding")) return "Onboarding";
    return "Customers"; // Default to Customers
  };

  const activeTab = getActiveTab();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* CRM Tabs */}
      <div className="px-6 pt-6 pb-0">
        <div className="bg-white rounded-2xl shadow-sm p-1.5 inline-flex items-center gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.name
                  ? "bg-orange-50 text-orange-500"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}