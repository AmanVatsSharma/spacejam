/**
 * File:        apps/web/src/app/dashboard/meeting-room/request/page.tsx
 * Module:      Web · Dashboard · Meeting Room · Request
 * Purpose:     Placeholder for the Request tab. Reachable via the
 *              dashboard header pill tab "Request". Replace with the
 *              real booking-request flow once the Figma spec lands.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */

import styles from "./request.module.css";

export default function MeetingRoomRequestPage() {
  return (
    <div className={styles.page}>
      <section className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>Requests</h1>
          <p className={styles.heroSubtitle}>
            Manage meeting-room booking requests from members
          </p>
        </div>
        <button type="button" className={styles.heroAction}>
          <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>+</span>
          <span>New Request</span>
        </button>
      </section>

      <section className={styles.placeholderCard}>
        <h2 className={styles.placeholderTitle}>Coming soon</h2>
        <p className={styles.placeholderText}>
          The Request workspace is reserved for member booking requests, approvals,
          and follow-ups. Hook it up to the meetings API once the backend endpoint
          ships.
        </p>
      </section>
    </div>
  );
}