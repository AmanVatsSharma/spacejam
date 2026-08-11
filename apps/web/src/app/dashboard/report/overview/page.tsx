"use client";

import { useState } from "react";
import styles from "./overview.module.css";

const Icons = {
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  rupee: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12"></path>
      <path d="M6 8h12"></path>
      <path d="M14.5 21L9 13h5.5c2 0 3.5-1.5 3.5-3.5S16.5 6 14.5 6H6v15"></path>
    </svg>
  ),
  exclamation: (
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
  pulse: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  ),
  trendUp: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  trendDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
      <polyline points="17 18 23 18 23 12"></polyline>
    </svg>
  ),
  wallet: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"></path>
      <path d="M12 4v16"></path>
      <path d="M2 12h20"></path>
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
  more: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="19" cy="12" r="1"></circle>
      <circle cx="5" cy="12" r="1"></circle>
    </svg>
  ),
  trendUpLg: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  )
};

export default function OverviewPage() {
  const [search, setSearch] = useState("");
  
  return (
    <div className={styles.page}>
      
      {/* Header & Controls */}
      <div className={styles.headerCard}>
        <h1 className={styles.headerTitle}>Reports Overview</h1>
        <p className={styles.headerSubtitle}>Track revenue, occupancy, and performance across all centers.</p>
        
        <div className={styles.controlsRow}>
          <div className={styles.searchWrap}>
            <div className={styles.searchIcon}>{Icons.search}</div>
            <input 
              type="text" 
              placeholder="Search lead name, company, or phone" 
              className={styles.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className={styles.filtersWrap}>
            <select className={styles.filterSelect} defaultValue="All center">
              <option value="All center">All center</option>
            </select>
            <select className={styles.filterSelect} defaultValue="Last 30 days">
              <option value="Last 30 days">Last 30 days</option>
            </select>
            <select className={styles.filterSelect} defaultValue="CM All">
              <option value="CM All">CM All</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrap}>{Icons.rupee}</div>
          <div className={styles.kpiLabel}>Total Revenue</div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>₹9.8L</span>
            <span className={styles.kpiTrendUp}>{Icons.trendUp} 12%</span>
          </div>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrap}>{Icons.exclamation}</div>
          <div className={styles.kpiLabel}>Outstanding Dues</div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>₹1.4L</span>
            <span className={styles.kpiTrendUp}>{Icons.trendUp} 5%</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrap}>{Icons.users}</div>
          <div className={styles.kpiLabel}>Active Clients</div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>320</span>
            <span className={styles.kpiTrendDown}>{Icons.trendDown} 8%</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrap}>{Icons.pulse}</div>
          <div className={styles.kpiLabel}>Occupancy Rate</div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>78%</span>
            <span className={styles.kpiTrendUp}>{Icons.trendUp} 5%</span>
          </div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Analytics Overview</h2>

      {/* Analytics Row 1 */}
      <div className={styles.analyticsGrid1}>
        
        {/* Payment Status */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Payment Status</h3>
              <p className={styles.cardSub}>Invoice Breakdown</p>
            </div>
            <div style={{ color: '#9CA3AF', cursor: 'pointer' }}>{Icons.more}</div>
          </div>
          <div className={styles.donutWrap}>
            <div style={{ position: 'relative', width: 200, height: 100, overflow: 'hidden' }}>
              <svg viewBox="0 0 36 36" width="200" height="200" style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Background arc */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="4"
                  strokeDasharray="50, 100"
                />
                {/* Paid (Green) ~69% */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#2DD4BF"
                  strokeWidth="4"
                  strokeDasharray="34.5, 100"
                />
                {/* Overdue (Yellow) ~18% */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#FCD34D"
                  strokeWidth="4"
                  strokeDasharray="9, 100"
                  strokeDashoffset="-34.5"
                />
                {/* Partial (Red) ~13% */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F87171"
                  strokeWidth="4"
                  strokeDasharray="6.5, 100"
                  strokeDashoffset="-43.5"
                />
              </svg>
              <div className={styles.donutInner}>
                <div className={styles.donutNumber}>142</div>
                <div className={styles.donutLabel}>Total Invoices</div>
              </div>
            </div>
            
            <div className={styles.donutLegend}>
              <div className={styles.legendItem}><div className={styles.dotPaid}></div> Paid - 98</div>
              <div className={styles.legendItem}><div className={styles.dotOverdue}></div> Overdue - 26</div>
              <div className={styles.legendItem}><div className={styles.dotPartial}></div> Partial - 18</div>
            </div>
          </div>
        </div>

        {/* Mini Cards */}
        <div className={styles.miniCardsCol}>
          <div className={styles.miniCard}>
            <div className={styles.miniHeader}>
              <span className={styles.miniTitle}>Deposits Held</span>
              <div className={styles.miniIconWrap}>{Icons.wallet}</div>
            </div>
            <div>
              <div className={styles.miniValue}>₹5.2L</div>
              <div className={styles.miniTrend}><b>{Icons.trendUp} +10%</b> vs last month</div>
            </div>
          </div>
          <div className={styles.miniCard}>
            <div className={styles.miniHeader}>
              <span className={styles.miniTitle}>Booking Utilisation</span>
              <div className={styles.miniIconWrap}>{Icons.calendar}</div>
            </div>
            <div>
              <div className={styles.miniValue}>82%</div>
              <div className={styles.miniTrend}><b>{Icons.trendUp} +6%</b> vs last week</div>
            </div>
          </div>
        </div>

        {/* Occupancy Trend */}
        <div className={styles.card}>
          <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
            <div>
              <h3 className={styles.cardTitle}>Occupancy Trend</h3>
              <p className={styles.cardSub}>Weekly progression</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select style={{ border: '1px solid #FF7847', color: '#FF7847', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', outline: 'none', background: 'white' }}>
                <option>Select Center</option>
              </select>
              <select style={{ border: '1px solid #FFE4D6', color: '#FF7847', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', outline: 'none', background: '#FFF0EB' }}>
                <option>This Month</option>
              </select>
            </div>
          </div>
          
          <div className={styles.barChartWrap}>
            <div className={styles.yAxis}>
              <div className={styles.yLine}>75%</div>
              <div className={styles.yLine}>50%</div>
              <div className={styles.yLine}>25%</div>
              <div className={styles.yLine}>0%</div>
            </div>
            {/* Mocked Data for exact visual match */}
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', paddingLeft: '40px', paddingBottom: '16px', boxSizing: 'border-box' }}>
              
              <div className={styles.barCol}>
                <div className={styles.barBlocks} style={{ height: '60%' }}>
                  <div className={styles.barBlock} style={{ flex: 1.5 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                </div>
                <div className={styles.barLabel}>CH-S21</div>
              </div>
              
              <div className={styles.barCol}>
                <div className={styles.barBlocks} style={{ height: '50%' }}>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1.2 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1.5 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                </div>
                <div className={styles.barLabel}>CH-S34</div>
              </div>
              
              <div className={styles.barCol}>
                <div className={styles.barBlocks} style={{ height: '40%' }}>
                  <div className={styles.barBlock} style={{ flex: 0.5 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1.5 }}></div>
                </div>
                <div className={styles.barLabel}>JL-S34</div>
              </div>

              <div className={styles.barCol}>
                <div className={styles.barBlocks} style={{ height: '70%' }}>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1.5 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1.2 }}></div>
                </div>
                <div className={styles.barLabel}>MH-S34</div>
              </div>

              <div className={styles.barCol}>
                <div className={styles.barBlocks} style={{ height: '35%' }}>
                  <div className={styles.barBlock} style={{ flex: 0.5 }}></div>
                  <div className={styles.barBlock} style={{ flex: 0.8 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                </div>
                <div className={styles.barLabel}>JL-S21</div>
              </div>

              <div className={styles.barCol}>
                <div className={styles.barBlocks} style={{ height: '50%' }}>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                  <div className={styles.barBlock} style={{ flex: 1 }}></div>
                </div>
                <div className={styles.barLabel}>MH-S2</div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Analytics Row 2 */}
      <div className={styles.analyticsGrid2}>
        
        {/* Lead to Converted */}
        <div className={styles.card}>
          <div className={styles.badgeCardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Lead to Converted</h3>
              <p className={styles.cardSub}>Monthly progression</p>
            </div>
            <div className={styles.growthBadge}>Net growth: +46 this month</div>
          </div>
          
          <div className={styles.barChartWrap} style={{ marginTop: 0 }}>
            <div className={styles.yAxis}>
              <div className={styles.yLine}>75%</div>
              <div className={styles.yLine}>50%</div>
              <div className={styles.yLine}>25%</div>
              <div className={styles.yLine}>0%</div>
            </div>
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', paddingLeft: '40px', paddingBottom: '16px', boxSizing: 'border-box' }}>
              
              <div className={styles.leadBarCol}>
                <div style={{ height: '60%', display: 'flex', flexDirection: 'column' }}>
                  <div className={styles.leadBlockGreen} style={{ flex: 1 }}></div>
                  <div className={styles.leadBlockYellow} style={{ flex: 1 }}></div>
                </div>
                <div className={styles.barLabel}>JAN</div>
              </div>
              <div className={styles.leadBarCol}>
                <div style={{ height: '75%', display: 'flex', flexDirection: 'column' }}>
                  <div className={styles.leadBlockGreen} style={{ flex: 0.8 }}></div>
                  <div className={styles.leadBlockYellow} style={{ flex: 1.2 }}></div>
                </div>
                <div className={styles.barLabel}>FEB</div>
              </div>
              <div className={styles.leadBarCol}>
                <div style={{ height: '65%', display: 'flex', flexDirection: 'column' }}>
                  <div className={styles.leadBlockGreen} style={{ flex: 0.3 }}></div>
                  <div className={styles.leadBlockYellow} style={{ flex: 1.5 }}></div>
                </div>
                <div className={styles.barLabel}>MAR</div>
              </div>
              <div className={styles.leadBarCol}>
                <div style={{ height: '65%', display: 'flex', flexDirection: 'column' }}>
                  <div className={styles.leadBlockGreen} style={{ flex: 0.5 }}></div>
                  <div className={styles.leadBlockYellow} style={{ flex: 1 }}></div>
                </div>
                <div className={styles.barLabel}>APR</div>
              </div>
              <div className={styles.leadBarCol}>
                <div style={{ height: '70%', display: 'flex', flexDirection: 'column' }}>
                  <div className={styles.leadBlockGreen} style={{ flex: 1 }}></div>
                  <div className={styles.leadBlockYellow} style={{ flex: 1 }}></div>
                </div>
                <div className={styles.barLabel}>MAY</div>
              </div>
              <div className={styles.leadBarCol}>
                <div style={{ height: '65%', display: 'flex', flexDirection: 'column' }}>
                  <div className={styles.leadBlockGreen} style={{ flex: 1 }}></div>
                  <div className={styles.leadBlockYellow} style={{ flex: 1.5 }}></div>
                </div>
                <div className={styles.barLabel}>JUN</div>
              </div>
              <div className={styles.leadBarCol}>
                <div style={{ height: '65%', display: 'flex', flexDirection: 'column' }}>
                  <div className={styles.leadBlockGreen} style={{ flex: 1.5 }}></div>
                  <div className={styles.leadBlockYellow} style={{ flex: 0.5 }}></div>
                </div>
                <div className={styles.barLabel}>JUL</div>
              </div>

            </div>
          </div>
          
          <div className={styles.leadLegend}>
            <div className={styles.legendItem}><div className={styles.dotOverdue}></div> Lead</div>
            <div className={styles.legendItem}><div className={styles.dotPaid}></div> Converted</div>
          </div>
        </div>

        {/* Top Performing Centers */}
        <div className={styles.card}>
          <div className={styles.cardHeader} style={{ marginBottom: '16px' }}>
            <div>
              <h3 className={styles.cardTitle}>Top Performing Centers</h3>
              <p className={styles.cardSub}>Ranked by overall performance</p>
            </div>
          </div>

          <div className={styles.centersList}>
            <div className={styles.centerRow}>
              <div className={styles.centerName}>
                Chandigarh 
                <span className={styles.topBadge}>{Icons.trendUpLg} Top</span>
              </div>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div className={styles.centerStat}>
                  <span className={styles.statLabel}>Revenue</span>
                  <span className={styles.statValue}>₹4.2L</span>
                </div>
                <div className={styles.centerStat}>
                  <span className={styles.statLabel}>Occupancy</span>
                  <span className={styles.statValue}>85%</span>
                </div>
                <div className={styles.centerStat}>
                  <span className={styles.statLabel}>Growth</span>
                  <span className={styles.statTrendUp}>{Icons.trendUp} +15%</span>
                </div>
              </div>
            </div>

            <div className={styles.centerRow}>
              <div className={styles.centerName}>Mohali</div>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div className={styles.centerStat}>
                  <span className={styles.statLabel}>Revenue</span>
                  <span className={styles.statValue}>₹3.8L</span>
                </div>
                <div className={styles.centerStat}>
                  <span className={styles.statLabel}>Occupancy</span>
                  <span className={styles.statValue}>72%</span>
                </div>
                <div className={styles.centerStat}>
                  <span className={styles.statLabel}>Growth</span>
                  <span className={styles.statTrendUp}>{Icons.trendUp} +8%</span>
                </div>
              </div>
            </div>

            <div className={styles.centerRow}>
              <div className={styles.centerName}>Jalandhar</div>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div className={styles.centerStat}>
                  <span className={styles.statLabel}>Revenue</span>
                  <span className={styles.statValue}>₹1.8L</span>
                </div>
                <div className={styles.centerStat}>
                  <span className={styles.statLabel}>Occupancy</span>
                  <span className={styles.statValue}>68%</span>
                </div>
                <div className={styles.centerStat}>
                  <span className={styles.statLabel}>Growth</span>
                  <span className={styles.statTrendDown}>{Icons.trendDown} -5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Operational Insights */}
      <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>Operational Insights</h2>
      
      <div className={styles.insightsRow}>
        <div className={styles.insightBox}>
          <div className={styles.insightIconWrap}>{Icons.trendUpLg}</div>
          <div className={styles.insightText}>Revenue increased by 12% this month</div>
        </div>
        
        <div className={styles.insightBox}>
          <div className={styles.insightIconWrap}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div className={styles.insightText}>Occupancy dropped in Mohali center</div>
        </div>

        <div className={styles.insightBox}>
          <div className={styles.insightIconWrap}>{Icons.exclamation}</div>
          <div className={styles.insightText}>High overdue payments in Chandigarh</div>
        </div>
      </div>

    </div>
  );
}
