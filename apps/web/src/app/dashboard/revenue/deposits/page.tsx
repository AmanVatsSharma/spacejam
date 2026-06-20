/**
 * File:        apps/web/src/app/dashboard/revenue/deposits/page.tsx
 * Module:      Web · Dashboard · Revenue · Deposits
 * Purpose:     Deposit listing — sub-route of /dashboard/revenue. Tab
 *              navigation lives in the global header.
 *
 * Exports:
 *   - DepositsPage — deposits table
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

"use client";

interface Deposit {
  id: string;
  clientName: string;
  bookingId: string;
  amount: string;
  depositAmount: string;
  date: string;
  status: "completed" | "pending" | "refunded";
}

const mockDeposits: Deposit[] = [
  { id: "DEP-001", clientName: "TechCorp India", bookingId: "BK-2024-089", amount: "₹45,000", depositAmount: "₹22,500", date: "May 28, 2026", status: "completed" },
  { id: "DEP-002", clientName: "StartupXYZ", bookingId: "BK-2024-088", amount: "₹28,500", depositAmount: "₹14,250", date: "May 25, 2026", status: "completed" },
  { id: "DEP-003", clientName: "Design Studio", bookingId: "BK-2024-087", amount: "₹32,000", depositAmount: "₹16,000", date: "May 20, 2026", status: "pending" },
  { id: "DEP-004", clientName: "Freelancer Co.", bookingId: "BK-2024-086", amount: "₹15,000", depositAmount: "₹7,500", date: "May 18, 2026", status: "completed" },
  { id: "DEP-005", clientName: "Digital Agency", bookingId: "BK-2024-085", amount: "₹50,000", depositAmount: "₹25,000", date: "May 15, 2026", status: "completed" },
  { id: "DEP-006", clientName: "Cloud Services Inc", bookingId: "BK-2024-084", amount: "₹38,000", depositAmount: "₹19,000", date: "May 12, 2026", status: "refunded" },
];

const statusStyles = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  refunded: "bg-purple-100 text-purple-700",
};

export default function DepositsPage() {
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
                placeholder="Search deposits..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent w-64"
              />
            </div>
            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent">
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockDeposits.map((deposit) => (
                <tr key={deposit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-[#101828]">{deposit.id}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{deposit.clientName}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{deposit.bookingId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#101828]">{deposit.amount}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#FF6A2F]">{deposit.depositAmount}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{deposit.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[deposit.status]}`}>
                      {deposit.status}
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
