/**
 * File:        apps/web/src/app/dashboard/crm/customers/[id]/page.tsx
 * Module:      Web · Dashboard · CRM · Customers · Customer Detail (360°)
 * Purpose:     360° customer view matching Figma node 0:23687
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./customer-detail.module.css";

type Tab = "overview" | "employees" | "activity" | "documents";

/* ----- Icons (inline SVG, matches leads/[id] pattern) ----- */
const Icons = {
  arrowLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  receipt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  ),
  trendingUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  rupee: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 0a3 3 0 11-6 0m6 0a3 3 0 00-3-3H9m6 3L6 18m12-9.75H9" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  ),
  arrowUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
  snowflake: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m-7.5-13.5l15 9M4.5 16.5l15-9M19.5 12h-15M9 6.75l6 3.75M9 17.25l6-3.75" />
    </svg>
  ),
  logOut: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  ),
};

/* ----- Tabs config ----- */
const TAB_LIST: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "employees", label: "Employees" },
  { key: "activity", label: "Activity Timeline" },
  { key: "documents", label: "Documents" },
];

/* ----- Field config (Overview tab) ----- */
const MEMBERSHIP_FIELDS = [
  { label: "Plan Type", value: "Enterprise" },
  { label: "Number of Seats", value: "25 seats" },
  { label: "Type of Seat", value: "Dedicated" },
  { label: "Active Since", value: "Jan 15, 2024" },
  { label: "Renewal Date", value: "Jan 15, 2026" },
  { label: "Contact Email", value: "contact@technova.com" },
  { label: "Phone Number", value: "+91 98765 43210" },
];

const FINANCIAL_FIELDS = [
  { label: "Total Paid", value: "₹150,000", secondary: true },
  { label: "Pending Dues", value: "₹0" },
  { label: "Last Payment", value: "₹25,000" },
  { label: "Mode of Payment", value: "NEFT" },
  { label: "Payment Cycle", value: "Monthly" },
  { label: "Invoice Date", value: "Jan 01, 2025" },
  { label: "Invoice Amount", value: "₹25,000" },
  { label: "Security Deposit", value: "₹5,000" },
];

const USAGE_FIELDS = [
  { label: "Meeting Rooms (This Month)", value: "12", trend: "20% from last month" },
  { label: "Printing Credits", value: "850" },
  { label: "Wallet Balance", value: "₹3,200", secondary: true },
];

/* ============================================================
   Component
   ============================================================ */
