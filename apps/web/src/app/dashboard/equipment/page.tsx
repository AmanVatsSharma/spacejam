/**
 * File:        apps/web/src/app/dashboard/equipment/page.tsx
 * Module:      Web · Dashboard · Equipment
 * Purpose:     Equipment asset management — CRUD, assign/unassign,
 *              status tracking, warranty monitoring.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
"use client";

import { useState } from "react";
import { useEquipmentList, useEquipmentMutations, EquipmentStatuses, EquipmentTypes } from "@/hooks/use-enterprise";
import { QueryLoading, QueryError } from "@/components/ui/query-status";
import { toast } from "sonner";

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
  RETIRED: "bg-gray-100 text-gray-500",
};

export default function EquipmentPage() {
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "">("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "LAPTOP" as EquipmentType, description: "",
    serialNumber: "", purchaseDate: "", warrantyExpiry: "",
  });

  const { items, loading, error, refetch } = useEquipmentList();
  const { create, update, assign, unassign, setStatus, remove } = useEquipmentMutations();

  const filtered = statusFilter ? items.filter((i: any) => i.status === statusFilter) : items;

  const resetForm = () => setForm({ name: "", type: "LAPTOP", description: "", serialNumber: "", purchaseDate: "", warrantyExpiry: "" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({
        ...form,
        type: form.type as EquipmentType,
        status: EquipmentStatus.AVAILABLE,
        centerId: (await (await fetch('/api/auth/session')).json().then((d: any) => d.user?.centers?.[0]?.id).catch(() => "")) || "",
      });
      resetForm();
      setShowAdd(false);
      refetch();
    } catch {
      toast.error("Failed to add equipment");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Equipment</h1>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | "")}
            className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
          >
            <option value="">All statuses</option>
            {Object.values(EquipmentStatus).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium"
          >
            Add Equipment
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-[#E5E7EB] p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EquipmentType })} className="px-3 py-2 border rounded-lg text-sm">
            {Object.values(EquipmentType).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input placeholder="Serial #" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Purchase date" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <button type="submit" className="col-span-full px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium">Save</button>
        </form>
      )}

      {loading && <QueryLoading />}
      {error && <QueryError error={error} />}

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Name</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Type</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Serial #</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Assigned</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Purchase Date</th>
                <th className="text-left px-4 py-3 text-[#6A7282] font-medium">Warranty</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: any) => (
                <tr key={item.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-[#1F1F1F]">{item.name}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{item.type}</td>
                  <td className="px-4 py-3 text-[#4A5565] font-mono text-xs">{item.serialNumber ?? "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[item.status] ?? "bg-gray-100 text-gray-600"}`}>{item.status}</span></td>
                  <td className="px-4 py-3 text-[#4A5565]">{item.assignedUser?.name ?? item.assignedTo ? "Assigned" : "—"}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{item.purchaseDate ?? "—"}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{item.warrantyExpiry ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      {item.status !== EquipmentStatus.ASSIGNED && (
                        <button onClick={() => assign(item.id, (window as any).__CURRENT_USER_ID__) } className="text-xs text-blue-600 hover:underline">Assign</button>
                      )}
                      {item.status === EquipmentStatus.ASSIGNED && (
                        <button onClick={() => unassign(item.id)} className="text-xs text-gray-600 hover:underline">Unassign</button>
                      )}
                      <select onChange={(e) => e.target.value && setStatus(item.id, e.target.value as EquipmentStatus)} className="text-xs border rounded px-1" defaultValue="">
                        <option value="">Set Status</option>
                        {Object.values(EquipmentStatus).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#6A7282]">No equipment items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}