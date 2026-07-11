"use client";

/**
 * File:        apps/web/src/app/dashboard/operations/events/page.tsx
 * Module:      Web · Dashboard · Operations · Events
 * Purpose:     Events page — Apollo-wired with mock fallback.
 *              Three-section view (Today / Upcoming / Past) + side detail panel.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */



import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useEvents, useEvent, useUpdateEventStatus, useCancelEvent, type EventStatusType } from "@/hooks/use-operations";
import { AddEventModal } from "../modals/add-event-modal";
import styles from "./events.module.css";

/* --------------- Local types & helpers (mirrors backend shapes) --------------- */

type EventStatus = "confirmed" | "pending" | "completed";

interface EventRow {
  id: string;
  title: string;
  company: string;
  date: string;
  time: string;
  duration: string;
  room: string;
  seats: number;
  addons: string[];
  notes: string;
  status: EventStatus;
}

// Convert Apollo event data → UI row format
const toEventRow = (e: any): EventRow => ({
  id: e.id,
  title: e.title,
  company: e.company ?? (e.requestedBy?.name ?? "Unknown"),
  date: e.eventDate,
  time: e.startTime,
  duration: `${e.durationMinutes} min`,
  room: e.meetingRoom?.name ?? "—",
  seats: e.attendeesCount ?? 0,
  addons: e.addons ?? [],
  notes: e.notes ?? "",
  status: e.status?.toLowerCase() as EventStatus,
});

// Group events by date ranges
const classifyByDate = (events: EventRow[], date: string) => {
  const today = new Date(date).setHours(0, 0, 0, 0);
  const tomorrow = new Date(today).getTime();
  return {
    today: events.filter((ev) => {
      const evDate = new Date(ev.date).getTime();
      return evDate >= today && evDate < tomorrow;
    }),
    upcoming: events.filter((ev) => {
      const evDate = new Date(ev.date).getTime();
      return evDate >= tomorrow;
    }),
    past: events.filter((ev) => {
      const evDate = new Date(ev.date).getTime();
      return evDate < today;
    }),
  };
};

type FilterKey = "all" | "today" | "upcoming" | "past";

const todayStr = new Date().toISOString().split('T')[0];

/* --------------- Icons --------------- */

const ClockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="8.5" stroke="#FFFFFF" strokeWidth="1.7" />
    <path d="M11 6.5V11L14 12.5" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.3" />
    <path d="M9.5 9.5L12 12" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const CheckIcon = ({ color = "#FFFFFF" }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 6.5L4.7 9L10 3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="2.5" y="4" width="13" height="11.5" rx="2" stroke="#9CA3AF" strokeWidth="1.4" />
    <path d="M2.5 7.5H15.5" stroke="#9CA3AF" strokeWidth="1.4" />
    <path d="M6 2V5.5M12 2V5.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
    <rect x="5" y="9.5" width="2" height="2" rx="0.5" fill="#9CA3AF" />
    <rect x="8" y="9.5" width="2" height="2" rx="0.5" fill="#9CA3AF" />
    <rect x="11" y="9.5" width="2" height="2" rx="0.5" fill="#9CA3AF" />
  </svg>
);

const ClockSmallIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="6.5" stroke="#9CA3AF" strokeWidth="1.4" />
    <path d="M9 5V9L11.5 10.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M9 1.5C6.2 1.5 4 3.7 4 6.5C4 10.5 9 16.5 9 16.5C9 16.5 14 10.5 14 6.5C14 3.7 11.8 1.5 9 1.5Z" stroke="#9CA3AF" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="9" cy="6.5" r="2" stroke="#9CA3AF" strokeWidth="1.4" />
  </svg>
);

const PeopleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="2.5" stroke="#9CA3AF" strokeWidth="1.4" />
    <path d="M1.5 15.5C1.8 12.7 3.7 11 6 11C8.3 11 10.2 12.7 10.5 15.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="12" cy="7" r="2" stroke="#9CA3AF" strokeWidth="1.4" />
    <path d="M11 11C13.3 11 15.2 12.4 15.7 14.7" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const NoteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="3.5" y="2.5" width="11" height="13" rx="1.5" stroke="#9CA3AF" strokeWidth="1.4" />
    <path d="M6 6H12M6 9H12M6 12H9.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/* --------------- Sub-components --------------- */

function StatusPill({ status }: { status: EventStatus }) {
  if (status === "confirmed") return <span className={`${styles.statusPill} ${styles.statusConfirmed}`}>Confirmed</span>;
  if (status === "completed") return <span className={`${styles.statusPill} ${styles.statusCompleted}`}>Completed</span>;
  return <span className={`${styles.statusPill} ${styles.statusPending}`}>Pending</span>;
}

function EventRowItem({ event, selected, onSelect, onConfirm, onEdit, onCancel, style }: { event: EventRow; selected: boolean; onSelect: () => void; onConfirm?: (id: string) => void; onEdit?: (id: string) => void; onCancel?: (id: string) => void; style?: React.CSSProperties }) {
  return (
    <div className={`${styles.eventRow} ${styles.eventItem} ${selected ? styles.eventRowSelected : ""}`} style={style} onClick={onSelect} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
    >
      <div className={styles.eventIcon}><ClockIcon /></div>
      <div className={styles.eventBody}>
        <div className={styles.eventTitle}>{event.title}</div>
        <div className={styles.eventCompany}>{event.company}</div>
        <div className={styles.eventMeta}>
          <span className={styles.eventMetaTime}>{event.time}</span>
          <span className={styles.eventMetaSep}>•</span>
          <span>{event.duration}</span>
          <span className={styles.eventMetaSep}>•</span>
          <span>{event.room}</span>
        </div>
      </div>
      <div className={styles.eventRight}>
        <StatusPill status={event.status} />
        <div className={styles.eventActions}>
          {event.status === "pending" && (
            <button type="button" className={styles.btnPrimary} onClick={(e) => { e.stopPropagation(); onConfirm?.(event.id); }}>
              <CheckIcon /> Confirm Booking
            </button>
          )}
          <button type="button" className={styles.btnOutline} onClick={(e) => { e.stopPropagation(); onEdit?.(event.id); }}>Edit</button>
          <button type="button" className={styles.btnDanger} onClick={(e) => { e.stopPropagation(); onCancel?.(event.id); }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, count, events, selectedId, onSelect, onConfirm, onEdit, onCancel, emptyLabel }: { title: string; count: number; events: EventRow[]; selectedId: string | null; onSelect: (id: string) => void; onConfirm?: (id: string) => void; onEdit?: (id: string) => void; onCancel?: (id: string) => void; emptyLabel: string }) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionDot} aria-hidden="true" />
        <h3 className={styles.sectionTitle}>{title} <span className={styles.sectionCount}>({count})</span></h3>
      </div>
      {events.length === 0 ? (
        <div className={styles.emptySection}>{emptyLabel}</div>
      ) : (
        <div className={styles.eventList}>
          {events.map((ev, idx) => (
            <EventRowItem key={ev.id} event={ev} selected={selectedId === ev.id} onSelect={() => onSelect(ev.id)} onConfirm={onConfirm} onEdit={onEdit} onCancel={onCancel} style={{ '--i': idx } as React.CSSProperties} />
          ))}
        </div>
      )}
    </section>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailIcon} aria-hidden="true">{icon}</span>
      <div className={styles.detailText}>
        <div className={styles.detailLabel}>{label}</div>
        <div className={styles.detailValue}>{value}</div>
      </div>
    </div>
  );
}

