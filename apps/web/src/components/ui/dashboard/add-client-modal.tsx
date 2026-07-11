"use client";

import React, { useState } from "react";
import { toast } from "sonner";

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (data: Record<string, string>) => void;
}

export function AddClientModal({ open, onClose, onAdd }: AddClientModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [clientType, setClientType] = useState('');
  const [assignedPlan, setAssignedPlan] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [baseCenter, setBaseCenter] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  if (!open) return null;

  const resetForm = () => {
    setName(''); setPhone(''); setEmail(''); setCompany(''); setClientType('');
    setAssignedPlan(''); setTeamSize(''); setContractStartDate(''); setBaseCenter('');
    setLocation(''); setNotes('');
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (onAdd) {
      onAdd({
        name, phone, email, company, clientType, assignedPlan, teamSize,
        contractStartDate, baseCenter, location, notes,
      });
    }
    toast.success("Client created");
    onClose();
    resetForm();
  };

  const handleSaveDraft = () => {
    if (!name.trim()) {
      toast.error("Full name is required to save a draft");
      return;
    }
    if (onAdd) {
      onAdd({
        name, phone, email, company, clientType, assignedPlan, teamSize,
        contractStartDate, baseCenter, location, notes, status: "DRAFT",
      });
    }
    toast.success("Saved as draft");
    onClose();
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200" onClick={onClose}>
      <div
        className="w-full max-w-[800px] max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-200 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Add New Client</h2>
            <p className="text-[14px] text-gray-500 mt-1">Enter client details to create a new active client.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-8">
          
          {/* Basic Information */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[16px] font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Full Name</label>
                <input type="text" placeholder="Enter full name" value={name} onChange={e => setName(e.target.value)} className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Phone Number</label>
                <input type="text" placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)} className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Email Address</label>
                <input type="email" placeholder="Enter email address" value={email} onChange={e => setEmail(e.target.value)} className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Company Name</label>
                <input type="text" placeholder="Enter company name" value={company} onChange={e => setCompany(e.target.value)} className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" />
              </div>
            </div>
          </section>

          {/* Client Details */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[16px] font-semibold text-gray-900">Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Client Type</label>
                <div className="relative">
                  <select value={clientType} onChange={e => setClientType(e.target.value)} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                    <option value="">Select client type</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="startup">Startup</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Assigned Plan</label>
                <div className="relative">
                  <select value={assignedPlan} onChange={e => setAssignedPlan(e.target.value)} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                    <option value="">Select plan</option>
                    <option value="hot-desk">Hot Desk</option>
                    <option value="dedicated">Dedicated Desk</option>
                    <option value="private">Private Office</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Team Size</label>
                <input type="text" placeholder="Enter team size" value={teamSize} onChange={e => setTeamSize(e.target.value)} className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Contract Start Date</label>
                <input type="date" value={contractStartDate} onChange={e => setContractStartDate(e.target.value)} className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" />
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[16px] font-semibold text-gray-900">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Base Center</label>
                <div className="relative">
                  <select value={baseCenter} onChange={e => setBaseCenter(e.target.value)} className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                    <option value="">Select center</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Allocated Space</label>
                <input type="text" placeholder="e.g. Office 4B" value={location} onChange={e => setLocation(e.target.value)} className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[16px] font-semibold text-gray-900">Notes</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Additional Information</label>
              <textarea 
                placeholder="Enter any additional notes or requirements..." 
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors resize-none" 
              />
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end items-center gap-3 bg-gray-50/50">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[14px] font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]"
          >
            Cancel
          </button>
          <button onClick={handleSaveDraft} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[14px] font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]">
            Save as Draft
          </button>
          <button onClick={handleSubmit} className="px-5 py-2.5 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-all duration-200 active:scale-[0.97]">
            Create Client
          </button>
        </div>
      </div>
    </div>
  );
}

