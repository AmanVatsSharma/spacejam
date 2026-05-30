/**
 * File:        apps/web/src/app/dashboard/location/page.tsx
 * Module:      Web · Dashboard · Location Page
 * Purpose:     Location management page for center configuration
 *
 * Exports:
 *   - LocationPage — location management page content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import { useState, type ReactElement } from "react";
import styles from "./page.module.css";

const mockLocation = {
  name: "IT Park Chandigarh",
  address: "Plot 5, IT Park, Sector 17",
  city: "Chandigarh",
  state: "Punjab",
  country: "India",
  timezone: "Asia/Kolkata",
  facilities: {
    wifi: true,
    parking: true,
    access247: false,
    cafeteria: true,
    meetingRooms: true,
    phoneBooths: false,
  },
  operatingHours: {
    weekdays: "9:00 AM - 9:00 PM",
    saturday: "10:00 AM - 6:00 PM",
    sunday: "Closed",
  },
  contact: {
    phone: "+91 172 456 7890",
    email: "chandigarh@spacejam.co",
  },
};

const mockCenters = [
  { id: "it-park", name: "IT Park Chandigarh" },
  { id: "sector-17", name: "Sector 17 Chandigarh" },
  { id: "industrial-area", name: "Industrial Area" },
];

interface Facility {
  key: keyof typeof mockLocation.facilities;
  label: string;
  icon: ReactElement;
}

const facilities: Facility[] = [
  {
    key: "wifi",
    label: "WiFi",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 15C10 15 15 12.5 15 8.5V4M10 15C10 15 5 12.5 5 8.5V4M10 15V18M3 11C3 11 6 8.5 10 8.5C14 8.5 17 11 17 11" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: "parking",
    label: "Parking",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="#4B5563" strokeWidth="1.5"/>
        <path d="M7 7H13V13H7V7Z" stroke="#4B5563" strokeWidth="1.5"/>
        <path d="M7 3V1M13 3V1" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: "access247",
    label: "24/7 Access",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="7" stroke="#4B5563" strokeWidth="1.5"/>
        <path d="M10 6V10L13 12" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: "cafeteria",
    label: "Cafeteria",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 8H16V14C16 15.1 15.1 16 14 16H6C4.9 16 4 15.1 4 14V8Z" stroke="#4B5563" strokeWidth="1.5"/>
        <path d="M16 8H17C18.1 8 19 8.9 19 10V11C19 12.1 18.1 13 17 13H16" stroke="#4B5563" strokeWidth="1.5"/>
        <path d="M7 8V5C7 4.4 7.4 4 8 4H12C12.6 4 13 4.4 13 5V8" stroke="#4B5563" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    key: "meetingRooms",
    label: "Meeting Rooms",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="14" height="10" rx="1" stroke="#4B5563" strokeWidth="1.5"/>
        <path d="M7 15V17M13 15V17M3 15H17" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="14" cy="8" r="1" fill="#4B5563"/>
      </svg>
    ),
  },
  {
    key: "phoneBooths",
    label: "Phone Booths",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="3" width="10" height="14" rx="1" stroke="#4B5563" strokeWidth="1.5"/>
        <path d="M8 17V18M12 17V18" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="10" cy="8" r="2" stroke="#4B5563" strokeWidth="1.5"/>
        <rect x="8" y="11" width="4" height="3" rx="0.5" stroke="#4B5563" strokeWidth="1.5"/>
      </svg>
    ),
  },
];

export default function LocationPage() {
  const [selectedCenter, setSelectedCenter] = useState(mockCenters[0].id);
  const [location, setLocation] = useState(mockLocation);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLocation, setEditedLocation] = useState(mockLocation);

  const handleEditToggle = () => {
    if (isEditing) {
      setLocation(editedLocation);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedLocation((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContactChange = (field: string, value: string) => {
    setEditedLocation((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value,
      },
    }));
  };

  const handleHoursChange = (field: string, value: string) => {
    setEditedLocation((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [field]: value,
      },
    }));
  };

  const toggleFacility = (key: keyof typeof location.facilities) => {
    setLocation((prev) => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        [key]: !prev.facilities[key],
      },
    }));
  };

  const activeFacilitiesCount = Object.values(location.facilities).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold text-[#101828]">Location Management</h1>
          <p className="text-sm text-[#4A5565]">
            Configure center details, facilities, and operating hours
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#FF6A2F] text-white px-4 py-2 rounded-xl font-medium text-sm h-[36px] hover:bg-[#E55A25] transition-colors shadow-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 3V13M3 8H13" />
          </svg>
          <span>Add Center</span>
        </button>
      </div>

      {/* Center Selector */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-[#1F1F1F]">Select Center:</label>
          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="flex-1 max-w-[300px] h-[40px] px-4 rounded-xl border border-[#E5E7EB] bg-white text-[#101828] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent"
          >
            {mockCenters.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center Details & Facilities Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Center Details Card */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#101828]">Center Details</h2>
            <button
              onClick={handleEditToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm h-[36px] transition-colors shadow-sm ${
                isEditing
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-[#FF6A2F] text-white hover:bg-[#E55A25]"
              }`}
            >
              {isEditing ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 8L6 12L14 4" />
                  </svg>
                  <span>Save</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11.5 2.5L13.5 4.5M2 14L3.5 9.5L12.5 2.5L13.5 4.5L6.5 11.5L2 14Z" />
                  </svg>
                  <span>Edit</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-5">
            {/* Center Name */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Center Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedLocation.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={styles.input}
                />
              ) : (
                <p className={styles.value}>{location.name}</p>
              )}
            </div>

            {/* Full Address */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Full Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedLocation.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className={styles.input}
                />
              ) : (
                <p className={styles.value}>{location.address}</p>
              )}
            </div>

            {/* City, State, Country Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className={styles.inputGroup}>
                <label className={styles.label}>City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedLocation.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className={styles.input}
                  />
                ) : (
                  <p className={styles.value}>{location.city}</p>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>State</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedLocation.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className={styles.input}
                  />
                ) : (
                  <p className={styles.value}>{location.state}</p>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Country</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedLocation.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    className={styles.input}
                  />
                ) : (
                  <p className={styles.value}>{location.country}</p>
                )}
              </div>
            </div>

            {/* Timezone */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Timezone</label>
              {isEditing ? (
                <select
                  value={editedLocation.timezone}
                  onChange={(e) => handleInputChange("timezone", e.target.value)}
                  className={styles.input}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </select>
              ) : (
                <p className={styles.value}>{location.timezone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Facilities Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#101828]">Facilities</h2>
            <span className="text-sm text-[#4A5565]">
              {activeFacilitiesCount}/{facilities.length} active
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {facilities.map((facility) => (
              <div
                key={facility.key}
                className="flex items-center justify-between p-3 rounded-xl bg-[#FBF6F4] hover:bg-[#F5EDE9] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {facility.icon}
                  <span className="text-sm font-medium text-[#1F1F1F]">{facility.label}</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={location.facilities[facility.key]}
                    onChange={() => toggleFacility(facility.key)}
                    className={styles.toggleInput}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operating Hours & Contact Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Operating Hours Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#101828]">Operating Hours</h2>
            <button
              onClick={handleEditToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm h-[36px] transition-colors shadow-sm ${
                isEditing
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-[#FF6A2F] text-white hover:bg-[#E55A25]"
              }`}
            >
              {isEditing ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 8L6 12L14 4" />
                  </svg>
                  <span>Save</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11.5 2.5L13.5 4.5M2 14L3.5 9.5L12.5 2.5L13.5 4.5L6.5 11.5L2 14Z" />
                  </svg>
                  <span>Edit</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#FBF6F4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF6A2F]/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-[#FF6A2F]">M-F</span>
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Monday - Friday</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedLocation.operatingHours.weekdays}
                  onChange={(e) => handleHoursChange("weekdays", e.target.value)}
                  className={styles.hoursInput}
                />
              ) : (
                <span className="text-sm font-medium text-[#4A5565]">
                  {location.operatingHours.weekdays}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#FBF6F4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF6A2F]/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-[#FF6A2F]">Sat</span>
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Saturday</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedLocation.operatingHours.saturday}
                  onChange={(e) => handleHoursChange("saturday", e.target.value)}
                  className={styles.hoursInput}
                />
              ) : (
                <span className="text-sm font-medium text-[#4A5565]">
                  {location.operatingHours.saturday}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#FBF6F4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF6A2F]/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-[#FF6A2F]">Sun</span>
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Sunday</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedLocation.operatingHours.sunday}
                  onChange={(e) => handleHoursChange("sunday", e.target.value)}
                  className={styles.hoursInput}
                />
              ) : (
                <span className="text-sm font-medium text-[#4A5565]">
                  {location.operatingHours.sunday}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#101828]">Contact Information</h2>
            <button
              onClick={handleEditToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm h-[36px] transition-colors shadow-sm ${
                isEditing
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-[#FF6A2F] text-white hover:bg-[#E55A25]"
              }`}
            >
              {isEditing ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 8L6 12L14 4" />
                  </svg>
                  <span>Save</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11.5 2.5L13.5 4.5M2 14L3.5 9.5L12.5 2.5L13.5 4.5L6.5 11.5L2 14Z" />
                  </svg>
                  <span>Edit</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {/* Phone */}
            <div className="p-4 rounded-xl bg-[#FBF6F4]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF6A2F]/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 4C4.4 4.6 4 5.5 4 6.5C4 10 6 12 9.5 12C10.5 12 11.4 11.6 12 11M13 4C13.6 4.6 14 5.5 14 6.5C14 8 13.5 9.4 12.7 10.4M9 8.5C9 8.5 9.5 9.5 10.5 9.5C11.5 9.5 11 8.5 11 8.5" stroke="#FF6A2F" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M3 3H5L6.5 7.5L8.5 5.5C9.2 4.8 10.2 4.5 11.2 4.7L13 5C13.8 5.2 14.3 6 14.1 6.8C13.4 10.2 10.7 12.9 7.3 13.6C6.5 13.8 5.7 13.3 5.5 12.5L5.2 10.7C5 9.7 5.3 8.7 6 8L4.5 6.5L3 3Z" stroke="#FF6A2F" strokeWidth="1.5"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Phone</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedLocation.contact.phone}
                  onChange={(e) => handleContactChange("phone", e.target.value)}
                  className={styles.contactInput}
                />
              ) : (
                <p className="text-base font-semibold text-[#101828] ml-13">
                  {location.contact.phone}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="p-4 rounded-xl bg-[#FBF6F4]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF6A2F]/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="4" width="14" height="10" rx="1" stroke="#FF6A2F" strokeWidth="1.5"/>
                    <path d="M2 5L9 10L16 5" stroke="#FF6A2F" strokeWidth="1.5"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Email</span>
              </div>
              {isEditing ? (
                <input
                  type="email"
                  value={editedLocation.contact.email}
                  onChange={(e) => handleContactChange("email", e.target.value)}
                  className={styles.contactInput}
                />
              ) : (
                <p className="text-base font-semibold text-[#101828] ml-13">
                  {location.contact.email}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
