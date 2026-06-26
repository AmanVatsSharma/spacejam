/**
 * File:        apps/web/src/app/dashboard/crm/leads/page.tsx
 * Module:      Web · Dashboard · CRM · Lead Management
 * Purpose:     Lead management page (Figma: 0-6606). Implements
 *              header card, filters bar, 4 stat cards, lead pipeline,
 *              leads table, and a right-side lead-detail panel.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './leads.module.css';

/* ----------------------------- Types ----------------------------- */

type LeadStatus = 'New' | 'Visited' | 'Negotiation' | 'Converted' | 'Cold';

interface Lead {
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
}

/* ----------------------------- Data ------------------------------ */

const LEADS: Lead[] = [
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
  },
];

/* --------------------------- Helpers ----------------------------- */

const STATUS_PILL_CLASS: Record<LeadStatus, string> = {
  New: styles.pillNew,
  Visited: styles.pillVisited,
  Negotiation: styles.pillNegotiation,
  Converted: styles.pillConverted,
  Cold: styles.pillCold,
};

/* ----------------------------- Icons ----------------------------- */

const Icon = {
  Search: (
    <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Caret: (
    <svg className={styles.selectCaret} viewBox="0 0 10 6" fill="none">
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  PillCaret: (
    <svg className="caret" viewBox="0 0 10 6" fill="none" style={{ width: 9, height: 5 }}>
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Plus: (
    <svg viewBox="0 0 14 14" fill="none">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Calendar: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Note: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 2v6h6M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Edit: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Download: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Check: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Users: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Trend: (
    <svg viewBox="0 0 24 24" fill="none">
      <polyline points="3 17 9 11 13 15 21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 7 21 7 21 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Clock: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Target: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  IndRupee: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M6 3h12M6 8h12M6 13l8 8M6 13h3a5 5 0 0 0 0-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* --------------------------- Component --------------------------- */

export default function LeadsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | string>('all');
  const [sort, setSort] = useState<'Recent' | 'Name' | 'Budget'>('Recent');
  const [selectedId, setSelectedId] = useState<string>('l3');
  const [showAddLead, setShowAddLead] = useState(false);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);
  const [showSendProposal, setShowSendProposal] = useState(false);

  const filtered = useMemo(() => {
    return LEADS.filter((l) => {
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
  }, [search, statusFilter, sourceFilter]);

  const selected = useMemo(
    () => LEADS.find((l) => l.id === selectedId) ?? LEADS[0],
    [selectedId],
  );

  const stats = useMemo(() => {
    const total = LEADS.length;
    const converted = LEADS.filter((l) => l.status === 'Converted').length;
    const conversionRate = total ? Math.round((converted / total) * 100) : 0;
    return [
      { label: 'Total Leads',     value: '128', trend: '+12% this month', icon: Icon.Users },
      { label: 'Active Pipeline', value: '46',  trend: '+8% this week',   icon: Icon.IndRupee },
      { label: 'Conversion Rate', value: `${conversionRate || 28}%`, trend: '+5% vs last month', icon: Icon.Target },
      { label: 'Avg Response',    value: '2.4h', trend: '−18% vs last month', icon: Icon.Clock },
    ];
  }, []);

  const pipeline = [
    { name: 'Inquiry',    count: 32, cls: styles.tileInquiry },
    { name: 'Visited',    count: 18, cls: styles.tileVisited },
    { name: 'Negotiate',  count: 12, cls: styles.tileNegotiate },
    { name: 'Converted',  count: 7,  cls: styles.tileConverted },
    { name: 'Cold',       count: 9,  cls: styles.tileCold },
  ];

  return (
    <div className={styles.shell}>
      {/* --------------------------- Main column --------------------------- */}
      <div className={styles.main}>
        {/* Header card */}
        <div className={styles.headerCard}>
          <h1 className={styles.headerTitle}>Lead Management</h1>
          <p className={styles.headerSub}>
            Manage your leads, track their progress and convert them into customers.
          </p>
        </div>

        {/* Filters bar */}
        <div className={styles.filtersBar}>
          <div className={styles.searchWrap}>
            {Icon.Search}
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filtersRight}>
            <div className={styles.select}>
              <button type="button" className={styles.selectBtn}>
                {statusFilter === 'all' ? 'All Status' : statusFilter}
                {Icon.Caret}
              </button>
            </div>
            <div className={styles.select}>
              <button
                type="button"
                className={styles.selectBtn}
                onClick={() =>
                  setSourceFilter((p) =>
                    p === 'all' ? 'Website' : p === 'Website' ? 'Referral' : p === 'Referral' ? 'Walk-in' : p === 'Walk-in' ? 'Social' : p === 'Social' ? 'Email' : 'all',
                  )
                }
              >
                {sourceFilter === 'all' ? 'All Sources' : sourceFilter}
                {Icon.Caret}
              </button>
            </div>
            <div className={styles.select}>
              <button
                type="button"
                className={styles.selectBtn}
                onClick={() => setSort((p) => (p === 'Recent' ? 'Name' : p === 'Name' ? 'Budget' : 'Recent'))}
              >
                Sort: {sort}
                {Icon.Caret}
              </button>
            </div>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setSourceFilter('all');
              }}
            >
              Clear Filters
            </button>
            <button 
              type="button" 
              className={styles.addLeadBtn}
              onClick={() => setShowAddLead(true)}
            >
              {Icon.Plus} Add Lead
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {stats.map((s) => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statIconWrap}>{s.icon}</div>
              <h3 className={styles.statValue}>{s.value}</h3>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statTrend}>{s.trend}</p>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div className={styles.pipelineCard}>
          <h2 className={styles.pipelineTitle}>Lead Pipeline</h2>
          <div className={styles.pipelineGrid}>
            {pipeline.map((p) => (
              <div key={p.name} className={`${styles.pipelineTile} ${p.cls}`}>
                <h4>{p.name}</h4>
                <p>{p.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leads table */}
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Company</th>
                  <th>Requirement</th>
                  <th>Budget</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    className={l.id === selectedId ? styles.selectedRow : undefined}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className={styles.leadNameCell}>{l.name}</td>
                    <td>{l.company}</td>
                    <td>{l.requirement}</td>
                    <td>{l.budget}</td>
                    <td>{l.source}</td>
                    <td>
                      <span
                        className={`${styles.statusPill} ${STATUS_PILL_CLASS[l.status]}`}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {l.status}
                        {Icon.PillCaret}
                      </span>
                    </td>
                    <td>{l.lastContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ------------------------- Right sidebar --------------------------- */}
      <aside className="w-full xl:w-[320px] flex flex-col gap-6 shrink-0 mt-[160px] xl:mt-0">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-6 flex flex-col">
          <h3 className="text-[18px] font-bold text-gray-900 mb-6">Lead Details</h3>
          
          <div className="flex flex-col gap-5 mb-8">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">LEAD NAME</span>
              <span className="text-[14px] font-semibold text-gray-900">{selected.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">PHONE</span>
              <span className="text-[14px] font-semibold text-gray-900">{selected.phone}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">EMAIL</span>
              <span className="text-[14px] font-semibold text-gray-900">{selected.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">COMPANY</span>
              <span className="text-[14px] font-semibold text-gray-900">{selected.company}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">INTERESTED PLAN</span>
              <span className="text-[14px] font-semibold text-gray-900">{selected.requirement.split('·')[0].trim()}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TEAM SIZE</span>
              <span className="text-[14px] font-semibold text-gray-900">1 Person</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">PREFERRED MOVE-IN DATE</span>
              <span className="text-[14px] font-semibold text-gray-900">15 Mar 2026</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => router.push('/dashboard/crm/leads/' + selected.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M14 2v6h6M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              Lead Details
            </button>
            <button 
              onClick={() => setShowSendProposal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Send Proposal
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-lg text-sm font-semibold hover:bg-[#0891B2] transition-colors shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Convert to Client
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-6">
          <h3 className="text-[18px] font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setShowAddLead(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-500"><svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="1.8"/></svg></span> 
              Add Lead
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="text-gray-500"><svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span> 
              Import Leads
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="text-gray-500"><svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.5" /></svg></span> 
              Manage Sources
            </button>
          </div>
        </div>
      </aside>

      {/* Add New Lead Dialog */}
      <AddNewLeadDialog open={showAddLead} onClose={() => setShowAddLead(false)} />

      {/* Schedule Visit Dialog */}
      <ScheduleVisitDialog open={showScheduleVisit} onClose={() => setShowScheduleVisit(false)} />

      {/* Send Proposal Dialog */}
      <SendProposalDialog open={showSendProposal} onClose={() => setShowSendProposal(false)} />

    </div>
  );
}

/* --------------------------- Add New Lead Dialog --------------------------- */
// ... existing AddNewLeadDialog ...
function AddNewLeadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-[800px] max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Add New Lead</h2>
            <p className="text-[14px] text-gray-500 mt-1">Enter client details to create a new lead.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-8">
          
          {/* Basic Information */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[16px] font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Full Name</label>
                <input type="text" placeholder="Enter full name" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Phone Number</label>
                <input type="text" placeholder="Enter phone number" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Email Address</label>
                <input type="email" placeholder="Enter email address" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Company Name</label>
                <input type="text" placeholder="Enter company name" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
              </div>
            </div>
          </section>

          {/* Lead Details */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[16px] font-semibold text-gray-900">Lead Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Lead Source</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                    <option value="">Select lead source</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Interested Plan</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                    <option value="">Select plan</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Team Size</label>
                <input type="text" placeholder="Enter team size" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Preferred Move-in Date</label>
                <input type="date" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
              </div>
            </div>
          </section>

          {/* Assignment */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[16px] font-semibold text-gray-900">Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Assigned Center Manager</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                    <option value="">Select manager</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Preferred Center</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                    <option value="">Select center</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[16px] font-semibold text-gray-900">Notes</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Additional Information</label>
              <textarea 
                placeholder="Enter any additional notes or requirements..." 
                rows={4}
                className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors resize-none" 
              />
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end items-center gap-3 bg-gray-50/50">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[14px] font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[14px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Save as Draft
          </button>
          <button className="px-5 py-2.5 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors">
            Create Lead
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Schedule Visit Dialog --------------------------- */

function ScheduleVisitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-[20px] font-bold text-gray-900">Schedule Visit</h2>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-5 max-h-[70vh]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Lead Name</label>
            <input type="text" defaultValue="StartupX" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Date</label>
            <input type="text" placeholder="dd/mm/yyyy" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Time Slot</label>
            <input type="text" defaultValue="11:00 AM-12:00 PM" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Center</label>
            <input type="text" defaultValue="Mumbai" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Assigned Staff</label>
            <input type="text" defaultValue="CM Rahul" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Notes</label>
            <textarea 
              placeholder="Add any special notes..." 
              rows={3}
              className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors resize-none" 
            />
          </div>

          <div className="flex items-center gap-2 p-4 bg-[#FFF6F5] border border-[#FFD9D4] rounded-lg text-[#FF4D4F] text-[13px] font-medium mt-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Conflict detected: Another visit is scheduled at this time.
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors">
            Confirm Visit
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Send Proposal Dialog --------------------------- */

function SendProposalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-[600px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-[20px] font-bold text-gray-900">Send Proposal</h2>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6 max-h-[70vh]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Template Selection</label>
            <input type="text" className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-medium text-gray-700">Pricing (₹/month)</label>
              <input type="text" defaultValue="5000" className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-medium text-gray-700">Duration (months)</label>
              <input type="text" defaultValue="6" className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Proposal Notes</label>
            <textarea 
              placeholder="Add any custom notes for this proposal..." 
              rows={4}
              className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all resize-none" 
            />
          </div>

          <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-5 flex flex-col gap-2">
            <span className="text-[12px] font-bold text-gray-500 tracking-wide uppercase">PREVIEW</span>
            <div className="text-[14px] text-gray-600 flex flex-col gap-1 mt-1">
              <p><strong className="font-semibold text-gray-700">Package:</strong> Hot Desk Package</p>
              <p><strong className="font-semibold text-gray-700">Price:</strong> ₹5,000/month</p>
              <p><strong className="font-semibold text-gray-700">Duration:</strong> 6 months</p>
              <p><strong className="font-semibold text-gray-700">Includes:</strong> High-speed WiFi, Meeting room access, Printing credits</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <button className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            Preview PDF
          </button>
          <div className="flex flex-1 gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button className="flex-1 py-3 px-4 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
              </svg>
              Send Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}