"use client";

import { useState } from "react";

interface Deposit {
  id: string;
  name: string;
  amount: string;
  plan: string;
  center: string;
  payMode: string;
  status: "Active" | "Frozen" | "Pending" | "Release";
  date: string;
}

const mockDeposits: Deposit[] = [
  { id: "1", name: "Rahul Verma", amount: "₹5,000", plan: "Monthly", center: "Chandigarh Hub", payMode: "Cash", status: "Active", date: "Apr 15" },
  { id: "2", name: "Priya Sharma", amount: "₹10,000", plan: "Quarterly", center: "Mumbai Office", payMode: "UPI", status: "Frozen", date: "Apr 20" },
  { id: "3", name: "Amit Singh", amount: "₹3,000", plan: "Monthly", center: "Delhi Center", payMode: "Card", status: "Pending", date: "Mar 28" },
  { id: "4", name: "Amit Singh", amount: "₹3,000", plan: "Monthly", center: "Delhi Center", payMode: "Card", status: "Release", date: "Mar 28" },
];

const mockActivities = [
  { id: "1", type: "add", text: "Deposit added for Noah Brown - ₹8,000" },
  { id: "2", type: "refund", text: "Refund processed for Liam Anderson - ₹5,500" },
  { id: "3", type: "freeze", text: "Freeze applied to Emma Davis deposit" },
  { id: "4", type: "add", text: "Deposit added for Michael Chen - ₹3,500" },
  { id: "5", type: "add", text: "Deposit added for Sarah Momo Chen - ₹3,500" },
];

const statusStyles = {
  Active: "bg-green-100 text-green-700",
  Frozen: "bg-cyan-100 text-cyan-700",
  Pending: "bg-orange-100 text-orange-700",
  Release: "bg-green-100 text-green-700",
};

export default function CRMDepositsPage() {
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

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
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
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
                placeholder="Search Invoice.."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent w-64 bg-white"
              />
            </div>
            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]">
              <option value="">All Statues</option>
            </select>
            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]">
              <option value="">Last 30 Days</option>
            </select>
            <button className="px-4 py-2 bg-orange-50 text-[#FF6A2F] rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors">
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6A2F]">
                <span className="text-xl font-medium">₹</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">₹15,0,000</h3>
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
                <h3 className="text-2xl font-bold text-[#101828]">₹11,500</h3>
                <p className="text-sm text-gray-500 mt-1">Pending Release (2)</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6A2F]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">₹7,500</h3>
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
                  <th className="px-6 py-4 tracking-wider">PLAN</th>
                  <th className="px-6 py-4 tracking-wider">CENTER</th>
                  <th className="px-6 py-4 tracking-wider">PAY-MODE</th>
                  <th className="px-6 py-4 tracking-wider">STATUS</th>
                  <th className="px-6 py-4 tracking-wider">DATE</th>
                  <th className="px-6 py-4 tracking-wider text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockDeposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 font-medium text-[#101828]">
                      {deposit.name}
                    </td>
                    <td className="px-6 py-5 text-[#FF6A2F] font-semibold">{deposit.amount}</td>
                    <td className="px-6 py-5 text-gray-500">{deposit.plan}</td>
                    <td className="px-6 py-5 text-gray-500">{deposit.center}</td>
                    <td className="px-6 py-5 text-gray-500">{deposit.payMode}</td>
                    <td className="px-6 py-5">
                      <button className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize flex items-center gap-1.5 ${statusStyles[deposit.status]}`}>
                        {deposit.status}
                        {deposit.status === "Active" || deposit.status === "Frozen" || deposit.status === "Pending" || deposit.status === "Release" ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        ) : null}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-gray-500">{deposit.date}</td>
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
                          <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left font-medium">Release</button>
                          <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left font-medium">Freeze</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
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
            <button className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Approve Requests
            </button>
            <button className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
              </svg>
              Freeze Account
            </button>
            <button className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Deposit
            </button>
            <button className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Send Reminder
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1">
          <h2 className="text-lg font-semibold text-[#101828] mb-6">Recent Activities</h2>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gray-200"></div>
            
            <div className="flex flex-col gap-6">
              {mockActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white
                    ${activity.type === 'add' ? 'bg-orange-50 text-[#FF6A2F]' : 
                      activity.type === 'refund' ? 'bg-orange-50 text-[#FF6A2F]' : 
                      'bg-orange-50 text-[#FF6A2F]'}`}>
                    {activity.type === 'add' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                    {activity.type === 'refund' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {activity.type === 'freeze' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 leading-snug font-medium pt-0.5">{activity.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
