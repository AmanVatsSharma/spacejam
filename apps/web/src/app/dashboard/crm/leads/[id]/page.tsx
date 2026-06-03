/**
 * File:        apps/web/src/app/dashboard/crm/leads/[id]/page.tsx
 * Module:      Web · Dashboard · CRM · Leads · Lead Detail
 * Purpose:     Detailed lead view with interactions, follow-ups, and conversion options
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

"use client";

import { useState, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import EditLeadModal from "@/components/crm/EditLeadModal";

const Icons = {
  arrowLeft: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h5m4-4h5a2 2 0 012 2v5a2 2 0 01-2 2h-5m-4-4v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2h4a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2" />
    </svg>
  ),
  userCheck: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  mail: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  building: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  globe: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0 3-4.03 3-9s-1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  briefcase: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  teamSize: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  mapPin: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendarDays: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  fileText: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  send: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  paperclip: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  call: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.1421.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  email: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  note: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  inquiry: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  visited: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  negotiation: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
  converted: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  dropped: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const leadsData: Record<string, {
  name: string;
  initials: string;
  phone: string;
  email: string;
  company: string;
  source: string;
  plan: string;
  teamSize: string;
  moveInDate: string;
  assignedCM: string;
  stage: string;
  nextFollowUp: string;
  followUpNote: string;
  visitDate: string;
  visitType: string;
  visitStaff: string;
  proposalPlan: string;
  interestedSeats: string;
  expectedBudget: string;
  duration: string;
  activities: { title: string; time: string }[];
}> = {
  "rahul-sharma": {
    name: "Rahul Sharma",
    initials: "RS",
    phone: "+91 98765 43210",
    email: "rahul@example.com",
    company: "Freelancer",
    source: "Website",
    plan: "Hot Desk",
    teamSize: "1 Person",
    moveInDate: "15 Mar 2026",
    assignedCM: "CM Rahul",
    stage: "Negotiation",
    nextFollowUp: "15 Mar 2026, 10:00 AM",
    followUpNote: "Follow up on pricing discussion. Client interested in flexible desk options.",
    visitDate: "14 Mar 2026, 2:00 PM",
    visitType: "Center Tour",
    visitStaff: "CM Rahul",
    proposalPlan: "Hot Desk",
    interestedSeats: "1 Seat",
    expectedBudget: "₹8,000/month",
    duration: "6 Months",
    activities: [
      { title: "Proposal sent", time: "2h ago" },
      { title: "Follow-up call scheduled", time: "5h ago" },
      { title: "Email sent", time: "1d ago" },
      { title: "Note added", time: "2d ago" },
    ],
  },
  "startupx": {
    name: "StartupX",
    initials: "SX",
    phone: "+91 98765 43211",
    email: "contact@startupx.com",
    company: "Startup",
    source: "Referral",
    plan: "Cabin",
    teamSize: "5 Persons",
    moveInDate: "20 Mar 2026",
    assignedCM: "CM Rahul",
    stage: "Visited",
    nextFollowUp: "18 Mar 2026, 11:00 AM",
    followUpNote: "Discuss cabin layout options and pricing.",
    visitDate: "12 Mar 2026, 10:00 AM",
    visitType: "Center Tour",
    visitStaff: "CM Rahul",
    proposalPlan: "Cabin",
    interestedSeats: "5 Seats",
    expectedBudget: "₹35,000/month",
    duration: "12 Months",
    activities: [
      { title: "Visit completed", time: "1d ago" },
      { title: "Proposal sent", time: "2d ago" },
      { title: "Email sent", time: "3d ago" },
      { title: "Note added", time: "4d ago" },
    ],
  },
  "ankit": {
    name: "Ankit",
    initials: "AN",
    phone: "+91 98765 43212",
    email: "ankit@example.com",
    company: "Individual",
    source: "Walk-in",
    plan: "Dedicated Desk",
    teamSize: "1 Person",
    moveInDate: "1 Apr 2026",
    assignedCM: "CM Rahul",
    stage: "Negotiation",
    nextFollowUp: "20 Mar 2026, 3:00 PM",
    followUpNote: "Client wants dedicated desk with locker facility.",
    visitDate: "15 Mar 2026, 11:00 AM",
    visitType: "Center Tour",
    visitStaff: "CM Rahul",
    proposalPlan: "Dedicated Desk",
    interestedSeats: "1 Seat",
    expectedBudget: "₹12,000/month",
    duration: "6 Months",
    activities: [
      { title: "Visit scheduled", time: "1h ago" },
      { title: "Proposal sent", time: "1d ago" },
      { title: "Email sent", time: "2d ago" },
      { title: "Note added", time: "3d ago" },
    ],
  },
  "techcorp": {
    name: "TechCorp",
    initials: "TC",
    phone: "+91 98765 43213",
    email: "info@techcorp.com",
    company: "Enterprise",
    source: "Website",
    plan: "Private Office",
    teamSize: "20 Persons",
    moveInDate: "1 May 2026",
    assignedCM: "CM Rahul",
    stage: "Converted",
    nextFollowUp: "N/A",
    followUpNote: "Contract signed. Move-in scheduled.",
    visitDate: "5 Mar 2026, 10:00 AM",
    visitType: "Center Tour",
    visitStaff: "CM Rahul",
    proposalPlan: "Private Office",
    interestedSeats: "20 Seats",
    expectedBudget: "₹2,00,000/month",
    duration: "24 Months",
    activities: [
      { title: "Contract signed", time: "5d ago" },
      { title: "Proposal approved", time: "7d ago" },
      { title: "Visit completed", time: "10d ago" },
      { title: "Note added", time: "12d ago" },
    ],
  },
  "priya-singh": {
    name: "Priya Singh",
    initials: "PS",
    phone: "+91 98765 43214",
    email: "priya@example.com",
    company: "Freelancer",
    source: "Referral",
    plan: "Hot Desk",
    teamSize: "1 Person",
    moveInDate: "25 Mar 2026",
    assignedCM: "CM Rahul",
    stage: "New",
    nextFollowUp: "22 Mar 2026, 9:00 AM",
    followUpNote: "Initial inquiry - needs more information about hot desk options.",
    visitDate: "TBD",
    visitType: "TBD",
    visitStaff: "TBD",
    proposalPlan: "Hot Desk",
    interestedSeats: "1 Seat",
    expectedBudget: "₹8,000/month",
    duration: "3 Months",
    activities: [
      { title: "Lead created", time: "1d ago" },
      { title: "Initial call", time: "1d ago" },
    ],
  },
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const lead = leadsData[leadId] || leadsData["rahul-sharma"];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleBack = () => {
    router.push("/dashboard/crm/leads");
  };

  return (
    <Fragment>
      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        leadData={lead}
      />
      <div className="p-6">
      <div className="flex gap-6">
        {/* LEFT SIDE - Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Page Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="w-9 h-9 bg-[#f3f4f6] rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  {Icons.arrowLeft}
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-[#101828]">Lead Details</h1>
                  <p className="text-sm text-[#4a5565] mt-0.5">View lead information, track interactions, and convert potential clients into members.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  {Icons.edit}
                  <span>Edit Lead</span>
                </button>
                <button className="px-4 py-2 bg-[#ff7847] text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-orange-600 transition-colors">
                  {Icons.userCheck}
                  <span>Convert to Client</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lead Info Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex gap-5">
              <div className="w-20 h-20 bg-[#ff7847] rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-white">{lead.initials}</span>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.users} Lead Name
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{lead.name}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.phone} Phone Number
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{lead.phone}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.mail} Email
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{lead.email}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.building} Company Name
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{lead.company}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.globe} Lead Source
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{lead.source}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.briefcase} Interested Plan
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{lead.plan}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.teamSize} Team Size
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{lead.teamSize}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.calendar} Preferred Move-in Date
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{lead.moveInDate}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide flex items-center gap-1">
                      {Icons.mapPin} Assigned Center Manager
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#101828]">{lead.assignedCM}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Follow-up + Scheduled Visit Cards - 2 Columns */}
          <div className="grid grid-cols-2 gap-6">
            {/* Next Follow-up Card */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#ff7847]">{Icons.clock}</span>
                <h3 className="text-base font-semibold text-[#101828]">Next Follow-up</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide">Next Follow-up Date</p>
                  <p className="text-sm font-medium text-[#101828]">{lead.nextFollowUp}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide">Lead Stage</p>
                  <span className="inline-block mt-1 px-3 py-1 bg-[rgba(255,120,71,0.05)] rounded-full text-xs font-medium text-[#ff7847]">{lead.stage}</span>
                </div>
                <div>
                  <p className="text-sm text-[#364153]">{lead.followUpNote}</p>
                </div>
                <button className="w-full py-2.5 bg-[#ff7847] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
                  {Icons.checkCircle}
                  <span>Update Status</span>
                </button>
              </div>
            </div>

            {/* Scheduled Visit Card */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#ff7847]">{Icons.calendarDays}</span>
                <h3 className="text-base font-semibold text-[#101828]">Scheduled Visit</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide">Visit Date</p>
                  <p className="text-sm font-medium text-[#101828]">{lead.visitDate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide">Visit Type</p>
                  <p className="text-sm font-medium text-[#101828]">{lead.visitType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide">Assigned Staff</p>
                  <p className="text-sm font-medium text-[#101828]">{lead.visitStaff}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 bg-[#ffcf4e] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-yellow-500 transition-colors">
                    {Icons.calendar}
                    <span>Schedule Visit</span>
                  </button>
                  <button className="flex-1 py-2.5 bg-white border border-[#e5e7eb] text-[#364153] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                    {Icons.clock}
                    <span>Reschedule</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Proposal Details Card */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#ff7847]">{Icons.fileText}</span>
              <h3 className="text-base font-semibold text-[#101828]">Proposal Details</h3>
            </div>
            <div className="grid grid-cols-4 gap-6 mb-4">
              <div>
                <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide">Plan Type</p>
                <p className="text-sm font-medium text-[#101828]">{lead.proposalPlan}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide">Interested Seats</p>
                <p className="text-sm font-medium text-[#101828]">{lead.interestedSeats}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide">Expected Budget</p>
                <p className="text-sm font-medium text-[#101828]">{lead.expectedBudget}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-[#6a7282] uppercase tracking-wide">Duration</p>
                <p className="text-sm font-medium text-[#101828]">{lead.duration}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-[#00d1c6] text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-cyan-600 transition-colors">
                {Icons.send}
                <span>Send Proposal</span>
              </button>
              <button className="px-5 py-2.5 bg-white border border-[#e5e7eb] text-[#364153] rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors">
                {Icons.paperclip}
                <span>Attach Documents</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Sidebar */}
        <div className="w-80 flex flex-col gap-6">
          {/* Lead Details - Pipeline Status */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-[#101828] mb-4">Lead Details</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#dcfce7] rounded-xl flex items-center justify-center">
                  {Icons.inquiry}
                </div>
                <span className="text-sm font-medium text-[#008236]">Inquiry</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#dcfce7] rounded-xl flex items-center justify-center">
                  {Icons.visited}
                </div>
                <span className="text-sm font-medium text-[#008236]">Visited</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[rgba(255,120,71,0.05)] rounded-xl flex items-center justify-center">
                  {Icons.negotiation}
                </div>
                <span className="text-sm font-medium text-[#ff7847]">Negotiation</span>
                <span className="ml-auto px-2 py-0.5 bg-[rgba(255,120,71,0.05)] rounded-full text-xs font-medium text-[#ff7847]">Current</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f9fafb] rounded-xl flex items-center justify-center border-2 border-[#d1d5dc]">
                  {Icons.converted}
                </div>
                <span className="text-sm font-medium text-[#6a7282]">Converted</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f3f4f6] rounded-xl flex items-center justify-center">
                  {Icons.dropped}
                </div>
                <span className="text-sm font-medium text-[#6a7282]">Dropped</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-[#101828] mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <button className="w-full py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.call}
                <span>Call Lead</span>
              </button>
              <button className="w-full py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.whatsapp}
                <span>Send WhatsApp</span>
              </button>
              <button className="w-full py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.email}
                <span>Send Email</span>
              </button>
              <button className="w-full py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#364153] flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                {Icons.note}
                <span>Add Note</span>
              </button>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-[#101828] mb-4">Recent Activities</h3>
            <div className="flex flex-col gap-4">
              {lead.activities.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-2 h-2 bg-[#ff7847] rounded-full mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#101828]">{activity.title}</p>
                    <p className="text-xs text-[#ff7847]">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </Fragment>
  );
}