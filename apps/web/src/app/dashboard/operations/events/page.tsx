/**
 * File:        apps/web/src/app/dashboard/operations/events/page.tsx
 * Module:      Web · Dashboard · Meeting Room · Events
 * Purpose:     Events tab — manage booking and workspace events.
 *              Pixel-perfect match to Figma SpaceJam-VB node 0-10554.
 *              Hero card, filter bar (search + All/Today/Upcoming/Past +
 *              type/status dropdowns + Clear All), three section cards
 *              (Today's Events / Upcoming Events / Past Events) that
 *              scroll independently, and a sticky side panel that shows
 *              the selected event details (Figma node 0-11282) or an
 *              "Select an event to view details" prompt.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */

"use client";

import { useMemo, useState } from "react";
import styles from "./events.module.css";

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

const TODAY_EVENTS: EventRow[] = [
  {
    id: "ev-t1",
    title: "Product Strategy Meeting",
    company: "TechCorp Inc.",
    date: "April 25, 2026",
    time: "09:00 AM",
    duration: "2 hours",
    room: "Room A",
    seats: 8,
    addons: ["Projector", "Whiteboard"],
    notes: "Quarterly planning session",
    status: "confirmed",
  },
  {
    id: "ev-t2",
    title: "Client Onboarding Session",
    company: "StartupXYZ",
    date: "April 25, 2026",
    time: "11:30 AM",
    duration: "1 hour",
    room: "Room B",
    seats: 6,
    addons: ["TV Display"],
    notes: "Welcome walkthrough for the new cohort.",
    status: "confirmed",
  },
  {
    id: "ev-t3",
    title: "Design Workshop",
    company: "Creative Studios",
    date: "April 25, 2026",
    time: "02:00 PM",
    duration: "3 hours",
    room: "Conference Hall",
    seats: 12,
    addons: ["Whiteboard", "Markers"],
    notes: "Hands-on UI exploration — bring laptops.",
    status: "pending",
  },
  {
    id: "ev-t4",
    title: "Investment Pitch",
    company: "VentureCap Partners",
    date: "April 25, 2026",
    time: "04:30 PM",
    duration: "1.5 hours",
    room: "Room C",
    seats: 5,
    addons: ["Projector"],
    notes: "Series A deck rehearsal.",
    status: "confirmed",
  },
];

const UPCOMING_EVENTS: EventRow[] = [
  {
    id: "ev-u1",
    title: "Team Building Event",
    company: "InnovateCo",
    date: "April 28, 2026",
    time: "10:00 AM",
    duration: "4 hours",
    room: "Conference Hall",
    seats: 25,
    addons: ["Catering", "Whiteboard"],
    notes: "Off-site team building — RSVP required.",
    status: "confirmed",
  },
  {
    id: "ev-u2",
    title: "Board Meeting",
    company: "FinTech Solutions",
    date: "May 02, 2026",
    time: "02:00 PM",
    duration: "2 hours",
    room: "Room A",
    seats: 10,
    addons: ["Projector", "Conference Phone"],
    notes: "Quarterly board review.",
    status: "pending",
  },
  {
    id: "ev-u3",
    title: "Training Workshop",
    company: "EduTech Labs",
    date: "May 06, 2026",
    time: "09:30 AM",
    duration: "3 hours",
    room: "Room B",
    seats: 15,
    addons: ["Whiteboard", "Markers", "Projector"],
    notes: "Train-the-trainer session.",
    status: "confirmed",
  },
];

const PAST_EVENTS: EventRow[] = [
  {
    id: "ev-p1",
    title: "Annual General Meeting",
    company: "SpaceJam Co.",
    date: "April 10, 2026",
    time: "10:00 AM",
    duration: "2 hours",
    room: "Conference Hall",
    seats: 40,
    addons: ["Projector", "Catering"],
    notes: "Annual general meeting for stakeholders.",
    status: "completed",
  },
];

type FilterKey = "all" | "today" | "upcoming" | "past";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "today",    label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past",     label: "Past" },
];

const ALL_EVENTS: EventRow[] = [
  ...TODAY_EVENTS,
  ...UPCOMING_EVENTS,
  ...PAST_EVENTS,
];

const ClockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="8.5" stroke="#FFFFFF" strokeWidth="1.7" />
    <path
      d="M11 6.5V11L14 12.5"
      stroke="#FFFFFF"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarGlyph = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect x="6" y="9" width="28" height="24" rx="3" stroke="#9CA3AF" strokeWidth="1.6" />
    <path d="M6 16H34" stroke="#9CA3AF" strokeWidth="1.6" />
    <path d="M13 5V11M27 5V11" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="13" y="20" width="5" height="4" rx="1" fill="#FFEBE0" />
    <rect x="22" y="20" width="5" height="4" rx="1" fill="#FFEBE0" />
    <rect x="13" y="26" width="5" height="4" rx="1" fill="#FFEBE0" />
  </svg>
);

const SearchIcon = ({ stroke = "#9CA3AF" }: { stroke?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="4.5" stroke={stroke} strokeWidth="1.3" />
    <path d="M9.5 9.5L12 12" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const CheckIcon = ({ color = "#FFFFFF" }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M2 6.5L4.7 9L10 3.5"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ----------------- Detail-panel glyphs (Figma node 0-11282) -----------------

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
    <path
      d="M9 5V9L11.5 10.5"
      stroke="#9CA3AF"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M9 1.5C6.2 1.5 4 3.7 4 6.5C4 10.5 9 16.5 9 16.5C9 16.5 14 10.5 14 6.5C14 3.7 11.8 1.5 9 1.5Z"
      stroke="#9CA3AF"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="6.5" r="2" stroke="#9CA3AF" strokeWidth="1.4" />
  </svg>
);

const PeopleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="2.5" stroke="#9CA3AF" strokeWidth="1.4" />
    <path
      d="M1.5 15.5C1.8 12.7 3.7 11 6 11C8.3 11 10.2 12.7 10.5 15.5"
      stroke="#9CA3AF"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <circle cx="12" cy="7" r="2" stroke="#9CA3AF" strokeWidth="1.4" />
    <path
      d="M11 11C13.3 11 15.2 12.4 15.7 14.7"
      stroke="#9CA3AF"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const CubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M9 1.5L15.5 5V13L9 16.5L2.5 13V5L9 1.5Z"
      stroke="#9CA3AF"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M9 1.5V9M9 9L2.5 5M9 9L15.5 5M9 9V16.5" stroke="#9CA3AF" strokeWidth="1.4" />
  </svg>
);

const NoteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="3.5" y="2.5" width="11" height="13" rx="1.5" stroke="#9CA3AF" strokeWidth="1.4" />
    <path d="M6 6H12M6 9H12M6 12H9.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// ----------------- Status pill -----------------

function StatusPill({ status }: { status: EventStatus }) {
  if (status === "confirmed") {
    return <span className={`${styles.statusPill} ${styles.statusConfirmed}`}>Confirmed</span>;
  }
  if (status === "completed") {
    return <span className={`${styles.statusPill} ${styles.statusCompleted}`}>Completed</span>;
  }
  return <span className={`${styles.statusPill} ${styles.statusPending}`}>Pending</span>;
}

// ----------------- Event row (left column) -----------------

function EventRowItem({
  event,
  selected,
  onSelect,
}: {
  event: EventRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`${styles.eventRow} ${selected ? styles.eventRowSelected : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className={styles.eventIcon} aria-hidden="true">
        <ClockIcon />
      </div>

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
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={(e) => e.stopPropagation()}
            >
              <CheckIcon />
              Confirm Booking
            </button>
          )}
          <button
            type="button"
            className={styles.btnOutline}
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={(e) => e.stopPropagation()}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------- Section card -----------------

function SectionCard({
  title,
  count,
  events,
  selectedId,
  onSelect,
  emptyLabel,
}: {
  title: string;
  count: number;
  events: EventRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyLabel: string;
}) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionDot} aria-hidden="true" />
        <h3 className={styles.sectionTitle}>
          {title} <span className={styles.sectionCount}>({count})</span>
        </h3>
      </div>
      {events.length === 0 ? (
        <div className={styles.emptySection}>{emptyLabel}</div>
      ) : (
        <div className={styles.eventList}>
          {events.map((ev) => (
            <EventRowItem
              key={ev.id}
              event={ev}
              selected={selectedId === ev.id}
              onSelect={() => onSelect(ev.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ----------------- Detail panel (Figma node 0-11282) -----------------

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.detailText}>
        <div className={styles.detailLabel}>{label}</div>
        <div className={styles.detailValue}>{value}</div>
      </div>
    </div>
  );
}

function EventDetailPanel({ event }: { event: EventRow }) {
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
        <DetailRow
          icon={<CalendarIcon />}
          label="Date & Time"
          value={`${event.date} at ${event.time}`}
        />
        <DetailRow icon={<ClockSmallIcon />} label="Duration" value={event.duration} />
        <DetailRow icon={<PinIcon />} label="Room" value={event.room} />
        <DetailRow icon={<PeopleIcon />} label="Seats" value={`${event.seats} people`} />
        <DetailRow
          icon={<CubeIcon />}
          label="Add-ons"
          value={event.addons.length > 0 ? event.addons.join(", ") : "None"}
        />
        <DetailRow icon={<NoteIcon />} label="Notes" value={event.notes} />
      </div>

      <div className={styles.detailDivider} />

      <div className={styles.detailActions}>
        <button type="button" className={styles.btnEdit}>
          Edit Event
        </button>
        <button type="button" className={styles.btnComplete}>
          <CheckIcon color="#10B981" />
          Mark as Completed
        </button>
        <button type="button" className={styles.btnCancelEvent}>
          Cancel Event
        </button>
      </div>
    </aside>
  );
}

// ----------------- Empty side panel (default state) -----------------

function EmptySidePanel() {
  return (
    <aside className={styles.sidePanel} aria-label="Event details panel">
      <div className={styles.sidePanelIcon}>
        <CalendarGlyph />
      </div>
      <p className={styles.sidePanelText}>Select an event to view details</p>
    </aside>
  );
}

// ----------------- Page -----------------

export default function EventsPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Search match across title / company / room
  const matchesSearch = (ev: EventRow) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      ev.title.toLowerCase().includes(q) ||
      ev.company.toLowerCase().includes(q) ||
      ev.room.toLowerCase().includes(q)
    );
  };

  const todayEvents = TODAY_EVENTS.filter(matchesSearch);
  const upcomingEvents = UPCOMING_EVENTS.filter(matchesSearch);
  const pastEvents = PAST_EVENTS.filter(matchesSearch);

  // Decide which sections to show based on filter tab
  const showToday = filter === "all" || filter === "today";
  const showUpcoming = filter === "all" || filter === "upcoming";
  const showPast = filter === "all" || filter === "past";

  const selectedEvent = useMemo(
    () => ALL_EVENTS.find((ev) => ev.id === selectedId) ?? null,
    [selectedId]
  );

  return (
    <div className={styles.page}>
      {/* Hero card */}
      <section className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>Events</h1>
          <p className={styles.heroSubtitle}>Manage Booking and Workspace events</p>
        </div>
        <button type="button" className={styles.heroAction}>
          <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>+</span>
          <span>Add Event</span>
        </button>
      </section>

      {/* Filter bar */}
      <section className={styles.filterBar}>
        <div className={styles.searchInput}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search Events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search events"
          />
        </div>

        <div className={styles.filterTabs} role="tablist" aria-label="Filter by time">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={filter === tab.key}
              className={`${styles.filterTab} ${filter === tab.key ? styles.filterTabActive : ""}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button type="button" className={styles.dropdown} aria-label="Filter by type">
          <span>All types</span>
          <span className={styles.dropdownCaret} aria-hidden="true" />
        </button>
        <button type="button" className={styles.dropdown} aria-label="Filter by status">
          <span>All Status</span>
          <span className={styles.dropdownCaret} aria-hidden="true" />
        </button>

        <button type="button" className={styles.clearAll}>
          Clear All
        </button>
      </section>

      {/* Body grid */}
      <div className={styles.bodyGrid}>
        <div className={styles.eventsColumn}>
          {showToday && (
            <SectionCard
              title="Today's Events"
              count={todayEvents.length}
              events={todayEvents}
              selectedId={selectedId}
              onSelect={setSelectedId}
              emptyLabel="No events scheduled for today."
            />
          )}
          {showUpcoming && (
            <SectionCard
              title="Upcoming Events"
              count={upcomingEvents.length}
              events={upcomingEvents}
              selectedId={selectedId}
              onSelect={setSelectedId}
              emptyLabel="No upcoming events."
            />
          )}
          {showPast && (
            <SectionCard
              title="Past Events"
              count={pastEvents.length}
              events={pastEvents}
              selectedId={selectedId}
              onSelect={setSelectedId}
              emptyLabel="No past events."
            />
          )}
        </div>

        {selectedEvent ? (
          <EventDetailPanel event={selectedEvent} />
        ) : (
          <EmptySidePanel />
        )}
      </div>
    </div>
  );
}
