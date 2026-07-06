"use client";
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AddClientModal } from "@/components/ui/dashboard/add-client-modal";


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
  teamSize: string;
  location: string;
  joinDate: string;
  billing: "Paid" | "Pending" | "Overdue";
  lastInvoice: string;
  status: "Upgrade" | "Send Notice" | "Send Invoice";
}

const statsData = [
  { label: "Total Customer", value: 20, icon: "users" },
  { label: "Active Members", value: 15, icon: "userCheck" },
  { label: "1 Expiring Soon", value: 3, icon: "calendar" },
  { label: "", value: 2, icon: "rupee" }, // Represents the rupee icon card without a label
];

const customersData: Customer[] = [
  { id: "1", name: "Technova solution", teamSize: "25 seats", location: "Ch-Hub", joinDate: "Jan 15, 2025", billing: "Paid", lastInvoice: "12 Mar", status: "Upgrade" },
  { id: "2", name: "StartupX", teamSize: "8 seats", location: "Jalandhar", joinDate: "Jan 15, 2024", billing: "Paid", lastInvoice: "10 Mar", status: "Send Notice" },
  { id: "3", name: "Ankit", teamSize: "3 seats", location: "Ch-Hub", joinDate: "Jun 15, 2025", billing: "Paid", lastInvoice: "9 Mar", status: "Send Invoice" },
  { id: "4", name: "TechCorp", teamSize: "2 seats", location: "Ch-Hub", joinDate: "Jul 15, 2026", billing: "Overdue", lastInvoice: "8 Mar", status: "Send Notice" },
  { id: "5", name: "Priya Singh", teamSize: "5 seats", location: "Jalandhar", joinDate: "Jan 15, 2026", billing: "Paid", lastInvoice: "7 Mar", status: "Upgrade" },
  { id: "6", name: "Priya Singh", teamSize: "3 seats", location: "Ch-Hub", joinDate: "Jan 15, 2024", billing: "Paid", lastInvoice: "7 Mar", status: "Upgrade" },
  { id: "7", name: "Priya Singh", teamSize: "8 seats", location: "Ch-Hub", joinDate: "Aug 15, 2024", billing: "Pending", lastInvoice: "7 Mar", status: "Send Notice" },
  { id: "8", name: "Priya Singh", teamSize: "9 seats", location: "Ch-Hub", joinDate: "Jan 15, 2024", billing: "Paid", lastInvoice: "7 Mar", status: "Upgrade" },
];

const statusColors: Record<Customer["status"], string> = {
  Upgrade: "bg-[#FCEAE8] text-[#D95D51]",
  "Send Notice": "bg-[#FEF5E5] text-[#D99A29]",
  "Send Invoice": "bg-gray-100 text-gray-600",
};

const billingColors: Record<Customer["billing"], string> = {
  Paid: "text-gray-600",
  Pending: "text-[#F59E0B]", // Orange text
  Overdue: "text-[#EF4444]", // Red text
};

const recentActivities = [
  { title: "Payment Faild", subtitle: "Pending Approvals", icon: "wallet" },
  { title: "Printer Booked Today", subtitle: "Patel Enterprises printer bo.....", icon: "printer" },
];

