"use client";


export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_REVENUE_REPORT,
  GET_INVOICES,
  GET_DEPOSITS,
} from "@/lib/apollo/operations";
import { ExportExcelModal } from "@/components/ui/dashboard/export-excel-modal";
import styles from "./revenue.module.css";

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
  rupee: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 8h12M6 13h8.5l-5 8h5l5-8H6z" />
    </svg>
  ),
  document: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  signIn: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
      <polyline points="10 17 15 12 10 7"></polyline>
      <line x1="15" y1="12" x2="3" y2="12"></line>
    </svg>
  ),
  alertCircle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
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

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${Math.round(amount)}`;
}

export default function RevenueOverviewPage() {
  const [activeTab, setActiveTab] = useState("Invoices");
  const [openMenuId, setOpenMenuId] = useState<number | null>(1); // 1 is default open for demo
  const [showExport, setShowExport] = useState(false);

  // Live revenue report
  const { data: revenueData } = useQuery(GET_REVENUE_REPORT, {
    variables: { period: 'month' },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Live invoices for "Invoices Collected" metric
  const { data: invoicesData } = useQuery(GET_INVOICES, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Live deposits for "Deposit Held" metric
  const { data: depositsData } = useQuery(GET_DEPOSITS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const revenueReport = revenueData?.revenueReport;
  const invoices = invoicesData?.invoices ?? [];
  const deposits = depositsData?.deposits ?? [];

  // Compute metrics from live data
  const metrics = useMemo(() => {
    const invoicesCollected = invoices
      .filter((i: any) => i.status === "Paid")
      .reduce((sum: number, i: any) => sum + Number(i.totalAmount ?? 0), 0);
    const depositHeld = deposits
      .filter((d: any) => d.status === "Held" || d.status === "Active")
      .reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0);
    const outstandingDues = invoices
      .filter((i: any) => i.status === "Overdue" || i.status === "Sent")
      .reduce((sum: number, i: any) => sum + Number(i.totalAmount ?? 0), 0);
    const newSignups = invoices.length;
    return { invoicesCollected, depositHeld, outstandingDues, newSignups };
  }, [invoices, deposits]);

  return (
    <div className={styles.page}>

      {/* HEADER CARD */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Revenue Overview</h1>
          <p className={styles.headerSubtitle}>Monitor meeting room usage , availability and booking status</p>
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
            {Icons.rupee}
          </div>
          <span className={styles.metricLabel}>Invoices Collected</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{formatCurrency(metrics.invoicesCollected)}</span>
            <span className={styles.metricTrend}>{Icons.trendingDown} 12%</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.document}
          </div>
          <span className={styles.metricLabel}>Deposit Held</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{formatCurrency(metrics.depositHeld)}</span>
            <span className={styles.metricTrend}>{Icons.trendingDown} 5%</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.signIn}
          </div>
          <span className={styles.metricLabel}>New sign ups</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{metrics.newSignups}</span>
            <span className={styles.metricTrend}>{Icons.trendingDown} 8%</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.alertCircle}
          </div>
          <span className={styles.metricLabel}>Outstanding Dues</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{formatCurrency(metrics.outstandingDues)}</span>
            <span className={styles.metricTrend}>{Icons.trendingDown} 5%</span>
          </div>
        </div>

      </div>

      {/* AREA CHART */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div className={styles.chartTitleWrap}>
            <h3 className={styles.chartTitle}>Total Revenue</h3>
            <p className={styles.chartSubtitle}>Total Revenue of all center</p>
          </div>
          <div className={styles.chartBadges}>
            <span className={`${styles.chartBadge} ${styles.badgeOutline}`}>CH-Sector 34</span>
            <span className={`${styles.chartBadge} ${styles.badgeBg}`}>This Month {Icons.calendar}</span>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.chartGrid}>
            <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>75%</span><div className={styles.chartGridDash}></div></div>
            <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>50%</span><div className={styles.chartGridDash}></div></div>
            <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>25%</span><div className={styles.chartGridDash}></div></div>
            <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>0%</span><div className={styles.chartGridDash}></div></div>
          </div>

          <div className={styles.chartGridVerts}>
            <div className={styles.chartGridVertLine}></div>
            <div className={styles.chartGridVertLine}></div>
            <div className={styles.chartGridVertLine}></div>
            <div className={styles.chartGridVertLine}></div>
            <div className={styles.chartGridVertLine}></div>
            <div className={styles.chartGridVertLine}></div>
          </div>

          <svg className={styles.chartSvg} viewBox="0 0 1000 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ECDC3" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#4ECDC3" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area path */}
            <path
              d="M 0 160 L 100 150 L 200 160 L 300 70 L 400 130 L 500 100 L 600 135 L 700 130 L 800 145 L 900 30 L 1000 80 L 1000 200 L 0 200 Z"
              fill="url(#areaGradient)"
            />

            {/* Stroke path */}
            <path
              d="M 0 160 L 100 150 L 200 160 L 300 70 L 400 130 L 500 100 L 600 135 L 700 130 L 800 145 L 900 30 L 1000 80"
              fill="none"
              stroke="#4ECDC3"
              strokeWidth="2.5"
            />

            {/* Data points */}
            <circle cx="300" cy="70" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
            <circle cx="400" cy="130" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
            <circle cx="500" cy="100" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
            <circle cx="600" cy="135" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
            <circle cx="700" cy="130" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
            <circle cx="800" cy="145" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
            <circle cx="900" cy="30" r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />

            {/* Tooltip Mock */}
            <rect x="475" y="80" width="50" height="24" rx="4" fill="#4ECDC3" />
            <text x="500" y="96" fill="#FFFFFF" fontSize="10" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">2,678</text>
            <polygon points="496,104 504,104 500,108" fill="#4ECDC3" />
          </svg>

          <div className={styles.chartXAxis}>
            <span className={styles.chartXLabel}>CH-S21</span>
            <span className={styles.chartXLabel}>CH-S34</span>
            <span className={styles.chartXLabel}>JL-S34</span>
            <span className={styles.chartXLabel}>MH-S34</span>
            <span className={styles.chartXLabel}>JL-S21</span>
            <span className={styles.chartXLabel}>MH-S21</span>
            <span className={styles.chartXLabel}>MH-S21</span>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className={styles.tabsRow}>
        <div className={styles.tabsContainer}>
          <div
            className={`${styles.tabItem} ${activeTab === 'Invoices' ? styles.tabActive : ''} ${styles.tabLine} ${activeTab === 'Invoices' ? styles.tabLineActive : ''}`}
            onClick={() => setActiveTab('Invoices')}
          >
            Invoices
          </div>
          <div
            className={`${styles.tabItem} ${activeTab === 'Deposits' ? styles.tabActive : ''} ${styles.tabLine} ${activeTab === 'Deposits' ? styles.tabLineActive : ''}`}
            onClick={() => setActiveTab('Deposits')}
          >
            Deposits
          </div>
          <div
            className={`${styles.tabItem} ${activeTab === 'Overdues' ? styles.tabActive : ''} ${styles.tabLine} ${activeTab === 'Overdues' ? styles.tabLineActive : ''}`}
            onClick={() => setActiveTab('Overdues')}
          >
            Overdues
          </div>
        </div>
        <button className={styles.sendReminderBtn}>Send Reminder</button>
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
          <span>DATE</span>
          <span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>

        {activeTab === 'Invoices' ? (
          <>
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
                <span className={`${styles.statusBadge} ${styles.statusPaid}`}>Paid</span>
              </div>
              <span className={styles.cellText}>Apr 15</span>
              <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 1 ? null : 1)}>
                {Icons.moreVertical}
                {openMenuId === 1 && (
                  <div className={styles.actionMenu}>
                    <div className={styles.actionMenuItem}>View Details</div>
                    <div className={styles.actionMenuItem}>Edit</div>
                    <div className={styles.actionMenuItem}>Delete</div>
                  </div>
                )}
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
                <span className={`${styles.statusBadge} ${styles.statusDue}`}>Due Soon</span>
              </div>
              <span className={styles.cellText}>Apr 20</span>
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
                <span className={`${styles.statusBadge} ${styles.statusPaid}`}>Paid</span>
              </div>
              <span className={styles.cellText}>Mar 28</span>
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
                <span className={`${styles.statusBadge} ${styles.statusDue}`}>Due Soon</span>
              </div>
              <span className={styles.cellText}>Mar 28</span>
              <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 4 ? null : 4)}>
                {Icons.moreVertical}
              </div>
            </div>
          </>
        ) : activeTab === 'Deposits' ? (
          <>
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
              <span className={styles.cellText}>Apr 15</span>
              <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 5 ? null : 5)}>
                {Icons.moreVertical}
                {openMenuId === 5 && (
                  <div className={styles.actionMenu}>
                    <div className={styles.actionMenuItem}>Release</div>
                    <div className={styles.actionMenuItem}>Freeze</div>
                  </div>
                )}
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
                <span className={`${styles.statusBadge} ${styles.statusFrozen}`}>Frozen</span>
              </div>
              <span className={styles.cellText}>Apr 20</span>
              <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 6 ? null : 6)}>
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
                <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pending</span>
              </div>
              <span className={styles.cellText}>Mar 28</span>
              <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 7 ? null : 7)}>
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
                <span className={`${styles.statusBadge} ${styles.statusRelease}`}>Release</span>
              </div>
              <span className={styles.cellText}>Mar 28</span>
              <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 8 ? null : 8)}>
                {Icons.moreVertical}
              </div>
            </div>
          </>
        ) : activeTab === 'Overdues' ? (
          <>
            <div className={styles.listRow}>
              <div className={styles.checkbox}></div>
              <div className={styles.cellUser}>
                Vikas<br />Mehta
              </div>
              <span className={styles.cellAmount}>₹12,000</span>
              <span className={styles.cellText}>Quarterly</span>
              <span className={styles.cellText}>Chandigarh<br />Hub</span>
              <span className={styles.cellText}>Bank Transfer</span>
              <div className={styles.cellStatus}>
                <span className={`${styles.statusBadge} ${styles.statusOverdue}`}>Overdue</span>
              </div>
              <span className={styles.cellText}>Mar 10</span>
              <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 9 ? null : 9)}>
                {Icons.moreVertical}
                {openMenuId === 9 && (
                  <div className={styles.actionMenu}>
                    <div className={styles.actionMenuItem}>Send Email</div>
                    <div className={styles.actionMenuItem}>Send SMS</div>
                    <div className={styles.actionMenuItem}>Mark Paid</div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.listRow}>
              <div className={styles.checkbox}></div>
              <div className={styles.cellUser}>
                Anita<br />Desai
              </div>
              <span className={styles.cellAmount}>₹8,500</span>
              <span className={styles.cellText}>Monthly</span>
              <span className={styles.cellText}>Mohali</span>
              <span className={styles.cellText}>Credit Card</span>
              <div className={styles.cellStatus}>
                <span className={`${styles.statusBadge} ${styles.statusOverdue}`}>Overdue</span>
              </div>
              <span className={styles.cellText}>Feb 28</span>
              <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === 10 ? null : 10)}>
                {Icons.moreVertical}
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
            No data available for {activeTab}
          </div>
        )}

      </div>


      <ExportExcelModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
