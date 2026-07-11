"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GET_DEPOSITS, RELEASE_DEPOSIT, DELETE_DEPOSIT, EXPORT_DEPOSITS } from "@/lib/apollo/operations";

/* ─── Backend Deposit shape ─── */
interface BackendDeposit {
  id: string;
  customerName: string;
  amount: number;
  status: string;
  receivedDate: string;
  releasedDate?: string | null;
  referenceNumber?: string;
  center?: { id: string; name: string } | null;
}

/* ─── UI Deposit shape ─── */
interface UIDeposit {
  id: string;
  name: string;
  amount: string;
  plan: string;
  center: string;
  payMode: string;
  status: "Active" | "Frozen" | "Pending" | "Release";
  date: string;
}

function mapBackendToUI(d: BackendDeposit): UIDeposit {
  const statusMap: Record<string, UIDeposit["status"]> = {
    HELD: "Active",
    ACTIVE: "Active",
    FROZEN: "Frozen",
    PENDING: "Pending",
    RELEASED: "Release",
    RELEASE: "Release",
  };

  return {
    id: d.id,
    name: d.customerName ?? "Unknown",
    amount: `₹${Number(d.amount ?? 0).toLocaleString("en-IN")}`,
    plan: "Monthly",
    center: d.center?.name ?? "—",
    payMode: "Online",
    status: statusMap[d.status] ?? "Pending",
    date: d.receivedDate
      ? new Date(d.receivedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "—",
  };
}

const statusStyles: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Frozen: "bg-cyan-100 text-cyan-700",
  Pending: "bg-orange-100 text-orange-700",
  Release: "bg-green-100 text-green-700",
};

