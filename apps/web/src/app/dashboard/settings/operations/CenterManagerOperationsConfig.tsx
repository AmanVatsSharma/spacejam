"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_MY_CENTERS } from "@/lib/apollo/operations";
import { useUpdateCenterSettings } from "@/hooks/use-settings";
import styles from "./operations.module.css";

const Icons = {
  room: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"></path>
      <path d="M3 10h18"></path>
      <path d="M5 6l7-3 7 3"></path>
      <path d="M4 10v11"></path>
      <path d="M20 10v11"></path>
      <path d="M8 14v3"></path>
      <path d="M12 14v3"></path>
      <path d="M16 14v3"></path>
    </svg>
  ),
  wrench: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
  ),
  facility: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <path d="M9 22v-4h6v4"></path>
      <path d="M8 6h.01"></path>
      <path d="M16 6h.01"></path>
      <path d="M12 6h.01"></path>
      <path d="M12 10h.01"></path>
      <path d="M12 14h.01"></path>
      <path d="M16 10h.01"></path>
      <path d="M16 14h.01"></path>
      <path d="M8 10h.01"></path>
      <path d="M8 14h.01"></path>
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  alertTriangle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  checkCircle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  )
};

export default function CenterManagerOperationsConfig() {
  // Load center data
  const { data: centersData } = useQuery(GET_MY_CENTERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const { update: updateCenterSettings } = useUpdateCenterSettings();
  const centers = centersData?.myCenters ?? [];
  const primaryCenter = centers[0];

  const savedSettings = (primaryCenter?.settings as Record<string, any> | null) ?? null;
  const savedOps = savedSettings?.managerConfig?.operations ?? null;

  // States
  const [setupDuration, setSetupDuration] = useState("10");
  const [cleaningBuffer, setCleaningBuffer] = useState("15");
  const [escalationTiming, setEscalationTiming] = useState("30");
  const [printerAccess, setPrinterAccess] = useState(true);
  const [schedules, setSchedules] = useState(["9:00 AM", "6:00 PM"]);
  const [newSchedule, setNewSchedule] = useState("");

  useEffect(() => {
    if (savedOps) {
      if (savedOps.setupDuration) setSetupDuration(savedOps.setupDuration);
      if (savedOps.cleaningBuffer) setCleaningBuffer(savedOps.cleaningBuffer);
      if (savedOps.escalationTiming) setEscalationTiming(savedOps.escalationTiming);
      if (typeof savedOps.printerAccess === 'boolean') setPrinterAccess(savedOps.printerAccess);
      if (Array.isArray(savedOps.schedules)) setSchedules(savedOps.schedules);
    }
  }, [savedOps]);

  useEffect(() => {
    if (!primaryCenter) return;
    const saveSettings = async () => {
      try {
        await updateCenterSettings(primaryCenter.id, {
          managerConfig: {
            operations: {
              setupDuration,
              cleaningBuffer,
              escalationTiming,
              printerAccess,
              schedules
            }
          }
        });
      } catch (err) {
        console.error(err);
      }
    };
    const timeout = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timeout);
  }, [setupDuration, cleaningBuffer, escalationTiming, printerAccess, schedules, primaryCenter]);

  const addSchedule = () => {
    if (newSchedule && !schedules.includes(newSchedule)) {
      setSchedules([...schedules, newSchedule]);
      setNewSchedule("");
    }
  };

  const removeSchedule = (idx: number) => {
    const updated = [...schedules];
    updated.splice(idx, 1);
    setSchedules(updated);
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Operational Preferences</h1>
          <p className={styles.headerSubtitle}>Manage daily operations, timing rules, and service behavior</p>
        </div>
      </div>

      <div className={styles.managerSplitLayout}>
        <div className={styles.managerLeftCol}>
          
          {/* Room & Cleaning Settings */}
          <div className={styles.contentCardSmallPadding}>
            <div className={styles.formHeader}>
              <div className={styles.formIcon} style={{ background: '#FF7847', color: 'white' }}>{Icons.room}</div>
              <div className={styles.headerTitleWrap}>
                <h2 className={styles.formTitle}>Room & Cleaning Settings</h2>
                <p className={styles.inputSub} style={{ margin: 0 }}>Configure room preparation and cleaning timings</p>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <div className={styles.inputGroup} style={{ marginBottom: '16px' }}>
                <label className={styles.inputLabel}>Default Room Setup Duration (minutes)</label>
                <input 
                  type="text" 
                  className={styles.inputBox} 
                  value={setupDuration} 
                  onChange={e => setSetupDuration(e.target.value)} 
                />
                <span className={styles.inputSub}>Rooms will be prepared {setupDuration} minutes before booking</span>
              </div>
              
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Cleaning Buffer (minutes)</label>
                <input 
                  type="text" 
                  className={styles.inputBox} 
                  value={cleaningBuffer} 
                  onChange={e => setCleaningBuffer(e.target.value)} 
                />
                <span className={styles.inputSub}>Cleaning will take {cleaningBuffer} minutes after each session</span>
              </div>

              <div className={styles.impactBox}>
                <b>Impact:</b> These settings ensure smooth room turnover between bookings and prevent scheduling conflicts.
              </div>
            </div>
          </div>

          {/* Maintenance Settings */}
          <div className={styles.contentCardSmallPadding}>
            <div className={styles.formHeader}>
              <div className={styles.formIcon} style={{ background: '#FF7847', color: 'white' }}>{Icons.wrench}</div>
              <div className={styles.headerTitleWrap}>
                <h2 className={styles.formTitle}>Maintenance Settings</h2>
                <p className={styles.inputSub} style={{ margin: 0 }}>Configure maintenance escalation policies</p>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Maintenance Escalation Timing (minutes)</label>
                <input 
                  type="text" 
                  className={styles.inputBox} 
                  value={escalationTiming} 
                  onChange={e => setEscalationTiming(e.target.value)} 
                />
                <span className={styles.inputSub}>If an issue is not resolved within {escalationTiming} min, it will be escalated to senior management</span>
              </div>

              <div className={styles.impactBox}>
                <b>Impact:</b> Escalation helps prevent unresolved operational issues from affecting member experience.
              </div>
            </div>
          </div>

          {/* Facility Settings */}
          <div className={styles.contentCardSmallPadding}>
            <div className={styles.formHeader}>
              <div className={styles.formIcon} style={{ background: '#FF7847', color: 'white' }}>{Icons.facility}</div>
              <div className={styles.headerTitleWrap}>
                <h2 className={styles.formTitle}>Facility Settings</h2>
                <p className={styles.inputSub} style={{ margin: 0 }}>Manage facility availability and schedules</p>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FF7847', marginBottom: '16px' }}>Printer Availability</h3>
              
              <div className={styles.toggleCard} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', background: '#FFFFFF' }}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle} style={{ fontWeight: 400, color: '#FF7847' }}>Enable Printer Access</span>
                  <span className={styles.toggleSub}>Allow members to use printing facilities</span>
                </div>
                <div className={`${styles.toggleSwitch} ${!printerAccess ? styles.toggleSwitchOff : ''}`} onClick={() => setPrinterAccess(!printerAccess)}>
                  <div className={styles.toggleKnob} style={{ transform: printerAccess ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                </div>
              </div>

              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginTop: '32px', marginBottom: '16px' }}>Housekeeping Schedule</h3>
              
              <div className={styles.addSlotRow}>
                <input 
                  type="text" 
                  placeholder="e.g. 1:00 PM" 
                  className={styles.addSlotInput}
                  value={newSchedule}
                  onChange={e => setNewSchedule(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addSchedule(); }}
                />
                <button className={styles.addSlotBtn} onClick={addSchedule}>Add Slot</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {schedules.map((time, idx) => (
                  <div key={idx} className={styles.scheduleRow}>
                    <span className={styles.scheduleTime}>{time}</span>
                    <span className={styles.scheduleRemove} onClick={() => removeSchedule(idx)}>Remove</span>
                  </div>
                ))}
              </div>

              <div className={styles.impactBox} style={{ background: '#FFF9F6', color: '#1F2937' }}>
                <span style={{ color: '#FF7847', fontWeight: 600 }}>Schedule: </span>
                Housekeeping scheduled at {schedules.join(" and ")} daily
              </div>

              <div className={styles.impactBox}>
                <b>Impact:</b> Availability and scheduling directly impact daily center operations and member satisfaction.
              </div>
            </div>
          </div>

        </div>

        {/* Right Info Box Column */}
        <div className={styles.managerRightCol}>
          
          <div className={styles.infoBox}>
            <div className={styles.infoBoxHeader}>
              <div className={styles.infoBoxIcon}>{Icons.clock}</div>
              <div>
                <div className={styles.infoBoxTitle}>Room & Cleaning</div>
                <div className={styles.infoBoxDesc}>These settings ensure smooth room turnover between bookings and prevent scheduling conflicts.</div>
              </div>
            </div>
            <ul className={styles.infoBoxList} style={{ marginTop: '8px' }}>
              <li>Setup duration allows staff to prepare rooms properly</li>
              <li>Cleaning buffer prevents back-to-back bookings without cleanup</li>
            </ul>
          </div>

          <div className={styles.infoBox}>
            <div className={styles.infoBoxHeader}>
              <div className={styles.infoBoxIcon}>{Icons.alertTriangle}</div>
              <div>
                <div className={styles.infoBoxTitle}>Maintenance</div>
                <div className={styles.infoBoxDesc}>Escalation helps prevent unresolved operational issues from affecting member experience.</div>
              </div>
            </div>
            <div className={styles.impactBox} style={{ marginTop: '8px', padding: '12px' }}>
              Critical issues are automatically escalated when timing thresholds are exceeded
            </div>
          </div>

          <div className={styles.infoBox}>
            <div className={styles.infoBoxHeader}>
              <div className={styles.infoBoxIcon}>{Icons.checkCircle}</div>
              <div>
                <div className={styles.infoBoxTitle}>Facility Availability</div>
                <div className={styles.infoBoxDesc}>Availability and scheduling directly impact daily center operations and member satisfaction.</div>
              </div>
            </div>
            <ul className={styles.infoBoxList} style={{ marginTop: '8px' }}>
              <li>Printer access can be toggled based on maintenance or availability</li>
              <li>Housekeeping schedules ensure clean, professional environments</li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}
