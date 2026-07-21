/**
 * File:        apps/web/src/app/dashboard/calendar-sync/page.tsx
 * Module:      Web · Dashboard · Calendar Sync
 * Purpose:     External calendar connection management — Google / Outlook /
 *              Apple Calendar. Connect, disconnect, sync, toggle with
 *              provider-specific UI and sync status indicators.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */
"use client";

import { useState, useCallback } from "react";
import { useCalendarConnections, useCalendarSyncMutations, CalendarProvider } from "@/hooks/use-enterprise";
import { QueryLoading, QueryError } from "@/components/ui/query-status";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

// ─── Provider config ────────────────────────────────────────────
const PROVIDER_CONFIG: Record<
  CalendarProvider,
  { label: string; color: string; bgColor: string; icon: string; hexColor: string }
> = {
  GOOGLE: {
    label: "Google Calendar",
    color: "text-[#4285F4]",
    bgColor: "bg-[#4285F4]",
    icon: "G",
    hexColor: "#4285F4",
  },
  OUTLOOK: {
    label: "Outlook Calendar",
    color: "text-[#0078D4]",
    bgColor: "bg-[#0078D4]",
    icon: "O",
    hexColor: "#0078D4",
  },
  APPLE: {
    label: "Apple Calendar",
    color: "text-[#555555]",
    bgColor: "bg-[#555555]",
    icon: "",
    hexColor: "#555555",
  },
};