export default function CRMDepositsPage() {
  const router = useRouter();
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const goToRevenueDeposits = () => router.push("/dashboard/revenue/deposits");

  /* ── Apollo data ── */
  const { data, loading, error } = useQuery<{ deposits: BackendDeposit[] }>(
    GET_DEPOSITS,
    { fetchPolicy: "cache-and-network", errorPolicy: "all" }
  );

  const [releaseDeposit] = useMutation(RELEASE_DEPOSIT, {
    refetchQueries: [{ query: GET_DEPOSITS }],
  });

  const [deleteDeposit] = useMutation(DELETE_DEPOSIT, {
    refetchQueries: [{ query: GET_DEPOSITS }],
  });

  const [exportDeposits] = useMutation(EXPORT_DEPOSITS);

  const handleExport = async () => {
    try {
      const { data } = await exportDeposits({ variables: { format: "csv" } });
      const csv = data?.exportDeposits ?? "";
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "deposits.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported deposits.csv");
    } catch {
      toast.error("Export failed");
    }
  };

  /* ── Transform ── */
  const rawDeposits: UIDeposit[] = useMemo(() => {
    if (!data?.deposits?.length) return [];
    return data.deposits.map(mapBackendToUI);
  }, [data]);

  const deposits: UIDeposit[] = useMemo(() => {
    return rawDeposits.filter((d) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q || d.name.toLowerCase().includes(q) || d.center.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || d.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rawDeposits, searchQuery, statusFilter]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = rawDeposits.reduce((sum, d) => sum + parseFloat(d.amount.replace(/[₹,]/g, "") || "0"), 0);
    const pending = rawDeposits.filter((d) => d.status === "Pending").length;
    const frozen = rawDeposits.filter((d) => d.status === "Frozen").length;
    const frozenAmount = rawDeposits
      .filter((d) => d.status === "Frozen")
      .reduce((sum, d) => sum + parseFloat(d.amount.replace(/[₹,]/g, "") || "0"), 0);
    return { total, pending, frozen, frozenAmount };
  }, [rawDeposits]);

  const handleRelease = async (id: string) => {
    try {
      await releaseDeposit({ variables: { id } });
      setOpenActionMenu(null);
    } catch { /* Apollo handles */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this deposit?")) return;
    try {
      await deleteDeposit({ variables: { id } });
      setOpenActionMenu(null);
    } catch { /* Apollo handles */ }
  };

  const formatCurrency = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString("en-IN")}`;
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
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]"
          >
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent w-64 bg-white transition-all duration-200"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] transition-all duration-200"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Frozen">Frozen</option>
              <option value="Pending">Pending</option>
              <option value="Release">Released</option>
            </select>
            <button
              onClick={() => { setSearchQuery(""); setStatusFilter(""); }}
              className="px-4 py-2 bg-orange-50 text-[#FF6A2F] rounded-lg text-sm font-medium hover:bg-orange-100 transition-all active:scale-[0.97]"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6A2F]">
                <span className="text-xl font-medium">₹</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">
                  {loading ? "..." : formatCurrency(stats.total)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Total Deposits Held</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6A2F]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">
                  {loading ? "..." : stats.pending}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Pending Release</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6A2F]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">
                  {loading ? "..." : formatCurrency(stats.frozenAmount)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Frozen Deposits ({stats.frozen})</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
          <div className="overflow-x-auto">
            {loading && deposits.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">Loading deposits…</div>
            ) : error ? (
              <div className="flex items-center justify-center h-40 text-sm text-red-400">Failed to load deposits. Please try again.</div>
            ) : deposits.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">No deposits found.</div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-500 font-semibold bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 tracking-wider">NAME</th>
                    <th className="px-6 py-4 tracking-wider">AMOUNT</th>
                    <th className="px-6 py-4 tracking-wider">PLAN</th>
                    <th className="px-6 py-4 tracking-wider">CENTER</th>
                    <th className="px-6 py-4 tracking-wider">PAY-MODE</th>
                    <th className="px-6 py-4 tracking-wider">STATUS</th>
                    <th className="px-6 py-4 tracking-wider">DATE</th>
                    <th className="px-6 py-4 tracking-wider text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-5 font-medium text-[#101828]">{deposit.name}</td>
                      <td className="px-6 py-5 text-[#FF6A2F] font-semibold">{deposit.amount}</td>
                      <td className="px-6 py-5 text-gray-500">{deposit.plan}</td>
                      <td className="px-6 py-5 text-gray-500">{deposit.center}</td>
                      <td className="px-6 py-5 text-gray-500">{deposit.payMode}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${statusStyles[deposit.status]}`}>
                          {deposit.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-gray-500">{deposit.date}</td>
                      <td className="px-6 py-5 text-center relative">
                        <button
                          onClick={() => setOpenActionMenu(openActionMenu === deposit.id ? null : deposit.id)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-all active:scale-[0.97]"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </button>
                        {openActionMenu === deposit.id && (
                          <div className="absolute right-10 top-10 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-2 text-left animate-in fade-in zoom-in duration-150">
                            <button
                              onClick={() => handleRelease(deposit.id)}
                              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left font-medium"
                            >
                              Release
                            </button>
                            <button
                              onClick={() => handleDelete(deposit.id)}
                              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-[#101828] mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { toast.info("Opening deposit management…"); goToRevenueDeposits(); }}
              className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700 active:scale-[0.97]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Approve Requests
            </button>
            <button
              onClick={() => { toast.info("Opening deposit management…"); goToRevenueDeposits(); }}
              className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700 active:scale-[0.97]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
              </svg>
              Freeze Account
            </button>
            <button
              onClick={() => { toast.info("Opening deposit management…"); goToRevenueDeposits(); }}
              className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700 active:scale-[0.97]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Deposit
            </button>
            <button
              onClick={() => { toast.info("Opening deposit management…"); goToRevenueDeposits(); }}
              className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700 active:scale-[0.97]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Send Reminder
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1">
          <h2 className="text-lg font-semibold text-[#101828] mb-6">Recent Activity</h2>
          <p className="text-sm text-gray-400">
            {loading ? "Loading…" : `${rawDeposits.length} deposits on record.`}
          </p>
        </div>
      </div>
    </div>
  );
}
