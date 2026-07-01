"use client";

import { useState } from "react";
import { ExportExcelModal } from "@/components/ui/dashboard/export-excel-modal";
import styles from "./table-view.module.css";

const Icons = {
  export: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  chevronDown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  )
};

export default function TableViewPage() {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(0);
  const [showExport, setShowExport] = useState(false);

  const inventoryData = [
    {
      id: 1,
      spaceName: "Executive Cabin 101",
      location: "Chandigarh",
      floor: "1st Floor",
      type: "Cabin",
      capacity: 4,
      price: "₹25,000",
      gst: "18%",
      status: "Occupied",
      assignedTo: "Tech Solutions Pvt Ltd",
      startDate: "01 Jan 2026",
      endDate: "31 Dec 2026",
    },
    {
      id: 2,
      spaceName: "Hot Desk Area A",
      location: "Mohali",
      floor: "2nd Floor",
      type: "Desk",
      capacity: 20,
      price: "₹5,000",
      gst: "18%",
      status: "Available",
      assignedTo: "-",
      startDate: "-",
      endDate: "-",
    },
    {
      id: 3,
      spaceName: "Meeting Room 201",
      location: "Chandigarh",
      floor: "2nd Floor",
      type: "Meeting Room",
      capacity: 10,
      price: "₹15,000",
      gst: "18%",
      status: "Occupied",
      assignedTo: "Creative Agency Inc",
      startDate: "15 Mar 2026",
      endDate: "15 Mar 2026",
    },
    {
      id: 4,
      spaceName: "Private Office 102",
      location: "Jalandhar",
      floor: "1st Floor",
      type: "Cabin",
      capacity: 6,
      price: "₹35,000",
      gst: "18%",
      status: "Maintenance",
      assignedTo: "-",
      startDate: "-",
      endDate: "-",
    },
    {
      id: 5,
      spaceName: "Conference Hall B",
      location: "Mohali",
      floor: "3rd Floor",
      type: "Meeting Room",
      capacity: 25,
      price: "₹40,000",
      gst: "18%",
      status: "Available",
      assignedTo: "-",
      startDate: "-",
      endDate: "-",
    },
    {
      id: 6,
      spaceName: "Dedicated Desk 301",
      location: "Chandigarh",
      floor: "3rd Floor",
      type: "Desk",
      capacity: 1,
      price: "₹8,000",
      gst: "18%",
      status: "Occupied",
      assignedTo: "Freelance Designer",
      startDate: "01 Apr 2026",
      endDate: "30 Sep 2026",
    },
    {
      id: 7,
      spaceName: "Team Cabin 203",
      location: "Chandigarh",
      floor: "2nd Floor",
      type: "Cabin",
      capacity: 8,
      price: "₹45,000",
      gst: "18%",
      status: "Available",
      assignedTo: "-",
      startDate: "-",
      endDate: "-",
    },
    {
      id: 8,
      spaceName: "Meeting Room 102",
      location: "Jalandhar",
      floor: "1st Floor",
      type: "Meeting Room",
      capacity: 12,
      price: "₹18,000",
      gst: "18%",
      status: "Occupied",
      assignedTo: "Marketing Pro Ltd",
      startDate: "10 Feb 2026",
      endDate: "09 Aug 2026",
    }
  ];

  const toggleDropdown = (index: number) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  return (
    <div className={styles.page}>
      
      {/* Top Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Inventory Overview</h1>
          <p className={styles.headerSubtitle}>Manage all spaces, pricing, and occupancy</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>{Icons.search}</span>
            <input type="text" placeholder="Search spaces..." />
          </div>
          <button 
            onClick={() => setShowExport(true)}
            className={styles.exportBtn}
          >
            {Icons.export} Export CSV
          </button>
          <button className={styles.addSpaceBtn}>
            {Icons.plus} Add Space
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <div className={styles.searchBoxIcon}>{Icons.search}</div>
          <input type="text" placeholder="Search Space Name and Company" />
        </div>
        
        <select className={styles.filterSelect} defaultValue="Location">
          <option disabled>Location</option>
          <option>Chandigarh</option>
          <option>Mohali</option>
          <option>Jalandhar</option>
        </select>
        
        <select className={styles.filterSelect} defaultValue="Sub-Location">
          <option disabled>Sub-Location</option>
          <option>All</option>
        </select>
        
        <select className={styles.filterSelect} defaultValue="Floor">
          <option disabled>Floor</option>
          <option>1st Floor</option>
          <option>2nd Floor</option>
          <option>3rd Floor</option>
        </select>

        <select className={styles.filterSelect} defaultValue="Product">
          <option disabled>Product</option>
          <option>Cabin</option>
          <option>Desk</option>
          <option>Meeting Room</option>
        </select>

        <select className={styles.filterSelect} defaultValue="Status">
          <option disabled>Status</option>
          <option>Occupied</option>
          <option>Available</option>
          <option>Maintenance</option>
        </select>

        <button className={styles.clearBtn}>
          Clear All
        </button>
      </div>

      {/* Table Area */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Space Name</th>
              <th>Location</th>
              <th>Floor</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Price</th>
              <th>GST</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData.map((row, index) => (
              <tr key={row.id}>
                <td className={styles.colSpaceName}>
                  <div style={{ width: '120px', lineHeight: '1.4' }}>{row.spaceName}</div>
                </td>
                <td>{row.location}</td>
                <td>
                  <div style={{ width: '60px', lineHeight: '1.4' }}>{row.floor}</div>
                </td>
                <td>
                  <div style={{ width: '80px', lineHeight: '1.4' }}>{row.type}</div>
                </td>
                <td>{row.capacity}</td>
                <td style={{ fontWeight: 600 }}>{row.price}</td>
                <td>{row.gst}</td>
                <td>
                  <span className={`${styles.badge} ${
                    row.status === 'Occupied' ? styles.badgeOccupied :
                    row.status === 'Available' ? styles.badgeAvailable :
                    styles.badgeMaintenance
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td>
                  <div style={{ width: '120px', lineHeight: '1.4' }}>{row.assignedTo}</div>
                </td>
                <td>
                  <div style={{ width: '60px', lineHeight: '1.4' }}>{row.startDate}</div>
                </td>
                <td>
                  <div style={{ width: '60px', lineHeight: '1.4' }}>{row.endDate}</div>
                </td>
                <td className={styles.actionCell}>
                  <div className={styles.actionBtn} onClick={() => toggleDropdown(index)}>
                    {Icons.chevronDown}
                  </div>
                  {activeDropdown === index && (
                    <div className={styles.actionDropdown}>
                      <div className={styles.dropdownItem}>Occupied</div>
                      <div className={styles.dropdownItem}>Available</div>
                      <div className={styles.dropdownItem}>Maintenance</div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ExportExcelModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