export default function CustomerDetailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [note, setNote] = useState("");

  return (
    <div className={styles.shell}>
      {/* ----- Row 1: Profile header ----- */}
      <header className={styles.profileHeader}>
        <div className={styles.profileLeft}>
          <button
            type="button"
            className={styles.backBtn}
            aria-label="Back to customers"
            onClick={() => router.push("/dashboard/crm/customers")}
          >
            {Icons.arrowLeft}
          </button>

          <div className={styles.avatar}>TN</div>

          <div className={styles.profileMeta}>
            <h1 className={styles.customerName}>TechNova Solutions</h1>
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                {Icons.building}
                Enterprise · 25 seats
              </span>
              <span className={styles.metaItem}>
                {Icons.calendar}
                Member since Jan 2024
              </span>
            </div>
          </div>
        </div>

        <div className={styles.profileActions}>
          <button type="button" className={styles.actionBtnOutline}>
            {Icons.receipt}
            Generate Invoice
          </button>
          <button type="button" className={styles.actionBtnOutline}>
            {Icons.bell}
            Send Reminder
          </button>
        </div>
      </header>

      {/* ----- Row 2: KPI cards ----- */}
      <div className={styles.kpiGrid}>
        <KpiCard
          icon={Icons.trendingUp}
          value="₹25,000"
          label="Total Revenue Generated"
        />
        <KpiCard icon={Icons.rupee} value="₹0" label="Outstanding Dues" />
        <KpiCard icon={Icons.users} value="25" label="Active Seats" />
        <KpiCard
          icon={Icons.shield}
          value="₹5,000"
          label="Security Deposit Held"
        />
      </div>

      {/* ----- Row 3: Two-column main ----- */}
      <div className={styles.mainRow}>
        {/* Left column */}
        <div className={styles.leftCol}>
          {/* Tabs */}
          <div className={styles.tabBar} role="tablist">
            {TAB_LIST.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={activeTab === t.key}
                className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <>
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Membership Details</h2>
                <div className={`${styles.fieldGrid} ${styles.fieldGrid3}`}>
                  {MEMBERSHIP_FIELDS.map((f) => (
                    <Field key={f.label} label={f.label} value={f.value} />
                  ))}
                </div>
              </section>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Financial Summary</h2>
                <div className={`${styles.fieldGrid} ${styles.fieldGrid4}`}>
                  {FINANCIAL_FIELDS.map((f) => (
                    <Field
                      key={f.label}
                      label={f.label}
                      value={f.value}
                      secondary={f.secondary}
                    />
                  ))}
                </div>
              </section>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Usage Metrics</h2>
                <div className={`${styles.fieldGrid} ${styles.fieldGrid3}`}>
                  {USAGE_FIELDS.map((f) => (
                    <Field
                      key={f.label}
                      label={f.label}
                      value={f.value}
                      secondary={f.secondary}
                      trend={f.trend}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "employees" && (
            <div className={styles.placeholderTab}>
              Employees list will appear here.
            </div>
          )}
          {activeTab === "activity" && (
            <div className={styles.placeholderTab}>
              Activity timeline will appear here.
            </div>
          )}
          {activeTab === "documents" && (
            <div className={styles.placeholderTab}>
              Documents will appear here.
            </div>
          )}
        </div>

        {/* Right column */}
        <aside className={styles.rightCol}>
          <button type="button" className={styles.alertsCard}>
            {Icons.bell}
            <span className={styles.cardTitle}>Send Alerts &amp; Notifications</span>
          </button>

          <section className={`${styles.card} ${styles.cardCompact}`}>
            <h2 className={styles.cardTitle}>Quick Actions</h2>
            <div className={styles.quickActionsList}>
              <ActionButton icon={Icons.arrowUp} label="Upgrade Plan" />
              <ActionButton icon={Icons.refresh} label="Renew Membership" />
              <ActionButton icon={Icons.snowflake} label="Freeze Account" />
              <ActionButton icon={Icons.logOut} label="Initiate Exit" />
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Customer Insights</h2>
            <div className={styles.fieldStackLarge}>
              <span className={styles.fieldLabel}>Lifetime Value</span>
              <span className={`${styles.fieldValue} ${styles.fieldValueHighlight}`}>
                ₹150,000
              </span>
            </div>
            <div className={styles.fieldStack}>
              <span className={styles.fieldLabel}>Last Activity</span>
              <span className={`${styles.fieldValue} ${styles.fieldValueSecondary}`}>
                2 hours ago
              </span>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Internal Notes</h2>
            <textarea
              className={styles.notesTextarea}
              placeholder="Add a private note about this customer..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button type="button" className={styles.saveNoteBtn}>
              Save Note
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ----- Subcomponents ----- */

function KpiCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiIconWrap}>{icon}</div>
      <p className={styles.kpiValue}>{value}</p>
      <p className={styles.kpiLabel}>{label}</p>
    </div>
  );
}

function Field({
  label,
  value,
  secondary,
  trend,
}: {
  label: string;
  value: string;
  secondary?: boolean;
  trend?: string;
}) {
  return (
    <div className={styles.fieldItem}>
      <p className={styles.fieldLabel}>{label}</p>
      <p
        className={`${styles.fieldValue} ${secondary ? styles.fieldValueSecondary : ""}`}
      >
        {value}
      </p>
      {trend && (
        <p className={`${styles.fieldTrend} ${styles.fieldTrendUp}`}>{trend}</p>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button type="button" className={styles.quickActionBtn}>
      {icon}
      <span className={styles.quickActionLabel}>{label}</span>
    </button>
  );
}
