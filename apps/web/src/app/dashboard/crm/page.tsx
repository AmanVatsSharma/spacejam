/**
 * File:        apps/web/src/app/dashboard/crm/page.tsx
 * Module:      Web · Dashboard · CRM Page
 * Purpose:     Lead management - track potential clients, manage inquiries, convert to members
 *
 * Exports:
 *   - CRMPage — Lead management dashboard with stats, pipeline, and lead management
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-29
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Icons
const Icons = {
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  userPlus: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  list: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
  send: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  userCheck: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  upload: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
    </svg>
  ),
  clipboard: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
};

interface Lead {
  name: string;
  company: string;
  source: string;
  plan: string;
  assigned: string;
  date: string;
  status: "New" | "Visited" | "Negotiation" | "Converted";
}

const statsData = [
  { label: "Total Leads", value: 125, trend: "+12%", icon: "users" },
  { label: "New Leads", value: 32, trend: "+8%", icon: "userPlus" },
  { label: "Visits Scheduled", value: 18, trend: "+15%", icon: "calendar" },
  { label: "Converted Clients", value: 9, trend: "+5%", icon: "checkCircle" },
];

const pipelineData = [
  { label: "Inquiry", value: 2, color: "#ff7847" },
  { label: "Visited", value: 1, color: "#fbbf24" },
  { label: "Negotiation", value: 1, color: "#14b8a6" },
  { label: "Converted", value: 1, color: "#374151" },
  { label: "Cold Leads", value: 0, color: "#ef4444" },
];

const leadsData: Lead[] = [
  { name: "Rahul Sharma", company: "Freelancer", source: "Website", plan: "Hot Desk", assigned: "CM Rahul", date: "12 Mar", status: "New" },
  { name: "StartupX", company: "Startup", source: "Referral", plan: "Cabin", assigned: "CM Rahul", date: "10 Mar", status: "Visited" },
  { name: "Ankit", company: "Individual", source: "Walk-in", plan: "Dedicated Desk", assigned: "CM Rahul", date: "9 Mar", status: "Negotiation" },
  { name: "TechCorp", company: "Enterprise", source: "Website", plan: "Private Office", assigned: "CM Rahul", date: "8 Mar", status: "Converted" },
  { name: "Priya Singh", company: "Freelancer", source: "Referral", plan: "Hot Desk", assigned: "CM Rahul", date: "7 Mar", status: "New" },
];

const statusColors: Record<Lead["status"], string> = {
  New: "bg-orange-100 text-orange-600",
  Visited: "bg-yellow-100 text-yellow-600",
  Negotiation: "bg-teal-100 text-teal-600",
  Converted: "bg-gray-100 text-gray-600",
};

export default function CRMPage() {
  const [selectedLead, setSelectedLead] = useState<Lead>(leadsData[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filteredLeads = leadsData.filter((lead) =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    router.push(`/dashboard/crm/${lead.name.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div className="flex-1 p-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Lead Management</h1>
        <p className="text-sm text-gray-500 mt-1">Track potential clients, manage inquiries, and convert them into members.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-48"
              />
            </div>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
              All status {Icons.chevronDown}
            </button>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
              All centers {Icons.chevronDown}
            </button>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
              All assigned {Icons.chevronDown}
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Clear Filters
            </button>
          </div>
          <button className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-orange-600 transition-colors">
            {Icons.plus} Add Lead
          </button>
        </div>
      </div>

      {/* Stats Cards - Top */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statsData.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 transition-transform duration-200 hover:scale-110">
                {Icons[stat.icon as keyof typeof Icons]}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-sm font-medium text-green-600">{stat.trend} vs last week</p>
          </div>
        ))}
      </div>

      {/* Lead Details - Below stats */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2">
          {/* Pipeline */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Pipeline</h3>
            <div className="flex gap-4">
              {pipelineData.map((stage) => (
                <div
                  key={stage.label}
                  className="flex-1 rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
                  style={{ backgroundColor: stage.color }}
                >
                  <p className="text-sm font-medium text-white">{stage.label}</p>
                  <p className="text-2xl font-bold text-white">{stage.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-4 pl-4 pr-3 text-left text-sm font-medium text-gray-500">Lead Name</th>
                    <th className="px-3 py-4 text-left text-sm font-medium text-gray-500">Company</th>
                    <th className="px-3 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wide text-xs">Source</th>
                    <th className="px-3 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wide text-xs">Interested Plan</th>
                    <th className="px-3 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wide text-xs">Assigned To</th>
                    <th className="px-3 py-4 text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="px-3 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wide text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.name}
                      onClick={() => setSelectedLead(lead)}
                      className={`border-b border-gray-200 cursor-pointer transition-colors ${
                        selectedLead.name === lead.name ? "bg-orange-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-3 pl-4 pr-3">
                        <span className="text-sm font-medium text-gray-900">{lead.name}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-gray-500">{lead.company}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-gray-500">{lead.source}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-gray-500">{lead.plan}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-gray-500">{lead.assigned}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-gray-500">{lead.date}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Lead Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Details</h3>
            <div className="space-y-4">
              {[
                { label: "Lead Name", value: selectedLead.name },
                { label: "Phone", value: "+91 98765 43210" },
                { label: "Email", value: "rahul@example.com" },
                { label: "Company", value: selectedLead.company },
                { label: "Interested Plan", value: selectedLead.plan },
                { label: "Team Size", value: "1 Person" },
                { label: "Preferred Move-in Date", value: "15 Mar 2026" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <button className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
                {Icons.list} Lead Details
              </button>
              <button className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                {Icons.send} Send Proposal
              </button>
              <button className="w-full bg-cyan-500 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-cyan-600 transition-colors">
                {Icons.userCheck} Convert to Client
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium text-sm flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.plus} Add Lead
              </button>
              <button className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium text-sm flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.upload} Import Leads
              </button>
              <button className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium text-sm flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.clipboard} Manage Sources
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}