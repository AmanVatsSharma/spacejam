"use client";


export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_DEPOSITS,
  DELETE_DEPOSIT,
  RELEASE_DEPOSIT,
} from "@/lib/apollo/operations";
import { ApproveReleaseModal } from "@/components/ui/dashboard/approve-release-modal";
import { AddDepositModal } from "@/components/ui/dashboard/add-deposit-modal";
import { SendReminderModal } from "@/components/ui/dashboard/send-reminder-modal";
import { FreezeAccountModal } from "@/components/ui/dashboard/freeze-account-modal";
import { ExportExcelModal } from "@/components/ui/dashboard/export-excel-modal";

interface Deposit {
  id: string;
  customerId: string;
  customerName: string;
  centerId?: string;
  amount: number;
  type?: string;
  status: string;
  referenceNumber?: string;
  receivedDate?: string;
  releasedDate?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const statusStyles: Record<string, string> = {
  Held: "bg-green-100 text-green-700",
  Released: "bg-green-100 text-green-700",
  Refunded: "bg-cyan-100 text-cyan-700",
  Frozen: "bg-cyan-100 text-cyan-700",
  Pending: "bg-orange-100 text-orange-700",
  Active: "bg-green-100 text-green-700",
};

export default function RevenueDepositsPage() {
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isAddDepositModalOpen, setIsAddDepositModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);

  const { data, loading, error } = useQuery<{ deposits: Deposit[] }>(GET_DEPOSITS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const [deleteDeposit] = useMutation(DELETE_DEPOSIT, {
    refetchQueries: [{ query: GET_DEPOSITS }],
  });

  const [releaseDeposit] = useMutation(RELEASE_DEPOSIT, {
    refetchQueries: [{ query: GET_DEPOSITS }],
  });

  const deposits = data?.deposits ?? [];

  const filtered = useMemo(() => {
    return deposits.filter((d) => {
      const q = search.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        d.customerName?.toLowerCase().includes(q) ||
        d.referenceNumber?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || d.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [deposits, search, statusFilter]);

  // Compute stats from live data
  const stats = useMemo(() => {
    const totalHeld = deposits
      .filter((d) => d.status === "Held" || d.status === "Active")
      .reduce((sum, d) => sum + Number(d.amount), 0);
    const pendingRelease = deposits.filter((d) => d.status === "Pending" || d.status === "Released");
    const pendingAmount = pendingRelease.reduce((sum, d) => sum + Number(d.amount), 0);
    const frozen = deposits.filter((d) => d.status === "Frozen");
    const frozenAmount = frozen.reduce((sum, d) => sum + Number(d.amount), 0);
    return { totalHeld, pendingCount: pendingRelease.length, pendingAmount, frozenAmount };
  }, [deposits]);

  const handleRelease = async (id: string) => {
    try {
      await releaseDeposit({ variables: { id } });
      setOpenActionMenu(null);
    } catch {
      // handled by Apollo
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this deposit?')) return;
    try {
      await deleteDeposit({ variables: { id } });
      setOpenActionMenu(null);
    } catch {
      // handled by Apollo
    }
  };

  return (
    <div className="flex gap-6 w-full max-w-[1440px] mx-auto">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">

        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-semibold text-[#101828]">Security Deposits</h1>
            <p className="text-sm text-gray-500 mt-1">Manage client deposits, refunds, and holds</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors" onClick={() => setIsExportModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Export Excel
          </button>
        </div>

        {/* Filters and Stats */}
        <div className="flex flex-col gap-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="5" />
                <path d="M11 11L14 14" />
              </svg>
              <input
                type="text"
                placeholder="Search deposits..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent w-64 bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
            >
              <option value="">All Status</option>
              <option value="Held">Held</option>
              <option value="Released">Released</option>
              <option value="Refunded">Refunded</option>
              <option value="Frozen">Frozen</option>
              <option value="Pending">Pending</option>
            </select>
            <button
              className="px-4 py-2 bg-orange-50 text-[#FF6A2F] rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
              onClick={() => { setSearch(""); setStatusFilter(""); }}
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6A2F]">
                <span className="text-xl font-medium">₹</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">{formatCurrency(stats.totalHeld)}</h3>
                <p className="text-sm text-gray-500 mt-1">Total Deposits Held</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6A2F]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">{formatCurrency(stats.pendingAmount)}</h3>
                <p className="text-sm text-gray-500 mt-1">Pending Release ({stats.pendingCount})</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6A2F]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">{formatCurrency(stats.frozenAmount)}</h3>
                <p className="text-sm text-gray-500 mt-1">Frozen Deposits</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">0</h3>
                <p className="text-sm text-gray-500 mt-1">Overdue Refunds</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-gray-500 font-semibold bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 tracking-wider">NAME</th>
                  <th className="px-6 py-4 tracking-wider">AMOUNT</th>
                  <th className="px-6 py-4 tracking-wider">TYPE</th>
                  <th className="px-6 py-4 tracking-wider">REF #</th>
                  <th className="px-6 py-4 tracking-wider">STATUS</th>
                  <th className="px-6 py-4 tracking-wider">RECEIVED</th>
                  <th className="px-6 py-4 tracking-wider text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      Loading deposits…
                    </td>
                  </tr>
                ) : error && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      Unable to load deposits. Please try again.
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No deposits found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5 font-medium text-[#101828]">
                        {deposit.customerName}
                      </td>
                      <td className="px-6 py-5 text-[#FF6A2F] font-semibold">{formatCurrency(Number(deposit.amount))}</td>
                      <td className="px-6 py-5 text-gray-500">{deposit.type ?? "—"}</td>
                      <td className="px-6 py-5 text-gray-500">{deposit.referenceNumber ?? "—"}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize flex items-center gap-1.5 w-fit ${statusStyles[deposit.status] ?? "bg-gray-100 text-gray-700"}`}>
                          {deposit.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-gray-500">{formatDate(deposit.receivedDate)}</td>
                      <td className="px-6 py-5 text-center relative">
                        <button
                          onClick={() => setOpenActionMenu(openActionMenu === deposit.id ? null : deposit.id)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </button>
                        {openActionMenu === deposit.id && (
                          <div className="absolute right-10 top-10 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-2 text-left animate-in fade-in zoom-in duration-150">
                            <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left font-medium">View Details</button>
                            {deposit.status !== "Released" && (
                              <button
                                onClick={() => handleRelease(deposit.id)}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left font-medium"
                              >
                                Release
                              </button>
                            )}
                            <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left font-medium">Freeze</button>
                            <button
                              onClick={() => handleDelete(deposit.id)}
                              className="w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-50 text-left font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-[#101828] mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <button className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700" onClick={() => setIsApproveModalOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Approve Requests
            </button>
            <button className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700" onClick={() => setIsFreezeModalOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
              </svg>
              Freeze Account
            </button>
            <button className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700" onClick={() => setIsAddDepositModalOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Deposit
            </button>
            <button className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700" onClick={() => setIsReminderModalOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Send Reminder
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExportExcelModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      <ApproveReleaseModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
      />
      <AddDepositModal
        isOpen={isAddDepositModalOpen}
        onClose={() => setIsAddDepositModalOpen(false)}
      />
      <SendReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
      />
      <FreezeAccountModal
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
      />
    </div>
  );
}
