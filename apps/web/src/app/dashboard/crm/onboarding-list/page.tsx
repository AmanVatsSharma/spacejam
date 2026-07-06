"use client";
/**
 * File:        apps/web/src/app/dashboard/crm/onboarding/page.tsx
 * Module:      Web · Dashboard · CRM · Onboarding
 * Purpose:     Onboarding hub. Mirrors the Figma "Onboarding" tab
 *              (node 0-25984 / 0-25985) exactly. The pill switcher
 *              (Customers · Leads · Onboarding) and the main sidebar
 *              live in the shared `dashboard/layout.tsx` chrome; this
 *              page renders only the page body so it stays consistent
 *              across the CRM section.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-26
 */


import { useState } from 'react';
import styles from './onboarding.module.css';

/* ----------------------------- Types ----------------------------- */

type OnboardingStatus =
  | 'New'
  | 'Visit Scheduled'
  | 'Visit Complete'
  | 'Negotiation'
  | 'Agreement Sent';

interface OnboardingLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  requirement: string;
  location: string;
  source: string;
  status: OnboardingStatus;
  lastActivity: string;
  assignedTo: string;
  avatar?: string;
}

/* ----------------------------- Data ------------------------------ */

const ONBOARDING_LEADS: OnboardingLead[] = [
  {
    id: 'o1',
    name: 'Aarav Patel',
    email: 'aarav.p@nextera.in',
    phone: '+91 98200 11233',
    company: 'Nextera Solutions',
    requirement: 'Private Office · 8 seats',
    location: 'Bandra Kurla Complex',
    source: 'Website',
    status: 'New',
    lastActivity: '2 hours ago',
    assignedTo: 'Rahul',
    avatar: 'https://i.pravatar.cc/64?img=11',
  },
  {
    id: 'o2',
    name: 'Sneha Kapoor',
    email: 'sneha.k@brightloop.io',
    phone: '+91 99675 44321',
    company: 'Brightloop Tech',
    requirement: 'Dedicated Desk · 4 seats',
    location: 'Andheri East',
    source: 'Referral',
    status: 'Visit Scheduled',
    lastActivity: '1 day ago',
    assignedTo: 'Priya',
    avatar: 'https://i.pravatar.cc/64?img=47',
  },
  {
    id: 'o3',
    name: 'Rohan Mehta',
    email: 'rohan.m@quanta.dev',
    phone: '+91 90040 56789',
    company: 'Quanta Labs',
    requirement: 'Hot Desk · 12 seats',
    location: 'Powai',
    source: 'Walk-in',
    status: 'Visit Complete',
    lastActivity: '3 days ago',
    assignedTo: 'Rahul',
    avatar: 'https://i.pravatar.cc/64?img=15',
  },
  {
    id: 'o4',
    name: 'Anjali Shah',
    email: 'anjali.s@pixel8.co',
    phone: '+91 99209 87412',
    company: 'Pixel8 Agency',
    requirement: 'Meeting Room · 2 day pass',
    location: 'Lower Parel',
    source: 'Social',
    status: 'Negotiation',
    lastActivity: '5 hours ago',
    assignedTo: 'Priya',
    avatar: 'https://i.pravatar.cc/64?img=48',
  },
  {
    id: 'o5',
    name: 'Vikram Joshi',
    email: 'vikram.j@northgate.in',
    phone: '+91 98330 77821',
    company: 'Northgate Capital',
    requirement: 'Enterprise Floor · 25 seats',
    location: 'Worli',
    source: 'Referral',
    status: 'Agreement Sent',
    lastActivity: '1 day ago',
    assignedTo: 'Rahul',
    avatar: 'https://i.pravatar.cc/64?img=12',
  },
  {
    id: 'o6',
    name: 'Meera Reddy',
    email: 'meera.r@orbitstudio.in',
    phone: '+91 97730 55664',
    company: 'Orbit Studio',
    requirement: 'Hot Desk · 3 seats',
    location: 'Malad',
    source: 'Email',
    status: 'New',
    lastActivity: 'Today',
    assignedTo: 'Priya',
    avatar: 'https://i.pravatar.cc/64?img=44',
  },
  {
    id: 'o7',
    name: 'Aditya Singh',
    email: 'aditya.s@cloudbase.io',
    phone: '+91 98110 33445',
    company: 'CloudBase Solutions',
    requirement: 'Private Office · 6 seats',
    location: 'Goregaon',
    source: 'Website',
    status: 'Visit Scheduled',
    lastActivity: '2 days ago',
    assignedTo: 'Rahul',
    avatar: 'https://i.pravatar.cc/64?img=13',
  },
  {
    id: 'o8',
    name: 'Kavya Nair',
    email: 'kavya.n@driftworks.in',
    phone: '+91 99441 22331',
    company: 'Driftworks Studio',
    requirement: 'Dedicated Desk · 2 seats',
    location: 'Juhu',
    source: 'Walk-in',
    status: 'Visit Complete',
    lastActivity: '4 days ago',
    assignedTo: 'Priya',
    avatar: 'https://i.pravatar.cc/64?img=49',
  },
];

