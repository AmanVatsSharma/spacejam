/**
 * File:        apps/web/src/app/dashboard/equipment/page.tsx
 * Module:      Web · Dashboard · Equipment
 * Purpose:     Equipment asset management — CRUD, assign/unassign,
 *              status tracking, warranty monitoring, maintenance
 *              scheduling, bulk actions, assignment history.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */
"use client";

import { useState, useMemo } from "react";
import { useEquipmentList, useEquipmentMutations, EquipmentStatuses, EquipmentTypes } from "@/hooks/use-enterprise";
import { GET_MY_CENTERS } from "@/lib/apollo/operations";
import { QueryLoading, QueryError } from "@/components/ui/query-status";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

type EquipmentStatus = typeof EquipmentStatuses[number];
type EquipmentType = typeof EquipmentTypes[number];

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
  RETIRED: "bg-gray-100 text-gray-500",
};

const WARRANTY_WARN_DAYS = 30;

function getWarrantyInfo(expiryDate: string | null | undefined) {
  if (!expiryDate) return { label: null, style: "", daysLeft: null };
  const diff = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return { label: `Expired (${Math.abs(diff)}d)`, style: "bg-red-100 text-red-700", daysLeft: diff };
  if (diff <= WARRANTY_WARN_DAYS) return { label: `${diff}d left`, style: "bg-amber-100 text-amber-700", daysLeft: diff };
  return { label: null, style: "", daysLeft: diff };
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

type BulkAction = "assign" | "status" | "delete";
type SortKey = "name" | "type" | "status" | "warrantyExpiry" | "assignedAt";
type SortDir = "asc" | "desc";

export default function EquipmentPage() {
  const [centerFilter, setCenterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<EquipmentType | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState<string | null>(null);
  const [warrantyFilterOnly, setWarrantyFilterOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkStatus, setBulkStatus] = useState<EquipmentStatus>("MAINTENANCE");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [centers, setCenters] = useState<{ id: string; name: string }[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "LAPTOP" as EquipmentType,
    description: "",
    serialNumber: "",
    purchaseDate: "",
    warrantyExpiry: "",
  });

  const [maintForm, setMaintForm] = useState({
    date: "",
    description: "",
    estimatedCost: "",
    technicianName: "",
  });

  const { items, loading, error, refetch } = useEquipmentList(centerFilter || undefined, statusFilter || undefined);
  const { create, update, assign, unassign, setStatus, remove } = useEquipmentMutations();

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((i: any) => i.id)));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-[10px] text-[#6A7282]">
      {sortKey === col ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
    </span>
  );

  const filtered = useMemo(() => {
    let result = [...items];

    if (statusFilter) result = result.filter((i: any) => i.status === statusFilter);
    if (typeFilter) result = result.filter((i: any) => i.type === typeFilter);
    if (warrantyFilterOnly) {
      result = result.filter((i: any) => {
        const info = getWarrantyInfo(i.warrantyExpiry);
        return info.daysLeft !== null && info.daysLeft <= WARRANTY_WARN_DAYS;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i: any) =>
        i.name.toLowerCase().includes(q) || (i.serialNumber || "").toLowerCase().includes(q)
      );
    }

    result.sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (sortKey) {
        case "name": aVal = a.name; bVal = b.name; break;
        case "type": aVal = a.type; bVal = b.type; break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "warrantyExpiry":
          aVal = a.warrantyExpiry ? new Date(a.warrantyExpiry).getTime() : 0;
          bVal = b.warrantyExpiry ? new Date(b.warrantyExpiry).getTime() : 0;
          break;
        case "assignedAt":
          aVal = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
          bVal = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
          break;
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, statusFilter, typeFilter, warrantyFilterOnly, searchQuery, sortKey, sortDir]);

  const resetForm = () => setForm({ name: "", type: "LAPTOP", description: "", serialNumber: "", purchaseDate: "", warrantyExpiry: "" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sessionRes = await fetch("/api/auth/session").then(r => r.json()).catch(() => ({}));
      const cid = centerFilter || sessionRes.user?.centers?.[0]?.id || "";
      if (!cid) { toast.error("No center available"); return; }
      await create({ ...form, type: form.type, status: "AVAILABLE", centerId: cid });
      resetForm();
      setShowAdd(false);
      refetch();
    } catch {
      toast.error("Failed to add equipment");
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    try {
      if (bulkAction === "delete") {
        await Promise.all([...selectedIds].map(id => remove(id)));
        toast.success(`Deleted ${selectedIds.size} items`);
      } else if (bulkAction === "status") {
        await Promise.all([...selectedIds].map(id => setStatus(id, bulkStatus)));
        toast.success(`Updated status for ${selectedIds.size} items`);
      } else if (bulkAction === "assign") {
        const sessionRes = await fetch("/api/auth/session").then(r => r.json()).catch(() => ({}));
        const uid = sessionRes.user?.id || currentUserId;
        if (!uid) { toast.error("No user available for assignment"); return; }
        await Promise.all([...selectedIds].map(id => assign(id, uid)));
        toast.success(`Assigned ${selectedIds.size} items`);
      }
      setSelectedIds(new Set());
      setBulkAction(null);
      refetch();
    } catch {
      toast.error("Bulk action failed");
    }
  };

  const handleScheduleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMaintenance) return;
    try {
      await update(showMaintenance, {
        status: "MAINTENANCE",
        description: maintForm.description || undefined,
      });
      toast.success("Maintenance scheduled");
      setShowMaintenance(null);
      setMaintForm({ date: "", description: "", estimatedCost: "", technicianName: "" });
      refetch();
    } catch {
      toast.error("Failed to schedule maintenance");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      setDeleteConfirm(null);
      refetch();
    } catch {
      toast.error("Failed to delete equipment");
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await handleDelete(deleteConfirm);
    }
  };

  // Load centers for filter dropdown
  if (centers.length === 0 && typeof window !== "undefined") {
    (async () => {
      try {
        const res = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: GET_MY_CENTERS }),
        });
        const json = await res.json();
        if (json.data?.myCenters) {
          setCenters(json.data.myCenters.map((c: any) => ({ id: c.id, name: c.name })));
        }
      } catch { /* ignore */ }
    })();
  }

  // Get current user ID for assignment
  if (!currentUserId && typeof window !== "undefined") {
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setCurrentUserId(data.user?.id || "");
      } catch { /* ignore */ }
    })();
  }

  const warrantyAlertCount = items.filter((i: any) => {
    const info = getWarrantyInfo(i.warrantyExpiry);
    return info.daysLeft !== null && info.daysLeft <= WARRANTY_WARN_DAYS;
  }).length;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Equipment</h1>
        <div className="flex gap-3 items-center">
          {warrantyAlertCount > 0 && (
            <button
              onClick={() => setWarrantyFilterOnly(f => !f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${warrantyFilterOnly ? "bg-red-100 text-red-700 border-2 border-red-300" : "bg-red-50 text-red-600 border border-red-200"}`}
            >
              Warranty Alerts ({warrantyAlertCount})
            </button>
          )}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Add Equipment
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-[#E5E7EB] p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EquipmentType })} className="px-3 py-2 border rounded-lg text-sm">
            {EquipmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input placeholder="Serial #" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Purchase date" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Warranty expiry" type="date" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <button type="submit" className="col-span-full px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium">Save Equipment</button>
        </form>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={centerFilter}
            onChange={(e) => setCenterFilter(e.target.value)}
            className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white"
          >
            <option value="">All Centers</option>
            {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | "")}
            className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            {EquipmentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as EquipmentType | "")}
            className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white"
          >
            <option value="">All Types</option>
            {EquipmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search name or serial #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm pl-9"
            />
            <span className="absolute left-3 top-2.5 text-[#6A7282] text-sm">🔍</span>
          </div>

          {(centerFilter || statusFilter || typeFilter || searchQuery || warrantyFilterOnly) && (
            <button
              onClick={() => { setCenterFilter(""); setStatusFilter(""); setTypeFilter(""); setSearchQuery(""); setWarrantyFilterOnly(false); }}
              className="px-3 py-2 text-sm text-[#6A7282] hover:text-[#1F1F1F] underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading && <QueryLoading />}
      {error && <QueryError message={error.message} onRetry={refetch} />}

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#FFF7ED] border border-orange-200 rounded-2xl p-3 flex items-center gap-4">
          <span className="text-sm text-[#1F1F1F] font-medium">{selectedIds.size} selected</span>
          <button onClick={() => setBulkAction("assign")} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Assign</button>
          <button onClick={() => setBulkAction("status")} className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">Set Status</button>
          <button onClick={() => setBulkAction("delete")} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">Delete</button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-sm text-[#6A7282] hover:text-[#1F1F1F]">Cancel</button>
        </div>
      )}

      {/* Equipment Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-gray-50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                    onChange={handleToggleSelectAll}
                    className="rounded border-[#E5E7EB]"
                  />
                </th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium cursor-pointer" onClick={() => handleSort("name")}>
                  Name <SortIcon col="name" />
                </th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium cursor-pointer" onClick={() => handleSort("type")}>
                  Type <SortIcon col="type" />
                </th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Serial #</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium cursor-pointer" onClick={() => handleSort("status")}>
                  Status <SortIcon col="status" />
                </th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium cursor-pointer" onClick={() => handleSort("warrantyExpiry")}>
                  Warranty <SortIcon col="warrantyExpiry" />
                </th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Assigned To</th>
                <th className="px-4 py-3 w-44">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: any) => {
                const isExpanded = expandedId === item.id;
                const isSelected = selectedIds.has(item.id);
                const warranty = getWarrantyInfo(item.warrantyExpiry);

                return (
                  <>
                    <tr key={item.id} className={`border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 ${isSelected ? "bg-orange-50" : ""}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded border-[#E5E7EB]"
                        />
                      </td>
                      <td className="px-4 py-3 text-[#1F1F1F] font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-[#4A5565]">{item.type}</td>
                      <td className="px-4 py-3 text-[#4A5565] font-mono text-xs">{item.serialNumber ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[item.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {item.status}
                        </span>
                        {warranty.label && (
                          <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${warranty.style}`}>
                            {warranty.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#4A5565]">{formatDate(item.warrantyExpiry)}</td>
                      <td className="px-4 py-3 text-[#4A5565]">
                        {item.assignedUser?.name ?? (item.assignedTo ? "Assigned" : "—")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end flex-wrap">
                          {item.status !== "ASSIGNED" && item.status !== "MAINTENANCE" && item.status !== "RETIRED" && (
                            <button
                              onClick={() => assign(item.id, currentUserId || (window as any).__CURRENT_USER_ID__)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Assign
                            </button>
                          )}
                          {item.status === "ASSIGNED" && (
                            <button onClick={() => unassign(item.id)} className="text-xs text-gray-600 hover:underline">
                              Unassign
                            </button>
                          )}
                          {(item.status === "AVAILABLE" || item.status === "ASSIGNED") && (
                            <button
                              onClick={() => setShowMaintenance(item.id)}
                              className="text-xs text-amber-600 hover:underline"
                            >
                              Schedule Maint.
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="text-xs text-[#FF6A2F] hover:underline font-medium"
                          >
                            {isExpanded ? "Hide" : "Details"}
                          </button>
                          <select
                            onChange={(e) => e.target.value && setStatus(item.id, e.target.value as EquipmentStatus)}
                            className="text-xs border rounded px-1"
                            defaultValue=""
                          >
                            <option value="">Status</option>
                            {EquipmentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => setDeleteConfirm(item.id)} className="text-xs text-red-500 hover:underline">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expandable Detail Row */}
                    {isExpanded && (
                      <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Assignment History */}
                            <div>
                              <h4 className="text-sm font-semibold text-[#1F1F1F] mb-2">Assignment History</h4>
                              <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#6A7282]">Currently assigned to:</span>
                                  <span className="text-[#1F1F1F] font-medium">{item.assignedUser?.name ?? "—"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#6A7282]">Assigned at:</span>
                                  <span className="text-[#4A5565]">{formatDate(item.assignedAt)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#6A7282]">Assigned to ID:</span>
                                  <span className="text-[#4A5565] font-mono text-xs">{item.assignedTo ?? "—"}</span>
                                </div>
                                {item.status === "ASSIGNED" && (
                                  <div className="pt-2">
                                    <button
                                      onClick={() => { unassign(item.id); setExpandedId(null); }}
                                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-300"
                                    >
                                      Unassign Equipment
                                    </button>
                                  </div>
                                )}
                                {item.status !== "ASSIGNED" && item.status !== "RETIRED" && currentUserId && (
                                  <div className="pt-2">
                                    <button
                                      onClick={() => { assign(item.id, currentUserId); setExpandedId(null); }}
                                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600"
                                    >
                                      Assign to Me
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Maintenance & Details */}
                            <div>
                              <h4 className="text-sm font-semibold text-[#1F1F1F] mb-2">Maintenance &amp; Details</h4>
                              <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#6A7282]">Purchase Date:</span>
                                  <span className="text-[#4A5565]">{formatDate(item.purchaseDate)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#6A7282]">Warranty Expiry:</span>
                                  <span className={`font-medium ${warranty.style ? warranty.style : "text-[#4A5565]"}`}>
                                    {formatDate(item.warrantyExpiry)} {warranty.label ? `(${warranty.label})` : ""}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#6A7282]">Center:</span>
                                  <span className="text-[#4A5565]">{item.center?.name ?? "—"}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-[#6A7282]">Description:</span>
                                  <p className="text-[#4A5565] mt-1">{item.description || "No description provided."}</p>
                                </div>
                                {item.status === "MAINTENANCE" && (
                                  <div className="pt-2">
                                    <button
                                      onClick={() => { setStatus(item.id, "AVAILABLE"); }}
                                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600"
                                    >
                                      Mark as Available
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#6A7282]">
                    {warrantyFilterOnly ? "No equipment with warranty alerts found" : "No equipment items found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Maintenance Modal */}
      {showMaintenance && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowMaintenance(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-[#1F1F1F] mb-4">Schedule Maintenance</h3>
            <form onSubmit={handleScheduleMaintenance} className="space-y-3">
              <div>
                <label className="block text-sm text-[#6A7282] mb-1">Maintenance Date</label>
                <input
                  type="date"
                  value={maintForm.date}
                  onChange={(e) => setMaintForm({ ...maintForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#6A7282] mb-1">Description</label>
                <textarea
                  value={maintForm.description}
                  onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
                  rows={3}
                  placeholder="Describe the maintenance needed..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[#6A7282] mb-1">Estimated Cost</label>
                  <input
                    type="text"
                    placeholder="e.g. $50"
                    value={maintForm.estimatedCost}
                    onChange={(e) => setMaintForm({ ...maintForm, estimatedCost: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6A7282] mb-1">Technician Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John D."
                    value={maintForm.technicianName}
                    onChange={(e) => setMaintForm({ ...maintForm, technicianName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium">
                  Schedule Maintenance
                </button>
                <button type="button" onClick={() => setShowMaintenance(null)} className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Status Modal */}
      {bulkAction === "status" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setBulkAction(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-[#1F1F1F] mb-4">Set Status for {selectedIds.size} items</h3>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as EquipmentStatus)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm mb-4"
            >
              {EquipmentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={handleBulkAction} className="flex-1 px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium">Apply</button>
              <button onClick={() => setBulkAction(null)} className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Equipment"
        description="Are you sure you want to delete this equipment item? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