function EventDetailPanel({ event, onUpdateStatus, onCancel, onComplete, onEdit }: { event: EventRow; onUpdateStatus?: (id: string, status: string) => void; onCancel?: (id: string) => void; onComplete?: (id: string) => void; onEdit?: (id: string) => void }) {
  return (
    <aside className={styles.detailPanel} aria-label="Event details panel">
      <div className={styles.detailHead}>
        <div className={styles.detailHeadText}>
          <h2 className={styles.detailTitle}>{event.title}</h2>
          <p className={styles.detailCompany}>{event.company}</p>
        </div>
        <StatusPill status={event.status} />
      </div>
      <div className={styles.detailBody}>
        <DetailRow icon={<CalendarIcon />} label="Date & Time" value={`${event.date} at ${event.time}`} />
        <DetailRow icon={<ClockSmallIcon />} label="Duration" value={event.duration} />
        <DetailRow icon={<PinIcon />} label="Room" value={event.room} />
        <DetailRow icon={<PeopleIcon />} label="Seats" value={`${event.seats} people`} />
        <DetailRow icon={<NoteIcon />} label="Notes" value={event.notes || "None"} />
      </div>
      <div className={styles.detailDivider} />
      <div className={styles.detailActions}>
        <button type="button" className={styles.btnEdit} onClick={() => onEdit?.(event.id)}>Edit Event</button>
        {event.status !== "completed" && (
          <button type="button" className={styles.btnComplete} onClick={() => onComplete?.(event.id)}>
            <CheckIcon color="#10B981" /> Mark as Completed
          </button>
        )}
        {(event.status as string).toLowerCase() !== "cancelled" && (event.status as string).toLowerCase() !== "completed" && (
          <button type="button" className={styles.btnCancelEvent} onClick={() => onCancel?.(event.id)}>Cancel Event</button>
        )}
      </div>
    </aside>
  );
}

function EmptySidePanel() {
  return (
    <aside className={styles.sidePanel} aria-label="Event details panel">
      <div className={styles.sidePanelIcon}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect x="6" y="9" width="28" height="24" rx="3" stroke="#9CA3AF" strokeWidth="1.6" />
          <path d="M6 16H34" stroke="#9CA3AF" strokeWidth="1.6" />
          <path d="M13 5V11M27 5V11" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="13" y="20" width="5" height="4" rx="1" fill="#FFEBE0" />
          <rect x="22" y="20" width="5" height="4" rx="1" fill="#FFEBE0" />
          <rect x="13" y="26" width="5" height="4" rx="1" fill="#FFEBE0" />
        </svg>
      </div>
      <p className={styles.sidePanelText}>Select an event to view details</p>
    </aside>
  );
}

/* --------------- Page --------------- */

