# Plan: Customer Detail Page — Figma Design Implementation

## Goal

Replace [apps/web/src/app/dashboard/crm/customers/[id]/page.tsx](apps/web/src/app/dashboard/crm/customers/[id]/page.tsx) with a 360-degree customer view matching the Figma design at node `0:23687` (file key `vLt2UqE3C8JCWb7uJOuOu7`).

## Design Overview

A single-page customer dashboard with:

1. **Profile header** (full width row): back button + avatar circle "TN" + name "TechNova Solutions" (36px) + meta line ("Enterprise · 25 seats" + "Member since Jan 2024") + two outlined action buttons (Generate Invoice, Send Reminder)

2. **KPI cards** (4-column grid): Total Revenue Generated, Outstanding Dues, Active Seats, Security Deposit Held

3. **Two-column main area**:
   - **Left column** (~flexible):
     - Tabs row: Overview (active, orange pill) | Employees | Activity Timeline | Documents
     - Tab panel containing 3 cards stacked:
       - **Membership Details** — 7 fields in 3-column grid (Plan Type, Number of Seats, Type of Seat, Active Since, Renewal Date, Contact Email, Phone Number)
       - **Financial Summary** — 8 fields in 4-column × 2-row grid (Total Paid, Pending Dues, Last Payment, Mode of Payment, Payment Cycle, Invoice Date, Invoice Amount, Security Deposit)
       - **Usage Metrics** — 3 fields (Meeting Rooms This Month, Printing Credits, Wallet Balance)
   - **Right column** (fixed ~300px wide, 4 cards stacked):
     - **Send Alerts & Notifications** (button card)
     - **Quick Actions** — Upgrade Plan, Renew Membership, Freeze Account, Initiate Exit (4 outlined buttons)
     - **Customer Insights** — Lifetime Value, Last Activity
     - **Internal Notes** — textarea + orange "Save Note" button

## Files to Change

| File | Change |
|------|--------|
| `apps/web/src/app/dashboard/crm/customers/[id]/page.tsx` | Complete rewrite to match Figma layout |
| `apps/web/src/app/dashboard/crm/customers/[id]/customer-detail.module.css` | **New** — CSS Module for all components |

(The existing page uses inline styles + tailwind in some sections; the rewrite moves all styling to the new CSS module to match the convention used by sibling pages like `customers.module.css`.)

## Component Structure

```tsx
<div className={styles.shell}>            // padding 24px, flex column, gap 24px

  {/* Row 1: Profile header */}
  <header className={styles.profileHeader}>  // flex, align-center, justify-between
    <div className={styles.profileLeft}>      // back btn + avatar + name/meta
      <button className={styles.backBtn}>←</button>
      <div className={styles.avatar}>TN</div>
      <div>
        <h1 className={styles.customerName}>TechNova Solutions</h1>
        <div className={styles.metaRow}>
          <span>🏢 Enterprise · 25 seats</span>
          <span>📅 Member since Jan 2024</span>
        </div>
      </div>
    </div>
    <div className={styles.profileActions}>
      <button className={styles.actionBtnOutline}>📄 Generate Invoice</button>
      <button className={styles.actionBtnOutline}>🔔 Send Reminder</button>
    </div>
  </header>

  {/* Row 2: KPI cards */}
  <div className={styles.kpiGrid}>          // grid 4 cols, gap 16px
    <KpiCard icon="trending-up" value="₹25,000" label="Total Revenue Generated" />
    <KpiCard icon="rupee" value="₹0" label="Outstanding Dues" />
    <KpiCard icon="users" value="25" label="Active Seats" />
    <KpiCard icon="shield" value="₹5,000" label="Security Deposit Held" />
  </div>

  {/* Row 3: Two-column main */}
  <div className={styles.mainRow}>          // flex, gap 24px
    <div className={styles.leftCol}>        // flex-col, gap 24px
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'overview' && (
        <>
          <Card title="Membership Details">
            <FieldGrid columns={3} fields={[...]} />
          </Card>
          <Card title="Financial Summary">
            <FieldGrid columns={4} fields={[...]} />
          </Card>
          <Card title="Usage Metrics">
            <FieldGrid columns={3} fields={[...]} />
          </Card>
        </>
      )}

      {activeTab === 'employees' && <PlaceholderTab text="Employees list will appear here" />}
      {activeTab === 'activity' && <PlaceholderTab text="Activity Timeline will appear here" />}
      {activeTab === 'documents' && <PlaceholderTab text="Documents will appear here" />}
    </div>

    <aside className={styles.rightCol}>     // w 300px, flex-col, gap 20px
      <Card title="Send Alerts & Notifications" icon="bell" />
      <Card title="Quick Actions">
        <ActionButton label="Upgrade Plan" />
        <ActionButton label="Renew Membership" />
        <ActionButton label="Freeze Account" />
        <ActionButton label="Initiate Exit" />
      </Card>
      <Card title="Customer Insights">
        <Field label="Lifetime Value" value="₹150,000" highlight />
        <Field label="Last Activity" value="2 hours ago" />
      </Card>
      <Card title="Internal Notes">
        <textarea ... />
        <button className={styles.saveNoteBtn}>Save Note</button>
      </Card>
    </aside>
  </div>
</div>
```

