"use client";



import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_CONTRACTS,
  TERMINATE_CONTRACT,
  RENEW_CONTRACT,
} from "@/lib/apollo/operations";
import { AddContractModal } from "./modals/add-contract-modal";
import { normalizeStatus, contractStatusLabel } from "@/lib/revenue-status";

interface Contract {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  centerId?: string;
  planName?: string;
  startDate: string;
  endDate: string;
  status: string;
  amount: number;
  paymentFrequency?: string;
  autoRenew?: boolean;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-[#FF6A2F] text-white",
  EXPIRING_SOON: "bg-[#FFB703] text-white",
  EXPIRED: "bg-[#06D6A0] text-white",
  TERMINATED: "bg-[#EF476F] text-white",
};

export default function ContractsPage() {
  const [showAddContract, setShowAddContract] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewEndDate, setRenewEndDate] = useState("");

  const { data, loading, error } = useQuery<{ contracts: Contract[] }>(GET_CONTRACTS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const [terminateContract] = useMutation(TERMINATE_CONTRACT, {
    refetchQueries: [{ query: GET_CONTRACTS }],
  });

  const [renewContract, { loading: renewing }] = useMutation(RENEW_CONTRACT, {
    refetchQueries: [{ query: GET_CONTRACTS }],
  });

  const contracts = data?.contracts ?? [];

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        c.customerName?.toLowerCase().includes(q) ||
        c.contractNumber?.toLowerCase().includes(q) ||
        c.planName?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || normalizeStatus(c.status) === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [contracts, search, statusFilter]);

  const selected = useMemo(
    () => filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  );

  // Compute stats from live data
  const stats = useMemo(() => {
    const active = contracts.filter((c) => normalizeStatus(c.status) === "ACTIVE");
    const expiring = contracts.filter((c) => normalizeStatus(c.status) === "EXPIRING_SOON");
    const expired = contracts.filter((c) => normalizeStatus(c.status) === "EXPIRED");
    const terminated = contracts.filter((c) => normalizeStatus(c.status) === "TERMINATED");
    const monthlyRevenue = active.reduce((sum, c) => sum + Number(c.amount), 0);
    return { active, expiring, expired, terminated, monthlyRevenue, activeCount: active.length };
  }, [contracts]);

