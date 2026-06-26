"use client";

import { useState } from "react";
import styles from "./center.module.css";

const Icons = {
  reset: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
      <polyline points="3 3 3 8 8 8"></polyline>
    </svg>
  ),
  save: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
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
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  layout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  ),
  building: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <line x1="9" y1="22" x2="9" y2="22"></line>
      <line x1="15" y1="22" x2="15" y2="22"></line>
      <line x1="12" y1="6" x2="12" y2="6"></line>
      <line x1="12" y1="10" x2="12" y2="10"></line>
      <line x1="12" y1="14" x2="12" y2="14"></line>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  )
};

export default function CenterSettingsPage() {
  const [activeTab, setActiveTab] = useState("Booking Defaults");
  
  // Booking Defaults State
  const [lastMinuteBooking, setLastMinuteBooking] = useState(true);
  const [overbooking, setOverbooking] = useState(false);

  // Workspace Defaults State
  const [autoAssign, setAutoAssign] = useState(false);
  const [seatSwitching, setSeatSwitching] = useState(true);
  const [realTimeOccupancy, setRealTimeOccupancy] = useState(true);

  // Operational Defaults State
  const [emergencyOverride, setEmergencyOverride] = useState(false);

  return (
    <div className={styles.page}>
      
      {/* Top Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Center Defaults</h1>
          <p className={styles.headerSubtitle}>Set global operational rules applied across all centers</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.resetBtn}>
            {Icons.reset} Reset Default
          </button>
          <button className={styles.saveBtn}>
            {Icons.save} Save Rules
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className={styles.subTabs}>
        {["Booking Defaults", "Workspace Defaults", "Operational Defaults"].map(tab => (
          <div 
            key={tab} 
            className={`${styles.subTab} ${activeTab === tab ? styles.subTabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Split Layout */}
      <div className={styles.splitLayout}>
        
        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>
          
          {activeTab === "Booking Defaults" && (
            <>
              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.clock}</div>
                  <h2 className={styles.formTitle}>Booking Rules</h2>
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Booking Cutoff Time</label>
                    <select className={`${styles.inputBox} ${styles.selectBox}`}>
                      <option>30 minutes before slot</option>
                    </select>
                    <span className={styles.inputSub}>Latest time users can book a room before the slot starts</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Cancellation Window</label>
                    <div className={styles.inputWithSuffix}>
                      <input type="text" className={styles.inputBox} defaultValue="2" />
                      <span className={styles.inputSuffix}>hours</span>
                    </div>
                    <span className={styles.inputSub}>Users must cancel at least this many hours before booking</span>
                  </div>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Room Buffer Duration</label>
                  <div className={styles.inlineInputGroup}>
                    <input type="text" className={styles.inputBox} style={{ width: '120px' }} defaultValue="15" />
                    <span className={styles.inputSub}>minutes between bookings</span>
                  </div>
                  <span className={styles.inputSub}>Buffer time added between consecutive bookings for cleaning and setup</span>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon} style={{ background: '#F9FAFB', color: '#FF7847' }}>{Icons.lock}</div>
                  <h2 className={styles.formTitle}>Limits & Restrictions</h2>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Max Bookings Per User Per Day</label>
                  <div className={styles.inlineInputGroup}>
                    <input type="text" className={styles.inputBox} style={{ width: '120px' }} defaultValue="5" />
                    <span className={styles.inputSub}>bookings</span>
                  </div>
                  <span className={styles.inputSub}>Maximum number of active bookings a user can have in a single day</span>
                </div>

                <div className={styles.toggleCards} style={{ marginTop: '16px' }}>
                  <div className={styles.toggleCard}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Allow Last-Minute Booking</span>
                      <span className={styles.toggleSub}>Users can book rooms right up to the cutoff time</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!lastMinuteBooking ? styles.toggleSwitchOff : ''}`} onClick={() => setLastMinuteBooking(!lastMinuteBooking)}>
                      <div className={styles.toggleKnob} style={{ transform: lastMinuteBooking ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>

                  <div className={styles.toggleCard}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Allow Overbooking</span>
                      <span className={styles.toggleSub}>Permit bookings even when room capacity is reached</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!overbooking ? styles.toggleSwitchOff : ''}`} onClick={() => setOverbooking(!overbooking)}>
                      <div className={styles.toggleKnob} style={{ transform: overbooking ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "Workspace Defaults" && (
            <>
              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.eye}</div>
                  <h2 className={styles.formTitle}>Visibility & Structure</h2>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Seat Visibility</label>
                  <select className={`${styles.inputBox} ${styles.selectBox}`}>
                    <option>Public - All seats visible to everyone</option>
                  </select>
                  <span className={styles.inputSub}>Controls who can view and select seats across all centers</span>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Room Naming Format</label>
                  <select className={`${styles.inputBox} ${styles.selectBox}`}>
                    <option>Centre code + type + floor + number</option>
                  </select>
                  <span className={styles.inputSub}>Examples: SJ34- desk-A-1</span>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Default Availability Status</label>
                  <select className={`${styles.inputBox} ${styles.selectBox}`}>
                    <option>Available - Ready for booking</option>
                  </select>
                  <span className={styles.inputSub}>Initial status applied to all newly created workspaces</span>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.layout}</div>
                  <h2 className={styles.formTitle}>Space Behavior</h2>
                </div>

                <div className={styles.toggleCards}>
                  <div className={styles.toggleCard}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Auto-assign Seats</span>
                      <span className={styles.toggleSub}>Automatically assign available seats to new members upon registration</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!autoAssign ? styles.toggleSwitchOff : ''}`} onClick={() => setAutoAssign(!autoAssign)}>
                      <div className={styles.toggleKnob} style={{ transform: autoAssign ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>

                  <div className={styles.toggleCard}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Allow Seat Switching</span>
                      <span className={styles.toggleSub}>Users can change their assigned seat to another available seat</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!seatSwitching ? styles.toggleSwitchOff : ''}`} onClick={() => setSeatSwitching(!seatSwitching)}>
                      <div className={styles.toggleKnob} style={{ transform: seatSwitching ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>

                  <div className={styles.toggleCard}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Show Real-Time Occupancy</span>
                      <span className={styles.toggleSub}>Display live seat occupancy status to all users</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!realTimeOccupancy ? styles.toggleSwitchOff : ''}`} onClick={() => setRealTimeOccupancy(!realTimeOccupancy)}>
                      <div className={styles.toggleKnob} style={{ transform: realTimeOccupancy ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "Operational Defaults" && (
            <>
              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.clock}</div>
                  <h2 className={styles.formTitle}>Operating Hours</h2>
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Opening Time</label>
                    <input type="text" className={styles.inputBox} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Closing Time</label>
                    <input type="text" className={styles.inputBox} />
                  </div>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Working Days</label>
                  <div className={styles.pillGroup}>
                    <div className={`${styles.pill} ${styles.pillActive}`}>Mon</div>
                    <div className={`${styles.pill} ${styles.pillActive}`}>Tue</div>
                    <div className={`${styles.pill} ${styles.pillActive}`}>Wed</div>
                    <div className={`${styles.pill} ${styles.pillActive}`}>Thu</div>
                    <div className={`${styles.pill} ${styles.pillActive}`}>Fri</div>
                    <div className={`${styles.pill} ${styles.pillActive}`}>Sat</div>
                    <div className={styles.pill}>Sun</div>
                  </div>
                  <span className={styles.inputSub}>Select days when centers are operational</span>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.calendar}</div>
                  <h2 className={styles.formTitle}>Room & Event Limits</h2>
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Meeting Room Limits Per User</label>
                    <div className={styles.inlineInputGroup}>
                      <input type="text" className={styles.inputBox} style={{ width: '80px' }} defaultValue="3" />
                      <span className={styles.inputSub}>per week</span>
                    </div>
                    <span className={styles.inputSub}>Maximum weekly meeting room bookings per user</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Event Duration Limits</label>
                    <div className={styles.inlineInputGroup}>
                      <input type="text" className={styles.inputBox} style={{ width: '80px' }} defaultValue="2" />
                      <span className={styles.inputSub}>hours max</span>
                    </div>
                    <span className={styles.inputSub}>Maximum duration for event bookings</span>
                  </div>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.settings}</div>
                  <h2 className={styles.formTitle}>System Operations</h2>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Maintenance Window Timing</label>
                  <div className={styles.inputGrid} style={{ gap: '16px' }}>
                    <div className={styles.inputGroup}>
                      <span className={styles.inputSub} style={{ fontSize: '13px', color: '#6B7280' }}>Start Time</span>
                      <input type="text" className={styles.inputBox} />
                    </div>
                    <div className={styles.inputGroup}>
                      <span className={styles.inputSub} style={{ fontSize: '13px', color: '#6B7280' }}>End Time</span>
                      <input type="text" className={styles.inputBox} />
                    </div>
                  </div>
                  <span className={styles.inputSub}>Scheduled maintenance and system updates window</span>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Cleaning Buffer Duration</label>
                  <div className={styles.inlineInputGroup}>
                    <input type="text" className={styles.inputBox} style={{ width: '120px' }} defaultValue="30" />
                    <span className={styles.inputSub}>minutes</span>
                  </div>
                  <span className={styles.inputSub}>Time allocated for deep cleaning between events</span>
                </div>

                <div className={styles.toggleCards} style={{ marginTop: '16px' }}>
                  <div className={`${styles.toggleCard} ${styles.toggleCardWarning}`}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Emergency Override</span>
                      <span className={styles.toggleSub}>Allow admins to bypass all booking restrictions during emergencies</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!emergencyOverride ? styles.toggleSwitchOff : ''}`} onClick={() => setEmergencyOverride(!emergencyOverride)}>
                      <div className={styles.toggleKnob} style={{ transform: emergencyOverride ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>
          
          {activeTab === "Booking Defaults" && (
            <div className={styles.contentCardSmallPadding}>
              <div className={styles.rightPanelTitleWrap}>
                <div className={styles.rightPanelTitleIcon}>{Icons.info}</div>
                <h3 className={styles.rightPanelTitle}>How This Affects Users</h3>
              </div>

              <div className={styles.infoBoxList}>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.clock}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Cancellation Policy</span>
                    <span className={styles.infoBoxText}>Users can cancel bookings up to <b>2 hours</b> before start time.</span>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.clock}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Room Availability</span>
                    <span className={styles.infoBoxText}>Rooms will remain unavailable for <b>15 minutes</b> after each session for cleaning and setup.</span>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={`${styles.infoBoxIcon} ${styles.infoBoxIconGrey}`}>{Icons.lock}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Booking Deadline</span>
                    <span className={styles.infoBoxText}>Bookings must be made at least <b>30 minutes</b> before the slot starts.</span>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={`${styles.infoBoxIcon} ${styles.infoBoxIconGrey}`}>{Icons.users}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Daily Limit</span>
                    <span className={styles.infoBoxText}>Each user can make up to <b>5 bookings</b> per day to ensure fair access.</span>
                  </div>
                </div>
              </div>

              <div className={styles.bulletListWrap}>
                <div className={styles.bulletListTitle}>Example Scenario</div>
                <ul className={styles.bulletList}>
                  <li>User books Meeting Room A for 2:00 PM</li>
                  <li>Booking must be made before 1:30 PM</li>
                  <li>Can cancel until 10:00 PM</li>
                  <li>Room unavailable until 2:15 PM (buffer time)</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "Workspace Defaults" && (
            <div className={styles.contentCardSmallPadding}>
              <div className={styles.rightPanelTitleWrap}>
                <div className={styles.rightPanelTitleIcon}>{Icons.info}</div>
                <h3 className={styles.rightPanelTitle}>Workspace Behavior</h3>
              </div>

              <div className={styles.infoBoxList}>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.eye}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Seat Visibility</span>
                    <span className={styles.infoBoxText}>All users can view and select any available seat</span>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.building}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Naming Convention</span>
                    <span className={styles.infoBoxText}>Structured format with floor and sequential numbering</span>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.users}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Default Availability</span>
                    <span className={styles.infoBoxText}>New workspaces are immediately bookable by users</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryList}>
                <div className={styles.summaryListTitle}>Active Behaviors</div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Auto-assign</span>
                  <span className={styles.summaryValueGrey}>Disabled</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Seat switching</span>
                  <span className={styles.summaryValueOrange}>Allowed</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Real-time status</span>
                  <span className={styles.summaryValueOrange}>Visible</span>
                </div>
              </div>

              <div className={`${styles.bulletListWrap} ${styles.bulletListWrapGrey}`}>
                <div className={styles.bulletListTitle}>User Experience</div>
                <ul className={styles.bulletList}>
                  <li>Members must select their own seat</li>
                  <li>Users can switch to any available seat</li>
                  <li>Live occupancy data visible on floor plans</li>
                </ul>
              </div>

            </div>
          )}

          {activeTab === "Operational Defaults" && (
            <div className={styles.contentCardSmallPadding}>
              <div className={styles.rightPanelTitleWrap}>
                <div className={styles.rightPanelTitleIcon}>{Icons.info}</div>
                <h3 className={styles.rightPanelTitle}>Operational Summary</h3>
              </div>

              <div className={styles.infoBoxList}>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.clock}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Operating Hours</span>
                    <span className={styles.infoBoxText}>Centers operate <b>9:00 AM</b> to <b>8:00 PM</b></span>
                    <div className={styles.miniPillGroup}>
                      <span className={styles.miniPill}>Mon</span>
                      <span className={styles.miniPill}>Tue</span>
                      <span className={styles.miniPill}>Wed</span>
                      <span className={styles.miniPill}>Thu</span>
                      <span className={styles.miniPill}>Fri</span>
                      <span className={styles.miniPill}>Sat</span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.calendar}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Usage Limits</span>
                    <span className={styles.infoBoxText}>Meeting rooms: <b>3 bookings/week</b><br/>Maximum event duration: <b>2 hours</b></span>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.settings}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Maintenance Window</span>
                    <span className={styles.infoBoxText}><b>10:00 PM - 6:00 AM</b><br/>System unavailable during maintenance</span>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.clock}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Cleaning Buffer</span>
                    <span className={styles.infoBoxText}><b>30 minutes</b> allocated for deep cleaning</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryList} style={{ background: '#FFFFFF' }}>
                <div className={styles.summaryListTitle}>Weekly Overview</div>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className={styles.summaryRow}>
                    <span className={styles.summaryLabel} style={{ color: '#1F2937' }}>{day}</span>
                    <span className={styles.summaryValueOrange}>9:00 AM - 8:00 PM</span>
                  </div>
                ))}
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel} style={{ color: '#9CA3AF' }}>Sun</span>
                  <span className={styles.summaryValueGrey}>Closed</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
