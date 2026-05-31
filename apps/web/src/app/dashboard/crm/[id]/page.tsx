/**
 * File:        apps/web/src/app/dashboard/crm/[id]/page.tsx
 * Module:      Web · Dashboard · Lead Detail Page
 * Purpose:     Detailed view of a single lead with contact info, timeline, activities
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

"use client";

import { useParams, useRouter } from "next/navigation";

// Icons
const Icons = {
  arrowLeft: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.04211.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  mail: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  location: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  building: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-4 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  userPlus: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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
  clock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  note: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  chevronRight: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  video: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  copy: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
 trash: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  moreVertical: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  ),
};

// Mock lead data - in real app, this would come from API
const leadData = {
  id: "1",
  name: "Rahul Sharma",
  status: "Negotiation",
  phone: "+91 98765 43210",
  email: "rahul.sharma@gmail.com",
  company: "Freelancer",
  location: "Sector 62, Noida",
  interestedPlan: "Hot Desk",
  teamSize: "1 Person",
  preferredMoveIn: "15 Mar 2026",
  assignedTo: "CM Rahul",
  source: "Website",
  createdDate: "12 Mar 2026",
  lastActivity: "Today, 10:30 AM",
  dealValue: "₹15,000/month",
  probability: "60%",
  notes: [
    {
      id: 1,
      text: "Initial inquiry via website contact form. Interested in hot desk for1 person.",
      author: "CM Rahul",
      date: "12 Mar 2026, 10:00 AM",
    },
    {
      id: 2,
      text: "Follow-up call completed. Client wants to visit the center before finalizing.",
      author: "CM Rahul",
      date: "14 Mar 2026, 3:30 PM",
    },
 ],
  timeline: [
    {
      id: 1,
      type: "call",
      title: "Call - Inbound",
      description: "Incoming call from +91 98765 43210",
      time: "Today, 10:30 AM",
      duration: "5 min",
    },
    {
      id: 2,
      type: "email",
      title: "Email Sent",
      description: "Proposal document shared via email",
      time: "Yesterday, 4:15 PM",
    },
    {
      id: 3,
      type: "visit",
      title: "Site Visit",
      description: "Center visit completed - showed hot desk area",
      time: "15 Mar 2026, 11:00 AM",
 },
    {
      id: 4,
      type: "call",
      title: "Call - Outbound",
      description: "Initial follow-up call to discuss requirements",
      time: "12 Mar 2026, 10:00 AM",
      duration: "8 min",
    },
  ],
  upcomingActivities: [
    {
      id: 1,
      type: "call",
      title: "Follow-up Call",
      time: "Today, 4:00 PM",
      status: "scheduled",
    },
    {
      id: 2,
      type: "visit",
      title: "Second Site Visit",
      time: "18 Mar 2026, 10:00 AM",
      status: "scheduled",
    },
  ],
};

const statusColors: Record<string, string> = {
  New: "bg-orange-100 text-orange-600",
  Visited: "bg-yellow-100 text-yellow-600",
  Negotiation: "bg-teal-100 text-teal-600",
  Converted: "bg-green-100 text-green-600",
};

const stageSteps = [
  { label: "New", color: "#ff7847" },
  { label: "Visited", color: "#fbbf24" },
  { label: "Negotiation", color: "#14b8a6" },
  { label: "Converted", color: "#374151" },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case "call":
      return Icons.phone;
    case "email":
      return Icons.mail;
    case "visit":
      return Icons.building;
    default:
      return Icons.clock;
  }
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  // Find the lead from mock data - in real app, fetch by ID
  const lead = leadData;

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/crm")}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              {Icons.arrowLeft}
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900">{lead.name}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                  {lead.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Lead ID: #{lead.id} • Created {lead.createdDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
              {Icons.edit} Edit
            </button>
            <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
              {Icons.copy} Duplicate
            </button>
            <button className="px-4 py-2 border border-red-200 rounded-xl text-sm font-medium text-red-600 flex items-center gap-2 hover:bg-red-50 transition-colors">
              {Icons.trash} Delete
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                  {Icons.phone}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{lead.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                  {Icons.mail}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <p className="text-sm font-medium text-gray-900">{lead.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                  {Icons.building}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Company</p>
                  <p className="text-sm font-medium text-gray-900">{lead.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                  {Icons.location}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Location</p>
                  <p className="text-sm font-medium text-gray-900">{lead.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Interested Plan</p>
                <p className="text-sm font-medium text-gray-900">{lead.interestedPlan}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Team Size</p>
                <p className="text-sm font-medium text-gray-900">{lead.teamSize}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Preferred Move-in Date</p>
                <p className="text-sm font-medium text-gray-900">{lead.preferredMoveIn}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                <p className="text-sm font-medium text-gray-900">{lead.assignedTo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Source</p>
                <p className="text-sm font-medium text-gray-900">{lead.source}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Last Activity</p>
                <p className="text-sm font-medium text-gray-900">{lead.lastActivity}</p>
              </div>
            </div>
          </div>

          {/* Lead Stage */}
<div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-900">Lead Stage</h3>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Deal Value</p>
                  <p className="text-sm font-semibold text-gray-900">{lead.dealValue}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Probability</p>
                  <p className="text-sm font-semibold text-gray-900">{lead.probability}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {stageSteps.map((step, index) => (
                <div key={step.label} className="flex-1 flex items-center">
                  <div
                    className="flex-1 h-2 rounded-full"
                    style={{
                      backgroundColor: step.color,
                      opacity: step.label === lead.status ? 1 : 0.3,
                    }}
                  />
                  {index < stageSteps.length - 1 && (
                    <div className="w-8 h-0.5 bg-gray-200" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {stageSteps.map((step) => (
                <div key={step.label} className="text-center">
                  <p
                    className="text-xs font-medium"
                    style={{
                      color: step.label === lead.status ? step.color : "#9CA3AF",
                    }}
                  >
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Timeline</h3>
              <button className="text-sm text-orange-500 font-medium hover:text-orange-600">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {lead.timeline.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
                    {activity.duration && (
                      <p className="text-xs text-gray-400 mt-1">Duration: {activity.duration}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
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

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
              <button className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-colors">
                {Icons.note}
              </button>
            </div>
            <div className="space-y-4">
              {lead.notes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{note.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">{note.author}</p>
                    <p className="text-xs text-gray-400">{note.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Activity */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming Activity</h3>
            <div className="space-y-3">
              {lead.upcomingActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
                      {activity.type === "call" ? Icons.phone : Icons.video}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                    {Icons.check} Scheduled
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2">
              {Icons.calendar} Schedule Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
