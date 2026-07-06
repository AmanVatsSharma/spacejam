"use client";
/**
 * File:        apps/web/src/app/dashboard/crm/leads/page.tsx
 * Module:      Web · Dashboard · CRM · Lead Management
 * Purpose:     Lead management page (Figma: 0-6606). Implements
 *              header card, filters bar, 4 stat cards, lead pipeline,
 *              leads table, and a right-side lead-detail panel.
 *              Apollo-first with mock-data fallback + Demo badge.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-01
 */


import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_LEADS,
  CREATE_LEAD,
  UPDATE_LEAD,
  CONVERT_LEAD,
  DELETE_LEAD,
  LEAD_COUNT,
} from '@/lib/apollo/operations';
import { MOCK_LEADS, MOCK_LEAD_STATS, DEMO_BADGE, type MockLead } from '@/lib/mock-data/crm-mock-data';
import {
  AddLeadModal,
  ScheduleVisitModal,
  SendProposalModal,
} from '@/components/ui/dashboard';
import styles from './leads.module.css';

/* ----------------------------- Types ----------------------------- */

type LeadStatus = 'New' | 'Visited' | 'Negotiation' | 'Converted' | 'Cold';

interface Lead extends MockLead { }

/* --------------------------- GraphQL Data --------------------------- */

interface GetLeadsData {
  leads: Lead[];
}

interface GetLeadsVars {
  filters?: {
    status?: LeadStatus;
    source?: string;
    search?: string;
    limit?: number;
    offset?: number;
  };
}

/* ──────────────────────────────────────────────────
 * Helper: resolve leads — Apollo data with mock fallback
 * ────────────────────────────────────────────────── */
