"use client";



import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_REVENUE_REPORT,
  GET_INVOICES,
  GET_DEPOSITS,
} from "@/lib/apollo/operations";
import {
  normalizeStatus,
  invoiceStatusLabel,
  invoiceStatusStyles,
  depositStatusLabel,
  depositStatusStyles,
} from "@/lib/revenue-status";
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
  trendingUp: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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
      .filter((i: any) => normalizeStatus(i.status) === "PAID")
      .reduce((sum: number, i: any) => sum + Number(i.totalAmount ?? 0), 0);
    const depositHeld = deposits
      .filter((d: any) => normalizeStatus(d.status) === "HELD" || normalizeStatus(d.status) === "ACTIVE")
      .reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0);
    const outstandingDues = invoices
      .filter((i: any) => normalizeStatus(i.status) === "OVERDUE" || normalizeStatus(i.status) === "SENT")
      .reduce((sum: number, i: any) => sum + Number(i.totalAmount ?? 0), 0);
    const newSignups = invoices.length;
    return { invoicesCollected, depositHeld, outstandingDues, newSignups };
  }, [invoices, deposits]);

  // Monthly revenue series for the area chart (derived from live report)
  const monthlyRevenue = (revenueReport?.byMonth ?? []).map((m: any) => ({
    month: m.month,
    value: Number(m.revenue ?? 0),
  }));
  const maxRevenue = monthlyRevenue.reduce(
    (max: number, m: any) => Math.max(max, m.value),
    0,
  ) || 1;

  // Map normalized invoice status to existing CSS badge classes
  const invoiceStatusClass = (raw: string): string => {
    switch (normalizeStatus(raw)) {
      case 'PAID':
        return styles.statusPaid;
      case 'OVERDUE':
        return styles.statusOverdue;
      case 'CANCELLED':
      case 'DRAFT':
        return styles.statusPending;
      default: // SENT, PARTIAL, etc.
        return styles.statusDue;
    }
  };
  const invoiceStatusLabelText = (raw: string): string =>
    invoiceStatusLabel[normalizeStatus(raw)] || raw;

  // Map normalized deposit status to existing CSS badge classes
  const depositStatusClass = (raw: string): string => {
    switch (normalizeStatus(raw)) {
      case 'HELD':
      case 'ACTIVE':
        return styles.statusActive;
      case 'FROZEN':
        return styles.statusFrozen;
      case 'RELEASE_REQUESTED':
        return styles.statusRelease;
      case 'REFUNDED':
        return styles.statusRelease;
      default:
        return styles.statusPending;
    }
  };
  const depositStatusLabelText = (raw: string): string =>
    depositStatusLabel[normalizeStatus(raw)] || raw;

  // Per-tab filtered lists
  const tabInvoices =
    activeTab === 'Invoices'
      ? invoices
      : activeTab === 'Overdues'
        ? invoices.filter((i: any) => normalizeStatus(i.status) === 'OVERDUE')
        : [];
  const tabDeposits = activeTab === 'Deposits' ? deposits : [];

  const formatDate = (value?: string | null): string => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
            <span className={styles.metricTrend}>{revenueReport?.growth != null ? `${Icons.trendingUp} ${revenueReport.growth > 0 ? '+' : ''}${revenueReport.growth.toFixed(0)}%` : ''}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.document}
          </div>
          <span className={styles.metricLabel}>Deposit Held</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{formatCurrency(metrics.depositHeld)}</span>
            <span className={styles.metricTrend}>{revenueReport?.growth != null ? `${Icons.trendingUp} ${revenueReport.growth > 0 ? '+' : ''}${revenueReport.growth.toFixed(0)}%` : ''}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.signIn}
          </div>
          <span className={styles.metricLabel}>New sign ups</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{metrics.newSignups}</span>
            <span className={styles.metricTrend}>{revenueReport?.growth != null ? `${Icons.trendingUp} ${revenueReport.growth > 0 ? '+' : ''}${revenueReport.growth.toFixed(0)}%` : ''}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ color: '#FF6A2F' }}>
            {Icons.alertCircle}
          </div>
          <span className={styles.metricLabel}>Outstanding Dues</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{formatCurrency(metrics.outstandingDues)}</span>
            <span className={styles.metricTrend}>{revenueReport?.growth != null ? `${Icons.trendingDown} ${revenueReport.growth > 0 ? '+' : ''}${revenueReport.growth.toFixed(0)}%` : ''}</span>
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
          {monthlyRevenue.length === 0 ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: '13px' }}>
              No revenue data available
            </div>
          ) : (
            <>
              <div className={styles.chartGrid}>
                <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>75%</span><div className={styles.chartGridDash}></div></div>
                <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>50%</span><div className={styles.chartGridDash}></div></div>
                <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>25%</span><div className={styles.chartGridDash}></div></div>
                <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>0%</span><div className={styles.chartGridDash}></div></div>
              </div>

              <div className={styles.chartGridVerts}>
                {monthlyRevenue.map((m: any) => (
                  <div key={m.month} className={styles.chartGridVertLine}></div>
                ))}
              </div>

              <svg className={styles.chartSvg} viewBox={`0 0 ${monthlyRevenue.length * 100} 200`} preserveAspectRatio="none">
                {(() => {
                  // Build a smooth line/area from monthly revenue values.
                  const points: readonly (readonly [number, number])[] = monthlyRevenue.map((m: any, idx: number) => {
                    const x = idx * 100;
                    const y = 200 - (m.value / maxRevenue) * 180;
                    return [x, y] as const;
                  });
                  if (points.length === 0) return null;
                  const linePath = points
                    .map(([x, y]: readonly [number, number], i: number) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`)
                    .join(' ');
                  const areaPath = `${linePath} L ${points[points.length - 1][0]} 200 L ${points[0][0]} 200 Z`;
                  return (
                    <>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4ECDC3" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#4ECDC3" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={areaPath} fill="url(#areaGradient)" />
                      <path d={linePath} fill="none" stroke="#4ECDC3" strokeWidth="2.5" />
                      {points.map(([x, y], i) => (
                        <circle key={i} cx={x} cy={y} r="4" fill="#FFFFFF" stroke="#4ECDC3" strokeWidth="2" />
                      ))}
                    </>
                  );
                })()}
              </svg>

              <div className={styles.chartXAxis}>
                {monthlyRevenue.map((m: any) => (
                  <span key={m.month} className={styles.chartXLabel}>{m.month}</span>
                ))}
              </div>
            </>
          )}
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
          tabInvoices.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
              No invoices found
            </div>
          ) : (
            tabInvoices.map((inv: any) => (
              <div key={inv.id} className={styles.listRow}>
                <div className={styles.checkbox}></div>
                <div className={styles.cellUser}>{inv.customerName || '—'}</div>
                <span className={styles.cellAmount}>₹{Math.round(Number(inv.totalAmount ?? inv.amount ?? 0)).toLocaleString('en-IN')}</span>
                <span className={styles.cellText}>{inv.planName || '—'}</span>
                <span className={styles.cellText}>{inv.centerName || inv.center?.name || '—'}</span>
                <span className={styles.cellText}>{inv.paymentMethod || '—'}</span>
                <div className={styles.cellStatus}>
                  <span className={`${styles.statusBadge} ${invoiceStatusClass(inv.status)}`}>{invoiceStatusLabelText(inv.status)}</span>
                </div>
                <span className={styles.cellText}>{formatDate(inv.issueDate)}</span>
                <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}>
                  {Icons.moreVertical}
                  {openMenuId === inv.id && (
                    <div className={styles.actionMenu}>
                      <div className={styles.actionMenuItem}>View Details</div>
                      <div className={styles.actionMenuItem}>Edit</div>
                      <div className={styles.actionMenuItem}>Delete</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )
        ) : activeTab === 'Deposits' ? (
          tabDeposits.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
              No deposits found
            </div>
          ) : (
            tabDeposits.map((dep: any) => (
              <div key={dep.id} className={styles.listRow}>
                <div className={styles.checkbox}></div>
                <div className={styles.cellUser}>{dep.customerName || '—'}</div>
                <span className={styles.cellAmount}>₹{Math.round(Number(dep.amount ?? 0)).toLocaleString('en-IN')}</span>
                <span className={styles.cellText}>{dep.depositType || '—'}</span>
                <span className={styles.cellText}>{dep.center?.name || '—'}</span>
                <span className={styles.cellText}>{dep.referenceNumber || '—'}</span>
                <div className={styles.cellStatus}>
                  <span className={`${styles.statusBadge} ${depositStatusClass(dep.status)}`}>{depositStatusLabelText(dep.status)}</span>
                </div>
                <span className={styles.cellText}>{formatDate(dep.receivedDate)}</span>
                <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === dep.id ? null : dep.id)}>
                  {Icons.moreVertical}
                  {openMenuId === dep.id && (
                    <div className={styles.actionMenu}>
                      <div className={styles.actionMenuItem}>Release</div>
                      <div className={styles.actionMenuItem}>Freeze</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )
        ) : activeTab === 'Overdues' ? (
          tabInvoices.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
              No overdue invoices found
            </div>
          ) : (
            tabInvoices.map((inv: any) => (
              <div key={inv.id} className={styles.listRow}>
                <div className={styles.checkbox}></div>
                <div className={styles.cellUser}>{inv.customerName || '—'}</div>
                <span className={styles.cellAmount}>₹{Math.round(Number(inv.totalAmount ?? inv.amount ?? 0)).toLocaleString('en-IN')}</span>
                <span className={styles.cellText}>{inv.planName || '—'}</span>
                <span className={styles.cellText}>{inv.centerName || inv.center?.name || '—'}</span>
                <span className={styles.cellText}>{inv.paymentMethod || '—'}</span>
                <div className={styles.cellStatus}>
                  <span className={`${styles.statusBadge} ${invoiceStatusClass(inv.status)}`}>{invoiceStatusLabelText(inv.status)}</span>
                </div>
                <span className={styles.cellText}>{formatDate(inv.dueDate)}</span>
                <div className={styles.cellAction} onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}>
                  {Icons.moreVertical}
                  {openMenuId === inv.id && (
                    <div className={styles.actionMenu}>
                      <div className={styles.actionMenuItem}>Send Email</div>
                      <div className={styles.actionMenuItem}>Send SMS</div>
                      <div className={styles.actionMenuItem}>Mark Paid</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )
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
