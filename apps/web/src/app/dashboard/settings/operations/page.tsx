/**
 * File:        apps/web/src/app/dashboard/settings/operations/page.tsx
 * Module:      Web · Dashboard · Settings · Operations
 * Purpose:     Operations settings — booking rules, room defaults, and maintenance windows
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */
'use client';

import { useState } from 'react';
import { useSettingsGroup } from '@/hooks/use-settings';
import styles from './operations.module.css';

const Icons = {
  reset: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <polyline points="3 3 3 8 8 8" />
    </svg>
  ),
  save: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  calendar: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  clock: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  users: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  room: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  tool: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
};

export default function OperationsSettingsPage() {
  const [activeTab, setActiveTab] = useState('Booking Rules');

  const booking = useSettingsGroup('bookingRules', {
    advanceBookingDays: '30',
    minBookingDuration: '1',
    maxBookingDuration: '8',
    cancellationHours: '24',
    autoConfirmBooking: true,
    allowRecurring: true,
    bufferMinutes: '15',
  });

  const room = useSettingsGroup('roomDefaults', {
    defaultCapacity: '10',
    allowOverbooking: false,
    gracePeriodMinutes: '10',
    cleanupDurationMinutes: '30',
  });

  const maintenance = useSettingsGroup('maintenance', {
    autoBlockOnMaintenance: true,
    notifyOnMaintenance: true,
    maintenanceLeadDays: '7',
  });

  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Operations</h1>
          <p className={styles.headerSubtitle}>
            Configure booking rules, room defaults, and maintenance windows
          </p>
        </div>
      </div>

      <div className={styles.subTabs}>
        {['Booking Rules', 'Room Defaults', 'Maintenance'].map((tab) => (
          <div
            key={tab}
            className={`${styles.subTab} ${activeTab === tab ? styles.subTabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className={styles.contentCard}>
        {activeTab === 'Booking Rules' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>{Icons.calendar}</span>
              <div>
                <h3 className={styles.sectionTitle}>Booking Rules</h3>
                <p className={styles.sectionSubtitle}>
                  Define how bookings can be made and modified
                </p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <TextInput
                label="Advance Booking (days)"
                sub="Max days ahead a booking can be made"
                value={(booking.draft as any).advanceBookingDays}
                onChange={(v) => booking.set('advanceBookingDays', v)}
              />
              <TextInput
                label="Min Duration (hours)"
                sub="Shortest allowed booking slot"
                value={(booking.draft as any).minBookingDuration}
                onChange={(v) => booking.set('minBookingDuration', v)}
              />
              <TextInput
                label="Max Duration (hours)"
                sub="Longest single booking allowed"
                value={(booking.draft as any).maxBookingDuration}
                onChange={(v) => booking.set('maxBookingDuration', v)}
              />
              <TextInput
                label="Cancellation Cutoff (hours)"
                sub="Hours before start when cancellation closes"
                value={(booking.draft as any).cancellationHours}
                onChange={(v) => booking.set('cancellationHours', v)}
              />
            </div>

            <div className={styles.toggleCards}>
              <ToggleRow
                icon={Icons.clock}
                title="Auto-Confirm Bookings"
                subtitle="Automatically confirm bookings without manual approval"
                on={(booking.draft as any).autoConfirmBooking}
                onChange={(v) => booking.set('autoConfirmBooking', v)}
              />
              <ToggleRow
                icon={Icons.calendar}
                title="Allow Recurring Bookings"
                subtitle="Let users create daily/weekly repeating slots"
                on={(booking.draft as any).allowRecurring}
                onChange={(v) => booking.set('allowRecurring', v)}
              />
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.resetBtn}
                onClick={booking.reset}
                disabled={booking.saving}
              >
                {Icons.reset} Reset
              </button>
              <button
                className={styles.saveBtn}
                onClick={booking.save}
                disabled={booking.saving}
              >
                {Icons.save} {booking.saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Room Defaults' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>{Icons.room}</span>
              <div>
                <h3 className={styles.sectionTitle}>Room Defaults</h3>
                <p className={styles.sectionSubtitle}>
                  Default capacities and overbooking behavior
                </p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <TextInput
                label="Default Capacity"
                sub="Default max occupants per space"
                value={(room.draft as any).defaultCapacity}
                onChange={(v) => room.set('defaultCapacity', v)}
              />
              <TextInput
                label="Cleanup Buffer (minutes)"
                sub="Gap between consecutive bookings"
                value={(room.draft as any).cleanupDurationMinutes}
                onChange={(v) => room.set('cleanupDurationMinutes', v)}
              />
              <TextInput
                label="Grace Period (minutes)"
                sub="Late-arrival tolerance before releasing"
                value={(room.draft as any).gracePeriodMinutes}
                onChange={(v) => room.set('gracePeriodMinutes', v)}
              />
            </div>

            <div className={styles.toggleCards}>
              <ToggleRow
                icon={Icons.users}
                title="Allow Overbooking"
                subtitle="Permit double-booking during peak hours"
                on={(room.draft as any).allowOverbooking}
                onChange={(v) => room.set('allowOverbooking', v)}
              />
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.resetBtn}
                onClick={room.reset}
                disabled={room.saving}
              >
                {Icons.reset} Reset
              </button>
              <button
                className={styles.saveBtn}
                onClick={room.save}
                disabled={room.saving}
              >
                {Icons.save} {room.saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Maintenance' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>{Icons.tool}</span>
              <div>
                <h3 className={styles.sectionTitle}>Maintenance Windows</h3>
                <p className={styles.sectionSubtitle}>
                  How the system handles scheduled downtime
                </p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <TextInput
                label="Lead Notice (days)"
                sub="Days ahead to announce maintenance"
                value={(maintenance.draft as any).maintenanceLeadDays}
                onChange={(v) => maintenance.set('maintenanceLeadDays', v)}
              />
            </div>

            <div className={styles.toggleCards}>
              <ToggleRow
                icon={Icons.room}
                title="Auto-Block Bookings"
                subtitle="Prevent new bookings during maintenance windows"
                on={(maintenance.draft as any).autoBlockOnMaintenance}
                onChange={(v) => maintenance.set('autoBlockOnMaintenance', v)}
              />
              <ToggleRow
                icon={Icons.users}
                title="Notify Affected Users"
                subtitle="Send alerts to users with bookings during downtime"
                on={(maintenance.draft as any).notifyOnMaintenance}
                onChange={(v) => maintenance.set('notifyOnMaintenance', v)}
              />
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.resetBtn}
                onClick={maintenance.reset}
                disabled={maintenance.saving}
              >
                {Icons.reset} Reset
              </button>
              <button
                className={styles.saveBtn}
                onClick={maintenance.save}
                disabled={maintenance.saving}
              >
                {Icons.save} {maintenance.saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TextInput({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.inputLabel}>{label}</label>
      <input
        type="number"
        className={styles.inputBox}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className={styles.inputSub}>{sub}</span>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  on,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={styles.toggleCard}>
      <div className={styles.toggleInfo}>
        <div className={styles.toggleTitleWrap}>
          <span className={styles.toggleIcon}>{icon}</span>
          <span className={styles.toggleTitle}>{title}</span>
        </div>
        <span className={styles.toggleSub}>{subtitle}</span>
      </div>
      <div
        className={`${styles.toggleSwitch} ${!on ? styles.toggleSwitchOff : ''}`}
        onClick={() => onChange(!on)}
      >
        <div
          className={styles.toggleKnob}
          style={{ transform: on ? 'translateX(24px)' : 'translateX(0px)' }}
        />
      </div>
    </div>
  );
}
