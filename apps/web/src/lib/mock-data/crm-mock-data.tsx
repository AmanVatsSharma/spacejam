/**
 * File:        apps/web/src/lib/mock-data/crm-mock-data.ts
 * Module:      Web · Mock Data · CRM
 * Purpose:     Demo/fallback data for the CRM section. All pages in
 *              /dashboard/crm consume these constants when the Apollo
 *              query returns null or an empty array (e.g. backend is
 *              down, auth token is missing, or running in offline mode).
 *
 *              Each export is used as a <source-of-truth> fallback so
 *              the UI never breaks — it simply shows the DEMO_BADGE.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-01
 */

/* ──────────────────────────────────────────────────
 * Demo / Fallback Badge
 * Add this element next to any section title that is
 * backed by mock data so testers and devs can see it
 * at a glance.
 * ────────────────────────────────────────────────── */
export const DEMO_BADGE = (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 ml-2 align-middle">
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    Demo Data
  </span>
);

/* ──────────────────────────────────────────────────
 * Types (mirrors backend Lead type so mock shapes
 * match the real GraphQL response exactly)
 * ────────────────────────────────────────────────── */
export type LeadStatus = 'New' | 'Visited' | 'Negotiation' | 'Converted' | 'Cold';
export type LeadSource = 'Website' | 'Referral' | 'Walk-in' | 'Social' | 'Email';

export interface MockLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  requirement: string;
  budget: string;
  location: string;
  status: LeadStatus;
  lastContact: string;
  /** When the mock is treated as "real" data, this field is undefined */
  __isDemo?: true;
}

/* ──────────────────────────────────────────────────
 * Leads
 * ────────────────────────────────────────────────── */
export const MOCK_LEADS: MockLead[] = [
  {
    id: 'l1',
    name: 'Aarav Mehta',
    email: 'aarav.m@nova.in',
    phone: '+91 98200 11233',
    company: 'Nova Studio',
    source: 'Website',
    requirement: 'Hot Desk · 6 seats',
    budget: '₹85,000 / month',
    location: 'Bandra Kurla Complex',
    status: 'New',
    lastContact: '2 days ago',
    __isDemo: true,
  },
  {
    id: 'l2',
    name: 'Priya Shah',
    email: 'priya@brightloop.io',
    phone: '+91 99675 44321',
    company: 'Brightloop Tech',
    source: 'Referral',
    requirement: 'Private Office · 12 seats',
    budget: '₹2,40,000 / month',
    location: 'Andheri East',
    status: 'Visited',
    lastContact: '1 day ago',
    __isDemo: true,
  },
  {
    id: 'l3',
    name: 'Rohan Kapoor',
    email: 'rohan.k@quanta.dev',
    phone: '+91 90040 56789',
    company: 'Quanta Labs',
    source: 'Walk-in',
    requirement: 'Dedicated Desk · 4 seats',
    budget: '₹48,000 / month',
    location: 'Powai',
    status: 'Negotiation',
    lastContact: '5 hours ago',
    __isDemo: true,
  },
  {
    id: 'l4',
    name: 'Anjali Verma',
    email: 'anjali.v@pixel8.co',
    phone: '+91 99209 87412',
    company: 'Pixel8 Agency',
    source: 'Social',
    requirement: 'Meeting Room · 1 day pass',
    budget: '₹8,500 / day',
    location: 'Lower Parel',
    status: 'Converted',
    lastContact: '3 days ago',
    __isDemo: true,
  },
  {
    id: 'l5',
    name: 'Karan Bhatia',
    email: 'karan@orbitalhq.in',
    phone: '+91 98921 23498',
    company: 'Orbital HQ',
    source: 'Website',
    requirement: 'Enterprise Floor · 30 seats',
    budget: '₹6,50,000 / month',
    location: 'Worli',
    status: 'Cold',
    lastContact: '12 days ago',
    __isDemo: true,
  },
  {
    id: 'l6',
    name: 'Neha Iyer',
    email: 'neha.iyer@cumulus.app',
    phone: '+91 97730 55664',
    company: 'Cumulus App',
    source: 'Email',
    requirement: 'Hot Desk · 3 seats',
    budget: '₹42,000 / month',
    location: 'Malad',
    status: 'New',
    lastContact: 'Today',
    __isDemo: true,
  },
  {
    id: 'l7',
    name: 'Vikram Joshi',
    email: 'vikram@northgate.in',
    phone: '+91 98330 77821',
    company: 'Northgate Capital',
    source: 'Referral',
    requirement: 'Private Office · 8 seats',
    budget: '₹1,60,000 / month',
    location: 'Goregaon',
    status: 'Visited',
    lastContact: 'Yesterday',
    __isDemo: true,
  },
];

/* ──────────────────────────────────────────────────
 * Lead stats (pre-aggregated from MOCK_LEADS)
 * ────────────────────────────────────────────────── */
export const MOCK_LEAD_STATS = {
  total: 128,
  activePipeline: 46,
  conversionRate: 28, // %
  avgResponseHours: 2.4,
};

/* ──────────────────────────────────────────────────
 * Pipeline breakdown (hardcoded from design)
 * ────────────────────────────────────────────────── */
export const MOCK_PIPELINE = [
  { name: 'Inquiry',   count: 32 },
  { name: 'Visited',   count: 18 },
  { name: 'Negotiate', count: 12 },
  { name: 'Converted', count: 7  },
  { name: 'Cold',      count: 9  },
] as const;

