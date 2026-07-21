/**
 * File:        apps/web/src/app/dashboard/audit/page.tsx
 * Module:      Web · Dashboard · Audit Log
 * Purpose:     Read-only audit log viewer — filters by user, action,
 *              entity type, date range. Enterprise compliance view.
 *              Enhanced with presets, pagination, drill-down, and CSV export.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */
"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuditLog, type AuditLogFilters } from "@/hooks/use-enterprise";
import { QueryLoading, QueryError } from "@/components/ui/query-status";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────
interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

// ─── Presets ────────────────────────────────────────────────────
type DatePreset = "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "custom";

function getPresetDates(preset: DatePreset, from: string, to: string): { fromDate: string; toDate: string } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { fromDate: toISODate(today), toDate: toISODate(today) };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { fromDate: toISODate(y), toDate: toISODate(y) };
    }
    case "last7": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { fromDate: toISODate(d), toDate: toISODate(today) };
    }
    case "last30": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { fromDate: toISODate(d), toDate: toISODate(today) };
    }
    case "thisMonth":
      return { fromDate: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)), toDate: toISODate(today) };
    case "custom":
      return from && to ? { fromDate: from, toDate: to } : null;
    default:
      return null;
  }
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const ACTION_OPTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "CHECK_IN", "CHECK_OUT", "ASSIGN", "UNASSIGN", "CANCEL", "APPROVE", "REJECT", "EXPORT"];
const ENTITY_OPTIONS = ["Booking", "Customer", "Lead", "Invoice", "Deposit", "Contract", "MeetingRoom", "Event", "User", "Equipment", "Payment", "Plan"];

const PAGE_SIZES = [25, 50, 100] as const;

// ─── Helpers ────────────────────────────────────────────────────
function formatChanges(changes: Record<string, any> | null | undefined): string {
  if (!changes || typeof changes !== "object") return "No changes recorded";
  const pairs: string[] = [];
  for (const [key, val] of Object.entries(changes)) {
    if (val === null || val === undefined) continue;
    const v = typeof val === "object" ? JSON.stringify(val) : String(val);
    pairs.push(`${key}: ${v}`);
  }
  return pairs.length ? pairs.join("\n") : "No changes recorded";
}

function flattenChanges(changes: Record<string, any> | null | undefined): { field: string; value: string }[] {
  if (!changes || typeof changes !== "object") return [];
  return Object.entries(changes)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([field, val]) => ({
      field,
      value: typeof val === "object" ? JSON.stringify(val) : String(val),
    }));
}

