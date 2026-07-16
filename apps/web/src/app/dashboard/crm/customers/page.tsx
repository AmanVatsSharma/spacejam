"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_CUSTOMERS,
  DELETE_CUSTOMER,
  CREATE_CUSTOMER,
} from "@/lib/apollo/operations";
import { AddClientModal } from "@/components/ui/dashboard/add-client-modal";
import { QueryLoading, QueryError, QueryEmpty } from "@/components/ui/query-status";


// Icons
const Icons = {
  search: (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  userCheck: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  rupee: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-6 4h6m-6 4h6M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  userPlus: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  wallet: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  printer: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};


interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking?: string | null;
  createdAt: string;
  teamSize?: string;
  location?: string;
  joinDate?: string;
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
  Active: "bg-[#FCEAE8] text-[#D95D51]",
  Inactive: "bg-gray-100 text-gray-600",
  "Expiring Soon": "bg-[#FEF5E5] text-[#D99A29]",
  Upgraded: "bg-green-100 text-green-700",
};

export default function CustomersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Apollo query
  const { data, loading, error, refetch } = useQuery<{ customers: Customer[] }>(GET_CUSTOMERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    refetchQueries: [{ query: GET_CUSTOMERS }],
  });

  const [createCustomer] = useMutation(CREATE_CUSTOMER, {
    refetchQueries: [{ query: GET_CUSTOMERS }],
  });

  const handleAddClient = async (input: Record<string, string>) => {
    try {
      await createCustomer({ variables: { input } });
      toast.success("Client created successfully");
      setShowAddClient(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create client";
      toast.error(msg);
      throw err; // re-throw so the modal stays open and doesn't close
    }
  };

  const customers = data?.customers ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        customer.name?.toLowerCase().includes(q) ||
        customer.email?.toLowerCase().includes(q) ||
        customer.company?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || customer.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  // Compute stats from live data
  const stats = useMemo(() => {
    const active = customers.filter((c) => c.status === "Active").length;
    const expiring = customers.filter((c) => c.status === "Expiring Soon").length;
    const totalSpent = customers.reduce((sum, c) => sum + Number(c.totalSpent ?? 0), 0);
    return { total: customers.length, active, expiring, totalSpent };
  }, [customers]);

  const statsData = [
    { label: "Total Customer", value: stats.total, icon: "users" as const },
    { label: "Active Members", value: stats.active, icon: "userCheck" as const },
    { label: "Expiring Soon", value: stats.expiring, icon: "calendar" as const },
    { label: "Total Revenue", value: formatCurrency(stats.totalSpent), icon: "rupee" as const },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await deleteCustomer({ variables: { id } });
      toast.success("Customer deleted");
      setOpenDropdownId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete customer");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1440px] mx-auto pb-10">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
        <div>
          <h1 className="text-[28px] font-bold text-[#101828] leading-tight">Customers</h1>
          <p className="text-sm text-[#667085] mt-1">Manage all onboarded clients and organizations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all active:scale-[0.97] shadow-sm"
          >
            {Icons.download} Export Excel
          </button>
          <button
            onClick={() => setShowAddClient(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-all active:scale-[0.97] shadow-sm"
          >
            {Icons.userPlus} Add Client
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">{Icons.search}</span>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent w-64 bg-white shadow-sm transition-all duration-200"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-[#344054] font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] min-w-[130px] cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Upgraded">Upgraded</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">{Icons.chevronDown}</span>
        </div>

        <button
          className="px-5 py-2.5 bg-[#FFF2F0] text-[#D95D51] border border-[#FCEAE8] rounded-lg text-sm font-medium hover:bg-[#FCEAE8] transition-all active:scale-[0.97] ml-2"
          onClick={() => { setSearchQuery(""); setStatusFilter(""); }}
        >
          Clear All
        </button>
      </div>

      {/* Grid Section: Stats */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: 4 Stat Cards */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 flex flex-col justify-between min-h-[140px] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-full bg-[#FFF2EA] flex items-center justify-center text-[#FF6A2F] mb-4">
                {Icons[stat.icon]}
              </div>
              <div>
                <p className="text-[28px] font-bold text-[#101828] leading-none mb-1.5">{stat.value}</p>
                {stat.label && <p className="text-sm text-[#667085] font-medium">{stat.label}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 mt-2 pb-16">
        <div className="overflow-visible">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">CUSTOMER</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">COMPANY</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">LOCATION</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">JOIN DATE</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">BOOKINGS</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">TOTAL SPENT</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">STATUS</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12">
                    <QueryLoading message="Loading customers…" />
                  </td>
                </tr>
              ) : error && filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12">
                    <QueryError message="Unable to load customers." onRetry={() => refetch()} />
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12">
                    <QueryEmpty message="No customers found" hint="Add your first client to get started." />
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => router.push('/dashboard/crm/customers/' + customer.id)}
                    className="border-b border-gray-50 transition-colors duration-150 hover:bg-[#F9FAFB] cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/crm/customers/${customer.id}`} className="font-bold text-[#101828] hover:text-[#FF6A2F] transition-colors">
                        {customer.name}
                      </Link>
                      <div className="text-xs text-gray-400">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 text-[#667085]">{customer.company ?? "—"}</td>
                    <td className="px-6 py-4 text-[#667085]">{customer.location ?? "—"}</td>
                    <td className="px-6 py-4 text-[#667085]">{formatDate(customer.joinDate ?? customer.createdAt)}</td>
                    <td className="px-6 py-4 text-[#667085]">{customer.totalBookings ?? 0}</td>
                    <td className="px-6 py-4 text-[#667085] font-medium">{formatCurrency(Number(customer.totalSpent ?? 0))}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[customer.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block" ref={openDropdownId === customer.id ? dropdownRef : null}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === customer.id ? null : customer.id); }}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all active:scale-[0.97]"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </button>

                        {openDropdownId === customer.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/crm/customers/${customer.id}`); }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              View Details
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-red-500 hover:bg-gray-50"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} onAdd={handleAddClient} />
      
      {/* Export Dialog */}
      {showExportDialog && (
        <ExportToExcelDialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          customers={customers}
          filteredCustomers={filteredCustomers}
        />
      )}
    </div>
  );
}

/* ----- Export to Excel Dialog ----- */
function ExportToExcelDialog({
  open,
  onClose,
  customers,
  filteredCustomers,
}: {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  filteredCustomers: Customer[];
}) {
  const [exportType, setExportType] = useState<"all" | "filtered">("filtered");
  const [fileFormat, setFileFormat] = useState<"excel" | "csv">("excel");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[500px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-excel-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 id="export-excel-title" className="text-[20px] font-bold text-gray-900 leading-tight">
              Export to Excel
            </h2>
            <p className="text-[14px] text-gray-500 mt-1">Choose export options</p>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            onClick={onClose}
            aria-label="Close dialog"
          >
            {Icons.close}
          </button>
        </header>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">

          {/* Export Type */}
          <div className="flex flex-col gap-3">
            <span className="text-[15px] font-bold text-gray-900">Export Type</span>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setExportType("all")}
                className={`flex flex-col items-start px-5 py-4 rounded-xl border ${exportType === "all"
                    ? "border-[#FF6A2F] bg-[#FFF8F3]"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                  } transition-colors w-full text-left`}
              >
                <span className="text-[15px] font-medium text-gray-900 mb-1">All Customers</span>
                <span className="text-[14px] text-gray-500">Export complete customer list</span>
              </button>
              <button
                onClick={() => setExportType("filtered")}
                className={`flex flex-col items-start px-5 py-4 rounded-xl border ${exportType === "filtered"
                    ? "border-[#FF6A2F] bg-[#FFF8F3]"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                  } transition-colors w-full text-left`}
              >
                <span className="text-[15px] font-medium text-gray-900 mb-1">Filtered Results</span>
                <span className="text-[14px] text-gray-500">Export current filtered view</span>
              </button>
            </div>
          </div>

          {/* File Format */}
          <div className="flex flex-col gap-3">
            <span className="text-[15px] font-bold text-gray-900">File Format</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFileFormat("excel")}
                className={`flex items-center justify-center py-3.5 rounded-xl border ${fileFormat === "excel"
                    ? "border-[#FF6A2F] bg-[#FFF8F3] text-[#FF6A2F]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  } transition-colors text-[14px] font-medium`}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => setFileFormat("csv")}
                className={`flex items-center justify-center py-3.5 rounded-xl border ${fileFormat === "csv"
                    ? "border-[#FF6A2F] bg-[#FFF8F3] text-[#FF6A2F]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  } transition-colors text-[14px] font-medium`}
              >
                CSV (.csv)
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="px-6 py-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-[#F9FAFB]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[15px] font-medium rounded-lg hover:bg-gray-50 transition-all active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 py-3 bg-[#FF6A2F] text-white text-[15px] font-medium rounded-lg hover:bg-[#E55A20] transition-all active:scale-[0.97]"
            onClick={() => {
              const data = exportType === 'filtered' ? filteredCustomers : customers;
              const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Total Spent'];
              const rows = data.map(c => [
                c.name,
                c.email || '',
                c.phone || '',
                c.company || '',
                c.status,
                c.totalSpent || 0,
              ]);
              const csv = [headers, ...rows]
                .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'customers.csv';
              a.click();
              URL.revokeObjectURL(url);
              toast.success(`Exported ${data.length} customers`);
              onClose();
            }}
          >
            Download
          </button>
        </footer>
      </div>

    </div>
  );
}
