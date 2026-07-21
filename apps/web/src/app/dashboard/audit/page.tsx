/**
 * File:        apps/web/src/app/dashboard/audit/page.tsx
 * Module:      Web · Dashboard · Audit Log
 * Purpose:     Read-only audit log viewer — filters by user, action,
 *              entity type, date range. Enterprise compliance view.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
"use client";

import { useState } from "react";
import { useAuditLog } from "@/hooks/use-enterprise";
import { QueryLoading, QueryError } from "@/components/ui/query-status";
import type { AuditLogFilters } from "@/hooks/use-enterprise";

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const { logs, loading, error, refetch } = useAuditLog(filters, 100);

  const set = (key: keyof AuditLogFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-[#1F1F1F]">Audit Log</h1>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by action..."
          className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
          onChange={(e) => set("action", e.target.value)}
        />
        <input
          type="text"
          placeholder="Entity type..."
          className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
          onChange={(e) => set("entityType", e.target.value)}
        />
        <input
          type="text"
          placeholder="Entity ID..."
          className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
          onChange={(e) => set("entityId", e.target.value)}
        />
        <input
          type="date"
          className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
          onChange={(e) => set("fromDate", e.target.value)}
        />
        <input
          type="date"
          className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
          onChange={(e) => set("toDate", e.target.value)}
        />
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium"
        >
          Apply
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Time</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">User</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Action</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Entity</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6A7282]">Loading...</td></tr>}
              {error && <tr><td colSpan={5} className="px-4 py-8 text-center text-red-500">Failed to load audit log</td></tr>}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6A7282]">No audit records found</td></tr>
              )}
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-[#4A5565]">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#1F1F1F]">{log.user?.name ?? log.userId}</td>
                  <td className="px-4 py-3 text-[#1F1F1F] font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3 text-[#1F1F1F]">{log.entityType} {log.entityId ? `(${log.entityId.slice(0, 8)}...)` : ""}</td>
                  <td className="px-4 py-3 text-[#4A5565] font-mono text-xs">{log.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
