/**
 * File:        apps/web/src/components/crm/EditLeadModal.tsx
 * Module:      Web · CRM · EditLeadModal
 * Purpose:     Modal for editing lead details
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import { UPDATE_LEAD, GET_LEADS } from "@/lib/apollo/operations";

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadData?: {
    id?: string;
    name: string;
    phone: string;
    email: string;
    company: string;
    source: string;
    plan: string;
    teamSize: string;
    moveInDate: string;
    assignedCM: string;
    preferredCenter?: string;
    notes?: string;
  };
}

const Icons = {
  chevronDown: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  close: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const leadSources = ["Website", "Referral", "Walk-in", "Social Media", "Email Campaign", "Cold Call"];
const interestedPlans = ["Hot Desk", "Dedicated Desk", "Cabin", "Private Office", "Virtual Office"];
const centerManagers = ["Shubham", "Rahul", "Priya", "Amit", "Neha"];
const centerLocations = ["Ludhiana", "Chandigarh", "Delhi", "Mumbai", "Bangalore"];

export default function EditLeadModal({ isOpen, onClose, leadData }: EditLeadModalProps) {
  const [formData, setFormData] = useState({
    name: leadData?.name || "Rahul Sharma",
    phone: leadData?.phone || "0988477493",
    email: leadData?.email || "rahul@gmail.com",
    company: leadData?.company || "abc corporation",
    source: leadData?.source || "Website",
    plan: leadData?.plan || "Monthly",
    teamSize: leadData?.teamSize || "35",
    moveInDate: leadData?.moveInDate || "",
    assignedCM: leadData?.assignedCM || "Shubham",
    preferredCenter: leadData?.preferredCenter || "Ludhiana",
    notes: leadData?.notes || "Enter any additional notes or requirements...",
  });

  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [updateLead] = useMutation(UPDATE_LEAD, {
    refetchQueries: [{ query: GET_LEADS }],
  });

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDropdown = (field: string) => {
    setDropdownOpen(dropdownOpen === field ? null : field);
  };

  const selectDropdownOption = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setDropdownOpen(null);
  };

  const persist = async () => {
    const leadId = leadData?.id;
    if (!leadId) {
      toast.error("Cannot save: missing lead id");
      return false;
    }
    setSaving(true);
    try {
      await updateLead({
        variables: {
          id: leadId,
          input: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            company: formData.company,
            source: formData.source,
            requirement: formData.plan,
            teamSize: Number(formData.teamSize) || undefined,
            moveInDate: formData.moveInDate || undefined,
            assignedCM: formData.assignedCM,
            preferredCenter: formData.preferredCenter,
            notes: formData.notes,
          },
        },
      });
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update lead");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const ok = await persist();
    if (ok) {
      toast.success("Lead updated");
      onClose();
    }
  };

  const handleSaveDraft = async () => {
    const ok = await persist();
    if (ok) {
      toast.success("Lead saved");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-[10px] shadow-xl w-[850px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#f3f4f6]">
          <div>
            <h2 className="text-[20px] font-semibold text-[#101828] tracking-[-0.45px]">Edit Lead</h2>
            <p className="text-[14px] text-[#4a5565] mt-1">Edit client details here.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
          >
            {Icons.close}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 pt-6 pb-6">
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-[16px] font-medium text-[#101828] tracking-[-0.31px] mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-medium text-[#344054] mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full h-[40px] px-3 py-1 bg-[#f3f3f5] rounded-[8px] text-[14px] text-[#717182] border border-transparent focus:border-[#ff7847] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#344054] mb-2">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full h-[40px] px-3 py-1 bg-[#f3f3f5] rounded-[8px] text-[14px] text-[#717182] border border-transparent focus:border-[#ff7847] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#344054] mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full h-[40px] px-3 py-1 bg-[#f3f3f5] rounded-[8px] text-[14px] text-[#717182] border border-transparent focus:border-[#ff7847] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#344054] mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className="w-full h-[40px] px-3 py-1 bg-[#f3f3f5] rounded-[8px] text-[14px] text-[#717182] border border-transparent focus:border-[#ff7847] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="mb-6">
            <h3 className="text-[16px] font-medium text-[#101828] tracking-[-0.31px] mb-4">Lead Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-medium text-[#344054] mb-2">Lead Source</label>
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown("source")}
                    className="w-full h-[36px] px-3 bg-[#f3f3f5] rounded-[8px] text-[14px] font-medium text-[#717182] flex items-center justify-between border border-transparent focus:border-[#ff7847] focus:outline-none"
                  >
                    <span>{formData.source}</span>
                    {Icons.chevronDown}
                  </button>
                  {dropdownOpen === "source" && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg overflow-hidden">
                      {leadSources.map((source) => (
                        <button
                          key={source}
                          onClick={() => selectDropdownOption("source", source)}
                          className="w-full px-3 py-2 text-left text-[14px] text-[#344054] hover:bg-[#f3f4f6] transition-colors"
                        >
                          {source}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#344054] mb-2">Interested Plan</label>
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown("plan")}
                    className="w-full h-[36px] px-3 bg-[#f3f3f5] rounded-[8px] text-[14px] font-medium text-[#717182] flex items-center justify-between border border-transparent focus:border-[#ff7847] focus:outline-none"
                  >
                    <span>{formData.plan}</span>
                    {Icons.chevronDown}
                  </button>
                  {dropdownOpen === "plan" && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg overflow-hidden">
                      {interestedPlans.map((plan) => (
                        <button
                          key={plan}
                          onClick={() => selectDropdownOption("plan", plan)}
                          className="w-full px-3 py-2 text-left text-[14px] text-[#344054] hover:bg-[#f3f4f6] transition-colors"
                        >
                          {plan}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#344054] mb-2">Team Size</label>
                <input
                  type="text"
                  value={formData.teamSize}
                  onChange={(e) => handleChange("teamSize", e.target.value)}
                  className="w-full h-[40px] px-3 py-1 bg-[#f3f3f5] rounded-[8px] text-[14px] text-[#717182] border border-transparent focus:border-[#ff7847] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#344054] mb-2">Preferred Move-in Date</label>
                <input
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => handleChange("moveInDate", e.target.value)}
                  className="w-full h-[40px] px-3 py-1 bg-[#f3f3f5] rounded-[8px] text-[14px] text-[#717182] border border-transparent focus:border-[#ff7847] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="mb-6">
            <h3 className="text-[16px] font-medium text-[#101828] tracking-[-0.31px] mb-4">Assignment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-medium text-[#344054] mb-2">Assigned Center Manager</label>
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown("assignedCM")}
                    className="w-full h-[36px] px-3 bg-[#f3f3f5] rounded-[8px] text-[14px] font-medium text-[#717182] flex items-center justify-between border border-transparent focus:border-[#ff7847] focus:outline-none"
                  >
                    <span>{formData.assignedCM}</span>
                    {Icons.chevronDown}
                  </button>
                  {dropdownOpen === "assignedCM" && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg overflow-hidden">
                      {centerManagers.map((manager) => (
                        <button
                          key={manager}
                          onClick={() => selectDropdownOption("assignedCM", manager)}
                          className="w-full px-3 py-2 text-left text-[14px] text-[#344054] hover:bg-[#f3f4f6] transition-colors"
                        >
                          {manager}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#344054] mb-2">Preferred Center</label>
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown("preferredCenter")}
                    className="w-full h-[36px] px-3 bg-[#f3f3f5] rounded-[8px] text-[14px] font-medium text-[#717182] flex items-center justify-between border border-transparent focus:border-[#ff7847] focus:outline-none"
                  >
                    <span>{formData.preferredCenter}</span>
                    {Icons.chevronDown}
                  </button>
                  {dropdownOpen === "preferredCenter" && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg overflow-hidden">
                      {centerLocations.map((location) => (
                        <button
                          key={location}
                          onClick={() => selectDropdownOption("preferredCenter", location)}
                          className="w-full px-3 py-2 text-left text-[14px] text-[#344054] hover:bg-[#f3f4f6] transition-colors"
                        >
                          {location}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-[16px] font-medium text-[#101828] tracking-[-0.31px] mb-4">Notes</h3>
            <div>
              <label className="block text-[14px] font-medium text-[#344054] mb-2">Additional Information</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="w-full h-[100px] px-3 py-2 bg-[#f3f3f5] rounded-[8px] text-[14px] text-[#717182] border border-transparent focus:border-[#ff7847] focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#f3f4f6]">
          <button
            onClick={onClose}
            className="h-[40px] px-5 bg-white border border-[rgba(0,0,0,0.1)] rounded-[12px] text-[14px] font-medium text-[#0a0a0a] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="h-[40px] px-5 bg-white border border-[rgba(0,0,0,0.1)] rounded-[12px] text-[14px] font-medium text-[#0a0a0a] hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Save as Draft
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-[40px] px-5 bg-[#ff7847] rounded-[12px] text-[14px] font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Update Lead
          </button>
        </div>
      </div>
    </div>
  );
}