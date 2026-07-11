"use client";

import React, { useState } from "react";
import { toast } from "sonner";

export interface LeadDialogLead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status: string;
  source?: string | null;
  requirement?: string | null;
  budget?: string | null;
  location?: string | null;
  notes?: string | null;
  lastContact?: string | null;
  assignedTo?: { id: string; name?: string | null; email?: string | null } | null;
  center?: { id: string; name?: string | null } | null;
}

const DialogOverlay = ({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[800px] max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const SmallDialogOverlay = ({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const closeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LEAD_SOURCES = ["Website", "Referral", "Walk-in", "Social", "Email"] as const;
const LEAD_STATUSES = ["New", "Visited", "Negotiation", "Converted", "Cold"] as const;

export function EditLeadDialog({
  open,
  onClose,
  lead,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  lead: LeadDialogLead | null;
  onSubmit: (input: Record<string, unknown>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    company: lead?.company ?? "",
    source: lead?.source ?? "",
    requirement: lead?.requirement ?? "",
    budget: lead?.budget ?? "",
    location: lead?.location ?? "",
    notes: lead?.notes ?? "",
  });

  // Re-seed when opened for a different lead.
  React.useEffect(() => {
    if (open && lead) {
      setForm({
        name: lead.name ?? "",
        phone: lead.phone ?? "",
        email: lead.email ?? "",
        company: lead.company ?? "",
        source: lead.source ?? "",
        requirement: lead.requirement ?? "",
        budget: lead.budget ?? "",
        location: lead.location ?? "",
        notes: lead.notes ?? "",
      });
    }
  }, [open, lead?.id]);

  if (!open || !lead) return null;

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all";

  return (
    <DialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <div>
          <h2 className="text-[20px] font-bold text-gray-900">Edit Lead</h2>
          <p className="text-[14px] text-gray-500 mt-1">Update {lead.name}'s details.</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-all mt-1">{closeIcon}</button>
      </div>

      <div className="p-6 overflow-y-auto flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Phone Number</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Email Address</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Company Name</label>
              <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Lead Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Lead Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={`${inputCls} appearance-none pr-10`}>
                <option value="">Select lead source</option>
                {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Requirement</label>
              <input type="text" value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} placeholder="e.g. Hot Desk" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Budget</label>
              <input type="text" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="e.g. ₹8,000/month" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Notes</h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Additional Information</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} placeholder="Enter any additional notes or requirements..." className={`${inputCls} resize-none`} />
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-gray-100 flex justify-end items-center gap-3 bg-gray-50/50">
        <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[14px] font-medium rounded-lg hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={handleSubmit} disabled={saving} className="px-5 py-2.5 bg-[#FF6A2F] text-white text-[14px] font-medium rounded-lg hover:bg-[#E55A20] transition-all shadow-sm disabled:opacity-60">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </DialogOverlay>
  );
}

export function ConvertClientDialog({
  open,
  onClose,
  lead,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  lead: LeadDialogLead | null;
  onConfirm: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  if (!open || !lead) return null;

  async function handleConfirm() {
    setSaving(true);
    try { await onConfirm(); } finally { setSaving(false); }
  }

  return (
    <SmallDialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Convert to Client</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">{closeIcon}</button>
      </div>
      <div className="p-6">
        <p className="text-[14px] text-gray-600 mb-6">Are you sure you want to convert <strong>{lead.name}</strong> to a client? This will move them to the onboarding stage.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleConfirm} disabled={saving} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20] disabled:opacity-60">
            {saving ? "Converting…" : "Confirm Conversion"}
          </button>
        </div>
      </div>
    </SmallDialogOverlay>
  );
}

export function UpdateStatusDialog({
  open,
  onClose,
  lead,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  lead: LeadDialogLead | null;
  onSubmit: (status: string, notes: string) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(lead?.status ?? "New");
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (open && lead) { setStatus(lead.status); setNotes(lead.notes ?? ""); }
  }, [open, lead?.id]);

  if (!open || !lead) return null;

  async function handleSubmit() {
    setSaving(true);
    try { await onSubmit(status, notes); } finally { setSaving(false); }
  }

  return (
    <SmallDialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Update Status</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">{closeIcon}</button>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Lead Stage</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none">
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none" placeholder="Add status update notes..."></textarea>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20] disabled:opacity-60">
            {saving ? "Updating…" : "Update"}
          </button>
        </div>
      </div>
    </SmallDialogOverlay>
  );
}

export function AttachDocsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <SmallDialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Attach Documents</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">{closeIcon}</button>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50">
          <div className="w-12 h-12 bg-[#FFF2EA] text-[#FF6A2F] rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <p className="text-[14px] font-medium text-gray-900">Click to upload or drag and drop</p>
          <p className="text-[12px] text-gray-500 mt-1">PDF, DOCX, JPG or PNG (max. 10MB)</p>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={() => { toast.info("Document storage is not yet configured"); onClose(); }} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20]">Upload</button>
        </div>
      </div>
    </SmallDialogOverlay>
  );
}

