/**
 * File:        apps/web/src/app/dashboard/scheduled-reports/page.tsx
 * Module:      Web · Dashboard · Scheduled Reports
 * Purpose:     Scheduled report management — create, edit, delete,
 *              enable/disable, manual run. Supports daily/weekly/
 *              monthly/quarterly frequencies with center selection,
 *              report preview panel, and inline editing.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useScheduledReports, useScheduledReportMutations } from "@/hooks/use-enterprise";
import { GET_MY_CENTERS } from "@/lib/apollo/operations";
import { QueryLoading, QueryError, QueryEmpty } from "@/components/ui/query-status";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

const REPORT_TYPES = ["REVENUE", "OCCUPANCY", "BOOKINGS", "AUDIT", "PAYMENTS"];
const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"] as const;
type Frequency = (typeof FREQUENCIES)[number];

interface ReportForm {
  reportType: string;
  frequency: Frequency;
  dayOfPeriod: number | null;
  recipients: string;
  filters: string;
  centerId: string;
}

const EMPTY_FORM: ReportForm = {
  reportType: "REVENUE",
  frequency: "DAILY",
  dayOfPeriod: null,
  recipients: "",
  filters: "",
  centerId: "",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "Never";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Never";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCenterName(centers: any[], centerId: string): string {
  const c = centers.find((c) => c.id === centerId);
  return c?.name ?? centerId;
}

export default function ScheduledReportsPage() {
  const { reports, loading, error, refetch } = useScheduledReports();
  const { create, update, remove, runNow } = useScheduledReportMutations();

  const { data: centersData } = useQuery(GET_MY_CENTERS);
  const centers = centersData?.myCenters ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReportForm>({ ...EMPTY_FORM });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const preview = useMemo(
    () => reports.find((r: any) => r.id === previewId) ?? null,
    [reports, previewId],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, centerId: centers[0]?.id ?? "" });
    setShowForm(true);
  };

  const openEdit = (report: any) => {
    setEditingId(report.id);
    setForm({
      reportType: report.reportType,
      frequency: report.frequency,
      dayOfPeriod: report.dayOfPeriod ?? null,
      recipients: (report.recipients ?? []).join(", "),
      filters: report.filters ?? "",
      centerId: report.centerId,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = (window as any).__CURRENT_USER_ID__;
      if (!userId) {
        toast.error("User not identified");
        return;
      }
      const recipients = form.recipients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (recipients.length === 0) {
        toast.error("At least one recipient is required");
        return;
      }

      if (editingId) {
        await update(editingId, {
          centerId: form.centerId || undefined,
          reportType: form.reportType,
          frequency: form.frequency,
          dayOfPeriod: form.dayOfPeriod ?? undefined,
          recipients,
          filters: form.filters || undefined,
        });
        toast.success("Report updated");
      } else {
        await create({
          userId,
          centerId: form.centerId,
          reportType: form.reportType,
          frequency: form.frequency,
          dayOfPeriod: form.dayOfPeriod,
          recipients,
          filters: form.filters || null,
        });
        toast.success("Report created");
      }
      cancelForm();
      refetch();
    } catch {
      toast.error(editingId ? "Failed to update report" : "Failed to create report");
    }
  };

  const handleToggle = async (report: any) => {
    setTogglingId(report.id);
    try {
      await update(report.id, { enabled: !report.enabled });
      refetch();
    } catch {
      toast.error("Failed to toggle report");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await remove(deleteId);
      toast.success("Report deleted");
      setDeleteId(null);
      if (previewId === deleteId) setPreviewId(null);
      refetch();
    } catch {
      toast.error("Failed to delete report");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRunNow = async (id: string) => {
    setRunningId(id);
    try {
      await runNow(id);
      refetch();
    } catch {
      toast.error("Failed to run report");
    } finally {
      setRunningId(null);
    }
  };

  const showDayOfPeriod = form.frequency !== "DAILY";

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Scheduled Reports</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#e55d25] transition-colors"
        >
          New Report
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1F1F1F]">
              {editingId ? "Edit Report" : "New Report"}
            </h2>
            <button
              type="button"
              onClick={cancelForm}
              className="text-xs text-[#6A7282] hover:text-[#1F1F1F] transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Center */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#6A7282]">Center</label>
              <select
                value={form.centerId}
                onChange={(e) => setForm({ ...form, centerId: e.target.value })}
                className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#1F1F1F] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]/30"
                required
              >
                <option value="">Select center</option>
                {centers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Report Type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#6A7282]">Report Type</label>
              <select
                value={form.reportType}
                onChange={(e) => setForm({ ...form, reportType: e.target.value })}
                className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#1F1F1F] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]/30"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Frequency */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#6A7282]">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value as Frequency })
                }
                className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#1F1F1F] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]/30"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Day of Period */}
            {showDayOfPeriod && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#6A7282]">Day of Period</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Day of month"
                  value={form.dayOfPeriod ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dayOfPeriod: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]/30"
                />
              </div>
            )}
          </div>

          {/* Recipients */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#6A7282]">Recipients</label>
            <input
              placeholder="Comma-separated emails (e.g. john@example.com, jane@example.com)"
              value={form.recipients}
              onChange={(e) => setForm({ ...form, recipients: e.target.value })}
              className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]/30"
              required
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#6A7282]">
              Filters <span className="text-[#9CA3AF]">(optional JSON)</span>
            </label>
            <textarea
              placeholder='e.g. {"dateFrom": "2026-01-01", "dateTo": "2026-12-31"}'
              value={form.filters}
              onChange={(e) => setForm({ ...form, filters: e.target.value })}
              rows={2}
              className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]/30 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2 text-sm font-medium text-[#4A5565] hover:text-[#1F1F1F] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#e55d25] transition-colors"
            >
              {editingId ? "Update Report" : "Create Report"}
            </button>
          </div>
        </form>
      )}

      {/* Loading / Error */}
      {loading && <QueryLoading message="Loading reports..." />}
      {error && <QueryError message={error.message} onRetry={refetch} />}

      {/* Reports Table */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Frequency</th>
                  <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Center</th>
                  <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Recipients</th>
                  <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Last Run</th>
                  <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Next Run</th>
                  <th className="px-4 py-3 text-right text-[#6A7282] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8">
                      <QueryEmpty message="No scheduled reports" hint="Create one to get started" />
                    </td>
                  </tr>
                )}
                {reports.map((report: any) => {
                  const isToggling = togglingId === report.id;
                  const isRunning = runningId === report.id;
                  return (
                    <tr
                      key={report.id}
                      className={`border-b border-[#E5E7EB] last:border-0 transition-colors cursor-pointer ${
                        previewId === report.id
                          ? "bg-orange-50/60"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setPreviewId(previewId === report.id ? null : report.id)}
                    >
                      <td className="px-4 py-3 text-[#1F1F1F] font-medium">{report.reportType}</td>
                      <td className="px-4 py-3 text-[#4A5565]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {report.frequency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#4A5565]">
                        {report.center?.name ?? getCenterName(centers, report.centerId)}
                      </td>
                      <td className="px-4 py-3 text-[#4A5565]">
                        {report.recipients?.length ?? 0} recipient{(report.recipients?.length ?? 0) !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(report);
                          }}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            report.enabled
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          } ${isToggling ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              report.enabled ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {isToggling ? "..." : report.enabled ? "On" : "Off"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[#4A5565] whitespace-nowrap">
                        {formatDate(report.lastSentAt)}
                      </td>
                      <td className="px-4 py-3 text-[#4A5565] whitespace-nowrap">—</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunNow(report.id);
                            }}
                            disabled={isRunning}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50"
                          >
                            {isRunning ? "Running…" : "Run now"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(report);
                            }}
                            className="text-xs text-[#FF6A2F] hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(report.id);
                            }}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Panel */}
      {preview && (
        <div className="fixed inset-0 z-40" onClick={() => setPreviewId(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-[#E5E7EB] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              {/* Panel header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1F1F1F]">Report Details</h3>
                <button
                  onClick={() => setPreviewId(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-[#6A7282] transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Config */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6A7282]">
                  Configuration
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6A7282]">Type</span>
                    <span className="font-medium text-[#1F1F1F]">{preview.reportType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6A7282]">Frequency</span>
                    <span className="font-medium text-[#1F1F1F]">{preview.frequency}</span>
                  </div>
                  {preview.dayOfPeriod && (
                    <div className="flex justify-between">
                      <span className="text-[#6A7282]">Day of Period</span>
                      <span className="font-medium text-[#1F1F1F]">{preview.dayOfPeriod}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#6A7282]">Center</span>
                    <span className="font-medium text-[#1F1F1F]">
                      {preview.center?.name ?? getCenterName(centers, preview.centerId)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6A7282]">Status</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        preview.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          preview.enabled ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {preview.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6A7282]">Created</span>
                    <span className="font-medium text-[#1F1F1F]">
                      {formatDate(preview.createdAt)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Recipients */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6A7282]">
                  Recipients
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  {preview.recipients?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {preview.recipients.map((email: string) => (
                        <li
                          key={email}
                          className="text-sm text-[#1F1F1F] flex items-center gap-2"
                        >
                          <svg className="h-4 w-4 text-[#9CA3AF] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          {email}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-[#9CA3AF]">No recipients configured</span>
                  )}
                </div>
              </section>

              {/* Filters */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6A7282]">
                  Filters
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  {preview.filters ? (
                    <pre className="text-xs text-[#4A5565] whitespace-pre-wrap font-mono bg-white rounded-lg p-3 border border-[#E5E7EB]">
                      {typeof preview.filters === "string"
                        ? preview.filters
                        : JSON.stringify(preview.filters, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-sm text-[#9CA3AF]">No filters applied</span>
                  )}
                </div>
              </section>

              {/* Delivery Log */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6A7282]">
                  Recent Deliveries
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <ul className="space-y-2">
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-[#6A7282]">Latest run</span>
                      <span className="text-[#1F1F1F] font-medium">
                        {formatDate(preview.lastSentAt)}
                      </span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-[#6A7282]">Status</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          preview.enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {preview.enabled ? "Active" : "Paused"}
                      </span>
                    </li>
                    <li className="text-xs text-[#9CA3AF] pt-1 border-t border-gray-200 mt-2">
                      Delivery history is available when the report has been sent at least once.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Panel actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setPreviewId(null);
                    openEdit(preview);
                  }}
                  className="flex-1 px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#e55d25] transition-colors"
                >
                  Edit Report
                </button>
                <button
                  onClick={async () => {
                    try {
                      await handleRunNow(preview.id);
                    } finally {
                      // refetch handled inside handleRunNow
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-[#E5E7EB] text-[#1F1F1F] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Run Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Report"
        description="This will permanently remove the scheduled report. Recipients will no longer receive it. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
