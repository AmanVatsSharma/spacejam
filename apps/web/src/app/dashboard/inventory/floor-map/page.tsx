"use client";

import { useState } from "react";
import styles from "./floor-map.module.css";

const Icons = {
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  filter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  ),
  chair: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"></path>
      <path d="M5 11V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"></path>
      <line x1="2" y1="11" x2="22" y2="11"></line>
      <line x1="8" y1="21" x2="8" y2="23"></line>
      <line x1="16" y1="21" x2="16" y2="23"></line>
    </svg>
  ),
  circleCheck: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  target: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  tools: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
  ),
  zoomIn: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="11" y1="8" x2="11" y2="14"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
  ),
  zoomOut: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  )
};

export default function FloorMapPage() {
  const [activeTab, setActiveTab] = useState("Floor 01");
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className={styles.page}>
      
      {/* LEFT COLUMN */}
      <div className={styles.leftCol}>
        
        {/* Header Card */}
        <div className={styles.headerCard}>
          <div className={styles.headerTitleWrap}>
            <h1 className={styles.headerTitle}>Floor Map</h1>
            <p className={styles.headerSubtitle}>Visualize space usage and real-time occupancy</p>
          </div>
          <button className={styles.addSpaceBtn}>
            {Icons.plus} Add Space
          </button>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <div className={styles.searchBoxIcon}>{Icons.search}</div>
            <input type="text" placeholder="Search" />
          </div>
          <div className={styles.filterPills}>
            {["All", "Available", "Occupied", "Maintenance"].map(filter => (
              <div 
                key={filter} 
                className={`${styles.filterPill} ${activeFilter === filter ? styles.filterPillActive : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>{Icons.chair}</div>
            <div className={styles.statValue}>52</div>
            <div className={styles.statLabel}>Total Seats</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>{Icons.circleCheck}</div>
            <div className={styles.statValue}>32</div>
            <div className={styles.statLabel}>Available</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>{Icons.target}</div>
            <div className={styles.statValue}>18</div>
            <div className={styles.statLabel}>Occupied</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>{Icons.tools}</div>
            <div className={styles.statValue}>2</div>
            <div className={styles.statLabel}>Maintenance</div>
          </div>
        </div>

        {/* Map Container */}
        <div className={styles.mapContainerCard}>
          
          {/* Floor Tabs */}
          <div className={styles.floorTabsWrap}>
            {["Floor 01", "Floor 02", "Floor 03"].map(tab => (
              <div 
                key={tab} 
                className={`${styles.floorTab} ${activeTab === tab ? styles.floorTabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          <div className={styles.mapToolbar}>
            <div className={styles.mapToolbarLeft}>
              <div className={styles.mapSearch}>
                {Icons.search}
                <input type="text" placeholder="cabin 1B" defaultValue="cabin 1B" />
              </div>
              <div className={styles.mapFilterIcon}>{Icons.filter}</div>
              
              <div className={styles.mapLegend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#FF7847' }}></div>
                  <span>All</span>
                  <span className={`${styles.legendCount} ${styles.legendCountActive}`}>42</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#10B981' }}></div>
                  <span>Available</span>
                  <span className={styles.legendCount}>28</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#EF4444' }}></div>
                  <span>Occupied</span>
                  <span className={styles.legendCount}>12</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#6B7280' }}></div>
                  <span>Under Maintenance</span>
                  <span className={styles.legendCount}>2</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#F59E0B' }}></div>
                  <span>Upcoming</span>
                  <span className={styles.legendCount}>12</span>
                </div>
              </div>
            </div>

            <div className={styles.mapToolbarRight}>
              <div className={styles.mapDatePicker}>
                {Icons.calendar}
                Apr 4, 2026
              </div>
              <button className={styles.mapContinueBtn}>Continue</button>
            </div>
          </div>

          <div className={styles.mapCanvas}>
            <div className={styles.floorGrid}>
              
              {/* Left Area - Hexagons & Open Seats */}
              <div className={`${styles.roomBlock} ${styles.rOpenSeats} ${styles.bgGrey}`}>
                <div className={styles.rHexagons}>
                  <div className={styles.hexagon}></div>
                  <div className={styles.hexagon}></div>
                  <div className={styles.hexagon}></div>
                  <div className={styles.hexagon}></div>
                </div>
                <div style={{ position: 'absolute', left: '70px', top: '40px', fontSize: '13px', color: '#1F2937' }}>
                  8 Hexagon
                </div>
                <div style={{ position: 'absolute', right: '40px', top: '40px', fontSize: '13px', color: '#1F2937' }}>
                  10 Open Seats
                </div>
                <div className={styles.rOpenSeatsBox}>
                  Open Seats
                </div>
              </div>

              {/* Row 1 Cabins */}
              <div className={`${styles.roomBlock} ${styles.r1A} ${styles.roomGreen}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName}>Cabin 1A</div>
                  <div className={styles.roomDot}></div>
                </div>
                <div className={styles.roomCapacity}>{Icons.chair} 5</div>
                <div className={styles.roomStatus}>Available Now</div>
              </div>
              
              <div className={`${styles.roomBlock} ${styles.r1B} ${styles.roomRed}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName}>Cabin 1B</div>
                  <div className={styles.roomDot}></div>
                </div>
                <div className={styles.roomCapacity}>{Icons.chair} 5</div>
                <div className={styles.roomStatus}>4 months left</div>
              </div>

              <div className={`${styles.roomBlock} ${styles.r1C} ${styles.roomOrange}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName}>Cabin 1C</div>
                  <div className={styles.roomDot}></div>
                </div>
                <div className={styles.roomCapacity}>{Icons.chair} 5</div>
                <div className={styles.roomStatus}>Book for 5 days</div>
              </div>

              <div className={`${styles.roomBlock} ${styles.r1D} ${styles.roomOrange}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName}>Cabin 1D</div>
                  <div className={styles.roomDot}></div>
                </div>
                <div className={styles.roomCapacity}>{Icons.chair} 5</div>
                <div className={styles.roomStatus}>Next in 45 m</div>
              </div>

              {/* Row 1 Right Cabins */}
              <div className={`${styles.roomBlock} ${styles.r3A} ${styles.roomGreen}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName}>Cabin 3A</div>
                  <div className={styles.roomDot}></div>
                </div>
                <div className={styles.roomCapacity}>{Icons.chair} 2</div>
                <div className={styles.roomStatus}>Available now</div>
              </div>
              <div className={`${styles.roomBlock} ${styles.r3B} ${styles.roomGreen}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName}>Cabin 3B</div>
                  <div className={styles.roomDot}></div>
                </div>
                <div className={styles.roomCapacity}>{Icons.chair} 2</div>
                <div className={styles.roomStatus}>Available now</div>
              </div>
              <div className={`${styles.roomBlock} ${styles.r3C} ${styles.roomRed}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName}>Cabin 3C</div>
                  <div className={styles.roomDot}></div>
                </div>
                <div className={styles.roomCapacity}>{Icons.chair} 5</div>
                <div className={styles.roomStatus}>9 months left</div>
              </div>
              <div className={`${styles.roomBlock} ${styles.rMeeting} ${styles.roomRed}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName}>Meeting Room</div>
                  <div className={styles.roomDot}></div>
                </div>
                <div className={styles.roomCapacity}>{Icons.chair} 7</div>
                <div className={styles.roomStatus} style={{ textAlign: 'center', marginTop: 'auto' }}>2h 30m left</div>
              </div>

              {/* Row 2 Cabins & Areas */}
              <div className={`${styles.roomBlock} ${styles.r2A} ${styles.roomOrange}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName}>Cabin 2A</div>
                  <div className={styles.roomDot}></div>
                </div>
                <div className={styles.roomCapacity}>{Icons.chair} 4</div>
                <div className={styles.roomStatus}>Book For 10 days</div>
              </div>
              
              <div className={`${styles.roomBlock} ${styles.r2B} ${styles.roomGrey}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName}>Cabin 2B</div>
                  <div className={styles.roomDot}></div>
                </div>
                <div className={styles.roomCapacity}>{Icons.chair} 4</div>
                <div className={styles.roomStatus}>Unavailable</div>
              </div>

              <div className={`${styles.roomBlock} ${styles.rWashroom} ${styles.bgGreen}`}>
                Washroom Area
              </div>

              <div className={`${styles.roomBlock} ${styles.rSofa}`}>
                Sofa Area
              </div>

              <div className={`${styles.roomBlock} ${styles.rPantry}`}>
                Pantry
              </div>

              {/* Bottom Right Cabins */}
              <div className={`${styles.roomBlock} ${styles.r4A} ${styles.roomGreen}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName} style={{fontSize: '11px'}}>Cabin 4A</div>
                </div>
                <div className={styles.roomCapacity} style={{fontSize: '10px'}}>{Icons.chair} 2</div>
                <div className={styles.roomStatus} style={{fontSize: '9px'}}>Available Now</div>
              </div>
              <div className={`${styles.roomBlock} ${styles.r4B} ${styles.roomGreen}`}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomName} style={{fontSize: '11px'}}>Cabin 4B</div>
                </div>
                <div className={styles.roomCapacity} style={{fontSize: '10px'}}>{Icons.chair} 2</div>
                <div className={styles.roomStatus} style={{fontSize: '9px'}}>Available Now</div>
              </div>

            </div>

            <div className={styles.zoomControls}>
              <button className={styles.zoomBtn}>{Icons.zoomIn}</button>
              <button className={styles.zoomBtn}>{Icons.zoomOut}</button>
            </div>
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className={styles.rightCol}>
        
        <div className={styles.panelHeader}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className={styles.panelTitle}>Cabin A1</h2>
            <span className={styles.panelSubtitle}>4-seater Cabin</span>
          </div>
          <div className={styles.statusBadge}>
            <div className={styles.statusDot}></div>
            Occupied
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <span className={styles.sectionTitle}>Capacity</span>
          <span className={styles.sectionText}>4 seats</span>
        </div>

        <div className={styles.sectionBlock}>
          <span className={styles.sectionTitle}>Pricing</span>
          <div className={styles.priceWrap}>
            <span className={styles.priceText}>₹12,000/month</span>
            <span className={styles.priceGst}>GST: 18%</span>
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <span className={styles.sectionTitle}>Amenities</span>
          <div className={styles.amenityPills}>
            <span className={styles.amenityPill}>WiFi</span>
            <span className={styles.amenityPill}>AC</span>
            <span className={styles.amenityPill}>Whiteboard</span>
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <span className={styles.sectionTitle}>Occupancy</span>
          <div className={styles.occupancyList}>
            <div className={styles.occRow}>
              <span className={styles.occLabel}>Company:</span>
              <span className={styles.occValue}>TechCorp</span>
            </div>
            <div className={styles.occRow}>
              <span className={styles.occLabel}>Start Date:</span>
              <span className={styles.occValue}>Jan 10, 2026</span>
            </div>
            <div className={styles.occRow}>
              <span className={styles.occLabel}>End Date:</span>
              <span className={styles.occValue}>Mar 10, 2026</span>
            </div>
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <span className={styles.sectionTitle}>Schedule</span>
          <div className={styles.scheduleCards}>
            <div className={`${styles.schCard} ${styles.schCardActive}`}>
              <span className={styles.schTitleOrange}>Currently Booked</span>
              <span className={styles.schDateOrange}>Until Mar 10, 2026</span>
            </div>
            <div className={`${styles.schCard} ${styles.schCardGrey}`}>
              <span className={styles.schTitleBlack}>Next Available</span>
              <span className={styles.schDateGrey}>After Mar 10, 2026</span>
            </div>
          </div>
        </div>

        <div className={styles.panelActions}>
          <button className={styles.btnSecondary}>View Details</button>
          <button className={styles.btnPrimary}>Vacate</button>
        </div>

      </div>

    </div>
  );
}
