"use client";



import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_SEATS,
  GET_FLOORS,
  GET_MY_CENTERS,
  CREATE_SEAT,
  UPDATE_SEAT,
  GET_BOOKINGS,
} from "@/lib/apollo/operations";
import { ExportExcelModal } from "@/components/ui/dashboard/export-excel-modal";
import styles from "./table-view.module.css";

const SEAT_TYPES = ["HOT_DESK", "DEDICATED", "CABIN"] as const;

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

  // Filter state — driven by live data where possible
  const [locationId, setLocationId] = useState<string>("all");
  const [floorId, setFloorId] = useState<string>("all");
  const [product, setProduct] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  // Live centers data (drives the Location filter options)
  const { data: centersData } = useQuery<{ myCenters: any[] }>(GET_MY_CENTERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const centers = centersData?.myCenters ?? [];

  // Floors for the selected center (drives the Floor filter options)
  const selectedCenter = centers.find((c: any) => c.id === locationId) ?? null;
  const floorsForCenter = useMemo(() => {
    if (locationId === "all") return [];
    return selectedCenter?.floors ?? [];
  }, [locationId, selectedCenter]);

  // Live seats data
  const { data: seatsData, loading, error } = useQuery(GET_SEATS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    variables: floorId !== "all" ? { floorId } : {},
  });

  const seats = seatsData?.seats ?? [];

  const { data: bookingsData } = useQuery(GET_BOOKINGS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Mutations
  const [createSeat] = useMutation(CREATE_SEAT, {
    refetchQueries: [{ query: GET_SEATS }],
  });
  const [updateSeat] = useMutation(UPDATE_SEAT, {
    refetchQueries: [{ query: GET_SEATS }],
  });

  // Map API seats to the table's expected shape (preserve real seat id for mutations)
  const inventoryData = useMemo(() => {
    const activeBookingsBySeat = new Map();
    if (bookingsData?.bookings) {
      bookingsData.bookings.forEach((b: any) => {
        if (b.status === "CONFIRMED" || b.status === "CHECKED_IN") {
          if (b.seat?.id) {
             activeBookingsBySeat.set(b.seat.id, b);
          }
        }
      });
    }

    return seats.map((seat: any) => {
      const b = activeBookingsBySeat.get(seat.id);
      let assignedTo = "-";
      let startDate = "-";
      let endDate = "-";
      
      if (b) {
        assignedTo = b.user?.name || b.user?.email || "Assigned";
        startDate = b.startDate ? new Date(b.startDate).toLocaleDateString() : "-";
        endDate = b.endDate ? new Date(b.endDate).toLocaleDateString() : "-";
      } else if (seat.status === "OCCUPIED") {
        assignedTo = "Assigned";
      }

      return {
        id: seat.id,
        spaceName: seat.number ?? `Seat ${seat.id}`,
        location: seat.location ?? "—",
        floor: seat.floor?.name ?? "—",
        floorId: seat.floor?.id ?? null,
        type: seat.seatType ?? "—",
        capacity: 1,
        price: seat.price ? formatCurrency(seat.price) : "—",
        gst: "18%",
        status: seat.status ?? "Available",
        assignedTo,
        startDate,
        endDate,
      };
    });
  }, [seats, bookingsData]);

  const filteredData = useMemo(() => {
    let result = inventoryData;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item: any) =>
        item.spaceName?.toLowerCase().includes(q) ||
        item.type?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q)
      );
    }

    if (locationId !== "all") {
      const centerName = selectedCenter?.name?.toLowerCase();
      result = result.filter((item: any) =>
        item.location?.toLowerCase() === centerName ||
        item.location?.toLowerCase().includes(centerName ?? "___")
      );
    }

    if (floorId !== "all") {
      result = result.filter((item: any) => item.floorId === floorId);
    }

    if (product !== "all") {
      result = result.filter((item: any) => item.type === product);
    }

    if (status !== "all") {
      result = result.filter((item: any) =>
        String(item.status).toUpperCase() === status
      );
    }

    return result;
  }, [inventoryData, search, locationId, selectedCenter, floorId, product, status]);

  const clearAllFilters = () => {
    setLocationId("all");
    setFloorId("all");
    setProduct("all");
    setStatus("all");
    setSearch("");
  };

  const toggleDropdown = (index: number) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  // Add Space: collect number + type + price, then call CREATE_SEAT.
  // Uses window.prompt as a lightweight form — requires a floor context,
  // so we fall back to the first floor of the selected center.
  const handleAddSpace = async () => {
    if (!centers.length) {
      toast.error("No centers available to add a seat to.");
      return;
    }
    const center = locationId !== "all"
      ? selectedCenter
      : centers[0];
    const centerFloors = center?.floors ?? [];
    if (!centerFloors.length) {
      toast.error("Selected center has no floors. Add a floor first.");
      return;
    }

    const number = window.prompt("Enter seat number (e.g. A-101):");
    if (number == null) return;
    if (!number.trim()) {
      toast.error("Seat number is required.");
      return;
    }

    const typeInput = window.prompt(
      `Seat type (one of: ${SEAT_TYPES.join(", ")}):`,
      "HOT_DESK"
    );
    if (typeInput == null) return;
    const seatType = (SEAT_TYPES as readonly string[]).includes(typeInput.toUpperCase())
      ? typeInput.toUpperCase()
      : "HOT_DESK";

    const priceInput = window.prompt("Monthly price (INR, optional):", "5000");
    if (priceInput == null) return;
    const price = Number(priceInput);
    const pricePayload = Number.isFinite(price) && price > 0 ? price : undefined;

    // Prefer the floor selected in the filter, else the center's first floor.
    const targetFloorId =
      floorId !== "all" && centerFloors.some((f: any) => f.id === floorId)
        ? floorId
        : centerFloors[0].id;

    try {
      await createSeat({
        variables: {
          input: {
            floorId: targetFloorId,
            number: number.trim(),
            seatType,
            status: "AVAILABLE",
            ...(pricePayload != null ? { price: pricePayload } : {}),
          },
        },
      });
      toast.success("Seat added");
      // Keep the floor filter in sync if we used the center's first floor.
      if (floorId !== targetFloorId) setFloorId(targetFloorId);
    } catch (err) {
      console.error("Failed to create seat:", err);
      toast.error("Could not add seat. Please try again.");
    }
  };

  // Per-row status change via UPDATE_SEAT.
  const handleStatusChange = async (seatId: string, newStatus: string) => {
    setActiveDropdown(null);
    try {
      await updateSeat({
        variables: {
          id: seatId,
          input: { status: newStatus },
        },
      });
      toast.success("Status updated");
    } catch (err) {
      console.error("Failed to update seat status:", err);
      toast.error("Could not update status. Please try again.");
    }
  };

  const handleLocationChange = (value: string) => {
    setLocationId(value);
    setFloorId("all"); // reset floor when center changes
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
            onClick={() => {
              const headers = ["Space Name", "Floor", "Type", "Status", "Price"];
              const rows = inventoryData.map((s: any) => [s.spaceName, s.floor, s.type, s.status, s.price]);
              const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success(`Exported ${inventoryData.length} spaces`);
            }}
            className={`${styles.exportBtn} active:scale-[0.97] transition-transform duration-150`}
          >
            {Icons.export} Export CSV
          </button>
          <button
            onClick={handleAddSpace}
            className={`${styles.addSpaceBtn} active:scale-[0.97] transition-transform duration-150`}
          >
            {Icons.plus} Add Space
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <div className={styles.searchBoxIcon}>{Icons.search}</div>
          <input type="text" placeholder="Search Space Name and Company" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <select
          className={styles.filterSelect}
          value={locationId}
          onChange={(e) => handleLocationChange(e.target.value)}
        >
          <option value="all">Location</option>
          {centers.map((center: any) => (
            <option key={center.id} value={center.id}>{center.name}</option>
          ))}
        </select>

        <select className={styles.filterSelect} value="all" disabled>
          <option value="all">Sub-Location</option>
        </select>

        <select
          className={styles.filterSelect}
          value={floorId}
          onChange={(e) => setFloorId(e.target.value)}
          disabled={locationId === "all"}
        >
          <option value="all">Floor</option>
          {floorsForCenter.map((floor: any) => (
            <option key={floor.id} value={floor.id}>{floor.name}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        >
          <option value="all">Product</option>
          <option value="HOT_DESK">Hot Desk</option>
          <option value="DEDICATED">Dedicated Desk</option>
          <option value="CABIN">Cabin</option>
        </select>

        <select
          className={styles.filterSelect}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Status</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="AVAILABLE">Available</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>

        <button
          onClick={clearAllFilters}
          className={`${styles.clearBtn} active:scale-[0.97] transition-transform duration-150`}
        >
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
                <tr key={row.id} className="transition-colors duration-150 hover:bg-[#F9FAFB]" style={{ animation: 'fadeInUp 0.4s ease-out forwards', opacity: 0, animationDelay: `calc(${index} * 50ms)` }}>
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
                        <div
                          className={styles.dropdownItem}
                          onClick={() => handleStatusChange(row.id, "OCCUPIED")}
                        >Occupied</div>
                        <div
                          className={styles.dropdownItem}
                          onClick={() => handleStatusChange(row.id, "AVAILABLE")}
                        >Available</div>
                        <div
                          className={styles.dropdownItem}
                          onClick={() => handleStatusChange(row.id, "MAINTENANCE")}
                        >Maintenance</div>
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
