"use client";



import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import {
  GET_DASHBOARD_METRICS,
  GET_LEADS,
  GET_CUSTOMERS,
} from "@/lib/apollo/operations";
import { normalizeStatus } from "@/lib/revenue-status";
import { ExportExcelModal } from "@/components/ui/dashboard/export-excel-modal";
import styles from "./occupancy.module.css";

const Icons = {
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  download: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  checkCircle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  logOut: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
  pause: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16"></rect>
      <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  trendingUp: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  trendingDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
      <polyline points="17 18 23 18 23 12"></polyline>
    </svg>
  ),
  moreVertical: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="12" cy="5" r="1"></circle>
      <circle cx="12" cy="19" r="1"></circle>
    </svg>
  )
};

export default function OccupancyOverviewPage() {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  // Live dashboard metrics for occupancy data
  const { data: metricsData } = useQuery(GET_DASHBOARD_METRICS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Live leads for inquiry/converted counts
  const { data: leadsData } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Live customers for the directory table
  const { data: customersData } = useQuery(GET_CUSTOMERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const metrics = metricsData?.dashboardMetrics;
  const leads = leadsData?.leads ?? [];
  const customers = customersData?.customers ?? [];

  // Compute occupancy metrics from live data
  const occMetrics = useMemo(() => {
    const newInquiries = leads.filter((l: any) => normalizeStatus(l.status) === "NEW").length;
    const converted = leads.filter((l: any) => normalizeStatus(l.status) === "CONVERTED").length;
    const occupancyRate = metrics ? Math.round(metrics.occupancyRate * 100) : 0;
    const totalSeats = metrics?.totalSeats ?? 0;
    const availableSeats = metrics?.availableSeats ?? 0;
    const occupiedSeats = totalSeats - availableSeats;
    return { newInquiries, converted, occupancyRate, totalSeats, occupiedSeats, availableSeats };
  }, [leads, metrics]);

  // Map normalized customer status to existing CSS badge classes
  const customerStatusClass = (raw: string): string => {
    switch (normalizeStatus(raw)) {
      case 'ACTIVE':
        return styles.statusActive;
      case 'HOLD':
      case 'ON_HOLD':
      case 'PAUSED':
        return styles.statusHold;
      case 'INACTIVE':
      case 'EXITED':
      case 'CHURNED':
        return styles.statusExited;
      default:
        return styles.statusActive;
    }
  };
  const customerStatusLabel = (raw: string): string => {
    const s = normalizeStatus(raw);
    if (s === 'ACTIVE') return 'Active';
    if (s === 'HOLD' || s === 'ON_HOLD' || s === 'PAUSED') return 'Hold';
    if (s === 'INACTIVE' || s === 'EXITED' || s === 'CHURNED') return 'Exited';
    return raw || '—';
  };

  const formatDate = (value?: string | null): string => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className={styles.page}>

      {/* HEADER CARD */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Occupancy Overview</h1>
          <p className={styles.headerSubtitle}>Track occupancy trends, client movement, exits, and active utilization across all centers.</p>
        </div>
        <button
          onClick={() => setShowExport(true)}
          className={`${styles.exportBtn} active:scale-[0.97] transition-transform duration-150`}
        >
          {Icons.download} Export Excel
        </button>
      </div>

      {/* FILTER CARD */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <span className="text-gray-400">{Icons.search}</span>
          <input type="text" placeholder="Search lead name, company, or phone" />
        </div>
        <div className={styles.dropdowns}>
          <button className={`${styles.dropdown} active:scale-[0.97] transition-transform duration-150`}>All center <span className={styles.dropdownCaret}></span></button>
          <button className={`${styles.dropdown} active:scale-[0.97] transition-transform duration-150`}>Last 30 days <span className={styles.dropdownCaret}></span></button>
          <button className={`${styles.dropdown} active:scale-[0.97] transition-transform duration-150`}>CM All <span className={styles.dropdownCaret}></span></button>
          <button className={`${styles.clearAllBtn} active:scale-[0.97] transition-transform duration-150`}>Clear All</button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className={styles.metricsRow}>

        <div className={`${styles.metricCard} ${styles.animateFadeIn}`} style={{ '--i': 0 } as React.CSSProperties}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.users}
          </div>
          <span className={styles.metricLabel}>New inquiries</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{occMetrics.newInquiries}</span>
            <span className={styles.metricTrend}>{Icons.trendingUp} {occMetrics.occupancyRate}%</span>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.animateFadeIn}`} style={{ '--i': 1 } as React.CSSProperties}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.checkCircle}
          </div>
          <span className={styles.metricLabel}>Converted</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{occMetrics.converted}</span>
            <span className={styles.metricTrend}>{Icons.trendingUp} {occMetrics.occupancyRate}%</span>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.animateFadeIn}`} style={{ '--i': 2 } as React.CSSProperties}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.logOut}
          </div>
          <span className={styles.metricLabel}>Members Exited</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{occMetrics.occupiedSeats}</span>
            <span className={styles.metricTrend}>{Icons.trendingDown} {100 - occMetrics.occupancyRate}%</span>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.animateFadeIn}`} style={{ '--i': 3 } as React.CSSProperties}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.pause}
          </div>
          <span className={styles.metricLabel}>Accounts Paused/Hold</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{occMetrics.availableSeats}</span>
            <span className={styles.metricTrend}>{Icons.trendingUp} {occMetrics.occupancyRate}%</span>
          </div>
        </div>

      </div>

      {/* AREA CHART */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div className={styles.chartTitleWrap}>
            <h3 className={styles.chartTitle}>Occupancy Trend</h3>
            <p className={styles.chartSubtitle}>Center-wise occupancy utilization comparison</p>
          </div>
          <div className={styles.chartBadges}>
            <span className={`${styles.chartBadge} ${styles.badgeOutline}`}>Select Center <span className={styles.dropdownCaret} style={{ marginLeft: '4px', borderColor: '#FF7847' }}></span></span>
            <span className={`${styles.chartBadge} ${styles.badgeBg}`}>This Month {Icons.calendar}</span>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: '13px' }}>
            Select a center to view occupancy trend data
          </div>
        </div>
      </div>

      {/* DIRECTORY HEADER */}
      <div className={`${styles.directoryHeaderCard} transition-all duration-200 hover:shadow-md`}>
        <div className={styles.headerTitleWrap}>
          <h3 className={styles.headerTitle} style={{ fontSize: '18px' }}>Customer Directory</h3>
          <p className={styles.headerSubtitle}>Track all active occupancy allocations</p>
        </div>
        <div className={styles.directorySearchBox}>
          <span className="text-gray-400">{Icons.search}</span>
          <input type="text" placeholder="Search customers..." />
        </div>
      </div>

      {/* LIST TABLE */}
      <div className={`${styles.listCard} transition-all duration-200 hover:shadow-md`}>

        <div className={styles.tableHeader}>
          <div className={styles.checkbox}></div>
          <span>NAME</span>
          <span>AMOUNT</span>
          <span>PLAN</span>
          <span>CENTER</span>
          <span>PAY-MODE</span>
          <span>STATUS</span>
          <span>MOVE IN DATE</span>
          <span>END DATE</span>
          <span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>

        {customers.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
            No customers found
          </div>
        ) : (
          customers.map((c: any, index: number) => (
            <div key={c.id} className={`${styles.listRow} ${styles.animateFadeIn}`} style={{ '--i': index } as React.CSSProperties}>
              <div className={styles.checkbox}></div>
              <div className={styles.cellUser}>{c.name || '—'}</div>
              <span className={styles.cellAmount}>{c.totalSpent != null ? `₹${Number(c.totalSpent).toLocaleString('en-IN')}` : '—'}</span>
              <span className={styles.cellText}>{c.teamSize != null ? `${c.teamSize} seats` : '—'}</span>
              <span className={styles.cellText}>{c.location || c.company || '—'}</span>
              <span className={styles.cellText}>{c.phone || '—'}</span>
              <div className={styles.cellStatus}>
                <span className={`${styles.statusBadge} ${customerStatusClass(c.status)}`}>{customerStatusLabel(c.status)}</span>
              </div>
              <span className={styles.cellText}>{formatDate(c.joinDate)}</span>
              <span className={styles.cellText}>{formatDate(c.lastBooking)}</span>
              <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}>
                {Icons.moreVertical}
                {openMenuId === c.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setOpenMenuId(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                      <div
                        className="px-4 py-2 text-sm text-[#101828] hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setOpenMenuId(null); router.push(`/dashboard/crm/leads/${c.id}`); }}
                      >
                        View Lead
                      </div>
                      <div
                        className="px-4 py-2 text-sm text-[#101828] hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setOpenMenuId(null); router.push(`/dashboard/crm/customers/${c.id}`); }}
                      >
                        View Customer
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}

      </div>

      <ExportExcelModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
