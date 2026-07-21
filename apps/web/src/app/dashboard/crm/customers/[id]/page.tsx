"use client";

/**
 * File:        apps/web/src/app/dashboard/crm/customers/[id]/page.tsx
 * Module:      Web · Dashboard · CRM · Customers · Customer Detail (360°)
 * Purpose:     360° customer view matching Figma node 0:23687
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */


import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_CUSTOMER,
  GET_CUSTOMER_DEPOSITS,
  GET_CUSTOMER_CONTRACTS,
  GET_CUSTOMER_INVOICES,
  TERMINATE_CONTRACT,
  RENEW_CONTRACT,
  FREEZE_DEPOSIT,
  UNFREEZE_DEPOSIT,
  RELEASE_DEPOSIT,
  REQUEST_DEPOSIT_RELEASE,
  SEND_DEPOSIT_REMINDER,
  MARK_INVOICE_PAID,
} from "@/lib/apollo/operations";
import styles from "./customer-detail.module.css";

type Tab = "overview" | "employees" | "activity" | "documents";

/** Placeholder for any field that has no backend source yet. */
const NA = "—";

/** Format an ISO date string into a short readable date; returns NA if missing. */
function formatDate(iso?: string | null): string {
  if (!iso) return NA;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NA;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format a numeric amount as INR; returns NA if not a finite number. */
function formatRupee(amount?: number | null): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return NA;
  return `₹${amount.toLocaleString("en-IN")}`;
}

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
  userPlus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  ),
  payment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  ),
  invoice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  seat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  ),
  onboarding: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
  view: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 8.25L12 12.75m0 0l4.5-4.5M12 12.75V3" />
    </svg>
  ),
  filePdf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  fileImage: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
  checkThin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  checkTiny: (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6.5l2.5 2.5 4.5-5" />
    </svg>
  ),
  envelope: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  alertCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  lockClosed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
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
type MembershipField = { label: string; value: string };
type FinancialField = { label: string; value: string; highlight?: boolean };
type UsageField = { label: string; value: string; trend?: string; subtext?: string };

/* ----- Activity Timeline tab item type ----- */
type Activity = {
  id: string;
  actor: string;
  actorInitials: string;
  message: string;
  time: string;
};

/* ----- Documents tab item type ----- */
type Document = {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "JPG" | "PNG";
  size: string;
  uploadedAt: string;
  variant: "pdf" | "image";
};

/* ----- Employees tab item type ----- */
type Employee = {
  name: string;
  email: string;
  role: string;
  seat: string;
  status: "active" | "inactive" | "invited";
  actions: ("edit" | "remove")[];
};

/* ============================================================
   Component
   ============================================================ */
