"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { toast } from "sonner";
import { GET_MY_CENTERS } from "@/lib/apollo/operations";
import { useUpdateCenterSettings } from "@/hooks/use-settings";
import styles from "./center.module.css";

const Icons = {
  mapPin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  box: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  externalLink: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  ),
  upload: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  save: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  ),
};

export default function CenterManagerConfig() {
  const [saving, setSaving] = useState(false);

  // Load center data
  const { data: centersData } = useQuery(GET_MY_CENTERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const { update: updateCenterSettings } = useUpdateCenterSettings();
  const centers = centersData?.myCenters ?? [];
  const primaryCenter = centers[0];

  // Config State
  const [centerName, setCenterName] = useState("Chandigarh Hub");
  const [emergencyContact, setEmergencyContact] = useState("+91 98765 43210");
  const [address, setAddress] = useState("");
  const [mapsLink, setMapsLink] = useState("https://maps.google.com/?q=Chandigarh+Hub");

  // Ops State
  const [openingTime, setOpeningTime] = useState("9:00 AM");
  const [closingTime, setClosingTime] = useState("9:00 PM");
  const [workingDays, setWorkingDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const [pantryStart, setPantryStart] = useState("");
  const [pantryEnd, setPantryEnd] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");

  // Inventory State
  const [seatCapacity, setSeatCapacity] = useState("120");
  const [hotDesks, setHotDesks] = useState("60");
  const [privateCabins, setPrivateCabins] = useState("12");
  const [meetingRooms, setMeetingRooms] = useState("8");
  const [eventSpace, setEventSpace] = useState("2");

  // Dynamic Rules State
  const [bookingBuffer, setBookingBuffer] = useState("30");
  const [roomCooldown, setRoomCooldown] = useState("15");
  const [bookingCutoff, setBookingCutoff] = useState("30");
  const [maxDuration, setMaxDuration] = useState("240");
  const [advanceBooking, setAdvanceBooking] = useState("7");

  const savedSettings = (primaryCenter?.settings as Record<string, any> | null) ?? null;
  const savedOps = savedSettings?.operations ?? null;
  const savedManagerConfig = savedSettings?.managerConfig ?? null;
  const savedBooking = savedSettings?.bookingDefaults ?? null;

  useEffect(() => {
    if (primaryCenter) {
      setCenterName(primaryCenter.name || centerName);
    }
    if (savedOps) {
      if (savedOps.openingTime) setOpeningTime(savedOps.openingTime);
      if (savedOps.closingTime) setClosingTime(savedOps.closingTime);
      if (Array.isArray(savedOps.workingDays)) setWorkingDays(savedOps.workingDays);
    }
    if (savedBooking) {
      if (savedBooking.roomBufferDuration) setRoomCooldown(savedBooking.roomBufferDuration);
    }
    if (savedManagerConfig) {
      if (savedManagerConfig.emergencyContact) setEmergencyContact(savedManagerConfig.emergencyContact);
      if (savedManagerConfig.address) setAddress(savedManagerConfig.address);
      if (savedManagerConfig.mapsLink) setMapsLink(savedManagerConfig.mapsLink);
      if (savedManagerConfig.pantryStart) setPantryStart(savedManagerConfig.pantryStart);
      if (savedManagerConfig.pantryEnd) setPantryEnd(savedManagerConfig.pantryEnd);
      if (savedManagerConfig.eventStart) setEventStart(savedManagerConfig.eventStart);
      if (savedManagerConfig.eventEnd) setEventEnd(savedManagerConfig.eventEnd);
      if (savedManagerConfig.seatCapacity) setSeatCapacity(savedManagerConfig.seatCapacity);
      if (savedManagerConfig.hotDesks) setHotDesks(savedManagerConfig.hotDesks);
      if (savedManagerConfig.privateCabins) setPrivateCabins(savedManagerConfig.privateCabins);
      if (savedManagerConfig.meetingRooms) setMeetingRooms(savedManagerConfig.meetingRooms);
      if (savedManagerConfig.eventSpace) setEventSpace(savedManagerConfig.eventSpace);
      if (savedManagerConfig.bookingBuffer) setBookingBuffer(savedManagerConfig.bookingBuffer);
      if (savedManagerConfig.bookingCutoff) setBookingCutoff(savedManagerConfig.bookingCutoff);
      if (savedManagerConfig.maxDuration) setMaxDuration(savedManagerConfig.maxDuration);
      if (savedManagerConfig.advanceBooking) setAdvanceBooking(savedManagerConfig.advanceBooking);
    }
  }, [primaryCenter, savedOps, savedManagerConfig, savedBooking]);

  const handleSave = async () => {
    if (!primaryCenter) return;
    setSaving(true);
    try {
      await updateCenterSettings(primaryCenter.id, {
        operations: {
          openingTime,
          closingTime,
          workingDays,
        },
        bookingDefaults: {
          roomBufferDuration: roomCooldown,
        },
        managerConfig: {
          emergencyContact,
          address,
          mapsLink,
          pantryStart,
          pantryEnd,
          eventStart,
          eventEnd,
          seatCapacity,
          hotDesks,
          privateCabins,
          meetingRooms,
          eventSpace,
          bookingBuffer,
          bookingCutoff,
          maxDuration,
          advanceBooking,
        }
      });
      toast.success("Center configuration saved");
    } catch {
      toast.error("Could not save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Top Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Center Configuration</h1>
          <p className={styles.headerSubtitle}>Manage your center's operations, spaces, and availability</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !primaryCenter}>
            {Icons.save} {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* 1. Center Configuration Card */}
      <div className={styles.contentCard}>
        <div className={styles.formHeader}>
          <div className={styles.formIcon}>{Icons.mapPin}</div>
          <h2 className={styles.formTitle}>Center Configuration</h2>
        </div>

        <div className={styles.inputGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Center Name <span style={{color: '#FF7847'}}>*</span></label>
            <input type="text" className={styles.inputBox} value={centerName} onChange={e => setCenterName(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Emergency Contact <span style={{color: '#FF7847'}}>*</span></label>
            <input type="text" className={styles.inputBox} value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} />
          </div>
        </div>
        
        <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
          <label className={styles.inputLabel}>Address <span style={{color: '#FF7847'}}>*</span></label>
          <input type="text" className={styles.inputBox} value={address} onChange={e => setAddress(e.target.value)} />
        </div>

        <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
          <label className={styles.inputLabel}>Google Maps Link</label>
          <div className={styles.inputWithSuffix}>
            <input type="text" className={styles.inputBox} value={mapsLink} onChange={e => setMapsLink(e.target.value)} />
            <span className={styles.inputSuffix} style={{ cursor: 'pointer', color: '#FF7847', display: 'flex', gap: '4px', alignItems: 'center' }} onClick={() => window.open(mapsLink, '_blank')}>
              {Icons.externalLink} View on Map
            </span>
          </div>
        </div>
      </div>

      {/* 2. Operations Card */}
      <div className={styles.contentCard}>
        <div className={styles.formHeader}>
          <div className={styles.formIconGrey}>{Icons.clock}</div>
          <h2 className={styles.formTitle}>Operations</h2>
        </div>
        <p className={styles.inputSub} style={{ marginTop: '-20px', marginBottom: '8px' }}>Working hours and operational timings</p>

        <div className={styles.inputGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Opening Time</label>
            <div className={styles.inputWithSuffix}>
              <input type="text" className={styles.inputBox} value={openingTime} onChange={e => setOpeningTime(e.target.value)} />
              <span className={styles.inputSuffix}>{Icons.clock}</span>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Closing Time</label>
            <div className={styles.inputWithSuffix}>
              <input type="text" className={styles.inputBox} value={closingTime} onChange={e => setClosingTime(e.target.value)} />
              <span className={styles.inputSuffix}>{Icons.clock}</span>
            </div>
          </div>
        </div>

        <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
          <label className={styles.inputLabel}>Working Days</label>
          <div className={styles.pillGroup} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
              const active = workingDays.includes(day);
              return (
                <div
                  key={day}
                  className={`${styles.pill} ${active ? styles.pillActive : ''}`}
                  style={{ textAlign: 'center' }}
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
        </div>

        <div className={styles.inputGrid} style={{ marginTop: '16px' }}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Pantry Start</label>
            <input type="text" className={styles.inputBox} value={pantryStart} onChange={e => setPantryStart(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Pantry End</label>
            <input type="text" className={styles.inputBox} value={pantryEnd} onChange={e => setPantryEnd(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Event Start</label>
            <input type="text" className={styles.inputBox} value={eventStart} onChange={e => setEventStart(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Event End</label>
            <input type="text" className={styles.inputBox} value={eventEnd} onChange={e => setEventEnd(e.target.value)} />
          </div>
        </div>

        <div className={styles.summaryBoxLight}>
          <b>Summary:</b> Open {openingTime} - {closingTime} | {workingDays.join(", ")}
        </div>
      </div>

      {/* 3. Inventory Settings */}
      <div className={styles.contentCard}>
        <div className={styles.formHeader}>
          <div className={styles.formIconGrey}>{Icons.box}</div>
          <h2 className={styles.formTitle}>Inventory Settings</h2>
        </div>
        <p className={styles.inputSub} style={{ marginTop: '-20px', marginBottom: '8px' }}>Space capacity and floor management</p>

        <label className={styles.inputLabel}>Capacity</label>
        <div className={styles.inputGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{fontWeight: 400}}>Seat Capacity</label>
            <input type="text" className={styles.inputBox} value={seatCapacity} onChange={e => setSeatCapacity(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{fontWeight: 400}}>Hot Desks</label>
            <input type="text" className={styles.inputBox} value={hotDesks} onChange={e => setHotDesks(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{fontWeight: 400}}>Private Cabins</label>
            <input type="text" className={styles.inputBox} value={privateCabins} onChange={e => setPrivateCabins(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{fontWeight: 400}}>Meeting Rooms</label>
            <input type="text" className={styles.inputBox} value={meetingRooms} onChange={e => setMeetingRooms(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{fontWeight: 400}}>Event Space</label>
            <input type="text" className={styles.inputBox} value={eventSpace} onChange={e => setEventSpace(e.target.value)} />
          </div>
        </div>

        <label className={styles.inputLabel} style={{ marginTop: '16px' }}>Floor Management</label>
        <div className={styles.inputGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{fontWeight: 400}}>Floor Plan</label>
            <div className={styles.uploadBox}>
              <div className={styles.uploadIcon}>{Icons.upload}</div>
              <div className={styles.uploadText}>Upload Floor Plan</div>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{fontWeight: 400}}>Seat Map</label>
            <div className={styles.uploadBox}>
              <div className={styles.uploadIcon}>{Icons.upload}</div>
              <div className={styles.uploadText}>Upload Seat Map</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Dynamic Rules */}
      <div className={styles.contentCard}>
        <div className={styles.formHeader}>
          <div className={styles.formIconGrey}>{Icons.settings}</div>
          <h2 className={styles.formTitle}>Dynamic Rules</h2>
        </div>
        <p className={styles.inputSub} style={{ marginTop: '-20px', marginBottom: '8px' }}>Booking policies and operational constraints</p>

        <div className={styles.inputGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{fontWeight: 400}}>Booking Buffer (minutes)</label>
            <input type="text" className={styles.inputBox} value={bookingBuffer} onChange={e => setBookingBuffer(e.target.value)} />
            <span className={styles.inputSub}>Time buffer between consecutive bookings</span>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{fontWeight: 400}}>Room Cooldown (minutes)</label>
            <input type="text" className={styles.inputBox} value={roomCooldown} onChange={e => setRoomCooldown(e.target.value)} />
            <span className={styles.inputSub}>Rooms remain unavailable after each booking</span>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{fontWeight: 400}}>Booking Cutoff (minutes)</label>
            <input type="text" className={styles.inputBox} value={bookingCutoff} onChange={e => setBookingCutoff(e.target.value)} />
            <span className={styles.inputSub}>Users can book up to this time before start</span>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{fontWeight: 400}}>Max Duration (minutes)</label>
            <input type="text" className={styles.inputBox} value={maxDuration} onChange={e => setMaxDuration(e.target.value)} />
            <span className={styles.inputSub}>Maximum booking duration allowed at a stretch</span>
          </div>
        </div>

        <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
          <label className={styles.inputLabel} style={{fontWeight: 400}}>Advance Booking (days)</label>
          <input type="text" className={styles.inputBox} value={advanceBooking} onChange={e => setAdvanceBooking(e.target.value)} />
          <span className={styles.inputSub}>How far in advance users can book spaces</span>
        </div>

        <div className={styles.summaryBoxLight}>
          <b style={{display: 'block', marginBottom: '8px'}}>Booking Behavior Summary</b>
          <ul className={styles.bulletList} style={{ margin: 0, paddingLeft: '8px' }}>
            <li>Users can book rooms up to {bookingCutoff} minutes before start time</li>
            <li>Rooms remain unavailable for {roomCooldown} minutes after each booking</li>
            <li>Maximum booking duration: {maxDuration} minutes ({Math.round(Number(maxDuration)/60)}h)</li>
            <li>Advance booking allowed up to {advanceBooking} days in advance</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
