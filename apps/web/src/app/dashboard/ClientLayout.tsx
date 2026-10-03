/**
 * File:        apps/web/src/app/dashboard/layout.tsx
 * Module:      Web · Dashboard Layout
 * Purpose:     Shared layout with fixed header, sidebar, and scrollable content.
 *              The header's center pill is route-aware: it shows the
 *              sub-navigation for whichever top-level dashboard section the
 *              user is currently in.
 *
 * Exports:
 *   - DashboardLayout — layout component with fixed navigation and scrollable content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import { Header, type HeaderTab } from '@/components/ui/header';
import { SetUpNewCenter } from '@/components/ui/set-up-new-center';
import { useAuth } from '@/contexts/auth-context';
import { useActiveCenter } from '@/contexts/active-center-context';

/** Compact center selector shown on Settings when the caller has >1 center. */
function CenterPicker() {
  const { centers, activeCenter, setActiveCenter } = useActiveCenter();
  if (centers.length <= 1) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xs font-medium text-[#6B7280]">Center</span>
      <select
        aria-label="Active center"
        value={activeCenter?.id ?? ''}
        onChange={(e) => setActiveCenter(e.target.value)}
        className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-[#1F2937] shadow-sm outline-none focus:border-[#FF6A2F]"
      >
        {centers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Per-section sub-navigation. The first tab of each section is the
 * section's index route (e.g. `/dashboard/revenue`). Tabs are matched
 * against the current pathname by prefix, so a child route like
 * `/dashboard/revenue/invoices` keeps the `revenue` section's tabs active.
 */
const SECTION_TABS: Record<string, HeaderTab[]> = {
  dashboard: [
    { id: 'changelog', label: "What's new", href: '/dashboard/changelog' },
  ],
  revenue: [
    { id: 'invoices', label: 'Invoices', href: '/dashboard/revenue' },
    { id: 'deposits', label: 'Deposit', href: '/dashboard/revenue/deposits' },
    {
      id: 'contracts',
      label: 'Contracts',
      href: '/dashboard/revenue/contracts',
    },
  ],
  inventory: [
    { id: 'location', label: 'Location', href: '/dashboard/inventory' },
    {
      id: 'floor-map',
      label: 'Floor map',
      href: '/dashboard/inventory/floor-map',
    },
    {
      id: 'table-view',
      label: 'Table view',
      href: '/dashboard/inventory/table-view',
    },
  ],
  crm: [
    { id: 'leads', label: 'Leads', href: '/dashboard/crm/leads' },
    { id: 'customers', label: 'Customers', href: '/dashboard/crm/customers' },
    { id: 'onboarding', label: 'Onboarding', href: '/dashboard/crm/onboarding' },
    // Cheques awaiting clearance, unfinished online payments, failed attempts.
    { id: 'pending', label: 'Pending payments', href: '/dashboard/crm/onboarding/pending' },
  ],
  operations: [
    {
      id: 'meeting-room',
      label: 'Meeting Room',
      href: '/dashboard/operations/meeting-room',
    },
    { id: 'events', label: 'Events', href: '/dashboard/operations/events' },
    { id: 'request', label: 'Request', href: '/dashboard/operations/request' },
  ],
  report: [
    { id: 'overview', label: 'Overview', href: '/dashboard/report' },
    { id: 'revenue', label: 'Revenue', href: '/dashboard/report/revenue' },
    {
      id: 'occupancy',
      label: 'Occupancy',
      href: '/dashboard/report/occupancy',
    },
  ],
  settings: [
    { id: 'teams', label: 'Teams', href: '/dashboard/settings' },
    { id: 'finance', label: 'Finance', href: '/dashboard/settings/finance' },
    {
      id: 'notification',
      label: 'Notification',
      href: '/dashboard/settings/notification',
    },
    { id: 'center', label: 'Center', href: '/dashboard/settings/center' },
    { id: 'security', label: 'Security', href: '/dashboard/settings/security' },
    { id: 'operations', label: 'Operations', href: '/dashboard/settings/operations' },
    { id: 'integrations', label: 'Integrations', href: '/dashboard/settings/integrations' },
    { id: 'promotion', label: 'Promotion', href: '/dashboard/settings/promotion' },
  ],
};

function getTabsForPath(pathname: string | null): {
  tabs: HeaderTab[];
  activeId: string | undefined;
} {
  if (!pathname) return { tabs: [], activeId: undefined };
  // `/dashboard/<section>/...` — pick the section segment.
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  const section =
    match?.[1] || (pathname === '/dashboard' ? 'dashboard' : undefined);
  if (!section || !SECTION_TABS[section])
    return { tabs: [], activeId: undefined };

  const tabs = SECTION_TABS[section];
  // Find exact match first
  let active = tabs.find((t) => pathname === t.href);
  if (!active) {
    // If no exact match, find the longest prefix match
    const sortedTabs = [...tabs].sort((a, b) => b.href.length - a.href.length);
    active = sortedTabs.find((t) => pathname.startsWith(`${t.href}/`));
  }

  return { tabs, activeId: active?.id };
}

/** Admin-only route prefixes: settings/*, crm/*, revenue/*, inventory/*, report/*, audit, equipment, scheduled-reports, calendar-sync, notifications. */
const ADMIN_ROUTE_PREFIXES = [
  '/dashboard/settings',
  '/dashboard/crm',
  '/dashboard/revenue',
  '/dashboard/inventory',
  '/dashboard/report',
  '/dashboard/audit',
  '/dashboard/equipment',
  '/dashboard/scheduled-reports',
  '/dashboard/calendar-sync',
  '/dashboard/notifications',
];
const STAFF_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'CENTER_OWNER', 'CENTER_MANAGER', 'FINANCE', 'SUPPORT', 'STAFF']);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSetUpModal, setShowSetUpModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { tabs, activeId } = getTabsForPath(pathname);
  // The proxy cannot gate dashboard access (it runs at the Edge and has no
  // access to localStorage tokens), and the auth-context does not redirect
  // on its own, so this effect is the actual gate: once the ME_QUERY
  // resolves (or proves there is no token), bounce anyone who isn't
  // authenticated. Render nothing while loading to suppress the flash of
  // dashboard shell that ships in the SSR HTML.
  const { user, isLoading, logout } = useAuth();
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/signin');
    }
  }, [user, isLoading, router]);

  // ── Client-side RBAC ───────────────────────────────────────────────────
  // Backend resolvers enforce roles (@Roles), but this keeps the UI honest:
  // a MEMBER/EMPLOYEE browsing to an admin-only route is bounced to Home
  // instead of seeing a form they can't actually submit.
  // NOTE: every hook must run BEFORE the early returns below. This effect used
  // to sit after them, so on a hard page load (auth: loading → loaded) React saw
  // an extra hook and crashed the whole dashboard with error #310.
  useEffect(() => {
    if (!user) return; // still loading — don't redirect yet.
    const isAdmin = STAFF_ROLES.has(user.role);
    if (!isAdmin && ADMIN_ROUTE_PREFIXES.some((p) => pathname?.startsWith(p))) {
      router.replace('/dashboard/home');
    }
  }, [user, pathname, router]);

  // Don't render the dashboard shell until auth has resolved. The initial
  // SSR HTML contains the full dashboard layout; without this guard the
  // user would see a flash of sidebar/header before the redirect commits.
  if (isLoading) return null;
  if (!user) return null;

  let settingsTabs = SECTION_TABS['settings'];
  if (user?.role === 'CENTER_MANAGER') {
    settingsTabs = [
      { id: 'center', label: 'Centers', href: '/dashboard/settings/center' },
      { id: 'finance', label: 'Finance', href: '/dashboard/settings/finance' },
      { id: 'notification', label: 'Notification', href: '/dashboard/settings/notification' },
      { id: 'operations', label: 'Operation', href: '/dashboard/settings/operations' },
      { id: 'promotion', label: 'Promotion', href: '/dashboard/settings/promotion' },
    ];
  }

  // Update tabs if section is 'settings'
  const finalTabs = (pathname?.startsWith('/dashboard/settings') ? settingsTabs : tabs);

  return (
    <div className="min-h-screen bg-[#FBF6F4]">
      {/* Fixed Header - stays at top */}
      <Header
        tabs={finalTabs}
        activeTabId={activeId}
        onTabChange={(tab) => router.push(tab.href)}
        onSetUpNewCenter={() => setShowSetUpModal(true)}
        hideSetUpButton={true}
        user={{
          name: user?.name ?? user?.email ?? 'Guest',
          email: user?.email,
          role: user?.role ?? 'Member',
          onLogout: () => {
            void logout()
              .catch(console.error)
              .finally(() => router.push('/signin'));
          },
        }}
      />

      <div className="flex compact:gap-2">
        {/* Fixed Sidebar - stays on left - routing handles active state */}
        <Sidebar />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto px-8 py-6 compact:px-4 compact:py-4 min-w-0">
          {/* Settings are center-scoped: surface the active center switcher
              so a multi-center admin edits the center they intend to. */}
          {pathname?.startsWith('/dashboard/settings') && (
            <div className="flex justify-end mb-2">
              <CenterPicker />
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Set Up New Center Modal */}
      {showSetUpModal && (
        <SetUpNewCenter onClose={() => setShowSetUpModal(false)} />
      )}
    </div>
  );
}