function useLeads() {
  const { data, loading, error } = useQuery<GetLeadsData, GetLeadsVars>(GET_LEADS);
  const leads = data?.leads?.length ? data.leads : MOCK_LEADS;
  const isDemo = !!error;
  return { leads, loading, error, isDemo };
}

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

  /* ── Apollo data ── */
  const { leads, loading, isDemo } = useLeads();

  /* ── Mutations ── */
  const [createLead] = useMutation(CREATE_LEAD, {
    refetchQueries: [{ query: GET_LEADS }],
  });
  const [updateLead] = useMutation(UPDATE_LEAD, {
    refetchQueries: [{ query: GET_LEADS }],
  });
  const [deleteLead] = useMutation(DELETE_LEAD, {
    refetchQueries: [{ query: GET_LEADS }],
  });
  const [convertLead] = useMutation(CONVERT_LEAD, {
    refetchQueries: [{ query: GET_LEADS }],
  });

  /* ── Lead counts for pipeline stats ── */
  const { data: newCountData } = useQuery(LEAD_COUNT, {
    variables: { status: 'New' },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const { data: visitedCountData } = useQuery(LEAD_COUNT, {
    variables: { status: 'Visited' },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const { data: negotiationCountData } = useQuery(LEAD_COUNT, {
    variables: { status: 'Negotiation' },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const { data: convertedCountData } = useQuery(LEAD_COUNT, {
    variables: { status: 'Converted' },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const { data: coldCountData } = useQuery(LEAD_COUNT, {
    variables: { status: 'Cold' },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const handleDeleteLead = useCallback(
    async (leadId: string) => {
      if (isDemo) {
        alert('Delete is disabled in demo mode. Connect the backend first.');
        return;
      }
      if (!confirm('Delete this lead?')) return;
      try {
        await deleteLead({ variables: { id: leadId } });
      } catch {
        // handled by Apollo
      }
    },
    [deleteLead, isDemo],
  );

  const handleUpdateLeadStatus = useCallback(
    async (leadId: string, status: string) => {
      if (isDemo) {
        alert('Status update is disabled in demo mode. Connect the backend first.');
        return;
      }
      try {
        await updateLead({ variables: { id: leadId, input: { status } } });
      } catch {
        // handled by Apollo
      }
    },
    [updateLead, isDemo],
  );

  /* ── Handlers ── */
  const handleConvertToClient = useCallback(
    async (leadId: string) => {
      if (isDemo) {
        alert('Convert to Client is disabled in demo mode. Connect the backend first.');
        return;
      }
      try {
        await convertLead({ variables: { id: leadId } });
      } catch {
        // error handled by Apollo
      }
    },
    [convertLead, isDemo],
  );

  const handleAddLead = useCallback(
    async (input: Record<string, string>) => {
      if (isDemo) {
        alert('Add Lead is disabled in demo mode. Connect the backend first.');
        setShowAddLead(false);
        return;
      }
      try {
        await createLead({ variables: { input } });
        setShowAddLead(false);
      } catch {
        // error handled by Apollo
      }
    },
    [createLead, isDemo],
  );

  /* ── Filtered leads ── */
  const filtered = useMemo(() => {
    return leads.filter((l) => {
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
  }, [leads, search, statusFilter, sourceFilter]);

  /* ── Selected lead ── */
  const selected = useMemo(
    () => filtered.find((l) => l.id === selectedId) ?? filtered[0],
    [filtered, selectedId],
  );

  /* ── Stats ── */
  const stats = useMemo(() => {
    const converted = leads.filter((l) => l.status === 'Converted').length;
    const conversionRate = leads.length
      ? Math.round((converted / leads.length) * 100)
      : MOCK_LEAD_STATS.conversionRate;
    return [
      { label: 'Total Leads', value: String(leads.length || MOCK_LEAD_STATS.total), trend: '+12% this month', icon: Icon.Users },
      { label: 'Active Pipeline', value: String(MOCK_LEAD_STATS.activePipeline), trend: '+8% this week', icon: Icon.IndRupee },
      { label: 'Conversion Rate', value: `${conversionRate}%`, trend: '+5% vs last month', icon: Icon.Target },
      { label: 'Avg Response', value: `${MOCK_LEAD_STATS.avgResponseHours}h`, trend: '−18% vs last month', icon: Icon.Clock },
    ];
  }, [leads]);

  const pipeline = [
    { name: 'Inquiry', count: newCountData?.leadCount ?? 0, cls: styles.tileInquiry },
    { name: 'Visited', count: visitedCountData?.leadCount ?? 0, cls: styles.tileVisited },
    { name: 'Negotiate', count: negotiationCountData?.leadCount ?? 0, cls: styles.tileNegotiate },
    { name: 'Converted', count: convertedCountData?.leadCount ?? 0, cls: styles.tileConverted },
    { name: 'Cold', count: coldCountData?.leadCount ?? 0, cls: styles.tileCold },
  ];

  return (
    <div className={styles.shell}>
      {/* --------------------------- Main column --------------------------- */}
      <div className={styles.main}>
        {/* Header card */}
        <div className={styles.headerCard}>
          <div className="flex items-center gap-2">
            <h1 className={styles.headerTitle}>Lead Management</h1>
            {isDemo && DEMO_BADGE}
            {loading && (
              <span className="ml-2 inline-block h-4 w-4 rounded-full border-2 border-[#FF6A2F] border-t-transparent animate-spin" />
            )}
          </div>
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
                    p === 'all'
                      ? 'Website'
                      : p === 'Website'
                        ? 'Referral'
                        : p === 'Referral'
                          ? 'Walk-in'
                          : p === 'Walk-in'
                            ? 'Social'
                            : p === 'Social'
                              ? 'Email'
                              : 'all',
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
                onClick={() =>
                  setSort((p) =>
                    p === 'Recent' ? 'Name' : p === 'Name' ? 'Budget' : 'Recent',
                  )
                }
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
                {loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      Loading leads…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
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
                          className={`${styles.statusPill} ${STATUS_PILL_CLASS[l.status as LeadStatus] ?? ''}`}
                        >
                          {l.status}
                          {Icon.PillCaret}
                        </span>
                      </td>
                      <td>{l.lastContact}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ------------------------- Right sidebar --------------------------- */}
      {selected && (
        <aside className="w-full xl:w-[320px] flex flex-col gap-6 shrink-0 mt-[160px] xl:mt-0">
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-6 flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-[18px] font-bold text-gray-900">Lead Details</h3>
              {selected.__isDemo && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Demo
                </span>
              )}
            </div>

            <div className="flex flex-col gap-5 mb-8">
              {[
                { label: 'LEAD NAME', value: selected.name },
                { label: 'PHONE', value: selected.phone },
                { label: 'EMAIL', value: selected.email },
                { label: 'COMPANY', value: selected.company },
                {
                  label: 'INTERESTED PLAN',
                  value: selected.requirement.split('·')[0].trim(),
                },
                { label: 'TEAM SIZE', value: '1 Person' },
                { label: 'PREFERRED MOVE-IN DATE', value: '15 Mar 2026' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {label}
                  </span>
                  <span className="text-[14px] font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/dashboard/crm/leads/' + selected.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-colors shadow-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M14 2v6h6M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Lead Details
              </button>
              <button
                onClick={() => setShowSendProposal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Send Proposal
              </button>
              <button
                onClick={() => handleConvertToClient(selected.id)}
                disabled={isDemo}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-lg text-sm font-semibold hover:bg-[#0891B2] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path
                    d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Convert to Client
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-6">
            <h3 className="text-[18px] font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: 'Add Lead',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  ),
                  onClick: () => setShowAddLead(true),
                },
                {
                  label: 'Import Leads',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  onClick: () => { },
                },
                {
                  label: 'Manage Sources',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ),
                  onClick: () => { },
                },
              ].map(({ label, icon, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-500">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}

      {/* Dialogs */}
      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} onAdd={handleAddLead} />
      <ScheduleVisitModal open={showScheduleVisit} onClose={() => setShowScheduleVisit(false)} />
      <SendProposalModal open={showSendProposal} onClose={() => setShowSendProposal(false)} />
    </div>
  );
}