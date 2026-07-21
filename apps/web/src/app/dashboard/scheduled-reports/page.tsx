/**
 * File:        apps/web/src/app/dashboard/scheduled-reports/page.tsx
 * Module:      Web · Dashboard · Scheduled Reports
 * Purpose:     Scheduled report management — create, edit, delete,
 *              enable/disable, manual run. Supports daily/weekly/
 *              monthly/quarterly frequencies.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
"use client";

import { useState } from "react";
import { useScheduledReports, useScheduledReportMutations } from "@/hooks/use-enterprise";
import { QueryLoading, QueryError } from "@/components/ui/query-status";
import { toast } from "sonner";

const REPORT_TYPES = ["REVENUE", "OCCUPANCY", "BOOKINGS", "AUDIT", "PAYMENTS"];
const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"];

export default function ScheduledReportsPage() {
  const { reports, loading, error, refetch } = useScheduledReports();
  const { create, update, remove, runNow } = useScheduledReportMutations();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    reportType: "REVENUE", frequency: "DAILY", dayOfPeriod: null as number | null,
    recipients: "", filters: "", centerId: "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({
        userId: (window as any).__CURRENT_USER_ID__,
        centerId: form.centerId,
        reportType: form.reportType,
        frequency: form.frequency,
        dayOfPeriod: form.dayOfPeriod,
        recipients: form.recipients.split(",").map((s) => s.trim()),
        filters: form.filters || null,
      });
      setShowForm(false);
      setForm({ reportType: "REVENUE", frequency: "DAILY", dayOfPeriod: null, recipients: "", filters: "", centerId: form.centerId });
      refetch();
    } catch {
      toast.error("Failed to create report");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Scheduled Reports</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium">
          New Report
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E5E7EB] p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
            {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
            {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <input placeholder="Recipients (comma-separated emails)" value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} className="px-3 py-2 border rounded-lg text-sm col-span-2" required />
          <button type="submit" className="col-span-full px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium">Create</button>
        </form>
      )}

      {loading && <QueryLoading />}
      {error && <QueryError error={error} />}

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Type</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Frequency</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Recipients</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Enabled</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Last Sent</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {reports.map((report: any) => (
                <tr key={report.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-[#1F1F1F] font-medium">{report.reportType}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{report.frequency}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{report.recipients.length} recipients</td>
                  <td className="px-4 py-3">
                    <button onClick={() => update(report.id, { enabled: !report.enabled })} className={`px-2 py-1 rounded-full text-xs ${report.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {report.enabled ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[#4A5565]">{report.lastSentAt ?? "Never"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => runNow(report.id)} className="text-xs text-blue-600 hover:underline">Run now</button>
                      <button onClick={() => remove(report.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && reports.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6A7282]">No scheduled reports</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}