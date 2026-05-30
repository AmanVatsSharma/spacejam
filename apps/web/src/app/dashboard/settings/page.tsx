/**
 * File:        apps/web/src/app/dashboard/settings/page.tsx
 * Module:      Web · Dashboard · Settings Page
 * Purpose:     App configuration, user preferences, and system settings
 *
 * Exports:
 *   - SettingsPage — settings page content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import { useState } from "react";

interface SettingSection {
  id: string;
  title: string;
  description: string;
}

const settingSections: SettingSection[] = [
  { id: "profile", title: "Profile", description: "Manage your account details and preferences" },
  { id: "center", title: "Center Settings", description: "Configure your coworking center details" },
  { id: "billing", title: "Billing & Payments", description: "Payment methods and invoice settings" },
  { id: "notifications", title: "Notifications", description: "Email and push notification preferences" },
  { id: "security", title: "Security", description: "Password and two-factor authentication" },
  { id: "integrations", title: "Integrations", description: "Connect third-party apps and services" },
];

interface ToggleSetting {
  label: string;
  description: string;
  enabled: boolean;
}

const notificationSettings: ToggleSetting[] = [
  { label: "Booking Confirmations", description: "Get notified when a booking is confirmed", enabled: true },
  { label: "Check-in Reminders", description: "Receive reminders before guest check-in", enabled: true },
  { label: "Daily Reports", description: "Daily summary of bookings and revenue", enabled: false },
  { label: "System Updates", description: "Important updates about the platform", enabled: true },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [notifications, setNotifications] = useState(notificationSettings);

  const toggleNotification = (index: number) => {
    setNotifications((prev) =>
      prev.map((item, i) => (i === index ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#101828] mb-4">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Full Name</label>
            <input
              type="text"
              defaultValue="Rahul Sharma"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF7847]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Email</label>
            <input
              type="email"
              defaultValue="rahul@spacejam.dev"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF7847]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Phone</label>
            <input
              type="tel"
              defaultValue="+91 98765 43210"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF7847]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Role</label>
            <input
              type="text"
              defaultValue="Center Manager"
              disabled
              className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500"
            />
          </div>
        </div>
        <button className="mt-4 bg-[#FF7847] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#101828] mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {notifications.map((setting, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-[#101828]">{setting.label}</p>
                <p className="text-sm text-gray-500">{setting.description}</p>
              </div>
              <button
                onClick={() => toggleNotification(index)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  setting.enabled ? "bg-[#FF7847]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    setting.enabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComingSoonSection = (title: string) => (
    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
          <circle cx="16" cy="16" r="10" />
          <path d="M16 10V16L20 18" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500">This feature is under development.</p>
    </div>
  );

  return (
    <div className="flex gap-6">
      {/* Settings Navigation */}
      <div className="w-72 bg-white rounded-2xl shadow-sm p-4 h-fit">
        <h2 className="text-lg font-semibold text-[#101828] mb-4 px-2">Settings</h2>
        <nav className="space-y-1">
          {settingSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? "bg-[#FFF7ED] text-[#FF7847]"
                  : "text-[#4A5565] hover:bg-gray-100"
              }`}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1">
        {activeSection === "profile" && renderProfileSection()}
        {activeSection === "notifications" && renderNotificationsSection()}
        {activeSection === "center" && renderComingSoonSection("Center Settings")}
        {activeSection === "billing" && renderComingSoonSection("Billing & Payments")}
        {activeSection === "security" && renderComingSoonSection("Security")}
        {activeSection === "integrations" && renderComingSoonSection("Integrations")}
      </div>
    </div>
  );
}