function exportCSV(logs: AuditLogEntry[]): void {
  const headers = ["Time", "User", "Email", "Action", "Entity Type", "Entity ID", "IP Address", "Changes"];
  const rows = logs.map((log) => {
    const time = new Date(log.createdAt).toISOString();
    const userName = log.user?.name ?? "—";
    const email = log.user?.email ?? "—";
    const changes = formatChanges(log.changes).replace(/"/g, '""');
    return [
      time,
      `"${userName}"`,
      `"${email}"`,
      `"${log.action}"`,
      `"${log.entityType}"`,
      `"${log.entityId ?? ""}"`,
      `"${log.ipAddress ?? ""}"`,
      `"${changes}"`,
    ].join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dateStr = toISODate(new Date());
  link.download = `audit-log-${dateStr}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${logs.length} records`);
}

// ─── Component ──────────────────────────────────────────────────
export default function AuditPage() {
  const [preset, setPreset] = useState<DatePreset>("last30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [entityIdFilter, setEntityIdFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const [baseFilters, setBaseFilters] = useState<AuditLogFilters>({});
  const { logs, loading, error, refetch } = useAuditLog(baseFilters, pageSize, (page - 1) * pageSize);

  // Date preset handler
  const handlePreset = useCallback((p: DatePreset) => {
    setPreset(p);
    const dates = getPresetDates(p, customFrom, customTo);
    if (dates) {
      setBaseFilters((prev) => ({ ...prev, fromDate: dates.fromDate, toDate: dates.toDate }));
    }
  }, [customFrom, customTo]);

  const handleCustomDateChange = useCallback(() => {
    if (preset === "custom" && customFrom && customTo) {
      setBaseFilters((prev) => ({ ...prev, fromDate: customFrom, toDate: customTo }));
    }
  }, [preset, customFrom, customTo]);

  // Apply all filters to refetch
  const applyFilters = useCallback(() => {
    const filters: AuditLogFilters = { ...baseFilters };
    if (actionFilter) filters.action = actionFilter;
    if (entityFilter) filters.entityType = entityFilter;
    if (entityIdFilter) filters.entityId = entityIdFilter;
    if (userSearch.trim()) filters.userId = userSearch.trim();
    setBaseFilters(filters);
    refetch({ filters, limit: pageSize, offset: (page - 1) * pageSize });
  }, [baseFilters, actionFilter, entityFilter, entityIdFilter, userSearch, pageSize, page, refetch]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  // Derived values
  const visibleActions = useMemo(() => {
    const set = new Set((logs as AuditLogEntry[]).map((l: AuditLogEntry) => l.action));
    return [...set].sort();
  }, [logs]);

  const visibleEntityTypes = useMemo(() => {
    const set = new Set((logs as AuditLogEntry[]).map((l: AuditLogEntry) => l.entityType));
    return [...set].sort();
  }, [logs]);

  // Client-side filtering for user search (backend only has userId)
  const filteredLogs = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return logs as AuditLogEntry[];
    return (logs as AuditLogEntry[]).filter((log) => {
      const name = log.user?.name?.toLowerCase() ?? "";
      const email = log.user?.email?.toLowerCase() ?? "";
      const id = log.user?.id?.toLowerCase() ?? "";
      return name.includes(query) || email.includes(query) || id.includes(query);
    });
  }, [logs, userSearch]);

  const totalResults = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedLogs = filteredLogs.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleRow = useCallback((idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    if (filteredLogs.length === 0) {
      toast.error("No data to export");
      return;
    }
    exportCSV(filteredLogs);
  }, [filteredLogs]);

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Audit Log</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#4A5565] hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
        {/* Date Presets */}
        <div>
          <label className="block text-xs font-medium text-[#6A7282] uppercase tracking-wide mb-2">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2">
            {([
              { key: "today" as DatePreset, label: "Today" },
              { key: "yesterday" as DatePreset, label: "Yesterday" },
              { key: "last7" as DatePreset, label: "Last 7 Days" },
              { key: "last30" as DatePreset, label: "Last 30 Days" },
              { key: "thisMonth" as DatePreset, label: "This Month" },
              { key: "custom" as DatePreset, label: "Custom" },
            ]).map((p) => (
              <button
                key={p.key}
                onClick={() => handlePreset(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  preset === p.key
                    ? "bg-[#FF6A2F] text-white"
                    : "bg-gray-50 text-[#4A5565] hover:bg-gray-100 border border-[#E5E7EB]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex gap-3 mt-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6A7282]">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  onBlur={handleCustomDateChange}
                  className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6A7282]">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  onBlur={handleCustomDateChange}
                  className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Dropdown + User filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#6A7282]">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm min-w-[150px]"
            >
              <option value="">All Actions</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#6A7282]">Entity Type</label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm min-w-[150px]"
            >
              <option value="">All Entities</option>
              {ENTITY_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#6A7282]">User</label>
            <input
              type="text"
              placeholder="Search name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm min-w-[200px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#6A7282]">Entity ID</label>
            <input
              type="text"
              placeholder="Filter by ID..."
              value={entityIdFilter}
              onChange={(e) => setEntityIdFilter(e.target.value)}
              className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm min-w-[150px]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="px-5 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#e55d28] transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Apply Filters"}
          </button>
        </div>
      </div>

      {/* ── Error State ────────────────────────────────────────── */}
      {error && <QueryError message={error.message} onRetry={() => refetch()} retryLabel="Retry" />}

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium w-[180px]">Time</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">User</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Action</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Entity</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">IP Address</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <QueryLoading />
                  </td>
                </tr>
              )}
              {!loading && paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#6A7282]">
                    No audit records found matching your filters
                  </td>
                </tr>
              )}
              {paginatedLogs.map((log, idx) => {
                const isExpanded = expandedRows.has(idx);
                const changes = flattenChanges(log.changes);
                return (
                  <>
                    <tr
                      key={log.id}
                      className={`border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isExpanded ? "bg-orange-50/50" : ""
                      }`}
                      onClick={() => toggleRow(idx)}
                    >
                      <td className="px-4 py-3 text-[#4A5565] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[#1F1F1F]">{log.user?.name ?? "—"}</div>
                        {log.user?.email && (
                          <div className="text-xs text-[#6A7282]">{log.user.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 text-[#1F1F1F]">
                        <span className="font-medium">{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-[#6A7282] text-xs ml-1.5 font-mono">
                            ({log.entityId.slice(0, 8)}...)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#4A5565] font-mono text-xs whitespace-nowrap">
                        {log.ipAddress ?? "—"}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <svg
                          className={`w-4 h-4 text-[#6A7282] transition-transform inline-block ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${log.id}-detail`} className="bg-[#FAFAFA]">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
                            <div className="px-4 py-2.5 bg-gray-50 border-b border-[#E5E7EB]">
                              <span className="text-xs font-medium text-[#6A7282] uppercase tracking-wide">
                                Changes — {log.entityType} {log.entityId ? `(${log.entityId.slice(0, 8)}...)` : ""}
                              </span>
                            </div>
                            <div className="px-4 py-3">
                              {changes.length === 0 ? (
                                <p className="text-sm text-[#6A7282]">No field changes recorded</p>
                              ) : (
                                <div className="divide-y divide-[#E5E7EB]">
                                  {changes.map((c) => (
                                    <div
                                      key={c.field}
                                      className="flex items-start gap-3 py-2 first:pt-0 last:pb-0"
                                    >
                                      <span className="text-sm font-medium text-[#1F1F1F] min-w-[180px] shrink-0">
                                        {c.field}
                                      </span>
                                      <span className="text-sm text-[#6A7282] flex-1 break-all">
                                        {c.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {log.changes && (
                              <div className="px-4 py-3 border-t border-[#E5E7EB] bg-gray-50/50">
                                <span className="text-xs text-[#6A7282] uppercase tracking-wide mb-1.5 block">
                                  Raw JSON
                                </span>
                                <pre className="text-xs text-[#4A5565] font-mono bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ─────────────────────────────────────────── */}
      {!loading && totalResults > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#6A7282]">
            Showing {(safePage - 1) * pageSize + 1}
            {" – "}
            {Math.min(safePage * pageSize, totalResults)}
            {" of "}
            {totalResults} results
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#6A7282]">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-1 border border-[#E5E7EB] rounded-lg text-sm"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setPage((p) => Math.max(1, p - 1)); applyFilters(); }}
                disabled={safePage <= 1}
                className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-[#6A7282] px-2">
                Page {safePage} of {totalPages}
              </span>
              <button
                onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); applyFilters(); }}
                disabled={safePage >= totalPages}
                className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Action Badge ────────────────────────────────────────────────
function ActionBadge({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    CREATE: "bg-green-50 text-green-700 border-green-200",
    UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
    DELETE: "bg-red-50 text-red-700 border-red-200",
    LOGIN: "bg-purple-50 text-purple-700 border-purple-200",
    LOGOUT: "bg-gray-50 text-gray-600 border-gray-200",
    CHECK_IN: "bg-teal-50 text-teal-700 border-teal-200",
    CHECK_OUT: "bg-orange-50 text-orange-700 border-orange-200",
    ASSIGN: "bg-indigo-50 text-indigo-700 border-indigo-200",
    UNASSIGN: "bg-pink-50 text-pink-700 border-pink-200",
    CANCEL: "bg-red-50 text-red-600 border-red-200",
    APPROVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECT: "bg-rose-50 text-rose-700 border-rose-200",
    EXPORT: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const cls = colorMap[action] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-mono font-medium border ${cls}`}>
      {action}
    </span>
  );
}
