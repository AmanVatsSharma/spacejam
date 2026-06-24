/**
 * File:        apps/web/src/app/dashboard/crm/customers/page.tsx
 * Module:      Web · Dashboard · CRM · Customers
 * Purpose:     Manage all onboarded clients and organizations.
 *              Layout: row 1 = header/stats/filters on the left
 *              with Recent Activities on the right; row 2 = the
 *              customers table spans the full width beneath them.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./customers.module.css";

// Icons
const Icons = {
  search: (
    <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 10 6" fill="none" className={styles.selectCaret}>
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  pillCaret: (
    <svg className="caret" viewBox="0 0 10 6" fill="none" style={{ width: 9, height: 5 }}>
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  userCheck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  alertCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  userPlus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  printer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 3V13M3 8H13" />
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
  { label: "Payment Failed", value: 2, icon: "alertCircle" },
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

const STATUS_CLASS: Record<Customer["status"], string> = {
  Upgrade: styles.pillUpgrade,
  "Send Notice": styles.pillNotice,
  "Send Invoice": styles.pillInvoice,
};

const BILLING_CLASS: Record<Customer["billing"], string> = {
  Paid: styles.billingPaid,
  Pending: styles.billingPending,
  Overdue: styles.billingOverdue,
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
    <div className={styles.shell}>
      {/* --------------------------- Page header (full width) --------------------------- */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>Customers</h1>
          <p className={styles.headerSub}>Manage all onboarded clients and organizations</p>
        </div>
        <button type="button" className={styles.addBtn}>
          {Icons.plus}
          <span>Add Customer</span>
        </button>
      </div>

      {/* --------------------------- Top row --------------------------- */}
      <div className={styles.topRow}>
        {/* Main column: stats + filters */}
        <div className={styles.mainTop}>
          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            {statsData.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <div className={styles.statIconWrap}>
                  {Icons[stat.icon as keyof typeof Icons]}
                </div>
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filters Bar */}
          <div className={styles.filtersBar}>
            <div className={styles.searchWrap}>
              {Icons.search}
              <input
                type="text"
                placeholder="Search Invoice.."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button type="button" className={styles.selectBtn}>
              All Types {Icons.chevronDown}
            </button>
            <button type="button" className={styles.selectBtn}>
              All Statuses {Icons.chevronDown}
            </button>
            <button type="button" className={styles.selectBtn}>
              All Plans {Icons.chevronDown}
            </button>
            <button type="button" className={styles.clearBtn}>
              Clear All
            </button>
            <div className={styles.filtersRight}>
              <button type="button" className={styles.exportBtn}>
                {Icons.download} Export Excel
              </button>
              <button type="button" className={styles.addClientBtn}>
                {Icons.userPlus} Add Client
              </button>
            </div>
          </div>
        </div>

        {/* Right panel: Recent Activities only */}
        <aside className={styles.activitiesPanel}>
          <h3 className={styles.panelTitle}>Recent Activities</h3>
          <div className={styles.activityList}>
            {recentActivities.map((activity, index) => (
              <div key={index} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {Icons[activity.icon as keyof typeof Icons]}
                </div>
                <div>
                  <p className={styles.activityTitle}>{activity.title}</p>
                  <p className={styles.activitySub}>{activity.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* --------------------------- Full-width table --------------------------- */}
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Team Size</th>
                <th>Location</th>
                <th>Join Date</th>
                <th>Billing</th>
                <th>Last Invoice</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer, index) => (
                <tr
                  key={`${customer.name}-${index}`}
                  onClick={() => handleCustomerClick(customer.name)}
                >
                  <td className={styles.customerNameCell}>{customer.name}</td>
                  <td>{customer.teamSize}</td>
                  <td>{customer.location}</td>
                  <td>{customer.joinDate}</td>
                  <td className={BILLING_CLASS[customer.billing]}>{customer.billing}</td>
                  <td>{customer.lastInvoice}</td>
                  <td>
                    <span className={`${styles.statusPill} ${STATUS_CLASS[customer.status]}`}>
                      {customer.status}
                      {Icons.pillCaret}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}