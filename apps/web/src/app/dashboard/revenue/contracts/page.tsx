/**
 * File:        apps/web/src/app/dashboard/revenue/contracts/page.tsx
 * Module:      Web · Dashboard · Revenue · Contracts
 * Purpose:     Contract listing — sub-route of /dashboard/revenue. Tab
 *              navigation lives in the global header.
 *
 * Exports:
 *   - ContractsPage — contracts table
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

"use client";

interface Contract {
  id: string;
  clientName: string;
  bookingId: string;
  startDate: string;
  endDate: string;
  amount: string;
  status: "active" | "expiring" | "expired" | "renewed";
}

const mockContracts: Contract[] = [
  { id: "CON-001", clientName: "TechCorp India", bookingId: "BK-2024-089", startDate: "Jun 1, 2026", endDate: "Aug 31, 2026", amount: "₹45,000", status: "active" },
  { id: "CON-002", clientName: "StartupXYZ", bookingId: "BK-2024-088", startDate: "Jun 1, 2026", endDate: "Jul 31, 2026", amount: "₹28,500", status: "expiring" },
  { id: "CON-003", clientName: "Design Studio", bookingId: "BK-2024-087", startDate: "Jun 1, 2026", endDate: "Nov 30, 2026", amount: "₹32,000", status: "active" },
  { id: "CON-004", clientName: "Freelancer Co.", bookingId: "BK-2024-086", startDate: "Jun 1, 2026", endDate: "Jun 30, 2026", amount: "₹15,000", status: "expiring" },
  { id: "CON-005", clientName: "Digital Agency", bookingId: "BK-2024-085", startDate: "Jun 1, 2026", endDate: "Dec 31, 2026", amount: "₹50,000", status: "active" },
];

const statusStyles = {
  active: "bg-green-100 text-green-700",
  expiring: "bg-orange-100 text-orange-700",
  expired: "bg-red-100 text-red-700",
  renewed: "bg-blue-100 text-blue-700",
};

export default function ContractsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="5" />
                <path d="M11 11L14 14" />
              </svg>
              <input
                type="text"
                placeholder="Search contracts..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent w-64"
              />
            </div>
            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-[#101828]">{contract.id}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{contract.clientName}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{contract.bookingId}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{contract.startDate}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{contract.endDate}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#101828]">{contract.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[contract.status]}`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-[#FF6A2F] text-sm font-medium hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