export function CallLeadDialog({ open, onClose, lead }: { open: boolean; onClose: () => void; lead: LeadDialogLead | null }) {
  if (!open || !lead) return null;
  const phone = lead.phone || "No phone number";
  return (
    <SmallDialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Call Lead</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">{closeIcon}</button>
      </div>
      <div className="p-6 flex flex-col items-center justify-center gap-4 py-10">
        <div className="w-16 h-16 bg-[#FFF2EA] text-[#FF6A2F] rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
        </div>
        <h3 className="text-xl font-bold">{phone}</h3>
        <p className="text-gray-500">Calling {lead.name}…</p>
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="text-[13px] text-[#FF6A2F] font-medium hover:underline">Or open in phone app</a>
        )}
        <button onClick={onClose} className="mt-4 px-6 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 shadow-sm">End Call</button>
      </div>
    </SmallDialogOverlay>
  );
}

export function WhatsappDialog({ open, onClose, lead }: { open: boolean; onClose: () => void; lead: LeadDialogLead | null }) {
  const [body, setBody] = useState("");
  React.useEffect(() => {
    if (open && lead) setBody(`Hi ${lead.name?.split(" ")[0] ?? "there"}, it was great speaking with you earlier. Here are the details we discussed...`);
  }, [open, lead?.id]);
  if (!open || !lead) return null;

  const phone = lead.phone?.replace(/[^0-9]/g, "");
  function handleSend() {
    if (!phone) { toast.error("No phone number on this lead"); return; }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`, "_blank");
    toast.success("Opening WhatsApp…");
    onClose();
  }

  return (
    <SmallDialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Send WhatsApp</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">{closeIcon}</button>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Message Body</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none"></textarea>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSend} className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#20bd5a]">Send WhatsApp</button>
        </div>
      </div>
    </SmallDialogOverlay>
  );
}

export function EmailDialog({ open, onClose, lead }: { open: boolean; onClose: () => void; lead: LeadDialogLead | null }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  React.useEffect(() => {
    if (open && lead) {
      setTo(lead.email ?? "");
      setSubject(`SpaceJam Coworking — ${lead.requirement || "Your Inquiry"}`);
      setMessage(`Hi ${lead.name?.split(" ")[0] ?? "there"},\n\nThank you for your interest in SpaceJam.\n\nBest,\nSpaceJam Team`);
    }
  }, [open, lead?.id]);
  if (!open || !lead) return null;

  function handleSend() {
    if (!to) { toast.error("No email address on this lead"); return; }
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    toast.success("Opening email client…");
    onClose();
  }

  return (
    <DialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Compose Email</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">{closeIcon}</button>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">To</label>
          <input type="text" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Subject</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none"></textarea>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSend} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20] flex gap-2 items-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            Send Email
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
}

export function AddNoteDialog({
  open,
  onClose,
  lead,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  lead: LeadDialogLead | null;
  onSubmit: (note: string) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  React.useEffect(() => { if (open) setNote(""); }, [open]);
  if (!open || !lead) return null;

  async function handleSave() {
    if (!note.trim()) { toast.error("Note cannot be empty"); return; }
    setSaving(true);
    try { await onSubmit(note); } finally { setSaving(false); }
  }

  return (
    <SmallDialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Add Note</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">{closeIcon}</button>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Note Content</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none" placeholder="Type your note here..."></textarea>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20] disabled:opacity-60">
            {saving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </div>
    </SmallDialogOverlay>
  );
}

export function ScheduleVisitDialog({
  open,
  onClose,
  lead,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  lead: LeadDialogLead | null;
  onSubmit: (input: { date: string; timeSlot: string; notes: string }) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  React.useEffect(() => { if (open) { setDate(""); setTimeSlot(""); setNotes(""); } }, [open]);
  if (!open || !lead) return null;

  async function handleSubmit() {
    if (!date) { toast.error("Please pick a date"); return; }
    setSaving(true);
    try { await onSubmit({ date, timeSlot, notes }); } finally { setSaving(false); }
  }

  const inputCls = "px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all";

  return (
    <DialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[20px] font-bold text-gray-900">Schedule Visit</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">{closeIcon}</button>
      </div>
      <div className="p-6 overflow-y-auto flex flex-col gap-5 max-h-[70vh]">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Lead Name</label>
          <input type="text" value={lead.name} readOnly className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Time Slot</label>
          <input type="text" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} placeholder="e.g. 11:00 AM-12:00 PM" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Center</label>
          <input type="text" value={lead.center?.name ?? "Unassigned"} readOnly className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Assigned Staff</label>
          <input type="text" value={lead.assignedTo?.name ?? "Unassigned"} readOnly className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any special notes..." rows={3} className={`${inputCls} resize-none`} />
        </div>
      </div>
      <div className="p-6 border-t border-gray-100 flex gap-4">
        <button onClick={onClose} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-all disabled:opacity-60">
          {saving ? "Scheduling…" : "Confirm Visit"}
        </button>
      </div>
    </DialogOverlay>
  );
}

export function SendProposalDialog({
  open,
  onClose,
  lead,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  lead: LeadDialogLead | null;
  onSubmit: (input: { template: string; pricing: string; duration: string; notes: string }) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState("");
  const [pricing, setPricing] = useState(lead?.budget ?? "");
  const [duration, setDuration] = useState("6");
  const [notes, setNotes] = useState("");
  React.useEffect(() => { if (open && lead) { setPricing(lead.budget ?? ""); setDuration("6"); setNotes(""); setTemplate(""); } }, [open, lead?.id]);
  if (!open || !lead) return null;

  async function handleSubmit() {
    setSaving(true);
    try { await onSubmit({ template, pricing, duration, notes }); } finally { setSaving(false); }
  }

  const inputCls = "px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all";

  return (
    <DialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[20px] font-bold text-gray-900">Send Proposal</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">{closeIcon}</button>
      </div>
      <div className="p-6 overflow-y-auto flex flex-col gap-6 max-h-[70vh]">
        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-medium text-gray-700">Template Selection</label>
          <input type="text" value={template} onChange={(e) => setTemplate(e.target.value)} placeholder="e.g. Hot Desk Proposal" className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Pricing (₹/month)</label>
            <input type="text" value={pricing} onChange={(e) => setPricing(e.target.value)} placeholder="5000" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Duration (months)</label>
            <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-medium text-gray-700">Proposal Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any custom notes for this proposal..." rows={4} className={`${inputCls} resize-none`} />
        </div>
      </div>
      <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
        <button onClick={onClose} className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 px-4 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
          </svg>
          {saving ? "Sending…" : "Send Proposal"}
        </button>
      </div>
    </DialogOverlay>
  );
}