## State

```tsx
const [activeTab, setActiveTab] = useState<'overview'|'employees'|'activity'|'documents'>('overview');
const [noteText, setNoteText] = useState('');
const router = useRouter();
const params = useParams<{ id: string }>();
```

## Notes on Placeholder Data

Per CLAUDE.md ("Mock Data Pattern — All pages use mock data currently"), I'll hardcode "TechNova Solutions" as the rendered customer for now, since this is a single-customer route. Real data binding can happen when the API lands.

## Style Decisions

- Avatar: `bg #ff6a2f` (primary orange per CLAUDE.md design tokens), white text "TN", size 80×80, border-radius 14px, font-weight SemiBold 24px
- Card: white bg, 1px border `#e5e7eb`, border-radius 14px, box-shadow `0 1px 1.5px rgba(0,0,0,0.1), 0 1px 1px rgba(0,0,0,0.1)`, padding `21px 25px` (header) + `25px` (top) → varied per card to match Figma
- Tab: pill-style active state with `bg #ff6a2f` + white text, inactive transparent
- KPI card icon wrap: 40×40 rounded 10px, `bg #fff7ed` (or `#ffefe9` variant), orange icon color
- Action button outline: white bg, 1px border `rgba(0,0,0,0.1)`, radius 8px, height 36-44px
- Save Note button: `bg #ff6a2f`, white text, radius 8px, full width
- Font family: Inter, color #101828 (dark), #6a7282 (muted), #4a5565 (mid)
- Title text size: 18px SemiBold
- Body/label: 14px Regular muted
- Value text: 16px Medium dark; KPI value: 24px SemiBold; large field value: 20px SemiBold

## Icons

Inline SVGs (matching the convention in leads/page.tsx). Each KPI card gets a simple stroked SVG icon — matching the visual shape in the Figma (trending up, rupee, users, shield). Right-side cards use bell, bolt, etc.

## Responsive

Single `@media (max-width: 1023.98px)` block:
- Profile header: stack actions below meta
- KPI grid: 2 cols → 1 col under 768px
- Main row: stack vertical (left col full width, right col full width)
- Tab bar: horizontal scroll if needed

## Steps

1. Create `customer-detail.module.css` with all required classes
2. Rewrite `page.tsx` with the new layout, state, and all sections
3. Run `npx nx build web` to verify TypeScript + Tailwind compilation
4. Spot-check `git diff --stat` to confirm only the two intended files changed

## Out of Scope

- No API integration (matches CLAUDE.md note 5)
- No changes to the customer list page, leads pages, or sidebar
- No new dependencies
- Tabs other than "Overview" render a simple placeholder card (per plan: design fidelity focuses on the Overview tab as the Figma depicts)