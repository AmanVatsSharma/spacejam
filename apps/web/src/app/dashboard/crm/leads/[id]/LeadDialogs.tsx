"use client";

import React from "react";

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

export function EditLeadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <DialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <div>
          <h2 className="text-[20px] font-bold text-gray-900">Edit Lead</h2>
          <p className="text-[14px] text-gray-500 mt-1">Edit client details here.</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Full Name</label>
              <input type="text" defaultValue="Rahul Sharma" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Phone Number</label>
              <input type="text" defaultValue="0988477493" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Email Address</label>
              <input type="email" defaultValue="rahul@gmail.com" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Company Name</label>
              <input type="text" defaultValue="abc corporation" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Lead Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Lead Source</label>
              <div className="relative">
                <select className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                  <option value="">Select lead source</option>
                  <option value="Website" selected>Website</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Interested Plan</label>
              <div className="relative">
                <select className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                  <option value="Monthly" selected>Monthly</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Team Size</label>
              <input type="text" defaultValue="35" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Preferred Move-in Date</label>
              <input type="date" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Assigned Center Manager</label>
              <div className="relative">
                <select className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                  <option value="Shubham" selected>Shubham</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Preferred Center</label>
              <div className="relative">
                <select className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                  <option value="Ludhiana" selected>Ludhiana</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Notes</h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Additional Information</label>
            <textarea 
              placeholder="Enter any additional notes or requirements..." 
              rows={4}
              className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors resize-none" 
            />
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-gray-100 flex justify-end items-center gap-3 bg-gray-50/50">
        <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[14px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[14px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
          Save as Draft
        </button>
        <button onClick={onClose} className="px-5 py-2.5 bg-[#FF6A2F] text-white text-[14px] font-medium rounded-lg hover:bg-[#E55A20] transition-colors shadow-sm">
          Save Changes
        </button>
      </div>
    </DialogOverlay>
  );
}

export function ConvertClientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <SmallDialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Convert to Client</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-6">
        <p className="text-[14px] text-gray-600 mb-6">Are you sure you want to convert Rahul Sharma to a client? This will move them to the onboarding stage.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20]">Confirm Conversion</button>
        </div>
      </div>
    </SmallDialogOverlay>
  );
}

export function UpdateStatusDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <SmallDialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Update Status</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Lead Stage</label>
          <select className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none">
            <option>Inquiry</option>
            <option>Visited</option>
            <option selected>Negotiation</option>
            <option>Converted</option>
            <option>Dropped</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Notes</label>
          <textarea rows={3} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none" placeholder="Add status update notes..."></textarea>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20]">Update</button>
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
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
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
          <button onClick={onClose} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20]">Upload</button>
        </div>
      </div>
    </SmallDialogOverlay>
  );
}

export function CallLeadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <SmallDialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Call Lead</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-6 flex flex-col items-center justify-center gap-4 py-10">
        <div className="w-16 h-16 bg-[#FFF2EA] text-[#FF6A2F] rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
        </div>
        <h3 className="text-xl font-bold">+91 98765 43210</h3>
        <p className="text-gray-500">Calling Rahul Sharma...</p>
        <button onClick={onClose} className="mt-4 px-6 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 shadow-sm">
          End Call
        </button>
      </div>
    </SmallDialogOverlay>
  );
}

export function WhatsappDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <SmallDialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Send WhatsApp</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Message Template</label>
          <select className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none">
            <option>Meeting Follow-up</option>
            <option>Proposal Sent</option>
            <option>Checking In</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Message Body</label>
          <textarea rows={4} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none" defaultValue={"Hi Rahul, it was great speaking with you earlier. Here are the details we discussed..."}></textarea>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#20bd5a]">Send WhatsApp</button>
        </div>
      </div>
    </SmallDialogOverlay>
  );
}

export function EmailDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <DialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Compose Email</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">To</label>
          <input type="text" defaultValue="rahul@example.com" className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Subject</label>
          <input type="text" defaultValue="SpaceJam Coworking Proposal" className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Message</label>
          <textarea rows={6} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none" defaultValue={"Hi Rahul,\n\nPlease find the attached proposal for the Hot Desk plan.\n\nBest,\nSpaceJam Team"}></textarea>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20] flex gap-2 items-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            Send Email
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
}

export function AddNoteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <SmallDialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[18px] font-bold text-gray-900">Add Note</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Note Content</label>
          <textarea rows={4} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border-none outline-none" placeholder="Type your note here..."></textarea>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#E55A20]">Save Note</button>
        </div>
      </div>
    </SmallDialogOverlay>
  );
}

export function ScheduleVisitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <DialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[20px] font-bold text-gray-900">Schedule Visit</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex flex-col gap-5 max-h-[70vh]">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Lead Name</label>
          <input type="text" defaultValue="Rahul Sharma" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Date</label>
          <input type="text" placeholder="dd/mm/yyyy" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Time Slot</label>
          <input type="text" defaultValue="11:00 AM-12:00 PM" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Center</label>
          <input type="text" defaultValue="Ludhiana" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Assigned Staff</label>
          <input type="text" defaultValue="Shubham" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700">Notes</label>
          <textarea 
            placeholder="Add any special notes..." 
            rows={3}
            className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors resize-none" 
          />
        </div>

        <div className="flex items-center gap-2 p-4 bg-[#FFF6F5] border border-[#FFD9D4] rounded-lg text-[#FF4D4F] text-[13px] font-medium mt-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Conflict detected: Another visit is scheduled at this time.
        </div>
      </div>

      <div className="p-6 border-t border-gray-100 flex gap-4">
        <button 
          onClick={onClose}
          className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button onClick={onClose} className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors">
          Confirm Visit
        </button>
      </div>
    </DialogOverlay>
  );
}

export function SendProposalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <DialogOverlay open={open} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-[20px] font-bold text-gray-900">Send Proposal</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex flex-col gap-6 max-h-[70vh]">
        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-medium text-gray-700">Template Selection</label>
          <input type="text" className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Pricing (₹/month)</label>
            <input type="text" defaultValue="5000" className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Duration (months)</label>
            <input type="text" defaultValue="6" className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-medium text-gray-700">Proposal Notes</label>
          <textarea 
            placeholder="Add any custom notes for this proposal..." 
            rows={4}
            className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all resize-none" 
          />
        </div>

        <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-5 flex flex-col gap-2">
          <span className="text-[12px] font-bold text-gray-500 tracking-wide uppercase">PREVIEW</span>
          <div className="text-[14px] text-gray-600 flex flex-col gap-1 mt-1">
            <p><strong className="font-semibold text-gray-700">Package:</strong> Hot Desk Package</p>
            <p><strong className="font-semibold text-gray-700">Price:</strong> ₹5,000/month</p>
            <p><strong className="font-semibold text-gray-700">Duration:</strong> 6 months</p>
            <p><strong className="font-semibold text-gray-700">Includes:</strong> High-speed WiFi, Meeting room access, Printing credits</p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
        <button className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors">
          Preview PDF
        </button>
        <div className="flex flex-1 gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button onClick={onClose} className="flex-1 py-3 px-4 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
            </svg>
            Send Proposal
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
}