// ─── Helpers ────────────────────────────────────────────────────
function formatLastSync(iso?: string | null): string {
  if (!iso) return "Never synced";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getSyncStatus(conn: {
  syncEnabled: boolean;
  lastSyncedAt: string | null;
}): "success" | "syncing" | "failed" | "idle" {
  if (!conn.syncEnabled) return "idle";
  if (!conn.lastSyncedAt) return "idle";
  return "success";
}

// ─── Component ──────────────────────────────────────────────────
export default function CalendarSyncPage() {
  const userId =
    (typeof window !== "undefined" && (window as any).__CURRENT_USER_ID__) || "";
  const { connections, loading, error, refetch } = useCalendarConnections(userId);
  const { connect, disconnect, sync, toggle } = useCalendarSyncMutations();

  // Connect form state
  const [connectForm, setConnectForm] = useState<{
    provider: CalendarProvider;
    email: string;
  } | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [connecting, setConnecting] = useState(false);

  // Sync-all state
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  // Disconnect confirmation state
  const [disconnectTarget, setDisconnectTarget] = useState<{
    id: string;
    provider: CalendarProvider;
  } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Per-card syncing state
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  // ─── Handlers ─────────────────────────────────────────────────
  const handleConnectClick = useCallback((provider: CalendarProvider) => {
    setConnectForm({ provider, email: "" });
    setFormEmail("");
  }, []);

  const handleConnectSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!connectForm || !formEmail.trim()) return;

      setConnecting(true);
      try {
        // In a production flow, the OAuth callback would provide real tokens.
        // Here we simulate the exchange by generating placeholder tokens.
        const mockAccessToken = `mock_access_${connectForm.provider.toLowerCase()}_${Date.now()}`;
        const mockRefreshToken = `mock_refresh_${connectForm.provider.toLowerCase()}_${Date.now()}`;
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

        await connect({
          userId,
          provider: connectForm.provider,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
          expiresAt,
          email: formEmail.trim(),
        });
        toast.success(`${PROVIDER_CONFIG[connectForm.provider].label} connected`);
        setConnectForm(null);
        setFormEmail("");
        refetch();
      } catch {
        toast.error("Failed to connect calendar. Please try again.");
      } finally {
        setConnecting(false);
      }
    },
    [connectForm, formEmail, connect, refetch, userId]
  );

  const handleConnectCancel = useCallback(() => {
    setConnectForm(null);
    setFormEmail("");
  }, []);

  const handleSyncNow = useCallback(
    async (conn: { id: string; provider: CalendarProvider }) => {
      setSyncingIds((prev) => new Set(prev).add(conn.id));
      try {
        const result = await sync(conn.id);
        if (result) {
          toast.success(`${PROVIDER_CONFIG[conn.provider].label} synced`);
        } else {
          toast.error(`${PROVIDER_CONFIG[conn.provider].label} sync failed`);
        }
        refetch();
      } catch {
        toast.error(`${PROVIDER_CONFIG[conn.provider].label} sync failed`);
      } finally {
        setSyncingIds((prev) => {
          const next = new Set(prev);
          next.delete(conn.id);
          return next;
        });
      }
    },
    [sync, refetch]
  );

  const handleToggleSync = useCallback(
    async (conn: { id: string; syncEnabled: boolean; provider: CalendarProvider }) => {
      try {
        await toggle(conn.id, !conn.syncEnabled);
        toast.success(
          `${PROVIDER_CONFIG[conn.provider].label} sync ${conn.syncEnabled ? "paused" : "resumed"}`
        );
        refetch();
      } catch {
        toast.error("Failed to update sync setting");
      }
    },
    [toggle, refetch]
  );

  const handleDisconnectClick = useCallback(
    (id: string, provider: CalendarProvider) => {
      setDisconnectTarget({ id, provider });
    },
    []
  );

  const handleDisconnectConfirm = useCallback(async () => {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    try {
      await disconnect(disconnectTarget.id);
      toast.success(
        `${PROVIDER_CONFIG[disconnectTarget.provider].label} disconnected`
      );
      setDisconnectTarget(null);
      refetch();
    } catch {
      toast.error("Failed to disconnect calendar");
    } finally {
      setDisconnecting(false);
    }
  }, [disconnectTarget, disconnect, refetch]);

  const handleDisconnectCancel = useCallback(() => {
    setDisconnectTarget(null);
  }, []);

  const handleSyncAll = useCallback(async () => {
    const connected = connections.filter((c: any) => c.syncEnabled);
    if (connected.length === 0) {
      toast.info("No active connections to sync");
      return;
    }

    setSyncingAll(true);
    setSyncProgress({ done: 0, total: connected.length });

    let done = 0;
    let failed = 0;

    for (const conn of connected) {
      setSyncingIds((prev) => new Set(prev).add(conn.id));
      try {
        const result = await sync(conn.id);
        if (result) {
          done++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      } finally {
        setSyncingIds((prev) => {
          const next = new Set(prev);
          next.delete(conn.id);
          return next;
        });
        setSyncProgress((p) => (p ? { ...p, done: p.done + 1 } : null));
      }
    }

    setSyncingAll(false);
    setSyncProgress(null);
    refetch();

    if (failed === 0) {
      toast.success(`All ${done} calendars synced`);
    } else if (done > 0) {
      toast.error(`${failed} of ${connected.length} syncs failed. Tap Retry on failed cards.`);
    } else {
      toast.error("All syncs failed. Please try again.");
    }
  }, [connections, sync, refetch]);

  // ─── Render helpers ───────────────────────────────────────────
  const renderSyncStatusDot = (conn: {
    id: string;
    syncEnabled: boolean;
    lastSyncedAt: string | null;
  }) => {
    const status = getSyncStatus(conn);
    const isSyncing = syncingIds.has(conn.id);

    if (isSyncing) {
      return (
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
        </span>
      );
    }

    const dotColors: Record<string, string> = {
      success: "bg-green-500",
      failed: "bg-red-500",
      idle: "bg-gray-300",
    };

    return (
      <span
        className={`block h-3 w-3 rounded-full ${dotColors[status]}`}
        title={
          status === "success"
            ? `Synced ${formatLastSync(conn.lastSyncedAt)}`
            : status === "idle"
              ? "Sync paused or never synced"
              : "Sync failed"
        }
      />
    );
  };

  const renderProviderCard = (provider: CalendarProvider) => {
    const config = PROVIDER_CONFIG[provider];
    const conn = connections.find((c: any) => c.provider === provider);
    const isActiveForm = connectForm?.provider === provider;
    const isSyncing = syncingIds.has(conn?.id ?? "");

    return (
      <div
        key={provider}
        className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden"
      >
        {/* Card header */}
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              {/* Provider icon */}
              <div
                className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}
              >
                {config.icon ? (
                  <span className="text-lg leading-none">{config.icon}</span>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-[#1F1F1F] text-sm">
                  {config.label}
                </h3>
                {conn && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {renderSyncStatusDot(conn)}
                    <span className="text-xs text-[#6A7282]">
                      {conn.syncEnabled
                        ? `Synced ${formatLastSync(conn.lastSyncedAt)}`
                        : "Paused"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {conn && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  conn.syncEnabled
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {conn.syncEnabled ? "Active" : "Paused"}
              </span>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="px-5 pb-5">
          {conn ? (
            <>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    className="w-4 h-4 text-[#6A7282] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="3" />
                    <path d="M2 7l10 7 10-7" />
                  </svg>
                  <span className="text-[#4A5565] truncate">
                    {conn.email ?? "Connected"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    className="w-4 h-4 text-[#6A7282] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3.5 2" />
                  </svg>
                  <span className="text-[#6A7282]">
                    Last sync: {formatLastSync(conn.lastSyncedAt)}
                  </span>
                </div>
              </div>

              {/* Sync toggle */}
              <div className="flex items-center justify-between mb-4 py-2.5 px-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-[#1F1F1F] font-medium">
                  Auto Sync
                </span>
                <button
                  onClick={() => handleToggleSync(conn)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    conn.syncEnabled ? "bg-[#FF6A2F]" : "bg-gray-300"
                  }`}
                  role="switch"
                  aria-checked={conn.syncEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out mt-0.5 ${
                      conn.syncEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSyncNow(conn)}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isSyncing && (
                    <svg
                      className="animate-spin h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
                <button
                  onClick={() =>
                    handleDisconnectClick(conn.id, conn.provider)
                  }
                  className="px-3 py-2 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </>
          ) : isActiveForm ? (
            /* Inline connect form */
            <form onSubmit={handleConnectSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor={`email-${provider}`}
                  className="block text-xs font-medium text-[#1F1F1F] mb-1.5"
                >
                  Account email
                </label>
                <input
                  id={`email-${provider}`}
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder={`you@example.com`}
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]/30 focus:border-[#FF6A2F] placeholder:text-[#6A7282]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={connecting || !formEmail.trim()}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  style={{
                    backgroundColor: connecting || !formEmail.trim()
                      ? undefined
                      : "#FF6A2F",
                  }}
                >
                  {connecting ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    "Connect"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleConnectCancel}
                  disabled={connecting}
                  className="px-3 py-2 text-sm font-medium text-[#6A7282] bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Not connected — show connect button */
            <button
              onClick={() => handleConnectClick(provider)}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: config.hexColor }}
            >
              Connect
            </button>
          )}
        </div>
      </div>
    );
  };

  // ─── Loading / Error ──────────────────────────────────────────
  if (loading) return <QueryLoading />;
  if (error) return <QueryError message={error.message} onRetry={() => refetch()} />;

  const connectedCount = connections.filter((c: any) => c.syncEnabled).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">Calendar Sync</h1>
          <p className="text-sm text-[#6A7282] mt-1">
            Two-way sync with Google Calendar, Outlook, and Apple Calendar.
            Bookings flow to your external calendar automatically.
          </p>
        </div>

        {connectedCount > 0 && (
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#e55f28] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {syncingAll ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {syncProgress
                  ? `Syncing ${syncProgress.done}/${syncProgress.total}...`
                  : "Syncing..."}
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 4v5h5M20 20v-5h-5" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 0 1 3.51 15" />
                </svg>
                Sync All
              </>
            )}
          </button>
        )}
      </div>

      {/* Connection cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["GOOGLE", "OUTLOOK", "APPLE"] as CalendarProvider[]).map(
          renderProviderCard
        )}
      </div>

      {/* Disconnect confirmation dialog */}
      <ConfirmDialog
        open={!!disconnectTarget}
        title="Disconnect Calendar"
        description={
          disconnectTarget
            ? `This will remove the ${PROVIDER_CONFIG[disconnectTarget.provider].label} connection and stop syncing. Continue?`
            : ""
        }
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDisconnectConfirm}
        onCancel={handleDisconnectCancel}
      />
    </div>
  );
}