/* ──────────────────────────────────────────────────
 * Customers (demo data for /dashboard/crm/customers)
 * ────────────────────────────────────────────────── */
export interface MockCustomer {
  id: string;
  name: string;
  teamSize: string;
  location: string;
  joinDate: string;
  billing: 'Paid' | 'Pending' | 'Overdue';
  lastInvoice: string;
  status: 'Upgrade' | 'Send Notice' | 'Send Invoice';
  __isDemo?: true;
}

export const MOCK_CUSTOMERS: MockCustomer[] = [
  { id: '1', name: 'Technova solution', teamSize: '25 seats', location: 'Ch-Hub', joinDate: 'Jan 15, 2025', billing: 'Paid',  lastInvoice: '12 Mar', status: 'Upgrade',     __isDemo: true },
  { id: '2', name: 'StartupX',          teamSize: '8 seats',  location: 'Jalandhar', joinDate: 'Jan 15, 2024', billing: 'Paid',  lastInvoice: '10 Mar', status: 'Send Notice', __isDemo: true },
  { id: '3', name: 'Ankit',             teamSize: '3 seats',  location: 'Ch-Hub', joinDate: 'Jun 15, 2025', billing: 'Paid',  lastInvoice: '9 Mar',  status: 'Send Invoice',__isDemo: true },
  { id: '4', name: 'TechCorp',          teamSize: '2 seats',  location: 'Ch-Hub', joinDate: 'Jul 15, 2026', billing: 'Overdue',lastInvoice: '8 Mar',  status: 'Send Notice', __isDemo: true },
  { id: '5', name: 'Priya Singh',       teamSize: '5 seats',  location: 'Jalandhar',joinDate: 'Jan 15, 2026', billing: 'Paid',  lastInvoice: '7 Mar',  status: 'Upgrade',     __isDemo: true },
  { id: '6', name: 'Priya Singh',       teamSize: '3 seats',  location: 'Ch-Hub', joinDate: 'Jan 15, 2024', billing: 'Paid',  lastInvoice: '7 Mar',  status: 'Upgrade',     __isDemo: true },
  { id: '7', name: 'Priya Singh',       teamSize: '8 seats',  location: 'Ch-Hub', joinDate: 'Aug 15, 2024', billing: 'Pending',lastInvoice: '7 Mar',  status: 'Send Notice', __isDemo: true },
  { id: '8', name: 'Priya Singh',       teamSize: '9 seats',  location: 'Ch-Hub', joinDate: 'Jan 15, 2024', billing: 'Paid',  lastInvoice: '7 Mar',  status: 'Upgrade',     __isDemo: true },
];

/* ──────────────────────────────────────────────────
 * Onboarding list (demo data for onboarding wizard)
 * ────────────────────────────────────────────────── */
export interface MockOnboardingItem {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  plan: string;
  seats: number;
  startDate: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  center: string;
  __isDemo?: true;
}

export const MOCK_ONBOARDING_ITEMS: MockOnboardingItem[] = [
  { id: 'on1', company: 'Nova Studio',     contact: 'Aarav Mehta',     email: 'aarav.m@nova.in',      phone: '+91 98200 11233', plan: 'Hot Desk',   seats: 6,  startDate: '2026-03-15', status: 'In Progress', center: 'Bandra',     __isDemo: true },
  { id: 'on2', company: 'Brightloop Tech', contact: 'Priya Shah',      email: 'priya@brightloop.io',  phone: '+91 99675 44321', plan: 'Private Office', seats: 12, startDate: '2026-02-20', status: 'Completed',  center: 'Andheri',    __isDemo: true },
  { id: 'on3', company: 'Quanta Labs',     contact: 'Rohan Kapoor',    email: 'rohan.k@quanta.dev',   phone: '+91 90040 56789', plan: 'Dedicated Desk', seats: 4,  startDate: '2026-03-01', status: 'Pending',    center: 'Powai',      __isDemo: true },
  { id: 'on4', company: 'Pixel8 Agency',   contact: 'Anjali Verma',    email: 'anjali.v@pixel8.co',   phone: '+91 99209 87412', plan: 'Meeting Room',   seats: 1,  startDate: '2026-01-10', status: 'Completed',  center: 'Lower Parel',__isDemo: true },
  { id: 'on5', company: 'Cumulus App',     contact: 'Neha Iyer',       email: 'neha.iyer@cumulus.app',phone: '+91 97730 55664', plan: 'Hot Desk',   seats: 3,  startDate: '2026-03-20', status: 'In Progress', center: 'Malad',      __isDemo: true },
];

/* ──────────────────────────────────────────────────
 * Utility helpers
 * ────────────────────────────────────────────────── */

/**
 * Returns the mock data decorated with __isDemo = true so callers
 * can pass these through `useMemo(() => data ?? MOCK_LEADS, [data])`
 * and render the badge when `data` was null.
 */
export function getDemoLeads(): MockLead[] {
  return MOCK_LEADS.map((l) => ({ ...l, __isDemo: true }));
}

export function getDemoCustomers(): MockCustomer[] {
  return MOCK_CUSTOMERS.map((c) => ({ ...c, __isDemo: true }));
}

export function getDemoOnboardingItems(): MockOnboardingItem[] {
  return MOCK_ONBOARDING_ITEMS.map((o) => ({ ...o, __isDemo: true }));
}