export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [note, setNote] = useState("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [depositsOpen, setDepositsOpen] = useState(true);
  const [contractsOpen, setContractsOpen] = useState(true);
  const [invoicesOpen, setInvoicesOpen] = useState(true);
  const [showRenewContractDialog, setShowRenewContractDialog] = useState(false);
  const [renewingContractId, setRenewingContractId] = useState<string>("");
  const [renewEndDate, setRenewEndDate] = useState("");

  /* ── Apollo: fetch customer ── */
  const { data, loading, error } = useQuery(GET_CUSTOMER, {
    variables: { id: customerId },
    skip: !customerId,
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });
  const customer = data?.customer;

  /* ── Apollo: fetch financial data ── */
  const { data: depositsData } = useQuery(GET_CUSTOMER_DEPOSITS, {
    variables: { customerId },
    skip: !customerId,
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });
  const { data: contractsData } = useQuery(GET_CUSTOMER_CONTRACTS, {
    variables: { customerId },
    skip: !customerId,
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });
  const { data: invoicesData } = useQuery(GET_CUSTOMER_INVOICES, {
    variables: { customerId },
    skip: !customerId,
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  /* ── Apollo: financial mutations ── */
  const [terminateContractMut] = useMutation(TERMINATE_CONTRACT, {
    refetchQueries: [
      { query: GET_CUSTOMER_DEPOSITS, variables: { customerId } },
      { query: GET_CUSTOMER_CONTRACTS, variables: { customerId } },
      { query: GET_CUSTOMER_INVOICES, variables: { customerId } },
      { query: GET_CUSTOMER, variables: { id: customerId } },
    ],
  });
  const [renewContractMut] = useMutation(RENEW_CONTRACT, {
    refetchQueries: [
      { query: GET_CUSTOMER_CONTRACTS, variables: { customerId } },
      { query: GET_CUSTOMER, variables: { id: customerId } },
    ],
  });
  const [freezeDepositMut] = useMutation(FREEZE_DEPOSIT, {
    refetchQueries: [
      { query: GET_CUSTOMER_DEPOSITS, variables: { customerId } },
      { query: GET_CUSTOMER, variables: { id: customerId } },
    ],
  });
  const [unfreezeDepositMut] = useMutation(UNFREEZE_DEPOSIT, {
    refetchQueries: [
      { query: GET_CUSTOMER_DEPOSITS, variables: { customerId } },
      { query: GET_CUSTOMER, variables: { id: customerId } },
    ],
  });
  const [releaseDepositMut] = useMutation(RELEASE_DEPOSIT, {
    refetchQueries: [
      { query: GET_CUSTOMER_DEPOSITS, variables: { customerId } },
      { query: GET_CUSTOMER, variables: { id: customerId } },
    ],
  });
  const [requestReleaseMut] = useMutation(REQUEST_DEPOSIT_RELEASE, {
    refetchQueries: [
      { query: GET_CUSTOMER_DEPOSITS, variables: { customerId } },
      { query: GET_CUSTOMER, variables: { id: customerId } },
    ],
  });
  const [sendReminderMut] = useMutation(SEND_DEPOSIT_REMINDER, {
    refetchQueries: [
      { query: GET_CUSTOMER_DEPOSITS, variables: { customerId } },
    ],
  });
  const [markPaidMut] = useMutation(MARK_INVOICE_PAID, {
    refetchQueries: [
      { query: GET_CUSTOMER_INVOICES, variables: { customerId } },
      { query: GET_CUSTOMER, variables: { id: customerId } },
    ],
  });

  // Lock body scroll while dialog is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!(showUpgradeDialog || showRenewDialog || showRenewContractDialog)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showUpgradeDialog, showRenewDialog, showRenewContractDialog]);

  /* ── Loading state ── */
  if (loading && !customer) {
    return (
      <div className={styles.shell}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} aria-hidden="true" />
          <p>Loading customer details…</p>
        </div>
      </div>
    );
  }

  /* ── Error / not-found state ── */
  if (!customer) {
    return (
      <div className={styles.shell}>
        <div className={styles.loadingState}>
          <p className={styles.notFoundTitle}>Customer not found</p>
          <p className={styles.notFoundBody}>
            {error
              ? "We couldn't load this customer. Please try again later."
              : "This customer may have been deleted or the link is invalid."}
          </p>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.push("/dashboard/crm/customers")}
          >
            {Icons.arrowLeft}
            Back to customers
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived data from the live customer record ── */
  const displayName = customer.name || customer.company || "Customer";
  const initials = (displayName.trim().slice(0, 2) || "CN").toUpperCase();
  const memberSince = formatDate(customer.joinDate ?? customer.createdAt);
  const seatsLabel =
    customer.teamSize != null ? `${customer.teamSize} seats` : NA;

  const membershipFields: MembershipField[] = [
    { label: "Company", value: customer.company || NA },
    { label: "Number of Seats", value: customer.teamSize != null ? String(customer.teamSize) : NA },
    { label: "Status", value: customer.status || NA },
    { label: "Active Since", value: memberSince },
    { label: "Location", value: customer.location || NA },
    { label: "Contact Email", value: customer.email || NA },
    { label: "Phone Number", value: customer.phone || NA },
  ];

  const financialFields: FinancialField[] = [
    { label: "Total Spent", value: formatRupee(customer.totalSpent), highlight: true },
    { label: "Last Booking", value: formatDate(customer.lastBooking) },
    { label: "Total Bookings", value: customer.totalBookings != null ? String(customer.totalBookings) : NA },
    { label: "Notes", value: customer.notes || NA },
  ];

  const usageFields: UsageField[] = [
    { label: "Total Bookings", value: customer.totalBookings != null ? String(customer.totalBookings) : NA },
    { label: "Team Size", value: customer.teamSize != null ? String(customer.teamSize) : NA },
    { label: "Location", value: customer.location || NA },
  ];

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

          <div className={styles.avatar}>{initials}</div>

          <div className={styles.profileMeta}>
            <h1 className={styles.customerName}>{displayName}</h1>
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                {Icons.building}
                {customer.company || NA}
                {customer.teamSize != null ? ` · ${customer.teamSize} seats` : ""}
              </span>
              <span className={styles.metaItem}>
                {Icons.calendar}
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.profileActions}>
          <button
            type="button"
            className={styles.actionBtnOutline}
            onClick={() => {
              toast.info("Redirecting to invoices...");
              router.push("/dashboard/revenue/invoices");
            }}
          >
            {Icons.receipt}
            Generate Invoice
          </button>
          <button
            type="button"
            className={styles.actionBtnOutline}
            onClick={() => setShowReminderDialog(true)}
          >
            {Icons.bell}
            Send Reminder
          </button>
        </div>
      </header>

      {/* ----- Row 2: KPI cards ----- */}
      <div className={styles.kpiGrid}>
        <KpiCard
          icon={Icons.trendingUp}
          value={formatRupee(customer.totalSpent)}
          label="Total Revenue Generated"
        />
        <KpiCard icon={Icons.rupee} value={NA} label="Outstanding Dues" />
        <KpiCard
          icon={Icons.users}
          value={customer.teamSize != null ? String(customer.teamSize) : NA}
          label="Active Seats"
        />
        <KpiCard
          icon={Icons.shield}
          value={NA}
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
              {/* Membership Details */}
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Membership Details</h2>
                <div className={`${styles.fieldGrid} ${styles.fieldGrid3}`}>
                  {membershipFields.map((f) => (
                    <Field key={f.label} label={f.label} value={f.value} />
                  ))}
                </div>
              </section>

              {/* Financial Summary */}
              {(() => {
                const deposits = depositsData?.customerDeposits ?? [];
                const contracts = contractsData?.customerContracts ?? [];
                const invoices = invoicesData?.customerInvoices ?? [];
                const totalDeposits = deposits.reduce((s: number, d: any) => s + Number(d.amount ?? 0), 0);
                const activeContracts = contracts.filter((c: any) => c.status === "Active" || c.status === "Expiring Soon");
                const activeContractsTotal = activeContracts.reduce((s: number, c: any) => s + Number(c.amount ?? 0), 0);
                const outstandingInvoices = invoices.filter((i: any) => i.status !== "Paid");
                const outstandingTotal = outstandingInvoices.reduce((s: number, i: any) => s + Number(i.totalAmount ?? 0), 0);
                const paidInvoices = invoices.filter((i: any) => i.status === "Paid");
                const totalSpent = paidInvoices.reduce((s: number, i: any) => s + Number(i.totalAmount ?? 0), 0);
                return (
                  <section className={styles.card}>
                    <h2 className={styles.cardTitle}>Financial Summary</h2>
                    <div className={styles.finSummaryGrid}>
                      <div className={styles.finSummaryCard}>
                        <p className={styles.finSummaryLabel}>Total Deposits</p>
                        <p className={styles.finSummaryValue}>{formatRupee(totalDeposits)}</p>
                        <p className={styles.finSummaryCount}>{deposits.length} deposit{deposits.length !== 1 ? "s" : ""}</p>
                      </div>
                      <div className={styles.finSummaryCard}>
                        <p className={styles.finSummaryLabel}>Active Contracts</p>
                        <p className={styles.finSummaryValue}>{formatRupee(activeContractsTotal)}</p>
                        <p className={styles.finSummaryCount}>{activeContracts.length} active</p>
                      </div>
                      <div className={styles.finSummaryCard}>
                        <p className={styles.finSummaryLabel}>Outstanding Invoices</p>
                        <p className={styles.finSummaryValue}>{formatRupee(outstandingTotal)}</p>
                        <p className={styles.finSummaryCount}>{outstandingInvoices.length} pending</p>
                      </div>
                      <div className={styles.finSummaryCard}>
                        <p className={styles.finSummaryLabel}>Total Spent</p>
                        <p className={styles.finSummaryValue}>{formatRupee(totalSpent)}</p>
                        <p className={styles.finSummaryCount}>{paidInvoices.length} paid</p>
                      </div>
                    </div>
                  </section>
                );
              })()}

              {/* Deposits */}
              <section className={styles.card}>
                <div
                  className={styles.finSectionHeader}
                  onClick={() => setDepositsOpen((o) => !o)}
                >
                  <div className={styles.finSectionHeaderLeft}>
                    <span className={styles.finSectionIcon} aria-hidden="true">
                      {Icons.rupee}
                    </span>
                    <h2 className={styles.finSectionTitle}>Deposits</h2>
                  </div>
                  <span
                    className={`${styles.finSectionToggle} ${depositsOpen ? styles.finSectionToggleOpen : ""}`}
                    aria-hidden="true"
                  >
                    {Icons.chevronDown}
                  </span>
                </div>
                {depositsOpen && (() => {
                  const deposits = depositsData?.customerDeposits ?? [];
                  if (deposits.length === 0) {
                    return (
                      <div className={styles.emptyState}>
                        <p className={styles.emptyStateTitle}>No deposits</p>
                        <p className={styles.emptyStateBody}>No deposits have been recorded for this customer yet.</p>
                      </div>
                    );
                  }
                  return (
                    <div className={styles.finList}>
                      {deposits.map((d: any) => (
                        <div key={d.id} className={styles.finListItem}>
                          <div className={styles.finListMeta}>
                            <p className={styles.finListPrimary}>{d.depositType} Deposit &middot; {d.referenceNumber}</p>
                            <p className={styles.finListSecondary}>
                              Received {formatDate(d.receivedDate)} &middot; {d.notes || "—"}
                            </p>
                          </div>
                          <span className={`${styles.finStatusBadge} ${styles[`finStatus_${d.status?.replace(/\s+/g, "_")}] ?? ""}`}>{d.status}</span>
                          <span className={styles.finListAmount}>{formatRupee(d.amount)}</span>
                          <div className={styles.finActions}>
                            {d.status === "Held" && !d.frozen && (
                              <>
                                <button type="button" className={styles.finActionBtn} onClick={async () => {
                                  const reason = prompt("Freeze reason (optional):");
                                  if (reason === null) return;
                                  await requestReleaseMut({ variables: { id: d.id, reason: reason || undefined } });
                                  toast.success("Release requested");
                                }}>Request Release</button>
                                <button type="button" className={styles.finActionBtn} onClick={async () => {
                                  await freezeDepositMut({ variables: { id: d.id } });
                                  toast.success("Deposit frozen");
                                }}>Freeze</button>
                              </>
                            )}
                            {d.frozen && (
                              <button type="button" className={styles.finActionBtn} onClick={async () => {
                                await unfreezeDepositMut({ variables: { id: d.id } });
                                toast.success("Deposit unfrozen");
                              }}>Unfreeze</button>
                            )}
                            {d.status === "Release Requested" && (
                              <button type="button" className={`${styles.finActionBtn} ${styles.finActionBtnSuccess}`} onClick={async () => {
                                await releaseDepositMut({ variables: { id: d.id } });
                                toast.success("Deposit released");
                              }}>Release</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </section>

              {/* Contracts */}
              <section className={styles.card}>
                <div
                  className={styles.finSectionHeader}
                  onClick={() => setContractsOpen((o) => !o)}
                >
                  <div className={styles.finSectionHeaderLeft}>
                    <span className={styles.finSectionIcon} aria-hidden="true">
                      {Icons.filePdf}
                    </span>
                    <h2 className={styles.finSectionTitle}>Contracts</h2>
                  </div>
                  <span
                    className={`${styles.finSectionToggle} ${contractsOpen ? styles.finSectionToggleOpen : ""}`}
                    aria-hidden="true"
                  >
                    {Icons.chevronDown}
                  </span>
                </div>
                {contractsOpen && (() => {
                  const contracts = contractsData?.customerContracts ?? [];
                  if (contracts.length === 0) {
                    return (
                      <div className={styles.emptyState}>
                        <p className={styles.emptyStateTitle}>No contracts</p>
                        <p className={styles.emptyStateBody}>No contracts have been created for this customer yet.</p>
                      </div>
                    );
                  }
                  return (
                    <div className={styles.finList}>
                      {contracts.map((c: any) => (
                        <div key={c.id} className={styles.finListItem}>
                          <div className={styles.finListMeta}>
                            <p className={styles.finListPrimary}>{c.contractNumber} &middot; {c.planName}</p>
                            <p className={styles.finListSecondary}>
                              {formatDate(c.startDate)} — {formatDate(c.endDate)} &middot; {c.paymentFrequency} &middot; Auto-renew: {c.autoRenew ? "Yes" : "No"}
                            </p>
                          </div>
                          <span className={`${styles.finStatusBadge} ${styles[`finStatus_${c.status?.replace(/\s+/g, "_")}] ?? ""}`}>{c.status}</span>
                          <span className={styles.finListAmount}>{formatRupee(c.amount)}</span>
                          <div className={styles.finActions}>
                            {c.status === "Active" && (
                              <>
                                <button type="button" className={`${styles.finActionBtn} ${styles.finActionBtnPrimary}`} onClick={() => {
                                  setRenewingContractId(c.id);
                                  setRenewEndDate("");
                                  setShowRenewContractDialog(true);
                                }}>Renew</button>
                                <button type="button" className={`${styles.finActionBtn} ${styles.finActionBtnDanger}`} onClick={async () => {
                                  if (!confirm("Terminate this contract?")) return;
                                  await terminateContractMut({ variables: { id: c.id } });
                                  toast.success("Contract terminated");
                                }}>Terminate</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </section>

              {/* Invoices */}
              <section className={styles.card}>
                <div
                  className={styles.finSectionHeader}
                  onClick={() => setInvoicesOpen((o) => !o)}
                >
                  <div className={styles.finSectionHeaderLeft}>
                    <span className={styles.finSectionIcon} aria-hidden="true">
                      {Icons.invoice}
                    </span>
                    <h2 className={styles.finSectionTitle}>Invoices</h2>
                  </div>
                  <span
                    className={`${styles.finSectionToggle} ${invoicesOpen ? styles.finSectionToggleOpen : ""}`}
                    aria-hidden="true"
                  >
                    {Icons.chevronDown}
                  </span>
                </div>
                {invoicesOpen && (() => {
                  const invoices = invoicesData?.customerInvoices ?? [];
                  if (invoices.length === 0) {
                    return (
                      <div className={styles.emptyState}>
                        <p className={styles.emptyStateTitle}>No invoices</p>
                        <p className={styles.emptyStateBody}>No invoices have been generated for this customer yet.</p>
                      </div>
                    );
                  }
                  return (
                    <div className={styles.finList}>
                      {invoices.map((inv: any) => (
                        <div key={inv.id} className={styles.finListItem}>
                          <div className={styles.finListMeta}>
                            <p className={styles.finListPrimary}>{inv.invoiceNumber} &middot; {inv.planName || "—"}</p>
                            <p className={styles.finListSecondary}>
                              Issued {formatDate(inv.issueDate)} &middot; Due {formatDate(inv.dueDate)}
                              {inv.paidDate ? ` &middot; Paid ${formatDate(inv.paidDate)}` : ""}
                            </p>
                          </div>
                          <span className={`${styles.finStatusBadge} ${styles[`finStatus_${inv.status?.replace(/\s+/g, "_")}] ?? ""}`}>{inv.status}</span>
                          <span className={styles.finListAmount}>{formatRupee(inv.totalAmount)}</span>
                          <div className={styles.finActions}>
                            {inv.status !== "Paid" && (
                              <button type="button" className={`${styles.finActionBtn} ${styles.finActionBtnSuccess}`} onClick={async () => {
                                const methods = ["CARD", "UPI", "WALLET", "BANK_TRANSFER"] as const;
                                const method = prompt(`Payment method (${methods.join(", ")}):`);
                                if (!method || !methods.includes(method as any)) {
                                  if (method !== null) toast.error("Invalid payment method");
                                  return;
                                }
                                await markPaidMut({ variables: { id: inv.id, paymentMethod: method } });
                                toast.success("Invoice marked as paid");
                              }}>Mark Paid</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </section>
            </>
          )}

          {activeTab === "employees" && <EmployeesList employees={[]} />}
          {activeTab === "activity" && <ActivityList activities={[]} />}
          {activeTab === "documents" && <DocumentsList documents={[]} />}
        </div>

        {/* Right column */}
        <aside className={styles.rightCol}>
          <button
            type="button"
            className={styles.alertsCard}
            onClick={() => toast.info("Notification center coming soon")}
          >
            {Icons.bell}
            <span className={styles.cardTitle}>Send Alerts &amp; Notifications</span>
          </button>

          <section className={`${styles.card} ${styles.cardCompact}`}>
            <h2 className={styles.cardTitle}>Quick Actions</h2>
            <div className={styles.quickActionsList}>
              <ActionButton icon={Icons.arrowUp} label="Upgrade Plan" onClick={() => setShowUpgradeDialog(true)} />
              <ActionButton icon={Icons.refresh} label="Renew Membership" onClick={() => setShowRenewDialog(true)} />
              <ActionButton icon={Icons.snowflake} label="Freeze Account" onClick={() => setShowFreezeDialog(true)} />
              <ActionButton
                icon={Icons.logOut}
                label="Initiate Exit"
                onClick={() => toast.info(`Exit process initiated for ${displayName}`)}
              />
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Customer Insights</h2>
            <div className={styles.fieldStackLarge}>
              <span className={styles.fieldLabel}>Lifetime Value</span>
              <span className={`${styles.fieldValue} ${styles.fieldValueHighlight}`}>
                {formatRupee(customer.totalSpent)}
              </span>
            </div>
            <div className={styles.fieldStack}>
              <span className={styles.fieldLabel}>Last Activity</span>
              <span className={`${styles.fieldValue} ${styles.fieldValueSecondary}`}>
                {formatDate(customer.lastBooking)}
              </span>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Internal Notes</h2>
            <textarea
              className={styles.notesTextarea}
              placeholder="Add notes for team members..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              type="button"
              className={styles.saveNoteBtn}
              onClick={() => {
                if (!note.trim()) {
                  toast.error("Note cannot be empty");
                  return;
                }
                toast.success("Note saved");
                setNote("");
              }}
            >
              Save Note
            </button>
          </section>
        </aside>
      </div>

      <PlanUpgradeDialog
        open={showUpgradeDialog}
        customerName={displayName}
        onClose={() => setShowUpgradeDialog(false)}
      />

      <SendReminderDialog
        open={showReminderDialog}
        customerName={displayName}
        onClose={() => setShowReminderDialog(false)}
      />

      <FreezeAccountDialog
        open={showFreezeDialog}
        customerName={displayName}
        onClose={() => setShowFreezeDialog(false)}
      />

      <RenewMembershipDialog
        open={showRenewDialog}
        customerName={displayName}
        onClose={() => setShowRenewDialog(false)}
      />

      {showRenewContractDialog && (
        <RenewContractDialog
          open={showRenewContractDialog}
          contractId={renewingContractId}
          onClose={() => {
            setShowRenewContractDialog(false);
            setRenewingContractId("");
            setRenewEndDate("");
          }}
          onRenew={async (id, date) => {
            await renewContractMut({ variables: { id, newEndDate: date } });
            toast.success("Contract renewed successfully");
            setShowRenewContractDialog(false);
            setRenewingContractId("");
            setRenewEndDate("");
          }}
        />
      )}
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
  subtext,
  highlight,
}: {
  label: string;
  value: string;
  secondary?: boolean;
  trend?: string;
  subtext?: string;
  highlight?: boolean;
}) {
  return (
    <div className={styles.fieldItem}>
      <p className={styles.fieldLabel}>{label}</p>
      <p
        className={`${styles.fieldValue} ${secondary ? styles.fieldValueSecondary : ""} ${highlight ? styles.fieldValueHighlight : ""}`}
      >
        {value}
      </p>
      {trend && (
        <p className={`${styles.fieldTrend} ${styles.fieldTrendUp}`}>{trend}</p>
      )}
      {subtext && (
        <p className={styles.fieldTrend}>{subtext}</p>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={styles.quickActionBtn} onClick={onClick}>
      {icon}
      <span className={styles.quickActionLabel}>{label}</span>
    </button>
  );
}

/* ----- Employees tab (matches Figma node 0:23393) ----- */
function EmployeesList({ employees }: { employees: Employee[] }) {
  return (
    <section className={styles.employeesCard}>
      <header className={styles.employeesHeader}>
        <h2 className={styles.employeesTitle}>Team Members ({employees.length})</h2>
        <button
          type="button"
          className={styles.addEmployeeBtn}
          onClick={() => toast.info("Employee management coming soon")}
        >
          {Icons.userPlus}
          <span>Add Employee</span>
        </button>
      </header>

      {employees.length === 0 ? (
        <EmptyState title="No team members" body="No team members have been added for this customer yet." />
      ) : (
        <div className={styles.empTable} role="table" aria-label="Team members">
          <div className={styles.empHeaderRow} role="row">
            <div className={styles.empHeaderCell} role="columnheader">Name</div>
            <div className={styles.empHeaderCell} role="columnheader">Role</div>
            <div className={styles.empHeaderCell} role="columnheader">Assigned Seat</div>
            <div className={styles.empHeaderCell} role="columnheader">Status</div>
            <div className={`${styles.empHeaderCell} ${styles.empHeaderCellActions}`} role="columnheader">Actions</div>
          </div>

          <div className={styles.empBody} role="rowgroup">
            {employees.map((emp) => (
              <div key={emp.email} className={styles.empRow} role="row">
                <div className={styles.empCell} role="cell">
                  <div className={styles.empName}>{emp.name}</div>
                  <div className={styles.empEmail}>{emp.email}</div>
                </div>
                <div className={styles.empCell} role="cell">
                  <span className={styles.empRole}>{emp.role}</span>
                </div>
                <div className={styles.empCell} role="cell">
                  <span className={styles.empSeatBadge}>{emp.seat}</span>
                </div>
                <div className={styles.empCell} role="cell">
                  <span className={`${styles.empStatusBadge} ${styles[`empStatus_${emp.status}`] ?? ""}`}>
                    {emp.status}
                  </span>
                </div>
                <div className={styles.empCell} role="cell">
                  <div className={styles.empActions}>
                    {emp.actions.includes("edit") && (
                      <button type="button" className={styles.empActionBtn}>
                        {Icons.edit}
                        <span>Edit</span>
                      </button>
                    )}
                    {emp.actions.includes("remove") && (
                      <button type="button" className={`${styles.empActionBtn} ${styles.empActionBtnDanger}`}>
                        {Icons.trash}
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ActivityList({ activities }: { activities: Activity[] }) {
  return (
    <section className={styles.activityCard}>
      <header className={styles.activityHeader}>
        <h2 className={styles.activityTitle}>Recent Activity</h2>
        <button type="button" className={styles.activityFilterBtn}>
          {Icons.filter}
          <span>Last 30 days</span>
        </button>
      </header>

      {activities.length === 0 ? (
        <EmptyState title="No activities recorded" body="There is no activity history for this customer yet." />
      ) : (
        <ol className={styles.activityList}>
          {activities.map((a, idx) => {
            const isLast = idx === activities.length - 1;
            return (
              <li key={a.id} className={styles.activityItem}>
                <span className={styles.activityAvatar} aria-hidden="true">
                  {a.actorInitials}
                </span>
                {!isLast && <span className={styles.activityLine} aria-hidden="true" />}
                <div className={styles.activityBody}>
                  <p className={styles.activityText}>
                    <strong className={styles.activityActor}>{a.actor}</strong>
                    {" "}
                    <span className={styles.activityMessage}>{a.message}</span>
                  </p>
                  <span className={styles.activityTime}>{a.time}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function DocumentsList({ documents }: { documents: Document[] }) {
  return (
    <section className={styles.documentsCard}>
      <header className={styles.documentsHeader}>
        <h2 className={styles.documentsTitle}>Uploaded Documents</h2>
        <button
          type="button"
          className={styles.documentsUploadBtn}
          onClick={() => toast.info("Document upload coming soon")}
        >
          {Icons.upload}
          <span>Upload Document</span>
        </button>
      </header>

      {documents.length === 0 ? (
        <EmptyState title="No documents" body="No documents have been uploaded for this customer yet." />
      ) : (
        <div className={styles.documentsList}>
          {documents.map((d) => (
            <article key={d.id} className={styles.documentsRow}>
              <div
                className={`${styles.documentsIconWrap} ${d.variant === "image" ? styles.documentsIconWrapImage : ""}`}
                aria-hidden="true"
              >
                {d.variant === "pdf" ? Icons.filePdf : Icons.fileImage}
              </div>

              <div className={styles.documentsMeta}>
                <p className={styles.documentsName}>{d.name}</p>
                <p className={styles.documentsSub}>
                  {d.type} · {d.size} · Uploaded {d.uploadedAt}
                </p>
              </div>

              <div className={styles.documentsActions}>
                <button type="button" className={styles.documentsViewBtn}>
                  {Icons.view}
                  <span>View</span>
                </button>
                <button
                  type="button"
                  className={styles.documentsDownloadBtn}
                  aria-label={`Download ${d.name}`}
                >
                  {Icons.download}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* ----- Shared empty-state placeholder ----- */
function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.emptyState} role="status">
      <p className={styles.emptyStateTitle}>{title}</p>
      <p className={styles.emptyStateBody}>{body}</p>
    </div>
  );
}

/* ----- Plan Upgrade Dialog (Figma node 0:23983) ----- */
const UPGRADE_PLANS = ["Hot Desk", "Private Cabin", "Dedicated Desk", "Meeting Room"];
const UPGRADE_DURATIONS = ["1 month", "3 months", "6 months", "12 months"];
const UPGRADE_AMENITIES = ["WiFi", "AC", "Projector", "Coffee", "Whiteboard", "Printer"];

function PlanUpgradeDialog({
  open,
  customerName,
  onClose,
}: {
  open: boolean;
  customerName: string;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState("Private Cabin");
  const [duration, setDuration] = useState("3 months");
  const [amenities, setAmenities] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  };

  return (
    <div
      className={styles.dialogBackdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-upgrade-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className={styles.dialogHeader}>
          <div className={styles.dialogHeaderMeta}>
            <h2 id="plan-upgrade-title" className={styles.dialogTitle}>
              Plan Upgrade
            </h2>
            <p className={styles.dialogSubtitle}>{customerName}</p>
          </div>
          <button
            type="button"
            className={styles.dialogCloseBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            {Icons.close}
          </button>
        </header>

        {/* Body */}
        <div className={styles.dialogBody}>
          {/* Two-column comparison */}
          <div className={styles.upgradeColumns}>
            {/* Current Plan */}
            <div className={styles.upgradeCurrentCard}>
              <p className={styles.upgradeCurrentLabel}>Current Plan</p>
              <h3 className={styles.upgradeCurrentName}>Hot Desk</h3>
              <p className={styles.upgradeCurrentPrice}>₹ 10,000</p>
              <ul className={styles.upgradeCurrentList}>
                <li className={styles.upgradeCurrentListItem}>
                  <span className={styles.upgradeCheckIcon}>{Icons.checkThin}</span>
                  <span>Shared workspace</span>
                </li>
                <li className={styles.upgradeCurrentListItem}>
                  <span className={styles.upgradeCheckIcon}>{Icons.checkThin}</span>
                  <span>WiFi access</span>
                </li>
                <li className={styles.upgradeCurrentListItem}>
                  <span className={styles.upgradeCheckIcon}>{Icons.checkThin}</span>
                  <span>Coffee/Tea</span>
                </li>
              </ul>
            </div>

            {/* Upgrade form */}
            <div className={styles.upgradeFormCard}>
              <div className={styles.upgradeField}>
                <label className={styles.upgradeFieldLabel} htmlFor="upgrade-plan">
                  Upgrade plan
                </label>
                <div className={styles.upgradeSelectWrap}>
                  <select
                    id="upgrade-plan"
                    className={styles.upgradeSelect}
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                  >
                    {UPGRADE_PLANS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <span className={styles.upgradeSelectChevron} aria-hidden="true">
                    {Icons.chevronDown}
                  </span>
                </div>
              </div>

              <div className={styles.upgradeField}>
                <label className={styles.upgradeFieldLabel} htmlFor="upgrade-duration">
                  Duration
                </label>
                <div className={styles.upgradeSelectWrap}>
                  <select
                    id="upgrade-duration"
                    className={styles.upgradeSelect}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    {UPGRADE_DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <span className={styles.upgradeSelectChevron} aria-hidden="true">
                    {Icons.chevronDown}
                  </span>
                </div>
              </div>

              <div className={styles.upgradeAmenitiesBlock}>
                <p className={styles.upgradeAmenitiesLabel}>Amenities</p>
                <div className={styles.upgradeAmenitiesGrid}>
                  {UPGRADE_AMENITIES.map((a) => {
                    const checked = amenities.has(a);
                    return (
                      <label key={a} className={styles.upgradeAmenityItem}>
                        <input
                          type="checkbox"
                          className={styles.upgradeAmenityCheckbox}
                          checked={checked}
                          onChange={() => toggleAmenity(a)}
                          aria-label={a}
                        />
                        <span className={styles.upgradeAmenityCheckBox}>
                          {checked ? (
                            <span className={styles.upgradeAmenityCheckMark}>
                              {Icons.checkTiny}
                            </span>
                          ) : null}
                        </span>
                        <span className={styles.upgradeAmenityText}>{a}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Cost callout */}
          <div className={styles.upgradeCostCallout}>
            <span className={styles.upgradeCostLabel}>Additional Monthly Cost</span>
            <span className={styles.upgradeCostValue}>+ ₹ 10,000</span>
          </div>

          {/* Benefits */}
          <div className={styles.upgradeBenefits}>
            <h4 className={styles.upgradeBenefitsTitle}>Benefits of Upgrading</h4>
            <ul className={styles.upgradeBenefitsList}>
              <li>• Enhanced workspace amenities</li>
              <li>• Increased productivity and privacy</li>
              <li>• Professional image for clients</li>
              <li>• Priority support and services</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.dialogFooter}>
          <button
            type="button"
            className={styles.upgradeConfirmBtn}
            onClick={() => {
              toast.success("Upgrade request submitted. Invoice will be generated.");
              onClose();
            }}
          >
            Confirm Upgrade &amp; Generate Invoice
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ----- Send Reminder Dialog (Figma node 0:24082) ----- */
const REMINDER_TYPES = [
  "Payment Due Reminder",
  "Invoice Reminder",
  "Membership Renewal",
  "Document Submission",
];
const REMINDER_METHODS = [
  { value: "email", label: "Email", iconKey: "envelope" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

function SendReminderDialog({
  open,
  customerName,
  onClose,
}: {
  open: boolean;
  customerName: string;
  onClose: () => void;
}) {
  const [reminderType, setReminderType] = useState("Payment Due Reminder");
  const [method, setMethod] = useState<string>("email");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.dialogBackdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.reminderDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-reminder-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className={styles.reminderHeader}>
          <h2 id="send-reminder-title" className={styles.reminderTitle}>
            Send Reminder
          </h2>
          <p className={styles.reminderSubtitle}>
            Send a reminder to a client about their deposit
          </p>
          <button
            type="button"
            className={styles.reminderCloseBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            {Icons.close}
          </button>
        </header>

        {/* Body */}
        <div className={styles.reminderBody}>
          {/* Reminder Type */}
          <div className={styles.reminderField}>
            <label className={styles.reminderFieldLabel} htmlFor="reminder-type">
              Reminder Type
            </label>
            <div className={styles.reminderSelectWrap}>
              <select
                id="reminder-type"
                className={styles.reminderSelect}
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value)}
              >
                {REMINDER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className={styles.reminderSelectChevron} aria-hidden="true">
                {Icons.chevronDown}
              </span>
            </div>
          </div>

          {/* Communication Method */}
          <div className={styles.reminderField}>
            <label className={styles.reminderFieldLabel} htmlFor="reminder-method">
              Communication Method
            </label>
            <div className={styles.reminderSelectWrap}>
              <span className={styles.reminderMethodIcon} aria-hidden="true">
                {Icons.envelope}
              </span>
              <select
                id="reminder-method"
                className={`${styles.reminderSelect} ${styles.reminderSelectWithIcon}`}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {REMINDER_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <span className={styles.reminderSelectChevron} aria-hidden="true">
                {Icons.chevronDown}
              </span>
            </div>
          </div>

          {/* Reminder Message */}
          <div className={styles.reminderField}>
            <label className={styles.reminderFieldLabel} htmlFor="reminder-message">
              Reminder Message
            </label>
            <textarea
              id="reminder-message"
              className={styles.reminderTextarea}
              placeholder="Enter reminder message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <p className={styles.reminderHint}>
              Personalize your message or use the default template
            </p>
          </div>

          {/* Info callout */}
          <div className={styles.reminderCallout}>
            <span className={styles.reminderCalloutIcon} aria-hidden="true">
              {Icons.alertCircle}
            </span>
            <div className={styles.reminderCalloutText}>
              <p className={styles.reminderCalloutTitle}>
                Reminder will be sent immediately
              </p>
              <p className={styles.reminderCalloutBody}>
                The client will receive this notification via the selected
                communication method.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.reminderFooter}>
            <button
              type="button"
              className={styles.reminderCancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.reminderSendBtn}
              onClick={() => {
                toast.success(`Reminder sent to ${customerName}`);
                onClose();
              }}
            >
              <span className={styles.reminderSendIcon} aria-hidden="true">
                {Icons.send}
              </span>
              <span>Send Reminder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----- Freeze Account Dialog (Figma node 0:24139) ----- */
const FREEZE_REASONS = [
  "Pending Payment",
  "Contract Dispute",
  "Security Review",
  "Customer Request",
  "Maintenance Hold",
  "Other",
];

function FreezeAccountDialog({
  open,
  customerName,
  onClose,
}: {
  open: boolean;
  customerName: string;
  onClose: () => void;
}) {
  const [account, setAccount] = useState(customerName);
  const [reason, setReason] = useState("Pending Payment");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.dialogBackdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.freezeDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="freeze-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className={styles.freezeHeader}>
          <div className={styles.freezeHeaderMeta}>
            <h2 id="freeze-account-title" className={styles.freezeTitle}>
              Freeze Account
            </h2>
            <p className={styles.freezeSubtitle}>
              Temporarily freeze a security deposit
            </p>
          </div>
          <button
            type="button"
            className={styles.freezeCloseBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            {Icons.close}
          </button>
        </header>

        {/* Body */}
        <div className={styles.freezeBody}>
          {/* Two-column row: Account Name + Freeze Reason */}
          <div className={styles.freezeRow}>
            <div className={styles.freezeFieldHalf}>
              <label className={styles.freezeFieldLabel} htmlFor="freeze-account">
                Account Name
              </label>
              <div className={styles.freezeSelectWrap}>
                <select
                  id="freeze-account"
                  className={styles.freezeSelect}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                >
                  <option value={customerName}>{customerName}</option>
                </select>
                <span className={styles.freezeSelectChevron} aria-hidden="true">
                  {Icons.chevronDown}
                </span>
              </div>
            </div>

            <div className={styles.freezeFieldHalf}>
              <label className={styles.freezeFieldLabel} htmlFor="freeze-reason">
                Freeze Reason
              </label>
              <div className={styles.freezeSelectWrap}>
                <select
                  id="freeze-reason"
                  className={styles.freezeSelect}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {FREEZE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <span className={styles.freezeSelectChevron} aria-hidden="true">
                  {Icons.chevronDown}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className={styles.freezeNotesBlock}>
            <label className={styles.freezeFieldLabel} htmlFor="freeze-notes">
              Additional Notes
            </label>
            <textarea
              id="freeze-notes"
              className={styles.freezeTextarea}
              placeholder="Enter additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <button type="button" className={styles.freezeAddNoteBtn}>
              <span className={styles.freezeAddNoteIcon} aria-hidden="true">
                {Icons.plus}
              </span>
              <span>Add Note</span>
            </button>
          </div>

          {/* Info callout */}
          <div className={styles.freezeCallout}>
            <span className={styles.freezeCalloutIcon} aria-hidden="true">
              {Icons.alertCircle}
            </span>
            <div className={styles.freezeCalloutText}>
              <p className={styles.freezeCalloutTitle}>
                Account will be frozen immediately
              </p>
              <p className={styles.freezeCalloutBody}>
                The client will be notified about the freeze and the reason
                provided.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.freezeFooter}>
          <button
            type="button"
            className={styles.freezeCancelBtn}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.freezeConfirmBtn}
            onClick={() => {
              toast.success("Account freeze request submitted");
              onClose();
            }}
          >
            <span className={styles.freezeConfirmIcon} aria-hidden="true">
              {Icons.send}
            </span>
            <span>Freeze Account</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ----- Renew Membership Dialog ----- */
function RenewMembershipDialog({
  open,
  customerName,
  onClose,
}: {
  open: boolean;
  customerName: string;
  onClose: () => void;
}) {
  const [duration, setDuration] = useState(6);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="renew-membership-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 id="renew-membership-title" className="text-[20px] font-bold text-gray-900 leading-tight">
              Renew Membership
            </h2>
            <p className="text-[13px] text-gray-500 mt-0.5">{customerName}</p>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">
          {/* Current Plan */}
          <div className="bg-[#FFF8F3] border border-[#FFE1CD] rounded-xl p-5 flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-gray-900">Current Plan</span>
            <span className="text-[18px] font-bold text-[#FF6A2F]">Private Office</span>
          </div>

          {/* Renewal Duration */}
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-semibold text-gray-900">Renewal Duration</span>
            <div className="grid grid-cols-3 gap-3">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setDuration(m)}
                  className={`flex flex-col items-center justify-center py-3 rounded-xl border ${
                    duration === m
                      ? "border-[#FF6A2F] bg-[#FFF2EA] text-[#FF6A2F]"
                      : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                  } transition-colors`}
                >
                  <span className="text-[18px] font-bold leading-none mb-1">{m}</span>
                  <span className={`text-[12px] ${duration === m ? "text-gray-600" : "text-gray-500"}`}>months</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary Box */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between items-center px-4 py-3.5 bg-[#F9FAFB] rounded-lg">
              <span className="text-[14px] text-gray-600">Duration</span>
              <span className="text-[14px] font-bold text-gray-900">{duration} months</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3.5 bg-[#F9FAFB] rounded-lg">
              <span className="text-[14px] text-gray-600">Amount</span>
              <span className="text-[14px] font-bold text-gray-900">
                ₹ {(20000 * duration).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-5 border-t border-gray-100 bg-[#F9FAFB]">
          <button
            type="button"
            className="w-full py-2.5 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors shadow-sm"
            onClick={() => {
              toast.success("Renewal invoice generation started");
              onClose();
            }}
          >
            Generate Renewal Invoice
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ----- Renew Contract Dialog ----- */
function RenewContractDialog({
  open,
  contractId,
  onClose,
  onRenew,
}: {
  open: boolean;
  contractId: string;
  onClose: () => void;
  onRenew: (id: string, newEndDate: string) => Promise<void>;
}) {
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!endDate) {
      toast.error("Please select a new end date");
      return;
    }
    await onRenew(contractId, new Date(endDate).toISOString());
  };

  return (
    <div
      className={styles.dialogBackdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="renew-contract-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.dialogHeader}>
          <div className={styles.dialogHeaderMeta}>
            <h2 id="renew-contract-title" className={styles.dialogTitle}>
              Renew Contract
            </h2>
            <p className={styles.dialogSubtitle}>Contract {contractId.slice(0, 8)}</p>
          </div>
          <button
            type="button"
            className={styles.dialogCloseBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            {Icons.close}
          </button>
        </header>

        <div className={styles.dialogBody}>
          <div className={styles.freezeFieldHalf}>
            <label className={styles.freezeFieldLabel} htmlFor="renew-end-date">
              New End Date
            </label>
            <input
              id="renew-end-date"
              type="date"
              className={styles.renewDateInput}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <footer className={styles.dialogFooter}>
          <button
            type="button"
            className="w-full py-2.5 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors shadow-sm"
            onClick={handleSubmit}
          >
            Renew Contract
          </button>
        </footer>
      </div>
    </div>
  );
}
