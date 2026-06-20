/**
 * File:        apps/web/src/app/dashboard/crm/onboarding/page.tsx
 * Module:      Web · Dashboard · CRM · Onboarding
 * Purpose:     Onboarding hub. Mirrors the Figma "Onboarding" tab
 *              (node 0-25984 / 0-25985). The pill switcher
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

/* ----------------------------- Icons ----------------------------- */

const Icon = {
  UserPlus: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 21c0-3.866 3.134-7 7-7s7 3.134 7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M19 8v6M22 11h-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Spark: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.8 5.4a2 2 0 0 0 1.3 1.3L20.5 10.5l-5.4 1.8a2 2 0 0 0-1.3 1.3L12 19.5l-1.8-5.9a2 2 0 0 0-1.3-1.3L3.5 10.5l5.4-1.8a2 2 0 0 0 1.3-1.3L12 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Check: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Arrow: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Clipboard: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="4" width="12" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9 4h6v3H9zM9 11h6M9 15h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* ------------------------- Pipeline steps ------------------------ */

interface Step {
  index: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    index: 1,
    title: 'Capture Lead',
    description: 'Inquiries from website, walk-ins, and referrals land here automatically.',
  },
  {
    index: 2,
    title: 'Qualify & Visit',
    description: 'Schedule a tour, capture requirements, and check budget fit.',
  },
  {
    index: 3,
    title: 'Negotiate',
    description: 'Align on seats, pricing and move-in date with the prospect.',
  },
  {
    index: 4,
    title: 'Convert',
    description: 'Issue the booking, kick off paperwork and welcome the customer.',
  },
];

export default function OnboardingPage() {
  return (
    <div className={styles.shell}>
      {/* ---------------------------- Header card ---------------------------- */}
      <section className={styles.headerCard} aria-labelledby="onb-title">
        <div className={styles.headerCopy}>
          <h1 id="onb-title" className={styles.headerTitle}>
            Onboarding
          </h1>
          <p className={styles.headerSub}>
            A guided path from first enquiry to an active customer.
            Track every prospect as they move through the onboarding
            pipeline.
          </p>
        </div>
        <div className={styles.headerArt} aria-hidden="true">
          {Icon.Spark}
        </div>
      </section>

      {/* ----------------------------- Stats grid ---------------------------- */}
      <section className={styles.statsGrid} aria-label="Onboarding summary">
        <article className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.iconTeal}`}>
            {Icon.UserPlus}
          </div>
          <div className={styles.statBody}>
            <p className={styles.statValue}>24</p>
            <p className={styles.statLabel}>New this week</p>
          </div>
        </article>

        <article className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.iconOrange}`}>
            {Icon.Clipboard}
          </div>
          <div className={styles.statBody}>
            <p className={styles.statValue}>11</p>
            <p className={styles.statLabel}>Visits scheduled</p>
          </div>
        </article>

        <article className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.iconBlue}`}>
            {Icon.Arrow}
          </div>
          <div className={styles.statBody}>
            <p className={styles.statValue}>7</p>
            <p className={styles.statLabel}>In negotiation</p>
          </div>
        </article>

        <article className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.iconGreen}`}>
            {Icon.Check}
          </div>
          <div className={styles.statBody}>
            <p className={styles.statValue}>5</p>
            <p className={styles.statLabel}>Converted this week</p>
          </div>
        </article>
      </section>

      {/* --------------------------- Pipeline card --------------------------- */}
      <section className={styles.pipelineCard} aria-labelledby="onb-pipeline">
        <header className={styles.pipelineHead}>
          <div>
            <h2 id="onb-pipeline" className={styles.pipelineTitle}>
              Onboarding Pipeline
            </h2>
            <p className={styles.pipelineSub}>
              Four steps from inquiry to an active customer.
            </p>
          </div>
          <button type="button" className={styles.pipelineCta}>
            View all leads
            {Icon.Arrow}
          </button>
        </header>

        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li key={s.index} className={styles.step}>
              <div className={styles.stepBadge}>
                <span>{s.index}</span>
              </div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.description}</p>
              </div>
              {i < STEPS.length - 1 && (
                <span className={styles.stepDivider} aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
