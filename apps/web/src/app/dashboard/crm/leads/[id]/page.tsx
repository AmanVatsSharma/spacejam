"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_LEAD,
  UPDATE_LEAD,
  CONVERT_LEAD,
  DELETE_LEAD,
  CREATE_CUSTOMER,
} from "@/lib/apollo/operations";

// Icons
const Icons = {
  arrowLeft: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  userConvert: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  box: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  location: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  document: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
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
  checkCircle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
};

import {
  EditLeadDialog, ConvertClientDialog, UpdateStatusDialog, ScheduleVisitDialog,
  SendProposalDialog, AttachDocsDialog, CallLeadDialog, WhatsappDialog, EmailDialog, AddNoteDialog
} from './LeadDialogs';

export default function LeadDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string;

  /* ── Apollo: fetch lead ── */
  const { data, loading } = useQuery(GET_LEAD, {
    variables: { id: leadId },
    skip: !leadId,
    fetchPolicy: "cache-and-network",
  });
  const lead = data?.lead;

  /* ── Mutations ── */
  const [updateLead] = useMutation(UPDATE_LEAD, {
    refetchQueries: [{ query: GET_LEAD, variables: { id: leadId } }],
  });
  const [convertLead] = useMutation(CONVERT_LEAD, {
    refetchQueries: [{ query: GET_LEAD, variables: { id: leadId } }],
  });
  const [deleteLead] = useMutation(DELETE_LEAD);

  const handleConvertToClient = async () => {
    try {
      await convertLead({ variables: { id: leadId } });
      setShowConvertClient(false);
    } catch (err) {
      console.error("Failed to convert lead:", err);
    }
  };

  const handleUpdateLead = async (input: Record<string, unknown>) => {
    try {
      await updateLead({ variables: { id: leadId, input } });
      setShowEditLead(false);
      setShowUpdateStatus(false);
    } catch (err) {
      console.error("Failed to update lead:", err);
    }
  };

  const [showEditLead, setShowEditLead] = useState(false);
  const [showConvertClient, setShowConvertClient] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);
  const [showSendProposal, setShowSendProposal] = useState(false);
  const [showAttachDocs, setShowAttachDocs] = useState(false);
  const [showCallLead, setShowCallLead] = useState(false);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full max-w-[1400px] mx-auto pb-10 px-4 sm:px-0">

      {/* Left Column (Main Content) */}
      <div className="flex flex-col gap-6 flex-1 min-w-0">

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-0">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push('/dashboard/crm/leads')}
              className="mt-1 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
            >
              {Icons.arrowLeft}
            </button>
            <div>
              <h1 className="text-[22px] sm:text-[24px] font-bold text-[#101828] leading-tight">Lead Details</h1>
              <p className="text-[13px] sm:text-[14px] text-[#667085] mt-1 max-w-[500px]">
                View lead information, track interactions, and convert potential clients into members.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto pl-14 sm:pl-0">
            <button onClick={() => setShowEditLead(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
              {Icons.edit} Edit Lead
            </button>
            <button onClick={() => setShowConvertClient(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-colors shadow-sm">
              {Icons.userConvert} Convert to Client
            </button>
          </div>
        </div>

        {/* Basic Info Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#FF6A2F] text-white flex items-center justify-center text-[28px] sm:text-[32px] font-bold shrink-0">
            RS
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 w-full">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.users} LEAD NAME</span>
              <span className="text-[15px] font-semibold text-gray-900">Rahul Sharma</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.phone} PHONE NUMBER</span>
              <span className="text-[15px] font-semibold text-gray-900">+91 98765 43210</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.mail} EMAIL</span>
              <span className="text-[15px] font-semibold text-gray-900">rahul@example.com</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.building} COMPANY NAME</span>
              <span className="text-[15px] font-semibold text-gray-900">Freelancer</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.globe} LEAD SOURCE</span>
              <span className="text-[15px] font-semibold text-gray-900">Website</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.box} INTERESTED PLAN</span>
              <span className="text-[15px] font-semibold text-gray-900">Hot Desk</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.users} TEAM SIZE</span>
              <span className="text-[15px] font-semibold text-gray-900">1 Person</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.calendar} PREFERRED MOVE-IN DATE</span>
              <span className="text-[15px] font-semibold text-gray-900">15 Mar 2026</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.location} ASSIGNED CENTER MANAGER</span>
              <span className="text-[15px] font-semibold text-gray-900">CM Rahul</span>
            </div>
          </div>
        </div>

        {/* Two Columns: Next Follow-up & Scheduled Visit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Next Follow-up */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 flex flex-col h-full">
            <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-5">
              <span className="text-[#FF6A2F]">{Icons.clock}</span> Next Follow-up
            </h3>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">NEXT FOLLOW-UP DATE</span>
                <span className="text-[14px] font-semibold text-gray-900">15 Mar 2026, 10:00 AM</span>
              </div>
              <div className="flex flex-col gap-1.5 items-start">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">LEAD STAGE</span>
                <span className="px-2.5 py-1 rounded-full bg-[#FFF2EA] text-[#FF6A2F] text-[12px] font-medium border border-[#FFE4D6]">
                  Negotiation
                </span>
              </div>
              <p className="text-[13.5px] text-gray-600 leading-relaxed">
                Follow up on pricing discussion. Client interested in flexible desk options.
              </p>
            </div>

            <div className="mt-auto">
              <button onClick={() => setShowUpdateStatus(true)} className="w-full py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-colors shadow-sm flex items-center justify-center gap-2">
                {Icons.clock}
                Update Status
              </button>
            </div>
          </div>

          {/* Scheduled Visit */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 flex flex-col h-full">
            <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-5">
              <span className="text-[#FBBF24]">{Icons.calendar}</span> Scheduled Visit
            </h3>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">VISIT DATE</span>
                <span className="text-[14px] font-semibold text-gray-900">14 Mar 2026, 2:00 PM</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">VISIT TYPE</span>
                <span className="text-[14px] font-semibold text-gray-900">Center Tour</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ASSIGNED STAFF</span>
                <span className="text-[14px] font-semibold text-gray-900">CM Rahul</span>
              </div>
            </div>

            <div className="mt-auto flex gap-3">
              <button onClick={() => setShowScheduleVisit(true)} className="flex-1 py-2.5 bg-[#FBBF24] text-white rounded-lg text-sm font-semibold hover:bg-[#F59E0B] transition-colors shadow-sm flex items-center justify-center gap-2">
                {Icons.calendar} Reschedule
              </button>
              <button onClick={() => setShowScheduleVisit(true)} className="flex-1 py-2.5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                {Icons.clock} Cancel Visit
              </button>
            </div>
          </div>

        </div>

        {/* Proposal Details */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 flex flex-col">
          <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-5">
            <span className="text-[#06B6D4]">{Icons.document}</span> Proposal Details
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">PLAN TYPE</span>
              <span className="text-[14px] font-semibold text-gray-900">Hot Desk</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">INTERESTED SEATS</span>
              <span className="text-[14px] font-semibold text-gray-900">1 Seat</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">EXPECTED BUDGET</span>
              <span className="text-[14px] font-semibold text-gray-900">₹8,000/month</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">DURATION</span>
              <span className="text-[14px] font-semibold text-gray-900">6 Months</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowSendProposal(true)} className="py-2.5 px-5 bg-[#06B6D4] text-white rounded-lg text-sm font-semibold hover:bg-[#0891B2] transition-colors shadow-sm flex items-center justify-center gap-2">
              {Icons.send} Send Proposal
            </button>
            <button onClick={() => setShowAttachDocs(true)} className="py-2.5 px-5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2">
              {Icons.paperclip} Attach Files
            </button>
          </div>
        </div>

      </div>

      {/* Right Column (Sidebar) */}
      <div className="w-full xl:w-[320px] flex flex-col gap-6 shrink-0">

        {/* Pipeline Status */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6">
          <h3 className="text-[16px] font-bold text-gray-900 mb-6">Lead Details</h3>

          <div className="flex flex-col gap-0 relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-[20px] bottom-[20px] w-0.5 bg-gray-100 -z-10"></div>

            {/* Inquiry */}
            <div className="flex items-start gap-4 pb-6 relative">
              <div className="w-8 h-8 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] flex items-center justify-center shrink-0 bg-white z-10 relative">
                {Icons.checkCircle}
              </div>
              <div className="pt-1.5 flex justify-between items-center w-full">
                <span className="text-[14px] font-semibold text-[#10B981]">Inquiry</span>
              </div>
            </div>

            {/* Visited */}
            <div className="flex items-start gap-4 pb-6 relative">
              <div className="w-8 h-8 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] flex items-center justify-center shrink-0 bg-white z-10 relative">
                {Icons.checkCircle}
              </div>
              <div className="pt-1.5 flex justify-between items-center w-full">
                <span className="text-[14px] font-semibold text-[#10B981]">Visited</span>
              </div>
            </div>

            {/* Negotiation (Current) */}
            <div className="flex items-start gap-4 pb-6 relative">
              <div className="w-8 h-8 rounded-full bg-[#FFF2EA] border border-[#FFD9D4] text-[#FF6A2F] flex items-center justify-center shrink-0 bg-white z-10 relative">
                {Icons.clock}
              </div>
              <div className="pt-1.5 flex justify-between items-center w-full">
                <span className="text-[14px] font-semibold text-[#FF6A2F]">Negotiation</span>
                <span className="text-[11px] font-semibold text-[#FF6A2F] bg-[#FFF2EA] px-2 py-0.5 rounded-full">Current</span>
              </div>
            </div>

            {/* Converted */}
            <div className="flex items-start gap-4 pb-6 opacity-50 relative">
              <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center shrink-0 bg-white z-10 relative">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
              </div>
              <div className="pt-1.5 flex justify-between items-center w-full">
                <span className="text-[14px] font-medium text-gray-500">Converted</span>
              </div>
            </div>

            {/* Dropped */}
            <div className="flex items-start gap-4 opacity-50 relative">
              <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center shrink-0 bg-white z-10 relative">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
              </div>
              <div className="pt-1.5 flex justify-between items-center w-full">
                <span className="text-[14px] font-medium text-gray-500">Dropped</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6">
          <h3 className="text-[16px] font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-2.5">
            <button onClick={() => setShowCallLead(true)} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="text-[#FF6A2F] bg-[#FFF2EA] p-1.5 rounded-lg">{Icons.phone}</span> Call Lead
            </button>
            <button onClick={() => setShowWhatsapp(true)} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="text-[#25D366] bg-[#DCF8C6] p-1.5 rounded-lg">{Icons.whatsapp}</span> Send WhatsApp
            </button>
            <button onClick={() => setShowEmail(true)} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="text-gray-600 bg-gray-100 p-1.5 rounded-lg">{Icons.mail}</span> Send Email
            </button>
            <button onClick={() => setShowAddNote(true)} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="text-gray-600 bg-gray-100 p-1.5 rounded-lg">{Icons.box}</span> Add Note
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6">
          <h3 className="text-[16px] font-bold text-gray-900 mb-6">Recent Activities</h3>

          <div className="flex flex-col gap-5 relative">
            <div className="absolute left-[3px] top-[10px] bottom-[10px] w-[1.5px] bg-gray-100 -z-10"></div>

            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-[#FF6A2F] mt-1.5 shrink-0 ml-[-0.5px]"></div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-gray-900">Proposal sent</span>
                <span className="text-[12px] text-[#FF6A2F]">2h ago</span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-[#FF6A2F] mt-1.5 shrink-0 ml-[-0.5px]"></div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-gray-900">Follow-up call scheduled</span>
                <span className="text-[12px] text-[#FF6A2F]">5h ago</span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-[#FF6A2F] mt-1.5 shrink-0 ml-[-0.5px]"></div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-gray-900">Email sent</span>
                <span className="text-[12px] text-[#FF6A2F]">1d ago</span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-[#FF6A2F] mt-1.5 shrink-0 ml-[-0.5px]"></div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-gray-900">Note added</span>
                <span className="text-[12px] text-[#FF6A2F]">2d ago</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Render All Dialogs */}
      <EditLeadDialog open={showEditLead} onClose={() => setShowEditLead(false)} />
      <ConvertClientDialog open={showConvertClient} onClose={() => setShowConvertClient(false)} />
      <UpdateStatusDialog open={showUpdateStatus} onClose={() => setShowUpdateStatus(false)} />
      <ScheduleVisitDialog open={showScheduleVisit} onClose={() => setShowScheduleVisit(false)} />
      <SendProposalDialog open={showSendProposal} onClose={() => setShowSendProposal(false)} />
      <AttachDocsDialog open={showAttachDocs} onClose={() => setShowAttachDocs(false)} />
      <CallLeadDialog open={showCallLead} onClose={() => setShowCallLead(false)} />
      <WhatsappDialog open={showWhatsapp} onClose={() => setShowWhatsapp(false)} />
      <EmailDialog open={showEmail} onClose={() => setShowEmail(false)} />
      <AddNoteDialog open={showAddNote} onClose={() => setShowAddNote(false)} />
    </div>
  );
}