/* --------------------------- Helpers ----------------------------- */

const STATUS_PILL_CLASS: Record<OnboardingStatus, string> = {
  New: styles.pillNew,
  'Visit Scheduled': styles.pillVisitScheduled,
  'Visit Complete': styles.pillVisitComplete,
  Negotiation: styles.pillNegotiation,
  'Agreement Sent': styles.pillAgreement,
};

/* ----------------------------- Icons ----------------------------- */

const Icon = {
  Users: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Clock: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  CheckCircle: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  FileText: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Calendar: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Phone: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Mail: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <polyline points="3 7 12 13 21 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Eye: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  Edit: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  MoreHorizontal: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
};

/* --------------------------- Component --------------------------- */

export default function OnboardingPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OnboardingStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | string>('all');

  const stats = [
    {
      label: 'Total Onboarding',
      value: ONBOARDING_LEADS.length,
      trend: '+3 this week',
      icon: Icon.Users,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: 'Visits Scheduled',
      value: ONBOARDING_LEADS.filter((l) => l.status === 'Visit Scheduled').length,
      trend: '+2 this week',
      icon: Icon.Calendar,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Visits Complete',
      value: ONBOARDING_LEADS.filter((l) => l.status === 'Visit Complete').length,
      trend: '+1 this week',
      icon: Icon.CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Agreements Sent',
      value: ONBOARDING_LEADS.filter((l) => l.status === 'Agreement Sent').length,
      trend: '+1 this week',
      icon: Icon.FileText,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
    },
  ];

  const filtered = ONBOARDING_LEADS.filter((l) => {
    const q = search.trim().toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || l.source === sourceFilter;
    return matchesQuery && matchesStatus && matchesSource;
  });

  return (
    <div className={styles.shell}>
      {/* Stats */}
      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={`${styles.statIconWrap} ${s.iconBg} ${s.iconColor}`}>
              {s.icon}
            </div>
            <h3 className={styles.statValue}>{s.value}</h3>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statTrend}>{s.trend}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        {/* Table header / filters */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-48 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() =>
              setStatusFilter((p) =>
                p === 'all'
                  ? 'New'
                  : p === 'New'
                  ? 'Visit Scheduled'
                  : p === 'Visit Scheduled'
                  ? 'Visit Complete'
                  : p === 'Visit Complete'
                  ? 'Negotiation'
                  : p === 'Negotiation'
                  ? 'Agreement Sent'
                  : 'all',
              )
            }
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {statusFilter === 'all' ? 'All Status' : statusFilter}
          </button>
          <button
            type="button"
            onClick={() =>
              setSourceFilter((p) =>
                p === 'all' ? 'Website' : p === 'Website' ? 'Referral' : p === 'Referral' ? 'Walk-in' : p === 'Walk-in' ? 'Social' : p === 'Social' ? 'Email' : 'all',
              )
            }
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {sourceFilter === 'all' ? 'All Sources' : sourceFilter}
          </button>
          {(search || statusFilter !== 'all' || sourceFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setSourceFilter('all');
              }}
              className="h-8 px-3 text-xs font-medium text-gray-500 hover:text-orange-500 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Company</th>
                <th>Requirement</th>
                <th>Location</th>
                <th>Source</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Last Activity</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                    No onboarding leads found
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className={styles.avatarCell}>
                        <div className={styles.avatar}>
                          {lead.avatar ? (
                            <img src={lead.avatar} alt={lead.name} />
                          ) : (
                            lead.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className={styles.leadNameCell}>{lead.name}</p>
                          <p className="text-xs text-gray-400">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{lead.company}</td>
                    <td>{lead.requirement}</td>
                    <td>{lead.location}</td>
                    <td>{lead.source}</td>
                    <td>{lead.assignedTo}</td>
                    <td>
                      <span className={`${styles.statusPill} ${STATUS_PILL_CLASS[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>{lead.lastActivity}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button type="button" className={styles.actionBtn} title="Call">
                          {Icon.Phone}
                        </button>
                        <button type="button" className={styles.actionBtn} title="Email">
                          {Icon.Mail}
                        </button>
                        <button type="button" className={styles.actionBtn} title="View">
                          {Icon.Eye}
                        </button>
                        <button type="button" className={styles.actionBtn} title="Edit">
                          {Icon.Edit}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
