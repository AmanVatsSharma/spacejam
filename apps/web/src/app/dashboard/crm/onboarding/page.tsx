/**
 * File:        apps/web/src/app/dashboard/crm/onboarding/page.tsx
 * Module:      Web · Dashboard · CRM · Onboarding
 * Purpose:     Onboarding hub. Mirrors the Figma "Onboarding" tab
 *              (node 0-25984 / 0-25985) exactly. The pill switcher
 *              (Customers · Leads · Onboarding) and the main sidebar
 *              live in the shared `dashboard/layout.tsx` chrome; this
 *              page renders only the page body so it stays consistent
 *              across the CRM section.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
'use client';

import styles from './onboarding.module.css';

/**
 * The Figma "Onboarding" screen (node 0-25984) is intentionally empty
 * beneath the page header. We render only that header card and let the
 * shell's warm-cream background show through below, so the page stays
 * in lockstep with the design while leaving room for future content.
 */
export default function OnboardingPage() {
  return (
    <div className={styles.shell}>
      {/* ---------------------------- Header card ---------------------------- */}
      <section className={styles.headerCard} aria-labelledby="onb-title">
        <h1 id="onb-title" className={styles.headerTitle}>
          Onboarding
        </h1>
        <p className={styles.headerSub}>
          Track potential clients, manage inquiries, and convert them into members.
        </p>
      </section>
    </div>
  );
}