export default function EventsPage() {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { events, loading, error } = useEvents();
  const { event: _selectedEventDetail } = useEvent(selectedId ?? "");
  const { updateStatus } = useUpdateEventStatus();
  const { cancel } = useCancelEvent();

  // Build event list from backend data only (no mock fallback).
  const allEvents: EventRow[] = useMemo(() => events.map(toEventRow), [events]);

  const matchesSearch = (ev: EventRow) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return ev.title.toLowerCase().includes(q) || ev.company.toLowerCase().includes(q) || ev.room.toLowerCase().includes(q);
  };

  const filtered = allEvents.filter(matchesSearch);
  const { today: todayEvts, upcoming: upcomingEvts, past: pastEvts } = classifyByDate(filtered, todayStr);
  const showToday = filter === "all" || filter === "today";
  const showUpcoming = filter === "all" || filter === "upcoming";
  const showPast = filter === "all" || filter === "past";

  const selectedEvent = useMemo(() => {
    if (selectedId) return allEvents.find((ev) => ev.id === selectedId) ?? null;
    return null;
  }, [selectedId, allEvents]);

  const handleConfirm = async (id: string) => {
    try {
      const result = await updateStatus(id, "CONFIRMED" as EventStatusType);
      if (result?.success) {
        toast.success("Event confirmed");
      } else {
        toast.error(result?.error ?? "Could not confirm event");
      }
    } catch (err) {
      toast.error(`Failed to confirm: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const result = await updateStatus(id, "COMPLETED" as EventStatusType);
      if (result?.success) {
        toast.success("Event marked as completed");
      } else {
        toast.error(result?.error ?? "Could not complete event");
      }
    } catch (err) {
      toast.error(`Failed to complete: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleCancel = async (id: string) => {
    const ok = await cancel(id);
    if (ok) toast.success("Event cancelled");
    else toast.error("Could not cancel event");
  };

  const handleEditEvent = (_id: string) => {
    toast.info("Edit event coming soon");
  };

  const hasEvents = allEvents.length > 0;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>Events</h1>
          <p className={styles.heroSubtitle}>Manage Booking and Workspace events</p>
        </div>
        <button type="button" className={styles.heroAction} onClick={() => setShowAddEvent(true)}>
          <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>+</span>
          <span>Add Event</span>
        </button>
      </section>

      {/* Filter bar */}
      <section className={styles.filterBar}>
        <div className={styles.searchInput}>
          <SearchIcon />
          <input type="text" placeholder="Search Events..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search events" />
        </div>
        <div className={styles.filterTabs} role="tablist" aria-label="Filter by time">
          {(["all", "today", "upcoming", "past"] as FilterKey[]).map((tab) => (
            <button key={tab} type="button" role="tab" aria-selected={filter === tab}
              className={`${styles.filterTab} ${filter === tab ? styles.filterTabActive : ""} transition-all duration-200`}
              onClick={() => setFilter(tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
          ))}
        </div>
        <button type="button" className={styles.dropdown} onClick={() => toast.info("Type filter coming soon")}><span>All types</span><span className={styles.dropdownCaret} /></button>
        <button type="button" className={styles.dropdown} onClick={() => toast.info("Status filter coming soon")}><span>All Status</span><span className={styles.dropdownCaret} /></button>
        <button type="button" className={styles.clearAll} onClick={() => { setSearch(""); setFilter("all"); }}>Clear All</button>
      </section>

      {/* Body */}
      <div className={styles.bodyGrid}>
        <div className={styles.eventsColumn}>
          {loading && !hasEvents && <div className="text-center py-8 text-[#6A7282]">Loading events...</div>}
          {error && !hasEvents && <div className="text-center py-4 text-red-500 bg-red-50 rounded-xl">Error loading events. Check connection.</div>}
          {!loading && !error && !hasEvents && (
            <div className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-2xl text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                <CalendarIcon />
              </div>
              <p className="text-[15px] font-semibold text-gray-700">No events yet</p>
              <p className="text-[13px] text-gray-500 max-w-[320px]">
                There are no events scheduled. Click “Add Event” to create your first one.
              </p>
            </div>
          )}
          {hasEvents && showToday && (
            <SectionCard title="Today's Events" count={todayEvts.length} events={todayEvts} selectedId={selectedId} onSelect={setSelectedId} onConfirm={handleConfirm} onEdit={handleEditEvent} onCancel={handleCancel} emptyLabel="No events scheduled for today." />
          )}
          {hasEvents && showUpcoming && (
            <SectionCard title="Upcoming Events" count={upcomingEvts.length} events={upcomingEvts} selectedId={selectedId} onSelect={setSelectedId} onConfirm={handleConfirm} onEdit={handleEditEvent} onCancel={handleCancel} emptyLabel="No upcoming events." />
          )}
          {hasEvents && showPast && (
            <SectionCard title="Past Events" count={pastEvts.length} events={pastEvts} selectedId={selectedId} onSelect={setSelectedId} onConfirm={handleConfirm} onEdit={handleEditEvent} onCancel={handleCancel} emptyLabel="No past events." />
          )}
        </div>

        {selectedEvent ? (
          <EventDetailPanel
            event={selectedEvent}
            onUpdateStatus={(id, status) => updateStatus(id, status as any)}
            onCancel={handleCancel}
            onComplete={handleComplete}
            onEdit={handleEditEvent}
          />
        ) : (
          <EmptySidePanel />
        )}
      </div>

      {/* Add Event Modal */}
      <AddEventModal open={showAddEvent} onClose={() => setShowAddEvent(false)} />
    </div>
  );
}
