"use client";


export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_OCCUPANCY_REPORT,
  GET_DASHBOARD_METRICS,
  LEAD_COUNT,
  GET_LEADS,
} from "@/lib/apollo/operations";
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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
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

  const metrics = metricsData?.dashboardMetrics;
  const leads = leadsData?.leads ?? [];

  // Compute occupancy metrics from live data
  const occMetrics = useMemo(() => {
    const newInquiries = leads.filter((l: any) => l.status === "New").length;
    const converted = leads.filter((l: any) => l.status === "Converted").length;
    const occupancyRate = metrics ? Math.round(metrics.occupancyRate * 100) : 0;
    const totalSeats = metrics?.totalSeats ?? 0;
    const availableSeats = metrics?.availableSeats ?? 0;
    const occupiedSeats = totalSeats - availableSeats;
    return { newInquiries, converted, occupancyRate, totalSeats, occupiedSeats, availableSeats };
  }, [leads, metrics]);

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
          className={styles.exportBtn}
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
          <button className={styles.dropdown}>All center <span className={styles.dropdownCaret}></span></button>
          <button className={styles.dropdown}>Last 30 days <span className={styles.dropdownCaret}></span></button>
          <button className={styles.dropdown}>CM All <span className={styles.dropdownCaret}></span></button>
          <button className={styles.clearAllBtn}>Clear All</button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className={styles.metricsRow}>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.users}
          </div>
          <span className={styles.metricLabel}>New inquiries</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{occMetrics.newInquiries}</span>
            <span className={styles.metricTrend}>{Icons.trendingUp} 12%</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.checkCircle}
          </div>
          <span className={styles.metricLabel}>Converted</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{occMetrics.converted}</span>
            <span className={styles.metricTrend}>{Icons.trendingUp} 5%</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.logOut}
          </div>
          <span className={styles.metricLabel}>Members Exited</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{occMetrics.occupiedSeats}</span>
            <span className={styles.metricTrend}>{Icons.trendingDown} 8%</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.pause}
          </div>
          <span className={styles.metricLabel}>Accounts Paused/Hold</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{occMetrics.availableSeats}</span>
            <span className={styles.metricTrend}>{Icons.trendingUp} 5%</span>
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
          <div className={styles.chartGrid}>
            <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>100%</span><div className={styles.chartGridDash}></div></div>
            <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>75%</span><div className={styles.chartGridDash}></div></div>
            <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>50%</span><div className={styles.chartGridDash}></div></div>
            <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>25%</span><div className={styles.chartGridDash}></div></div>
            <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>0%</span><div className={styles.chartGridDash}></div></div>
          </div>

          <div className={styles.chartGridVerts}>
            <div className={styles.chartGridVertLine}></div><div className={styles.chartGridVertLine}></div>
            <div className={styles.chartGridVertLine}></div><div className={styles.chartGridVertLine}></div>
            <div className={styles.chartGridVertLine}></div><div className={styles.chartGridVertLine}></div>
            <div className={styles.chartGridVertLine}></div><div className={styles.chartGridVertLine}></div>
            <div className={styles.chartGridVertLine}></div><div className={styles.chartGridVertLine}></div>
            <div className={styles.chartGridVertLine}></div>
          </div>

          <svg className={styles.chartSvg} viewBox="0 0 1100 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ECDC3" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#4ECDC3" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area path representing the wave */}
            <path
              d="M 0 160 Q 50 150 100 150 T 200 60 T 300 100 T 400 150 T 500 140 T 600 40 T 700 110 T 800 140 T 900 110 T 1000 60 T 1100 110 L 1100 200 L 0 200 Z"
              fill="url(#areaGradient)"
            />
            <path
              d="M 0 160 Q 50 150 100 150 T 200 60 T 300 100 T 400 150 T 500 140 T 600 40 T 700 110 T 800 140 T 900 110 T 1000 60 T 1100 110"
              fill="none"
              stroke="#4ECDC3"
              strokeWidth="2.5"
            />

            <circle cx="300" cy="100" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
            <circle cx="600" cy="40" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
            <circle cx="700" cy="110" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
            <circle cx="800" cy="140" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
            <circle cx="900" cy="110" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
            <circle cx="1000" cy="60" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />

            {/* Tooltip Mock */}
            <rect x="275" y="50" width="50" height="24" rx="4" fill="#4ECDC3" />
            <text x="300" y="66" fill="#FFFFFF" fontSize="10" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">2,678</text>
            <polygon points="296,74 304,74 300,78" fill="#4ECDC3" />
          </svg>

          <div className={styles.chartXAxis}>
            <span className={styles.chartXLabel}>CH-S34</span>
            <span className={styles.chartXLabel}>CH-S21</span>
            <span className={styles.chartXLabel}>CH-S12</span>
            <span className={styles.chartXLabel}>JAL-01</span>
            <span className={styles.chartXLabel}>JAL-02</span>
            <span className={styles.chartXLabel}>JAL-03</span>
            <span className={styles.chartXLabel}>MO-01</span>
            <span className={styles.chartXLabel}>MO-02</span>
            <span className={styles.chartXLabel}>MO-03</span>
            <span className={styles.chartXLabel}>LU-01</span>
            <span className={styles.chartXLabel}>LU-02</span>
          </div>
        </div>
      </div>

      {/* DIRECTORY HEADER */}
      <div className={styles.directoryHeaderCard}>
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
      <div className={styles.listCard}>

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

        <div className={styles.listRow}>
          <div className={styles.checkbox}></div>
          <div className={styles.cellUser}>
            Rahul<br />Verma
          </div>
          <span className={styles.cellAmount}>₹5,000</span>
          <span className={styles.cellText}>Monthly</span>
          <span className={styles.cellText}>Chandigarh<br />Hub</span>
          <span className={styles.cellText}>Cash</span>
          <div className={styles.cellStatus}>
            <span className={`${styles.statusBadge} ${styles.statusActive}`}>Active</span>
          </div>
          <span className={styles.cellText}>12 Jan 2026</span>
          <span className={styles.cellText}>12 Jun 2026</span>
          <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 1 ? null : 1)}>
            {Icons.moreVertical}
          </div>
        </div>

        <div className={styles.listRow}>
          <div className={styles.checkbox}></div>
          <div className={styles.cellUser}>
            Priya<br />Sharma
          </div>
          <span className={styles.cellAmount}>₹10,000</span>
          <span className={styles.cellText}>Quarterly</span>
          <span className={styles.cellText}>Jalandhar</span>
          <span className={styles.cellText}>UPI</span>
          <div className={styles.cellStatus}>
            <span className={`${styles.statusBadge} ${styles.statusHold}`}>Hold</span>
          </div>
          <span className={styles.cellText}>05 Feb 2026</span>
          <span className={styles.cellText}>05 Jun 2026</span>
          <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 2 ? null : 2)}>
            {Icons.moreVertical}
          </div>
        </div>

        <div className={styles.listRow}>
          <div className={styles.checkbox}></div>
          <div className={styles.cellUser}>
            Amit<br />Singh
          </div>
          <span className={styles.cellAmount}>₹3,000</span>
          <span className={styles.cellText}>Monthly</span>
          <span className={styles.cellText}>Jalandhar</span>
          <span className={styles.cellText}>Card</span>
          <div className={styles.cellStatus}>
            <span className={`${styles.statusBadge} ${styles.statusExited}`}>Exited</span>
          </div>
          <span className={styles.cellText}>20 Mar 2026</span>
          <span className={styles.cellText}>20 Jun 2026</span>
          <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 3 ? null : 3)}>
            {Icons.moreVertical}
          </div>
        </div>

        <div className={styles.listRow}>
          <div className={styles.checkbox}></div>
          <div className={styles.cellUser}>
            Amit<br />Singh
          </div>
          <span className={styles.cellAmount}>₹3,000</span>
          <span className={styles.cellText}>Monthly</span>
          <span className={styles.cellText}>Jalandhar</span>
          <span className={styles.cellText}>Card</span>
          <div className={styles.cellStatus}>
            <span className={`${styles.statusBadge} ${styles.statusActive}`}>Active</span>
          </div>
          <span className={styles.cellText}>15 Apr 2026</span>
          <span className={styles.cellText}>15 Jun 2026</span>
          <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 4 ? null : 4)}>
            {Icons.moreVertical}
          </div>
        </div>

      </div>

      <ExportExcelModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
