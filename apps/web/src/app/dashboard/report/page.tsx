"use client";

import { useState } from "react";
import styles from "./report.module.css";

// SVG Icons
const Icons = {
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  rupee: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 8h12M6 13h8.5l-5 8h5l5-8H6z"/>
    </svg>
  ),
  alertCircle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
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
  activity: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
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
  moreHorizontal: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="19" cy="12" r="1"></circle>
      <circle cx="5" cy="12" r="1"></circle>
    </svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF7847" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  alertTriangle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  crown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
    </svg>
  )
};

export default function ReportPage() {
  return (
    <div className={styles.page}>
      
      {/* HEADER & FILTERS */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <h1 className={styles.headerTitle}>Reports Overview</h1>
          <p className={styles.headerSubtitle}>Track revenue, occupancy, and performance across all centers.</p>
        </div>
        <div className={styles.filtersRow}>
          <div className={styles.searchBox}>
            <span className="text-gray-400">{Icons.search}</span>
            <input type="text" placeholder="Search lead name, company, or phone" />
          </div>
          <div className={styles.dropdowns}>
            <button className={styles.dropdown}>All center <span className={styles.dropdownCaret}></span></button>
            <button className={styles.dropdown}>Last 30 days <span className={styles.dropdownCaret}></span></button>
            <button className={styles.dropdown}>CM All <span className={styles.dropdownCaret}></span></button>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.metricIconOrange}`}>{Icons.rupee}</div>
          <span className={styles.metricLabel}>Total Revenue</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>₹9.8L</span>
            <span className={`${styles.metricTrend} ${styles.trendUp}`}>{Icons.trendingUp} 12%</span>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.metricIconRed}`}>{Icons.alertCircle}</div>
          <span className={styles.metricLabel}>Outstanding Dues</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>₹1.4L</span>
            <span className={`${styles.metricTrend} ${styles.trendUp}`}>{Icons.trendingUp} 5%</span>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.metricIconOrange}`}>{Icons.users}</div>
          <span className={styles.metricLabel}>Active Clients</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>320</span>
            <span className={`${styles.metricTrend} ${styles.trendUpRed}`}>{Icons.trendingDown} 8%</span>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.metricIconOrange}`}>{Icons.activity}</div>
          <span className={styles.metricLabel}>Occupancy Rate</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>78%</span>
            <span className={`${styles.metricTrend} ${styles.trendUp}`}>{Icons.trendingUp} 5%</span>
          </div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Analytics Overview</h2>

      {/* ANALYTICS ROW 1 */}
      <div className={styles.analyticsRow1}>
        
        {/* Payment Status Donut */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <h3 className={styles.cardTitle}>Payment Status</h3>
              <p className={styles.cardSubtitle}>Invoice Breakdown</p>
            </div>
            <div className={styles.cardHeaderActions}>{Icons.moreHorizontal}</div>
          </div>
          <div className={styles.donutContainer}>
            <div className={styles.donutSvgWrap}>
              {/* 
                Half-donut simulation using SVG. 
                Radius = 70, Circumference = Math.PI * 70 = 219.9.
                Paid (Teal) ~ 69%, Overdue (Yellow) ~ 18%, Partial (Red) ~ 13%.
              */}
              <svg width="200" height="120" viewBox="0 0 200 120">
                {/* Background track (optional) */}
                <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="#F9FAFB" strokeWidth="24" strokeLinecap="round" />
                {/* Partial (Red/Orange-ish #EF4444) at the end */}
                <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="#EF4444" strokeWidth="24" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset="0" />
                {/* Overdue (Yellow #FBBF24) */}
                <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="#FBBF24" strokeWidth="24" strokeDasharray="251.2" strokeDashoffset="40" />
                {/* Paid (Teal #34D399) starts from left */}
                <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="#FF6A2F" strokeWidth="24" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset="100" />
              </svg>
              <div className={styles.donutText}>
                <span className={styles.donutValue}>142</span>
                <span className={styles.donutLabel}>Total Invoices</span>
              </div>
            </div>
            <div className={styles.donutLegend}>
              <span className={styles.legendItem}><span className={styles.legendDot} style={{background: '#34D399'}}></span> Paid - 98</span>
              <span className={styles.legendItem}><span className={styles.legendDot} style={{background: '#FBBF24'}}></span> Overdue - 26</span>
              <span className={styles.legendItem}><span className={styles.legendDot} style={{background: '#EF4444'}}></span> Partial - 18</span>
            </div>
          </div>
        </div>

        {/* Mini Cards Stack */}
        <div className={styles.miniCardsStack}>
          <div className={styles.miniCard}>
            <div className={styles.miniCardHeader}>
              <span className={styles.miniCardLabel}>DEPOSITS HELD</span>
              <div className={styles.miniCardIcon}>{Icons.rupee}</div>
            </div>
            <div>
              <div className={styles.miniCardValue}>₹5.2L</div>
              <div className={styles.miniCardTrend}><span>{Icons.trendingUp} +10%</span> vs last month</div>
            </div>
          </div>
          <div className={styles.miniCard}>
            <div className={styles.miniCardHeader}>
              <span className={styles.miniCardLabel}>BOOKING UTILISATION</span>
              <div className={styles.miniCardIcon}>{Icons.calendar}</div>
            </div>
            <div>
              <div className={styles.miniCardValue}>82%</div>
              <div className={styles.miniCardTrend}><span>{Icons.trendingUp} +6%</span> vs last week</div>
            </div>
          </div>
        </div>

        {/* Occupancy Trend Line Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <h3 className={styles.cardTitle}>Occupancy Trend</h3>
              <p className={styles.cardSubtitle}>Weekly progression</p>
            </div>
            <div className={styles.cardHeaderActions}>
              <span className={styles.badgeOutlineOrange}>CH:S24-CH:16 <span className={styles.dropdownCaret} style={{borderColor: '#FF7847'}}></span></span>
              <span className={styles.badgeOutlineOrange}>This Month {Icons.calendar}</span>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            <div className={styles.chartGrid}>
              <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>75%</span><div className={styles.chartGridDash}></div></div>
              <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>50%</span><div className={styles.chartGridDash}></div></div>
              <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>25%</span><div className={styles.chartGridDash}></div></div>
              <div className={styles.chartGridLine}><span className={styles.chartGridLabel}>0%</span><div className={styles.chartGridDash}></div></div>
            </div>
            <svg className={styles.chartSvg} viewBox="0 0 400 150" preserveAspectRatio="none">
              {/* Orange Line */}
              <path d="M0 100 Q 20 120, 50 110 T 100 80 T 150 130 T 200 90 T 250 130 T 300 70 T 350 120 T 400 60" fill="none" stroke="#FF7847" strokeWidth="3" />
              {/* Teal Line */}
              <path d="M0 60 Q 20 80, 50 70 T 100 40 T 150 100 T 200 60 T 250 90 T 300 40 T 350 80 T 400 30" fill="none" stroke="#34D399" strokeWidth="3" />
              {/* Hover Tooltip Mock (Teal) */}
              <circle cx="150" cy="100" r="5" fill="#34D399" stroke="#FFFFFF" strokeWidth="2" />
              <rect x="135" y="65" width="30" height="18" rx="4" fill="#34D399" />
              <text x="150" y="77" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">2,679</text>
              {/* Hover Tooltip Mock (Orange) */}
              <circle cx="300" cy="70" r="5" fill="#FF7847" stroke="#FFFFFF" strokeWidth="2" />
              <rect x="285" y="35" width="30" height="18" rx="4" fill="#FF7847" />
              <text x="300" y="47" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">2,678</text>
            </svg>
            <div className={styles.chartXAxis}>
              <span className={styles.chartXLabel}>Jan</span>
              <span className={styles.chartXLabel}>Feb</span>
              <span className={styles.chartXLabel}>Mar</span>
              <span className={styles.chartXLabel}>Apr</span>
              <span className={styles.chartXLabel}>May</span>
              <span className={styles.chartXLabel}>Jun</span>
            </div>
          </div>
        </div>

      </div>

      {/* ANALYTICS ROW 2 */}
      <div className={styles.analyticsRow2}>
        
        {/* Stacked Bar Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <h3 className={styles.cardTitle}>Lead to Converted</h3>
              <p className={styles.cardSubtitle}>Monthly progression</p>
            </div>
            <div className={styles.cardHeaderActions}>
              <span className={styles.badgeOutlineOrange} style={{borderColor: '#FCA5A5'}}>Net growth: +46 this month</span>
            </div>
          </div>
          <div className={styles.barChartWrapper}>
            <div className={styles.barGrid}>
              <div className={styles.barGridLine}><span className={styles.chartGridLabel}>75%</span><div className={styles.chartGridDash}></div></div>
              <div className={styles.barGridLine}><span className={styles.chartGridLabel}>50%</span><div className={styles.chartGridDash}></div></div>
              <div className={styles.barGridLine}><span className={styles.chartGridLabel}>25%</span><div className={styles.chartGridDash}></div></div>
              <div className={styles.barGridLine}><span className={styles.chartGridLabel}>0%</span><div className={styles.chartGridDash}></div></div>
            </div>
            <div className={styles.barsContainer}>
              {/* Jan */}
              <div className={styles.barGroup}>
                <div className={styles.barSegment} style={{background: '#34D399', height: '40%'}}></div>
                <div className={styles.barSegment} style={{background: '#FBBF24', height: '30%'}}></div>
              </div>
              {/* Feb */}
              <div className={styles.barGroup}>
                <div className={styles.barSegment} style={{background: '#34D399', height: '50%'}}></div>
                <div className={styles.barSegment} style={{background: '#FBBF24', height: '40%'}}></div>
              </div>
              {/* Mar */}
              <div className={styles.barGroup}>
                <div className={styles.barSegment} style={{background: '#34D399', height: '15%'}}></div>
                <div className={styles.barSegment} style={{background: '#FBBF24', height: '55%'}}></div>
              </div>
              {/* Apr */}
              <div className={styles.barGroup}>
                <div className={styles.barSegment} style={{background: '#34D399', height: '25%'}}></div>
                <div className={styles.barSegment} style={{background: '#FBBF24', height: '45%'}}></div>
              </div>
              {/* May */}
              <div className={styles.barGroup}>
                <div className={styles.barSegment} style={{background: '#34D399', height: '30%'}}></div>
                <div className={styles.barSegment} style={{background: '#FBBF24', height: '60%'}}></div>
              </div>
              {/* Jun */}
              <div className={styles.barGroup}>
                <div className={styles.barSegment} style={{background: '#34D399', height: '25%'}}></div>
                <div className={styles.barSegment} style={{background: '#FBBF24', height: '50%'}}></div>
              </div>
              {/* Jul */}
              <div className={styles.barGroup}>
                <div className={styles.barSegment} style={{background: '#34D399', height: '15%'}}></div>
                <div className={styles.barSegment} style={{background: '#FBBF24', height: '55%'}}></div>
              </div>
            </div>
            <div className={styles.barXAxis}>
              <span className={styles.chartXLabel}>JAN</span>
              <span className={styles.chartXLabel}>FEB</span>
              <span className={styles.chartXLabel}>MAR</span>
              <span className={styles.chartXLabel}>APR</span>
              <span className={styles.chartXLabel}>MAY</span>
              <span className={styles.chartXLabel}>JUN</span>
              <span className={styles.chartXLabel}>JUL</span>
            </div>
          </div>
          <div className={styles.barLegend}>
            <span className={styles.legendItem}><span className={styles.legendDot} style={{background: '#FBBF24'}}></span> Lead</span>
            <span className={styles.legendItem}><span className={styles.legendDot} style={{background: '#34D399'}}></span> Converted</span>
          </div>
        </div>

        {/* Top Performing Centers */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <h3 className={styles.cardTitle}>Top Performing Centers</h3>
              <p className={styles.cardSubtitle}>Ranked by overall performance</p>
            </div>
          </div>
          <div className={styles.centerList}>
            {/* 1 */}
            <div className={styles.centerRow}>
              <div className={styles.centerName}>Chandigarh <span className={styles.topBadge}>{Icons.crown} Top</span></div>
              <div className={styles.centerMetrics}>
                <div className={styles.cMetric}><span className={styles.cMetricLabel}>Revenue</span><span className={styles.cMetricValue}>₹4.2L</span></div>
                <div className={styles.cMetric}><span className={styles.cMetricLabel}>Occupancy</span><span className={styles.cMetricValue}>85%</span></div>
                <div className={styles.cMetric}><span className={styles.cMetricLabel}>Growth</span><span className={styles.cGrowthUp}>{Icons.trendingUp} +15%</span></div>
              </div>
            </div>
            {/* 2 */}
            <div className={styles.centerRow}>
              <div className={styles.centerName}>Mohali</div>
              <div className={styles.centerMetrics}>
                <div className={styles.cMetric}><span className={styles.cMetricLabel}>Revenue</span><span className={styles.cMetricValue}>₹3.8L</span></div>
                <div className={styles.cMetric}><span className={styles.cMetricLabel}>Occupancy</span><span className={styles.cMetricValue}>72%</span></div>
                <div className={styles.cMetric}><span className={styles.cMetricLabel}>Growth</span><span className={styles.cGrowthUp}>{Icons.trendingUp} +8%</span></div>
              </div>
            </div>
            {/* 3 */}
            <div className={styles.centerRow}>
              <div className={styles.centerName}>Jalandhar</div>
              <div className={styles.centerMetrics}>
                <div className={styles.cMetric}><span className={styles.cMetricLabel}>Revenue</span><span className={styles.cMetricValue}>₹1.8L</span></div>
                <div className={styles.cMetric}><span className={styles.cMetricLabel}>Occupancy</span><span className={styles.cMetricValue}>68%</span></div>
                <div className={styles.cMetric}><span className={styles.cMetricLabel}>Growth</span><span className={styles.cGrowthDown}>{Icons.trendingDown} -5%</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <h2 className={styles.sectionTitle}>Operational Insights</h2>

      {/* OPERATIONAL INSIGHTS */}
      <div className={styles.insightsRow}>
        <div className={styles.insightCard}>
          <div className={styles.insightIcon}>{Icons.trendingUp}</div>
          <span className={styles.insightText}>Revenue increased by 12% this month</span>
        </div>
        <div className={styles.insightCard}>
          <div className={styles.insightIcon} style={{background: '#FF7847'}}>{Icons.alertCircle}</div>
          <span className={styles.insightText} style={{color: '#FF7847'}}>Occupancy dropped in Mohali center</span>
        </div>
        <div className={styles.insightCard}>
          <div className={styles.insightIcon} style={{background: '#FF7847'}}>{Icons.alertTriangle}</div>
          <span className={styles.insightText} style={{color: '#FF7847'}}>High overdue payments in Chandigarh</span>
        </div>
      </div>

    </div>
  );
}