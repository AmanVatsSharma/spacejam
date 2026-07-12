"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_LEAD,
  GET_LEADS,
  UPDATE_LEAD,
  CONVERT_LEAD,
  DELETE_LEAD,
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
  const { data, loading, error } = useQuery(GET_LEAD, {
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
    refetchQueries: [{ query: GET_LEAD, variables: { id: leadId } }, { query: GET_LEADS }],
  });
  const [deleteLead] = useMutation(DELETE_LEAD, {
    refetchQueries: [{ query: GET_LEADS }],
  });

  const handleDeleteLead = async () => {
    if (!confirm(`Delete lead "${lead?.name}"? This cannot be undone.`)) return;
    try {
      await deleteLead({ variables: { id: leadId } });
      toast.success("Lead deleted");
      router.push("/dashboard/crm/leads");
    } catch (err) {
      console.error("Failed to delete lead:", err);
      toast.error("Could not delete lead");
    }
  };

  const handleConvertToClient = async () => {
    try {
      await convertLead({ variables: { id: leadId } });
      toast.success("Lead converted to client");
      setShowConvertClient(false);
    } catch (err) {
      console.error("Failed to convert lead:", err);
      toast.error("Could not convert lead");
    }
  };

  const handleUpdateLead = async (input: Record<string, unknown>) => {
    try {
      await updateLead({ variables: { id: leadId, input } });
      toast.success("Lead updated");
      setShowEditLead(false);
    } catch (err) {
      console.error("Failed to update lead:", err);
      toast.error("Could not update lead");
    }
  };

  const handleUpdateStatus = async (status: string, notes: string) => {
    try {
      // Only update status; preserve existing notes. Append the notes if provided.
      const input: Record<string, unknown> = { status };
      if (notes && notes.trim()) {
        const existing = lead?.notes ? `${lead.notes}\n\n` : "";
        input.notes = `${existing}${new Date().toLocaleDateString()}: ${notes.trim()}`;
      }
      await updateLead({ variables: { id: leadId, input } });
      toast.success(`Status updated to ${status}`);
      setShowUpdateStatus(false);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Could not update status");
    }
  };

  const handleAddNote = async (note: string) => {
    const existing = lead?.notes ? `${lead.notes}\n\n` : "";
    try {
      await updateLead({ variables: { id: leadId, input: { notes: `${existing}${new Date().toLocaleDateString()}: ${note}` } } });
      toast.success("Note added");
      setShowAddNote(false);
    } catch (err) {
      console.error("Failed to add note:", err);
      toast.error("Could not add note");
    }
  };

  const handleScheduleVisit = async (input: { date: string; timeSlot: string; notes: string }) => {
    try {
      const visitSummary = `Visit scheduled for ${input.date}${input.timeSlot ? ` (${input.timeSlot})` : ""}${input.notes ? ` — ${input.notes}` : ""}`;
      const existing = lead?.notes ? `${lead.notes}\n\n` : "";
      await updateLead({ variables: { id: leadId, input: { notes: `${existing}${visitSummary}`, lastContact: input.date } } });
      toast.success("Visit scheduled");
      setShowScheduleVisit(false);
    } catch (err) {
      console.error("Failed to schedule visit:", err);
      toast.error("Could not schedule visit");
    }
  };

  const handleSendProposal = async (input: { template: string; pricing: string; duration: string; notes: string }) => {
    if (!input.pricing?.trim()) {
      toast.error("Please enter a pricing amount");
      return;
    }
    if (!input.duration?.trim()) {
      toast.error("Please enter a duration");
      return;
    }
    try {
      const proposalSummary = `Proposal sent: ${input.template || "Custom"} — ₹${input.pricing}/month for ${input.duration} months${input.notes ? ` (${input.notes})` : ""}`;
      const existing = lead?.notes ? `${lead.notes}\n\n` : "";
      await updateLead({ variables: { id: leadId, input: { notes: `${existing}${proposalSummary}`, budget: input.pricing } } });
      toast.success("Proposal recorded on lead");
      setShowSendProposal(false);
    } catch (err) {
      console.error("Failed to send proposal:", err);
      toast.error("Could not record proposal");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-[#FF6A2F] border-t-transparent animate-spin" />
          <span className="text-sm text-gray-400">Loading lead details…</span>
        </div>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-2">Failed to load lead</p>
          <p className="text-sm text-gray-400 mb-4">{error.message}</p>
          <button
            onClick={() => router.push("/dashboard/crm/leads")}
            className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20] transition-all duration-200 active:scale-[0.97]"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-2">Lead not found</p>
          <p className="text-sm text-gray-400 mb-4">This lead may have been deleted or the link is invalid.</p>
          <button
            onClick={() => router.push("/dashboard/crm/leads")}
            className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20] transition-all duration-200 active:scale-[0.97]"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full max-w-[1400px] mx-auto pb-10 px-4 sm:px-0">

      {/* Left Column (Main Content) */}
      <div className="flex flex-col gap-6 flex-1 min-w-0">

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-0 transition-all duration-200">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push('/dashboard/crm/leads')}
              className="mt-1 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all duration-200 active:scale-[0.97] shrink-0 active:scale-[0.97] transition-transform duration-150"
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
            <button onClick={() => setShowEditLead(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all duration-200 active:scale-[0.97] shadow-sm">
              {Icons.edit} Edit Lead
            </button>
            <button onClick={() => setShowConvertClient(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-all duration-200 active:scale-[0.97] shadow-sm">
              {Icons.userConvert} Convert to Client
            </button>
            <button
              onClick={handleDeleteLead}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all duration-200 active:scale-[0.97] shadow-sm"
              title="Delete lead"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>

        {/* Basic Info Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start transition-all duration-200">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#FF6A2F] text-white flex items-center justify-center text-[28px] sm:text-[32px] font-bold shrink-0">
            {(lead.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 w-full">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.users} LEAD NAME</span>
              <span className="text-[15px] font-semibold text-gray-900">{lead.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.phone} PHONE NUMBER</span>
              <span className="text-[15px] font-semibold text-gray-900">{lead.phone || "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.mail} EMAIL</span>
              <span className="text-[15px] font-semibold text-gray-900">{lead.email || "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.building} COMPANY NAME</span>
              <span className="text-[15px] font-semibold text-gray-900">{lead.company || "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.globe} LEAD SOURCE</span>
              <span className="text-[15px] font-semibold text-gray-900">{lead.source || "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.box} REQUIREMENT</span>
              <span className="text-[15px] font-semibold text-gray-900">{lead.requirement || "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.location} LOCATION</span>
              <span className="text-[15px] font-semibold text-gray-900">{lead.location || "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.calendar} LAST CONTACT</span>
              <span className="text-[15px] font-semibold text-gray-900">{lead.lastContact ? new Date(lead.lastContact).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">{Icons.location} ASSIGNED CENTER MANAGER</span>
              <span className="text-[15px] font-semibold text-gray-900">{lead.assignedTo?.name || "Unassigned"}</span>
            </div>
          </div>
        </div>

        {/* Two Columns: Next Follow-up & Scheduled Visit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Next Follow-up */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 flex flex-col h-full transition-all duration-200">
            <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-5">
              <span className="text-[#FF6A2F]">{Icons.clock}</span> Next Follow-up
            </h3>

              <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">NEXT FOLLOW-UP DATE</span>
                <span className="text-[14px] font-semibold text-gray-900">{lead.lastContact ? new Date(lead.lastContact).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not scheduled"}</span>
              </div>
              <div className="flex flex-col gap-1.5 items-start">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">LEAD STAGE</span>
                <span className="px-2.5 py-1 rounded-full bg-[#FFF2EA] text-[#FF6A2F] text-[12px] font-medium border border-[#FFE4D6]">
                  {lead.status}
                </span>
              </div>
              <p className="text-[13.5px] text-gray-600 leading-relaxed">
                {lead.notes?.split("\n").pop() || "No recent notes. Add a note or update the status to track this lead."}
              </p>
            </div>

            <div className="mt-auto">
              <button onClick={() => setShowUpdateStatus(true)} className="w-full py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-all active:scale-[0.97] shadow-sm flex items-center justify-center gap-2">
                {Icons.clock}
                Update Status
              </button>
            </div>
          </div>

          {/* Scheduled Visit */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 flex flex-col h-full transition-all duration-200">
            <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-5">
              <span className="text-[#FBBF24]">{Icons.calendar}</span> Scheduled Visit
            </h3>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">VISIT DATE</span>
                <span className="text-[14px] font-semibold text-gray-900">{lead.lastContact ? new Date(lead.lastContact).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No visit scheduled"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">CENTER</span>
                <span className="text-[14px] font-semibold text-gray-900">{lead.center?.name || "Unassigned"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ASSIGNED STAFF</span>
                <span className="text-[14px] font-semibold text-gray-900">{lead.assignedTo?.name || "Unassigned"}</span>
              </div>
            </div>

            <div className="mt-auto flex gap-3">
              <button onClick={() => setShowScheduleVisit(true)} className="flex-1 py-2.5 bg-[#FBBF24] text-white rounded-lg text-sm font-semibold hover:bg-[#F59E0B] transition-all active:scale-[0.97] shadow-sm flex items-center justify-center gap-2">
                {Icons.calendar} Schedule Visit
              </button>
              {lead.lastContact && (
                <button
                  onClick={async () => {
                    if (!confirm("Cancel this visit? This will clear the visit date.")) return;
                    try {
                      const existing = lead?.notes ? `${lead.notes}\n\n` : "";
                      await updateLead({ variables: { id: leadId, input: { notes: `${existing}Visit cancelled on ${new Date().toLocaleDateString()}`, lastContact: null } } });
                      toast.success("Visit cancelled");
                    } catch {
                      toast.error("Could not cancel visit");
                    }
                  }}
                  className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all duration-200 active:scale-[0.97] shadow-sm flex items-center justify-center gap-2"
                >
                  {Icons.clock} Cancel Visit
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Proposal Details */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 flex flex-col transition-all duration-200">
          <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-5">
            <span className="text-[#06B6D4]">{Icons.document}</span> Proposal Details
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">REQUIREMENT</span>
              <span className="text-[14px] font-semibold text-gray-900">{lead.requirement || "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">LOCATION</span>
              <span className="text-[14px] font-semibold text-gray-900">{lead.location || "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">BUDGET</span>
              <span className="text-[14px] font-semibold text-gray-900">{lead.budget || "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">SOURCE</span>
              <span className="text-[14px] font-semibold text-gray-900">{lead.source || "—"}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowSendProposal(true)} className="py-2.5 px-5 bg-[#06B6D4] text-white rounded-lg text-sm font-semibold hover:bg-[#0891B2] transition-all duration-200 active:scale-[0.97] shadow-sm flex items-center justify-center gap-2">
              {Icons.send} Send Proposal
            </button>
            <button onClick={() => setShowAttachDocs(true)} className="py-2.5 px-5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all duration-200 active:scale-[0.97] shadow-sm flex items-center justify-center gap-2">
              {Icons.paperclip} Attach Files
            </button>
          </div>
        </div>

      </div>

      {/* Right Column (Sidebar) */}
      <div className="w-full xl:w-[320px] flex flex-col gap-6 shrink-0">

        {/* Pipeline Status */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 transition-all duration-200">
          <h3 className="text-[16px] font-bold text-gray-900 mb-6">Lead Details</h3>

          <div className="flex flex-col gap-0 relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-[20px] bottom-[20px] w-0.5 bg-gray-100 -z-10"></div>

            {(() => {
              const PIPELINE = ["New", "Visited", "Negotiation", "Converted"];
              const currentIdx = PIPELINE.indexOf(lead.status);
              // If status is not in pipeline, treat as "New" for display purposes
              const effectiveIdx = currentIdx === -1 ? 0 : currentIdx;
              return PIPELINE.map((stage) => {
                const idx = PIPELINE.indexOf(stage);
                const done = effectiveIdx > idx;
                const current = effectiveIdx === idx;
                const isConverted = lead.status === "Converted" && stage === "Converted";
                const reached = done || current || isConverted || (lead.status === "Cold" && stage === "New");
                if (current) {
                  return (
                    <div className="flex items-start gap-4 pb-6 relative" key={stage}>
                      <div className="w-8 h-8 rounded-full bg-[#FFF2EA] border border-[#FFD9D4] text-[#FF6A2F] flex items-center justify-center shrink-0 bg-white z-10 relative">
                        {Icons.clock}
                      </div>
                      <div className="pt-1.5 flex justify-between items-center w-full">
                        <span className="text-[14px] font-semibold text-[#FF6A2F]">{stage}</span>
                        <span className="text-[11px] font-semibold text-[#FF6A2F] bg-[#FFF2EA] px-2 py-0.5 rounded-full">Current</span>
                      </div>
                    </div>
                  );
                }
                if (reached) {
                  return (
                    <div className="flex items-start gap-4 pb-6 relative" key={stage}>
                      <div className="w-8 h-8 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] flex items-center justify-center shrink-0 bg-white z-10 relative">
                        {Icons.checkCircle}
                      </div>
                      <div className="pt-1.5 flex justify-between items-center w-full">
                        <span className="text-[14px] font-semibold text-[#10B981]">{stage}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="flex items-start gap-4 pb-6 opacity-50 relative" key={stage}>
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center shrink-0 bg-white z-10 relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                    </div>
                    <div className="pt-1.5 flex justify-between items-center w-full">
                      <span className="text-[14px] font-medium text-gray-500">{stage}</span>
                    </div>
                  </div>
                );
              });
            })()}
            {/* Dropped — always last, only highlighted if status is Cold */}
            <div className={`flex items-start gap-4 relative ${lead.status === "Cold" ? "" : "opacity-50"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white z-10 relative ${lead.status === "Cold" ? "bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981]" : "bg-gray-100 border border-gray-200 text-gray-400"}`}>
                {lead.status === "Cold" ? Icons.checkCircle : <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>}
              </div>
              <div className="pt-1.5 flex justify-between items-center w-full">
                <span className={`text-[14px] font-medium ${lead.status === "Cold" ? "text-[#10B981] font-semibold" : "text-gray-500"}`}>Dropped</span>
                {lead.status === "Cold" && <span className="text-[11px] font-semibold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full">Current</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 transition-all duration-200">
          <h3 className="text-[16px] font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-2.5">
            <button onClick={() => setShowCallLead(true)} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]">
              <span className="text-[#FF6A2F] bg-[#FFF2EA] p-1.5 rounded-lg">{Icons.phone}</span> Call Lead
            </button>
            <button onClick={() => setShowWhatsapp(true)} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]">
              <span className="text-[#25D366] bg-[#DCF8C6] p-1.5 rounded-lg">{Icons.whatsapp}</span> Send WhatsApp
            </button>
            <button onClick={() => setShowEmail(true)} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]">
              <span className="text-gray-600 bg-gray-100 p-1.5 rounded-lg">{Icons.mail}</span> Send Email
            </button>
            <button onClick={() => setShowAddNote(true)} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]">
              <span className="text-gray-600 bg-gray-100 p-1.5 rounded-lg">{Icons.box}</span> Add Note
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 sm:p-6 transition-all duration-200">
          <h3 className="text-[16px] font-bold text-gray-900 mb-6">Recent Activities</h3>

          <div className="flex flex-col gap-5 relative">
            <div className="absolute left-[3px] top-[10px] bottom-[10px] w-[1.5px] bg-gray-100 -z-10"></div>

            {(() => {
              const activities = (lead.notes || "")
                .split("\n")
                .map((n: string) => n.trim())
                .filter(Boolean);
              if (activities.length === 0) {
                return (
                  <p className="text-[13px] text-gray-400 py-2">
                    No activities yet. Notes, visits, and proposals will appear here as a timeline.
                  </p>
                );
              }
              return activities.slice(-8).reverse().map((act: string, i: number) => (
                <div className="flex items-start gap-4" key={i}>
                  <div className="w-2 h-2 rounded-full bg-[#FF6A2F] mt-1.5 shrink-0 ml-[-0.5px]"></div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-semibold text-gray-900">{act}</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

      </div>

      {/* Render All Dialogs */}
      <EditLeadDialog open={showEditLead} onClose={() => setShowEditLead(false)} lead={lead} onSubmit={handleUpdateLead} />
      <ConvertClientDialog open={showConvertClient} onClose={() => setShowConvertClient(false)} lead={lead} onConfirm={handleConvertToClient} />
      <UpdateStatusDialog open={showUpdateStatus} onClose={() => setShowUpdateStatus(false)} lead={lead} onSubmit={handleUpdateStatus} />
      <ScheduleVisitDialog open={showScheduleVisit} onClose={() => setShowScheduleVisit(false)} lead={lead} onSubmit={handleScheduleVisit} />
      <SendProposalDialog open={showSendProposal} onClose={() => setShowSendProposal(false)} lead={lead} onSubmit={handleSendProposal} />
      <AttachDocsDialog open={showAttachDocs} onClose={() => setShowAttachDocs(false)} />
      <CallLeadDialog open={showCallLead} onClose={() => setShowCallLead(false)} lead={lead} />
      <WhatsappDialog open={showWhatsapp} onClose={() => setShowWhatsapp(false)} lead={lead} />
      <EmailDialog open={showEmail} onClose={() => setShowEmail(false)} lead={lead} />
      <AddNoteDialog open={showAddNote} onClose={() => setShowAddNote(false)} lead={lead} onSubmit={handleAddNote} />
    </div>
  );
}