  const handleTerminate = async (id: string) => {
    if (!confirm('Terminate this contract? This action cannot be undone.')) return;
    try {
      await terminateContract({ variables: { id } });
      toast.success('Contract terminated');
    } catch (err) {
      toast.error(`Failed to terminate: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const openRenewDialog = (id: string) => {
    setRenewingId(id);
    setRenewEndDate("");
    setShowRenewDialog(true);
  };

  const handleRenewConfirm = async () => {
    if (!renewingId || !renewEndDate) return;
    const parsed = new Date(renewEndDate);
    if (Number.isNaN(parsed.getTime())) {
      toast.error("Invalid date.");
      return;
    }
    try {
      const { errors } = await renewContract({
        variables: { id: renewingId, newEndDate: parsed.toISOString() },
      });
      if (errors && errors.length) {
        toast.error(errors[0].message);
        return;
      }
      toast.success("Contract renewed successfully");
      setShowRenewDialog(false);
      setRenewingId(null);
    } catch (err) {
      toast.error(`Failed to renew: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-80px)] font-sans">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6 flex-shrink-0">
          <h1 className="text-[24px] font-bold text-gray-900 mb-1">Contract Management</h1>
          <p className="text-[14px] text-gray-500">Track active contracts, manage renewals, and monitor revenue.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-[280px] transition-all duration-200 focus-within:ring-2 focus-within:ring-[#FF6A2F]/20">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]/20 focus:border-[#FF6A2F] transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]/20"
          >
            <option value="">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING_SOON">Expiring Soon</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
          </select>

          <button
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 font-medium hover:bg-gray-50 transition-all active:scale-[0.97] transition-transform duration-150"
            onClick={() => { setSearch(""); setStatusFilter(""); }}
          >
            Clear Filters
          </button>

          <button
            onClick={() => setShowAddContract(true)}
            className="ml-auto px-5 py-2.5 bg-[#FF6A2F] text-white rounded-xl text-[14px] font-semibold flex items-center gap-2 hover:bg-[#E55A20] transition-all shadow-sm active:scale-[0.97] transition-transform duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            Add Contract
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <h3 className="text-[32px] font-bold text-gray-900 mb-1">{stats.activeCount}</h3>
            <p className="text-[13px] text-gray-500 mb-2">Total Active Contracts</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <h3 className="text-[32px] font-bold text-gray-900 mb-1">{formatCurrency(stats.monthlyRevenue)}</h3>
            <p className="text-[13px] text-gray-500 mb-2">Monthly Revenue</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <h3 className="text-[32px] font-bold text-gray-900 mb-1">{stats.expiring.length}</h3>
            <p className="text-[13px] text-gray-500 mb-2">Expiring This Month</p>
            {stats.expiring.length > 0 && (
              <span className="text-[13px] text-[#FF6A2F] font-medium">Action Required</span>
            )}
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <h3 className="text-[32px] font-bold text-gray-900 mb-1">{stats.terminated.length}</h3>
            <p className="text-[13px] text-gray-500 mb-2">Contracts Terminated</p>
          </div>
        </div>

        {/* Status Ribbons */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 flex-shrink-0">
          {[
            { name: "Active", filter: "ACTIVE", count: stats.active.length, cls: "bg-[#FF6A2F]" },
            { name: "Renewal Due", filter: "EXPIRING_SOON", count: stats.expiring.length, cls: "bg-[#FFB703]" },
            { name: "Expired", filter: "EXPIRED", count: stats.expired.length, cls: "bg-[#06D6A0]" },
            { name: "Terminated", filter: "TERMINATED", count: stats.terminated.length, cls: "bg-[#EF476F]" },
          ].map((s) => (
            <button
              key={s.name}
              onClick={() => setStatusFilter(statusFilter === s.filter ? "" : s.filter)}
              className={`flex-1 min-w-[120px] ${s.cls} ${statusFilter === s.filter ? "ring-2 ring-offset-2 ring-gray-400" : ""} text-white py-4 rounded-xl flex flex-col items-center justify-center transition-all shadow-sm opacity-90 hover:opacity-100 active:scale-[0.97] transition-transform duration-150`}
            >
              <span className="text-[14px] font-medium mb-1">{s.name}</span>
              <span className="text-[24px] font-bold">{s.count}</span>
            </button>
          ))}
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-2xl border border-gray-100 flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Contract #</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Customer</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Plan</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Amount</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">End Date</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Loading contracts…
                    </td>
                  </tr>
                ) : error && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Unable to load contracts. Please try again.
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No contracts found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((contract) => (
                    <tr
                      key={contract.id}
                      onClick={() => setSelectedId(contract.id)}
                      className={`group hover:bg-gray-50/50 transition-colors duration-150 border-b border-gray-50 last:border-0 cursor-pointer ${selected?.id === contract.id ? "bg-[#FFF8F6]" : ""}`}
                    >
                      <td className="py-4 px-6 text-[14px] font-semibold text-gray-900 whitespace-nowrap">{contract.contractNumber}</td>
                      <td className="py-4 px-6 text-[14px] font-semibold text-gray-900 whitespace-nowrap">{contract.customerName}</td>
                      <td className="py-4 px-6 text-[14px] text-gray-600">{contract.planName ?? "—"}</td>
                      <td className="py-4 px-6 text-[14px] font-medium text-gray-900">{formatCurrency(Number(contract.amount))}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[normalizeStatus(contract.status)] ?? "bg-gray-100 text-gray-700"}`}>
                          {contractStatusLabel[normalizeStatus(contract.status)] ?? contract.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[14px] text-gray-600">{formatDate(contract.endDate)}</td>
                      <td className="py-4 px-6 text-[14px] text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTerminate(contract.id); }}
                          className="text-[#EF476F] font-medium hover:underline transition-all active:scale-[0.97] transition-transform duration-150"
                        >
                          Terminate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Contract Details */}
      <div className="w-[360px] bg-white rounded-2xl border border-gray-100 flex flex-col flex-shrink-0 h-full overflow-y-auto">
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-[18px] font-bold text-gray-900">Contract Details</h2>
        </div>

        {selected ? (
          <div className="p-6 flex-1 flex flex-col">
            {/* Client Info */}
            <div className="mb-8">
              <h3 className="text-[15px] font-bold text-gray-900 mb-4">Client Info</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">Name</p>
                    <p className="text-[14px] font-semibold text-gray-900">{selected.customerName}</p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100 mb-8" />

            {/* Contract Info */}
            <div className="mb-8">
              <h3 className="text-[15px] font-bold text-gray-900 mb-4">Contract Info</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">Contract Number</p>
                    <p className="text-[14px] font-semibold text-gray-900">{selected.contractNumber}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">Plan</p>
                    <p className="text-[14px] font-semibold text-gray-900">{selected.planName ?? "—"}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">Start Date</p>
                    <p className="text-[14px] font-semibold text-gray-900">{formatDate(selected.startDate)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">End Date</p>
                    <p className="text-[14px] font-semibold text-gray-900">{formatDate(selected.endDate)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">Billing Cycle</p>
                    <p className="text-[14px] font-semibold text-gray-900">{selected.paymentFrequency ?? "—"}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                    <span className="font-bold">₹</span>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">Amount</p>
                    <p className="text-[14px] font-semibold text-gray-900">{formatCurrency(Number(selected.amount))}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">Auto Renew</p>
                    <p className="text-[14px] font-semibold text-gray-900">{selected.autoRenew ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100 mb-8" />

            {/* Bottom Actions */}
            <div className="space-y-3 pt-8 mt-auto">
              <button
                onClick={() => openRenewDialog(selected.id)}
                disabled={renewing}
                className="w-full py-2.5 bg-[#FF6A2F] text-white rounded-xl text-[14px] font-semibold hover:bg-[#E55A20] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97] transition-transform duration-150"
              >
                {renewing ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                )}
                {renewing ? "Renewing..." : "Renew Contract"}
              </button>
              <button
                onClick={() => handleTerminate(selected.id)}
                className="w-full py-2.5 bg-white border border-[#EF476F] text-[#EF476F] rounded-xl text-[14px] font-semibold hover:bg-[#FFF0F3] transition-all flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-150"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Terminate Contract
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a contract to view details
          </div>
        )}
      </div>

      {/* Modals */}
      <AddContractModal open={showAddContract} onClose={() => setShowAddContract(false)} />

      {/* Renew Contract Dialog */}
      {showRenewDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
          onClick={() => setShowRenewDialog(false)}
        >
          <div
            className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-[18px] font-bold text-gray-900">Renew Contract</h2>
              <p className="text-[13px] text-gray-500 mt-1">
                Set the new end date for this contract.
              </p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">New End Date</label>
                <input
                  type="date"
                  className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors w-full"
                  value={renewEndDate}
                  onChange={(e) => setRenewEndDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowRenewDialog(false)}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenewConfirm}
                disabled={!renewEndDate || renewing}
                className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {renewing ? "Renewing…" : "Confirm Renewal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
