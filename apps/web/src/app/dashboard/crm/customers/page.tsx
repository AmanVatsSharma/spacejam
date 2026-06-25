/**
 * File:        apps/web/src/app/dashboard/crm/customers/page.tsx
 * Module:      Web · Dashboard · CRM · Customers
 * Purpose:     Manage all onboarded clients and organizations.
 *              Sub-tab navigation (Customers / Leads / Onboarding)
 *              is rendered by the dashboard header via SECTION_TABS.crm
 *              — see apps/web/src/app/dashboard/layout.tsx. This page
 *              only renders the page-specific header card, stats,
 *              filters, table, and activity feed.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../crm.module.css";

// Icons
const Icons = {
  search: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  userCheck: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  alertCircle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  userPlus: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  wallet: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  printer: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  ),
 check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
};

interface Customer {
  name: string;
  teamSize: string;
  location: string;
  joinDate: string;
  billing: "Paid" | "Pending" | "Overdue";
  lastInvoice: string;
  status: "Upgrade" | "Send Notice" | "Send Invoice";
}

const statsData = [
  { label: "Total Customer", value: 20, icon: "users" },
  { label: "Active Members", value: 15, icon: "userCheck" },
  { label: "1 Expiring Soon", value: 3, icon: "calendar" },
  { label: "", value: 2, icon: "alertCircle" },
];

const customersData: Customer[] = [
  { name: "Technova solution", teamSize: "25 seats", location: "Ch-Hub", joinDate: "Jan 15, 2025", billing: "Paid", lastInvoice: "12 Mar", status: "Upgrade" },
  { name: "StartupX", teamSize: "8 seats", location: "Jalandhar", joinDate: "Jan 15, 2024", billing: "Paid", lastInvoice: "10 Mar", status: "Send Notice" },
  { name: "Ankit", teamSize: "3 seats", location: "Ch-Hub", joinDate: "Jun 15, 2025", billing: "Paid", lastInvoice: "9 Mar", status: "Send Invoice" },
  { name: "TechCorp", teamSize: "2 seats", location: "Ch-Hub", joinDate: "Jul 15, 2026", billing: "Overdue", lastInvoice: "8 Mar", status: "Send Notice" },
  { name: "Priya Singh", teamSize: "5 seats", location: "Jalandhar", joinDate: "Jan 15, 2026", billing: "Paid", lastInvoice: "7 Mar", status: "Upgrade" },
  { name: "Priya Singh", teamSize: "3 seats", location: "Ch-Hub", joinDate: "Jan 15, 2024", billing: "Paid", lastInvoice: "7 Mar", status: "Upgrade" },
  { name: "Priya Singh", teamSize: "8 seats", location: "Ch-Hub", joinDate: "Aug 15, 2024", billing: "Pending", lastInvoice: "7 Mar", status: "Send Notice" },
  { name: "Priya Singh", teamSize: "9 seats", location: "Ch-Hub", joinDate: "Jan 15, 2024", billing: "Paid", lastInvoice: "7 Mar", status: "Upgrade" },
];

const statusColors: Record<Customer["status"], string> = {
  Upgrade: "bg-orange-100 text-orange-600",
  "Send Notice": "bg-yellow-100 text-yellow-600",
  "Send Invoice": "bg-teal-100 text-teal-600",
};

const billingColors: Record<Customer["billing"], string> = {
  Paid: "text-green-600",
  Pending: "text-amber-500",
  Overdue: "text-red-500",
};

const recentActivities = [
  { title: "Payment Failed", subtitle: "Pending Approvals", icon: "wallet" },
  { title: "Printer Booked Today", subtitle: "Patel Enterprises printer bo.....", icon: "printer" },
];

export default function CustomersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customersData.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomerClick = (customerName: string) => {
    const id = customerName.toLowerCase().replace(/\s+/g, "-");
    router.push(`/dashboard/crm/customers/${id}`);
  };

  return (
    <div className="flex-1 p-6">
      {/* Page Header — sub-tab nav (Customers / Leads / Onboarding) is rendered by the dashboard header */}
      <div className={`${styles.pageHeader} mb-6 compact:flex-col compact:items-start compact:gap-3`}>
        <div className={styles.pageTitleBlock}>
          <h1 className={styles.pageTitle}>Customers</h1>
          <p className={styles.pageSubtitle}>
            Manage all onboarded clients and organizations
          </p>
        </div>
        <div className={styles.headerActions}>{/* reserved for future actions */}</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 compact:grid-cols-2 gap-4 compact:gap-3 mb-6">
        {statsData.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                {Icons[stat.icon as keyof typeof Icons]}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 compact:grid-cols-3 gap-6 compact:gap-3">
        {/* Table Section */}
        <div className="col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
                  <input
                    type="text"
                    placeholder="Search Invoice.."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-56"
                  />
                </div>
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                  All Types {Icons.chevronDown}
                </button>
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                  All Statuses {Icons.chevronDown}
                </button>
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                  All Plans {Icons.chevronDown}
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">
                  Clear All
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                  {Icons.download} Export Excel
                </button>
                <button className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-orange-600 transition-colors">
                  {Icons.userPlus} Add Client
                </button>
              </div>
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-4 pl-4 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-3 py-4 compact:px-2 compact:py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Size</th>
                    <th className="px-3 py-4 compact:px-2 compact:py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-3 py-4 compact:px-2 compact:py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Join Date</th>
                    <th className="px-3 py-4 compact:px-2 compact:py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing</th>
                    <th className="px-3 py-4 compact:px-2 compact:py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Invoice</th>
                    <th className="px-3 py-4 compact:px-2 compact:py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr
                      key={`${customer.name}-${index}`}
                      onClick={() => handleCustomerClick(customer.name)}
                      className="border-b border-gray-200 cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="py-3 pl-4 pr-3">
                        <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-gray-500">{customer.teamSize}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-gray-500">{customer.location}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-gray-500">{customer.joinDate}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-sm font-medium ${billingColors[customer.billing]}`}>
                          {customer.billing}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-gray-500">{customer.lastInvoice}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColors[customer.status]}`}>
                          {customer.status} {Icons.chevronDown}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Recent Activities */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                    {Icons[activity.icon as keyof typeof Icons]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium text-sm flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.userPlus} Add Client
              </button>
              <button className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium text-sm flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.download} Export Data
              </button>
              <button className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium text-sm flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.check} Manage Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}