export default function CustomersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  console.log(showAddClient);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const filteredCustomers = customersData.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            {Icons.download} Export Excel
          </button>
          <button 
            onClick={() => setShowAddClient(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-colors shadow-sm"
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
            placeholder="Search Invoice.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent w-64 bg-white shadow-sm"
          />
        </div>
        
        <div className="relative">
          <select className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-[#344054] font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] min-w-[130px] cursor-pointer">
            <option>All Types</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">{Icons.chevronDown}</span>
        </div>

        <div className="relative">
          <select className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-[#344054] font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] min-w-[130px] cursor-pointer">
            <option>All Statues</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">{Icons.chevronDown}</span>
        </div>

        <div className="relative">
          <select className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-[#344054] font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] min-w-[130px] cursor-pointer">
            <option>All Plans</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">{Icons.chevronDown}</span>
        </div>

        <button className="px-5 py-2.5 bg-[#FFF2F0] text-[#D95D51] border border-[#FCEAE8] rounded-lg text-sm font-medium hover:bg-[#FCEAE8] transition-colors ml-2">
          Clear All
        </button>
      </div>

      {/* Grid Section: Stats & Recent Activities */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: 4 Stat Cards */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 flex flex-col justify-between min-h-[140px]">
              <div className="w-10 h-10 rounded-full bg-[#FFF2EA] flex items-center justify-center text-[#FF6A2F] mb-4">
                {Icons[stat.icon as keyof typeof Icons]}
              </div>
              <div>
                <p className="text-[28px] font-bold text-[#101828] leading-none mb-1.5">{stat.value}</p>
                {stat.label && <p className="text-sm text-[#667085] font-medium">{stat.label}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Recent Activities */}
        <div className="w-full lg:w-[320px] bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-[#101828] mb-5">Recent Activities</h3>
          <div className="flex flex-col gap-5">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-[#FFF2EA] flex items-center justify-center text-[#FF6A2F] shrink-0 mt-0.5 border border-[#FFE4D6]">
                  {Icons[activity.icon as keyof typeof Icons]}
                </div>
                <div className="flex flex-col">
                  <p className="text-[13px] font-bold text-[#101828]">{activity.title}</p>
                  <p className="text-[13px] text-[#667085] mt-0.5">{activity.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 mt-2 pb-16">
        <div className="overflow-visible">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">CUSTOMER</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">TEAM SIZE</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">LOCATION</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">JOIN DATE</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">BILLING</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">LAST INVOICE</th>
                <th className="px-6 py-4 font-semibold text-[#667085] uppercase tracking-wider text-xs">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => router.push('/dashboard/crm/customers/' + customer.id)}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/crm/customers/${customer.id}`} className="font-bold text-[#101828] hover:text-[#FF6A2F] transition-colors">
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-[#667085]">{customer.teamSize}</td>
                  <td className="px-6 py-4 text-[#667085]">{customer.location}</td>
                  <td className="px-6 py-4 text-[#667085]">{customer.joinDate}</td>
                  <td className="px-6 py-4">
                    <span className={`${billingColors[customer.billing]}`}>
                      {customer.billing}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#667085]">{customer.lastInvoice}</td>
                  <td className="px-6 py-4">
                    <div className="relative inline-block" ref={openDropdownId === customer.id ? dropdownRef : null}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === customer.id ? null : customer.id)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold ${statusColors[customer.status]}`}
                      >
                        {customer.status}
                        <span className="opacity-70">{Icons.chevronDown}</span>
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdownId === customer.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1.5">
                          <button className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                            Upgrade
                          </button>
                          <button className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                            Send Notice
                          </button>
                          <button className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                            Send Invoice
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <ExportToExcelDialog 
        open={showExportDialog} 
        onClose={() => setShowExportDialog(false)} 
      />
      <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} />
    </div>
  );
}

/* ----- Export to Excel Dialog ----- */
function ExportToExcelDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[500px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
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
                className={`flex flex-col items-start px-5 py-4 rounded-xl border ${
                  exportType === "all"
                    ? "border-[#FF6A2F] bg-[#FFF8F3]"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                } transition-colors w-full text-left`}
              >
                <span className="text-[15px] font-medium text-gray-900 mb-1">All Invoices</span>
                <span className="text-[14px] text-gray-500">Export complete invoice list</span>
              </button>
              <button
                onClick={() => setExportType("filtered")}
                className={`flex flex-col items-start px-5 py-4 rounded-xl border ${
                  exportType === "filtered"
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
                className={`flex items-center justify-center py-3.5 rounded-xl border ${
                  fileFormat === "excel"
                    ? "border-[#FF6A2F] bg-[#FFF8F3] text-[#FF6A2F]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                } transition-colors text-[14px] font-medium`}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => setFileFormat("csv")}
                className={`flex items-center justify-center py-3.5 rounded-xl border ${
                  fileFormat === "csv"
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
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[15px] font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 py-3 bg-[#FF6A2F] text-white text-[15px] font-medium rounded-lg hover:bg-[#E55A20] transition-colors"
          >
            Download
          </button>
        </footer>
      </div>
      
    </div>
  );
}