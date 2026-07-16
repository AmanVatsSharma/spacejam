"use client";

import React, { useState } from "react";
import { toast } from "sonner";

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (data: Record<string, string>) => void | Promise<void>;
}

export function AddClientModal({ open, onClose, onAdd }: AddClientModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Errors per field
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const resetForm = () => {
    setName(''); setPhone(''); setEmail(''); setCompany('');
    setTeamSize(''); setLocation('');
    setErrors({});
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "Please enter a valid email address";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = (): Record<string, string> => {
    // Only send fields the backend CreateCustomerInput accepts:
    // name, email, phone, company, status, centerId, teamSize, location
    const payload: Record<string, string> = {
      name: name.trim(),
      email: email.trim(),
    };
    if (phone.trim()) payload.phone = phone.trim();
    if (company.trim()) payload.company = company.trim();
    if (teamSize.trim()) payload.teamSize = teamSize.trim();
    if (location.trim()) payload.location = location.trim();
    return payload;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!onAdd) {
      toast.error("Form is not connected to the backend");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(buildPayload());
      resetForm();
      onClose();
    } catch (err) {
      // The parent's onAdd already handles error toasts.
      // If it re-throws, show a generic message.
      if (err instanceof Error && err.message) {
        toast.error(err.message);
      } else {
        toast.error("Failed to create client");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200" onClick={handleClose}>
      <div
        className="w-full max-w-[560px] max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Add New Client</h2>
            <p className="text-[14px] text-gray-500 mt-1">Create a new customer record.</p>
          </div>
          <button onClick={handleClose} disabled={submitting} className="text-gray-400 hover:text-gray-600 transition-colors mt-1 disabled:opacity-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
              className={`px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border transition-all duration-200 ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#FF6A2F]'}`}
            />
            {errors.name && <span className="text-[12px] text-red-500">{errors.name}</span>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="e.g. priya@company.com"
              value={email}
              onChange={e => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
              className={`px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border transition-all duration-200 ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#FF6A2F]'}`}
            />
            {errors.email && <span className="text-[12px] text-red-500">{errors.email}</span>}
          </div>

          {/* Phone + Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                placeholder="e.g. TechCorp India"
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200"
              />
            </div>
          </div>

          {/* Team Size + Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Team Size</label>
              <input
                type="text"
                placeholder="e.g. 5"
                value={teamSize}
                onChange={e => setTeamSize(e.target.value)}
                className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Allocated Space</label>
              <input
                type="text"
                placeholder="e.g. Office 4B"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end items-center gap-3 bg-gray-50/50">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[14px] font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </>
            ) : (
              "Create Client"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
