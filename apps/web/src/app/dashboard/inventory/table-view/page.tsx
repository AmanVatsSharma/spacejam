"use client";


export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_SEATS, GET_FLOORS } from "@/lib/apollo/operations";
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export default function TableViewPage() {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(0);
  const [showExport, setShowExport] = useState(false);
  const [search, setSearch] = useState("");

  // Live seats data
  const { data: seatsData, loading, error } = useQuery(GET_SEATS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const seats = seatsData?.seats ?? [];

  // Map API seats to the table's expected shape
  const inventoryData = useMemo(() => {
    return seats.map((seat: any, index: number) => ({
      id: index + 1,
      spaceName: seat.number ?? `Seat ${seat.id}`,
      location: seat.location ?? "—",
      floor: seat.floor?.name ?? "—",
      type: seat.type ?? "—",
      capacity: 1,
      price: seat.price ? formatCurrency(seat.price) : "—",
      gst: "18%",
      status: seat.status ?? "Available",
      assignedTo: seat.status === "OCCUPIED" ? "Assigned" : "-",
      startDate: "-",
      endDate: "-",
    }));
  }, [seats]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return inventoryData;
    const q = search.toLowerCase();
    return inventoryData.filter((item: any) =>
      item.spaceName?.toLowerCase().includes(q) ||
      item.type?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q)
    );
  }, [inventoryData, search]);

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
            <input type="text" placeholder="Search spaces..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
            {loading && filteredData.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  Loading inventory…
                </td>
              </tr>
            ) : error && filteredData.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  Unable to load inventory. Please try again.
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  No spaces found.
                </td>
              </tr>
            ) : (
              filteredData.map((row: any, index: number) => (
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
                    <span className={`${styles.badge} ${row.status === 'Occupied' || row.status === 'OCCUPIED' ? styles.badgeOccupied :
                      row.status === 'Available' || row.status === 'AVAILABLE' ? styles.badgeAvailable :
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <ExportExcelModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
