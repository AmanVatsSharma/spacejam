"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { toast } from "sonner";
import { GET_MY_CENTERS } from "@/lib/apollo/operations";
import { useUpdateCenterSettings } from "@/hooks/use-settings";
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
  const [saving, setSaving] = useState(false);

  // Load center data
  const { data: centersData } = useQuery(GET_MY_CENTERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Persist via the deep-merge updateCenterSettings mutation (NOT updateCenter,
  // whose UpdateCenterInput has no `settings` field — so the old Save silently
  // dropped everything). Deep-merge also prevents clobbering sibling groups
  // (finance/security/notifications) written by other settings pages.
  const { update: updateCenterSettings } = useUpdateCenterSettings();

  const centers = centersData?.myCenters ?? [];
  const primaryCenter = centers[0];

  // Booking Defaults State
  const [lastMinuteBooking, setLastMinuteBooking] = useState(true);
  const [overbooking, setOverbooking] = useState(false);
  const [bookingCutoffTime, setBookingCutoffTime] = useState("30 minutes before slot");
  const [cancellationWindow, setCancellationWindow] = useState("2");
  const [roomBufferDuration, setRoomBufferDuration] = useState("15");
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState("5");

  // Workspace Defaults State
  const [autoAssign, setAutoAssign] = useState(false);
  const [seatSwitching, setSeatSwitching] = useState(true);
  const [realTimeOccupancy, setRealTimeOccupancy] = useState(true);
  const [seatVisibility, setSeatVisibility] = useState("Public - All seats visible to everyone");
  const [roomNamingFormat, setRoomNamingFormat] = useState("Centre code + type + floor + number");
  const [defaultAvailabilityStatus, setDefaultAvailabilityStatus] = useState("Available - Ready for booking");

  // Operational Defaults State
  const [emergencyOverride, setEmergencyOverride] = useState(false);
  const [openingTime, setOpeningTime] = useState("9:00 AM");
  const [closingTime, setClosingTime] = useState("8:00 PM");
  const [workingDays, setWorkingDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const [meetingRoomLimit, setMeetingRoomLimit] = useState("3");
  const [eventDurationLimit, setEventDurationLimit] = useState("2");
  const [maintenanceWindowStart, setMaintenanceWindowStart] = useState("10:00 PM");
  const [maintenanceWindowEnd, setMaintenanceWindowEnd] = useState("6:00 AM");
  const [cleaningBufferDuration, setCleaningBufferDuration] = useState("30");

  // Hydrate from persisted Center.settings once the center loads. Reads all
  // three groups (bookingDefaults, workspaceDefaults, operations) — previously
  // only `operations` was read, so the other two tabs always reloaded blank.
  const savedSettings = (primaryCenter?.settings as Record<string, any> | null) ?? null;
  const savedBooking = savedSettings?.bookingDefaults ?? null;
  const savedWorkspace = savedSettings?.workspaceDefaults ?? null;
  const savedOps = savedSettings?.operations ?? null;
  useEffect(() => {
    // Booking Defaults
    if (savedBooking) {
      if (typeof savedBooking.lastMinuteBooking === 'boolean') setLastMinuteBooking(savedBooking.lastMinuteBooking);
      if (typeof savedBooking.overbooking === 'boolean') setOverbooking(savedBooking.overbooking);
      if (savedBooking.bookingCutoffTime) setBookingCutoffTime(savedBooking.bookingCutoffTime);
      if (savedBooking.cancellationWindow) setCancellationWindow(savedBooking.cancellationWindow);
      if (savedBooking.roomBufferDuration) setRoomBufferDuration(savedBooking.roomBufferDuration);
      if (savedBooking.maxBookingsPerDay) setMaxBookingsPerDay(savedBooking.maxBookingsPerDay);
    }
    // Workspace Defaults
    if (savedWorkspace) {
      if (typeof savedWorkspace.autoAssign === 'boolean') setAutoAssign(savedWorkspace.autoAssign);
      if (typeof savedWorkspace.seatSwitching === 'boolean') setSeatSwitching(savedWorkspace.seatSwitching);
      if (typeof savedWorkspace.realTimeOccupancy === 'boolean') setRealTimeOccupancy(savedWorkspace.realTimeOccupancy);
      if (savedWorkspace.seatVisibility) setSeatVisibility(savedWorkspace.seatVisibility);
      if (savedWorkspace.roomNamingFormat) setRoomNamingFormat(savedWorkspace.roomNamingFormat);
      if (savedWorkspace.defaultAvailabilityStatus) setDefaultAvailabilityStatus(savedWorkspace.defaultAvailabilityStatus);
    }
    // Operational Defaults
    if (savedOps) {
      if (typeof savedOps.emergencyOverride === 'boolean') setEmergencyOverride(savedOps.emergencyOverride);
      if (savedOps.openingTime) setOpeningTime(savedOps.openingTime);
      if (savedOps.closingTime) setClosingTime(savedOps.closingTime);
      if (Array.isArray(savedOps.workingDays)) setWorkingDays(savedOps.workingDays);
      if (savedOps.meetingRoomLimit) setMeetingRoomLimit(savedOps.meetingRoomLimit);
      if (savedOps.eventDurationLimit) setEventDurationLimit(savedOps.eventDurationLimit);
      if (savedOps.maintenanceWindowStart) setMaintenanceWindowStart(savedOps.maintenanceWindowStart);
      if (savedOps.maintenanceWindowEnd) setMaintenanceWindowEnd(savedOps.maintenanceWindowEnd);
      if (savedOps.cleaningBufferDuration) setCleaningBufferDuration(savedOps.cleaningBufferDuration);
    }
  }, [savedBooking, savedWorkspace, savedOps]);

  const handleSave = async () => {
    if (!primaryCenter) return;
    setSaving(true);
    try {
      // updateCenterSettings deep-merges into Center.settings, so this won't
      // wipe sibling groups (finance/security/notifications) saved elsewhere.
      await updateCenterSettings(primaryCenter.id, {
        bookingDefaults: {
          lastMinuteBooking,
          overbooking,
          bookingCutoffTime,
          cancellationWindow,
          roomBufferDuration,
          maxBookingsPerDay,
        },
        workspaceDefaults: {
          autoAssign,
          seatSwitching,
          realTimeOccupancy,
          seatVisibility,
          roomNamingFormat,
          defaultAvailabilityStatus,
        },
        operations: {
          emergencyOverride,
          openingTime,
          closingTime,
          workingDays,
          meetingRoomLimit,
          eventDurationLimit,
          maintenanceWindowStart,
          maintenanceWindowEnd,
          cleaningBufferDuration,
        },
      });
      toast.success("Center defaults saved");
    } catch {
      toast.error("Could not save center defaults");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!savedOps) {
      setLastMinuteBooking(true); setOverbooking(false); setAutoAssign(false);
      setSeatSwitching(true); setRealTimeOccupancy(true); setEmergencyOverride(false);
      setBookingCutoffTime("30 minutes before slot");
      setCancellationWindow("2"); setRoomBufferDuration("15"); setMaxBookingsPerDay("5");
      setSeatVisibility("Public - All seats visible to everyone");
      setRoomNamingFormat("Centre code + type + floor + number");
      setDefaultAvailabilityStatus("Available - Ready for booking");
      setOpeningTime("9:00 AM"); setClosingTime("8:00 PM");
      setWorkingDays(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
      setMeetingRoomLimit("3"); setEventDurationLimit("2");
      setMaintenanceWindowStart("10:00 PM"); setMaintenanceWindowEnd("6:00 AM");
      setCleaningBufferDuration("30");
    } else {
      setLastMinuteBooking(savedOps.lastMinuteBooking ?? true);
      setOverbooking(savedOps.overbooking ?? false);
      setAutoAssign(savedOps.autoAssign ?? false);
      setSeatSwitching(savedOps.seatSwitching ?? true);
      setRealTimeOccupancy(savedOps.realTimeOccupancy ?? true);
      setEmergencyOverride(savedOps.emergencyOverride ?? false);
      setBookingCutoffTime(savedOps.bookingCutoffTime ?? "30 minutes before slot");
      setCancellationWindow(savedOps.cancellationWindow ?? "2");
      setRoomBufferDuration(savedOps.roomBufferDuration ?? "15");
      setMaxBookingsPerDay(savedOps.maxBookingsPerDay ?? "5");
      setSeatVisibility(savedOps.seatVisibility ?? "Public - All seats visible to everyone");
      setRoomNamingFormat(savedOps.roomNamingFormat ?? "Centre code + type + floor + number");
      setDefaultAvailabilityStatus(savedOps.defaultAvailabilityStatus ?? "Available - Ready for booking");
      setOpeningTime(savedOps.openingTime ?? "9:00 AM");
      setClosingTime(savedOps.closingTime ?? "8:00 PM");
      setWorkingDays(savedOps.workingDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
      setMeetingRoomLimit(savedOps.meetingRoomLimit ?? "3");
      setEventDurationLimit(savedOps.eventDurationLimit ?? "2");
      setMaintenanceWindowStart(savedOps.maintenanceWindowStart ?? "10:00 PM");
      setMaintenanceWindowEnd(savedOps.maintenanceWindowEnd ?? "6:00 AM");
      setCleaningBufferDuration(savedOps.cleaningBufferDuration ?? "30");
    }
    toast.info("Reverted to saved defaults");
  };

  return (
    <div className={styles.page}>

      {/* Top Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Center Defaults</h1>
          <p className={styles.headerSubtitle}>Set global operational rules applied across all centers</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.resetBtn} onClick={handleReset} disabled={saving || !primaryCenter}>
            {Icons.reset} Reset Default
          </button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !primaryCenter}>
            {Icons.save} {saving ? 'Saving…' : 'Save Rules'}
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
                    <select className={`${styles.inputBox} ${styles.selectBox}`} value={bookingCutoffTime} onChange={e => setBookingCutoffTime(e.target.value)}>
                      <option>30 minutes before slot</option>
                      <option>1 hour before slot</option>
                      <option>2 hours before slot</option>
                      <option>4 hours before slot</option>
                      <option>12 hours before slot</option>
                      <option>24 hours before slot</option>
                    </select>
                    <span className={styles.inputSub}>Latest time users can book a room before the slot starts</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Cancellation Window</label>
                    <div className={styles.inputWithSuffix}>
                      <input type="text" className={styles.inputBox} value={cancellationWindow} onChange={e => setCancellationWindow(e.target.value)} />
                      <span className={styles.inputSuffix}>hours</span>
                    </div>
                    <span className={styles.inputSub}>Users must cancel at least this many hours before booking</span>
                  </div>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Room Buffer Duration</label>
                  <div className={styles.inlineInputGroup}>
                    <input type="text" className={styles.inputBox} style={{ width: '120px' }} value={roomBufferDuration} onChange={e => setRoomBufferDuration(e.target.value)} />
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
                    <input type="text" className={styles.inputBox} style={{ width: '120px' }} value={maxBookingsPerDay} onChange={e => setMaxBookingsPerDay(e.target.value)} />
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
                  <select className={`${styles.inputBox} ${styles.selectBox}`} value={seatVisibility} onChange={e => setSeatVisibility(e.target.value)}>
                    <option>Public - All seats visible to everyone</option>
                    <option>Private - Seats visible to admin only</option>
                    <option>Team Only - Seats visible to team members only</option>
                  </select>
                  <span className={styles.inputSub}>Controls who can view and select seats across all centers</span>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Room Naming Format</label>
                  <select className={`${styles.inputBox} ${styles.selectBox}`} value={roomNamingFormat} onChange={e => setRoomNamingFormat(e.target.value)}>
                    <option>Centre code + type + floor + number</option>
                    <option>Type + floor + number only</option>
                    <option>Custom name per room</option>
                    <option>Floor + room number only</option>
                  </select>
                  <span className={styles.inputSub}>Examples: SJ34- desk-A-1</span>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Default Availability Status</label>
                  <select className={`${styles.inputBox} ${styles.selectBox}`} value={defaultAvailabilityStatus} onChange={e => setDefaultAvailabilityStatus(e.target.value)}>
                    <option>Available - Ready for booking</option>
                    <option>Maintenance - Under maintenance</option>
                    <option>Reserved - Reserved for specific use</option>
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
                    <input type="text" className={styles.inputBox} value={openingTime} onChange={e => setOpeningTime(e.target.value)} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Closing Time</label>
                    <input type="text" className={styles.inputBox} value={closingTime} onChange={e => setClosingTime(e.target.value)} />
                  </div>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Working Days</label>
                  <div className={styles.pillGroup}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
                      const active = workingDays.includes(day);
                      return (
                        <div
                          key={day}
                          className={`${styles.pill} ${active ? styles.pillActive : ''}`}
                          onClick={() => {
                            setWorkingDays(prev =>
                              active ? prev.filter(d => d !== day) : [...prev, day]
                            );
                          }}
                        >
                          {day}
                        </div>
                      );
                    })}
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
                      <input type="text" className={styles.inputBox} style={{ width: '80px' }} value={meetingRoomLimit} onChange={e => setMeetingRoomLimit(e.target.value)} />
                      <span className={styles.inputSub}>per week</span>
                    </div>
                    <span className={styles.inputSub}>Maximum weekly meeting room bookings per user</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Event Duration Limits</label>
                    <div className={styles.inlineInputGroup}>
                      <input type="text" className={styles.inputBox} style={{ width: '80px' }} value={eventDurationLimit} onChange={e => setEventDurationLimit(e.target.value)} />
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
                      <input type="text" className={styles.inputBox} value={maintenanceWindowStart} onChange={e => setMaintenanceWindowStart(e.target.value)} />
                    </div>
                    <div className={styles.inputGroup}>
                      <span className={styles.inputSub} style={{ fontSize: '13px', color: '#6B7280' }}>End Time</span>
                      <input type="text" className={styles.inputBox} value={maintenanceWindowEnd} onChange={e => setMaintenanceWindowEnd(e.target.value)} />
                    </div>
                  </div>
                  <span className={styles.inputSub}>Scheduled maintenance and system updates window</span>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Cleaning Buffer Duration</label>
                  <div className={styles.inlineInputGroup}>
                    <input type="text" className={styles.inputBox} style={{ width: '120px' }} value={cleaningBufferDuration} onChange={e => setCleaningBufferDuration(e.target.value)} />
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
                    <span className={styles.infoBoxText}>Meeting rooms: <b>3 bookings/week</b><br />Maximum event duration: <b>2 hours</b></span>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.settings}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Maintenance Window</span>
                    <span className={styles.infoBoxText}><b>10:00 PM - 6:00 AM</b><br />System unavailable during maintenance</span>
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
