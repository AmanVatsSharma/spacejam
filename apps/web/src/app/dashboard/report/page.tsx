/**
 * File:        apps/web/src/app/dashboard/report/page.tsx
 * Module:      Web · Dashboard · Reports Page
 * Purpose:     Analytics, reports, and business insights
 *
 * Exports:
 *   - ReportPage — reports page content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import { useState, type ReactElement } from "react";
import { OccupancyBarChart } from "@spacejam/ui";

interface ReportCard {
  title: string;
  description: string;
  icon: string;
}

const quickReports: ReportCard[] = [
  { title: "Occupancy Report", description: "Space utilization across floors and centers", icon: "chart" },
  { title: "Revenue Report", description: "Income breakdown by space type and period", icon: "money" },
  { title: "Guest Analytics", description: "Visitor patterns and peak hours", icon: "users" },
  { title: "Product Performance", description: "Sales data for each product type", icon: "box" },
];

type ReportPeriod = "today" | "week" | "month" | "quarter";

export default function ReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("month");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const periods: { id: ReportPeriod; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "quarter", label: "This Quarter" },
  ];

  const reportIcons: Record<string, ReactElement> = {
    chart: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7847" strokeWidth="1.5">
        <path d="M3 20L9 14L13 18L21 10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 10H21V14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    money: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7847" strokeWidth="1.5">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8V16M9 12H15" strokeLinecap="round" />
      </svg>
    ),
    users: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7847" strokeWidth="1.5">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 19C3 16.24 5.69 14 9 14C12.31 14 15 16.24 15 19" />
        <circle cx="19" cy="7" r="3" />
        <path d="M21 19C21 17.34 19.34 16 17 16" />
      </svg>
    ),
    box: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7847" strokeWidth="1.5">
        <rect x="4" y="6" width="16" height="14" rx="2" />
        <path d="M4 10H20" />
        <path d="M10 6V4M14 6V4" />
      </svg>
    ),
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#101828]">Reports & Analytics</h1>
          <p className="text-[#4A5565]">Generate insights and track business performance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.id
                    ? "bg-white text-[#101828] shadow-sm"
                    : "text-[#4A5565] hover:text-[#101828]"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-[#FF7847] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3V8L11 11" />
              <circle cx="8" cy="8" r="5" />
            </svg>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Quick Reports Grid */}
      <div>
        <h2 className="text-lg font-semibold text-[#101828] mb-4">Quick Reports</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickReports.map((report, index) => (
            <button
              key={index}
              onClick={() => setSelectedReport(report.title)}
              className={`bg-white rounded-2xl shadow-sm p-6 text-left transition-all hover:shadow-md ${
                selectedReport === report.title ? "ring-2 ring-[#FF7847]" : ""
              }`}
            >
              <div className="w-12 h-12 bg-[#FFF7ED] rounded-xl flex items-center justify-center mb-4">
                {reportIcons[report.icon]}
              </div>
              <h3 className="text-lg font-medium text-[#101828] mb-2">{report.title}</h3>
              <p className="text-sm text-gray-500">{report.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Report Preview */}
      {selectedReport ? (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#101828]">{selectedReport}</h3>
            <button className="text-[#FF7847] text-sm font-medium hover:underline">
              Download PDF
            </button>
          </div>
          {/* Chart Area - Show occupancy for occupancy report */}
          {selectedReport === "Occupancy Report" && (
            <div className="overflow-x-auto">
              <OccupancyBarChart />
            </div>
          )}
          {/* Placeholder for other reports */}
          {selectedReport !== "Occupancy Report" && (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
              <div className="text-center">
                <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <rect x="6" y="20" width="8" height="20" rx="2" />
                  <rect x="18" y="12" width="8" height="28" rx="2" />
                  <rect x="30" y="16" width="8" height="24" rx="2" />
                </svg>
                <p className="text-gray-500 font-medium">{selectedReport} Preview</p>
                <p className="text-sm text-gray-400">Data visualization for {selectedPeriod}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
              <path d="M4 24L12 16L18 22L28 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M24 8H28V12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Select a Report</h3>
          <p className="text-gray-500">Choose a quick report above or create a custom report.</p>
        </div>
      )}

      {/* Recent Reports */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#101828] mb-4">Recent Reports</h3>
        <div className="space-y-3">
          {["Occupancy Report - May 2026", "Revenue Summary - Week 21", "Guest Check-in Log"].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <path d="M4 4V16H16" />
                  <path d="M4 4L10 10L16 4" />
                </svg>
                <span className="text-sm font-medium text-[#101828]">{report}</span>
              </div>
              <span className="text-xs text-gray-400">Generated 2 days ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}