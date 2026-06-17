/**
 * File:        apps/web/src/app/dashboard/crm/customers/[id]/page.tsx
 * Module:      Web · Dashboard · CRM · Customer Detail
 * Purpose:     Detailed customer view with plans, invoices, and actions
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

"use client";

import { useParams, useRouter } from "next/navigation";

const Icons = {
  arrowLeft: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h5m4-4h5a2 2 0 012 2v5a2 2 0 01-2 2h-5m-4-4v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2h4a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2" />
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  mail: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  building: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  mapPin: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  creditCard: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  fileText: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  extend: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  upgrade: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  cancel: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  send: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  wallet: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  printer: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  ),
  bookSpace: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  ),
};

const customerData: Record<string, {
  name: string;
  initials: string;
  phone: string;
  email: string;
  company: string;
  location: string;
  teamSize: string;
  joinDate: string;
  billingCycle: string;
  plans: {
    location: string;
    planType: string;
    teamSize: string;
    billingCycle: string;
    price: string;
    status: string;
    startDate: string;
    endDate: string;
    renewal: string;
  }[];
  invoices: {
    id: string;
    date: string;
    amount: string;
    status: "Paid" | "Pending" | "Overdue";
  }[];
  activities: { title: string; subtitle: string; icon: string }[];
}> = {
  "technova-solution": {
    name: "Technova Solution",
    initials: "Te",
    phone: "+91 98765 43210",
    email: "contact@technova.com",
    company: "Technova Solution",
    location: "Ch-Hub",
    teamSize: "25 Persons",
    joinDate: "15 Jan 2025",
    billingCycle: "Monthly",
    plans: [
      {
        location: "Ch-Hub",
        planType: "Private Office",
        teamSize: "20 Persons",
        billingCycle: "Monthly",
        price: "₹25,000/month",
        status: "Active",
        startDate: "15 Jan 2025",
        endDate: "14 Jan 2026",
        renewal: "Auto Renewal",
      },
    ],
    invoices: [
      { id: "INV-001", date: "12 Mar 2026", amount: "₹25,000", status: "Paid" },
      { id: "INV-002", date: "12 Feb 2026", amount: "₹25,000", status: "Paid" },
      { id: "INV-003", date: "12 Jan 2026", amount: "₹25,000", status: "Paid" },
      { id: "INV-004", date: "12 Dec 2025", amount: "₹25,000", status: "Paid" },
      { id: "INV-005", date: "12 Nov 2025", amount: "₹25,000", status: "Overdue" },
    ],
    activities: [
      { title: "Payment Failed", subtitle: "Pending Approvals", icon: "wallet" },
      { title: "Printer Booked Today", subtitle: "Patel Enterprises printer bo.....", icon: "printer" },
    ],
  },
  "startupx": {
    name: "StartupX",
    initials: "St",
    phone: "+91 98765 43211",
    email: "contact@startupx.com",
    company: "StartupX",
    location: "Jalandhar",
    teamSize: "8 Persons",
    joinDate: "15 Jan 2024",
    billingCycle: "Monthly",
    plans: [
      {
        location: "Jalandhar",
        planType: "Cabin",
        teamSize: "5 Persons",
        billingCycle: "Monthly",
        price: "₹15,000/month",
        status: "Active",
        startDate: "15 Jan 2024",
        endDate: "14 Jan 2025",
        renewal: "Auto Renewal",
      },
    ],
    invoices: [
      { id: "INV-101", date: "10 Mar 2026", amount: "₹15,000", status: "Paid" },
      { id: "INV-102", date: "10 Feb 2026", amount: "₹15,000", status: "Pending" },
    ],
    activities: [
      { title: "Plan Upgraded", subtitle: "From Hot Desk to Cabin", icon: "upgrade" },
    ],
  },
  "ankit": {
    name: "Ankit",
    initials: "An",
    phone: "+91 98765 43212",
    email: "ankit@example.com",
    company: "Individual",
    location: "Ch-Hub",
    teamSize: "3 Persons",
    joinDate: "15 Jun 2025",
    billingCycle: "Monthly",
    plans: [
      {
        location: "Ch-Hub",
        planType: "Dedicated Desk",
        teamSize: "3 Persons",
        billingCycle: "Monthly",
        price: "₹9,000/month",
        status: "Active",
        startDate: "15 Jun 2025",
        endDate: "14 Jun 2026",
        renewal: "Auto Renewal",
      },
    ],
    invoices: [
      { id: "INV-201", date: "9 Mar 2026", amount: "₹9,000", status: "Paid" },
      { id: "INV-202", date: "9 Feb 2026", amount: "₹9,000", status: "Paid" },
    ],
    activities: [
      { title: "Member Since", subtitle: "June 2025", icon: "calendar" },
    ],
  },
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const customer = customerData[customerId] || customerData["technova-solution"];

  const handleBack = () => {
    router.push("/dashboard/crm/customers");
  };

  const statusColors = {
    Paid: "bg-green-100 text-green-700",
    Pending: "bg-amber-100 text-amber-700",
    Overdue: "bg-red-100 text-red-700",
    Active: "bg-green-100 text-green-700",
  };

  return (
    <div className="p-6 compact:p-3">
      <div className="flex gap-6 compact:gap-3">
        {/* LEFT SIDE - Main Content */}
        <div className="flex-1 flex flex-col gap-6 compact:gap-3 min-w-0">
          {/* Page Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="w-9 h-9 bg-[#f3f4f6] rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  {Icons.arrowLeft}
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-[#101828]">Customer Details</h1>
                  <p className="text-sm text-[#4a5565] mt-0.5">View customer information, plans, and billing history.</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-2 hover:bg-gray-50 transition-colors">
                {Icons.edit}
                <span>Edit Client</span>
              </button>
            </div>
          </div>

          {/* Client Info Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex gap-5">
              <div className="w-20 h-20 bg-[#ff6a2f] rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-white">{customer.initials}</span>
              </div>
              <div className="flex-1 grid grid-cols-2 compact:grid-cols-4 gap-x-6 compact:gap-x-3 gap-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.building} Company Name
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{customer.company}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.phone} Phone Number
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{customer.phone}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.mail} Email
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{customer.email}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.mapPin} Location
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{customer.location}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.users} Team Size
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{customer.teamSize}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.calendar} Join Date
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{customer.joinDate}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.creditCard} Billing Cycle
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{customer.billingCycle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Plans Section */}
          {customer.plans.map((plan, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#101828] mb-5">Active Plans</h3>
              <div className="flex gap-4 mb-5">
                {/* Location Badge */}
                <div className="px-3 py-1.5 bg-[#f3f4f6] rounded-lg flex items-center gap-2">
                  <span className="text-sm font-medium text-[#364153]">{plan.location}</span>
                </div>
                {/* Plan Info */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#101828]">{plan.planType}</span>
                  <span className="text-sm text-[#9ca3af]">•</span>
                  <span className="text-sm text-[#6a7282]">{plan.teamSize}</span>
                  <span className="text-sm text-[#9ca3af]">•</span>
                  <span className="text-sm text-[#6a7282]">{plan.billingCycle}</span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-lg font-bold text-[#101828]">{plan.price}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[plan.status as keyof typeof statusColors]}`}>
                    {plan.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 compact:grid-cols-4 gap-6 compact:gap-3 mb-5">
                <div>
                  <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide mb-1">Start Date</p>
                  <p className="text-sm font-medium text-[#101828]">{plan.startDate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide mb-1">End Date</p>
                  <p className="text-sm font-medium text-[#101828]">{plan.endDate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide mb-1">Renewal</p>
                  <p className="text-sm font-medium text-[#101828]">{plan.renewal}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide mb-1">Status</p>
                  <p className="text-sm font-medium text-[#10b981]">{plan.status}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-4 py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-2 hover:bg-gray-50 transition-colors">
                  {Icons.extend}
                  <span>Extend</span>
                </button>
                <button className="px-4 py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-2 hover:bg-gray-50 transition-colors">
                  {Icons.upgrade}
                  <span>Upgrade</span>
                </button>
                <button className="px-4 py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#ef4444] flex items-center gap-2 hover:bg-gray-50 transition-colors">
                  {Icons.cancel}
                  <span>Cancel</span>
                </button>
                <button className="px-4 py-2.5 bg-[#ff6a2f] text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-orange-600 transition-colors ml-auto">
                  {Icons.send}
                  <span>Send Invoice</span>
                </button>
              </div>
            </div>
          ))}

          {/* Invoices Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-[#101828]">Invoices</h3>
              <button className="text-sm font-medium text-[#ff6a2f] hover:text-orange-600 transition-colors">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left text-xs font-semibold text-[#6a7282] uppercase tracking-wide">Invoice ID</th>
                    <th className="pb-3 text-left text-xs font-semibold text-[#6a7282] uppercase tracking-wide">Date</th>
                    <th className="pb-3 text-left text-xs font-semibold text-[#6a7282] uppercase tracking-wide">Amount</th>
                    <th className="pb-3 text-left text-xs font-semibold text-[#6a7282] uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.invoices.map((invoice, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-sm font-medium text-[#101828]">{invoice.id}</td>
                      <td className="py-3 text-sm text-[#6a7282]">{invoice.date}</td>
                      <td className="py-3 text-sm font-medium text-[#101828]">{invoice.amount}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Sidebar */}
        <div className="w-80 flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-[#101828] mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <button className="w-full py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.bookSpace}
                <span>Book Space</span>
              </button>
              <button className="w-full py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.send}
                <span>Send Invoice</span>
              </button>
              <button className="w-full py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.extend}
                <span>Extend Plan</span>
              </button>
              <button className="w-full py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.upgrade}
                <span>Upgrade Plan</span>
              </button>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-[#101828] mb-4">Recent Activities</h3>
            <div className="flex flex-col gap-4">
              {customer.activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                    {Icons[activity.icon as keyof typeof Icons] || Icons.wallet}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#101828]">{activity.title}</p>
                    <p className="text-sm text-[#6a7282]">{activity.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
