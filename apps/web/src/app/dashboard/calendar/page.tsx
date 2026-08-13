"use client";

import { useState, useMemo } from "react";
import { useQuery, useApolloClient, gql } from "@apollo/client";
import { GET_MY_CENTERS } from "@/lib/apollo/operations";
import {
  useCalendarFeed,
  useCreateEvent,
  useCreateVisit,
  useBookRoom,
  useMeetingRooms,
} from "@/hooks/use-operations";
import { useAuth } from "@/contexts/auth-context";
import styles from "./calendar.module.css";
import {
  type CalendarItem,
  type CalendarView,
  type ModalKind,
  colorClass,
  timeItemClass,
  formatTime,
  parseMeta,
} from "./types";

const Icons = {
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  edit: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  trash: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM – 9 PM

const TYPE_FILTERS: { kind: CalendarItem["kind"]; label: string; color: string }[] = [
  { kind: "EVENT", label: "Events", color: "#8B5CF6" },
  { kind: "BOOKING", label: "Bookings", color: "#6B7280" },
  { kind: "VISIT", label: "Visits", color: "#3B82F6" },
  { kind: "BIRTHDAY", label: "Birthdays", color: "#EC4899" },
];

const KIND_INITIAL: Record<CalendarItem["kind"], string> = {
  EVENT: "E", BOOKING: "B", VISIT: "V", BIRTHDAY: "🎂",
};

// ─── date helpers ───────────────────────────────────────────────────────────
function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function startOfWeek(d: Date): Date {
  const r = new Date(d); r.setHours(0, 0, 0, 0); r.setDate(r.getDate() - r.getDay()); return r;
}
function endOfWeek(d: Date): Date {
  const r = startOfWeek(d); r.setDate(r.getDate() + 6); r.setHours(23, 59, 59, 999); return r;
}
function startOfDay(d: Date): Date { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; }
function endOfDay(d: Date): Date { const r = new Date(d); r.setHours(23, 59, 59, 999); return r; }
function addMonths(d: Date, n: number): Date { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [view, setView] = useState<CalendarView>("Month");
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [modalDefaults, setModalDefaults] = useState<{ date?: string; startTime?: string }>({});
  const [enabledTypes, setEnabledTypes] = useState<Set<CalendarItem["kind"]>>(
    new Set(["EVENT", "BOOKING", "VISIT", "BIRTHDAY"]),
  );
  const [centerId, setCenterId] = useState<string | undefined>(undefined);

  const { data: centersData } = useQuery(GET_MY_CENTERS, { fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const centers = centersData?.myCenters ?? [];
  const primaryCenter = centers[0];
  const effectiveCenterId = centerId ?? primaryCenter?.id;

  // Compute the feed range from the current view + cursor.
  const { startDate, endDate } = useMemo(() => {
    if (view === "Month") {
      // Pad to the full grid (start of week containing day 1, end of week containing last day).
      const gridStart = startOfWeek(startOfMonth(cursor));
      const gridEnd = endOfWeek(endOfMonth(cursor));
      return { startDate: toISODate(gridStart), endDate: toISODate(gridEnd) };
    }
    if (view === "Week") {
      return { startDate: toISODate(startOfWeek(cursor)), endDate: toISODate(endOfWeek(cursor)) };
    }
    return { startDate: toISODate(startOfDay(cursor)), endDate: toISODate(endOfDay(cursor)) };
  }, [view, cursor]);

  const { items, loading, error, refetch } = useCalendarFeed({
    startDate,
    endDate,
    centerId: effectiveCenterId,
    types: Array.from(enabledTypes),
  });

  const today = new Date();
  const label =
    view === "Month"
      ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
      : view === "Week"
      ? `${MONTHS[startOfWeek(cursor).getMonth()]} ${startOfWeek(cursor).getDate()} – ${endOfWeek(cursor).getDate()}, ${cursor.getFullYear()}`
      : `${WEEKDAYS[cursor.getDay()]}, ${MONTHS[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;

  function goPrev() {
    setCursor((c) => (view === "Month" ? addMonths(c, -1) : addDays(c, view === "Week" ? -7 : -1)));
  }
  function goNext() {
    setCursor((c) => (view === "Month" ? addMonths(c, 1) : addDays(c, view === "Week" ? 7 : 1)));
  }
  function goToday() {
    setCursor(startOfMonth(today));
    if (view !== "Month") setCursor(today);
  }

  function openModal(kind: ModalKind, date?: string, startTime?: string) {
    setModalDefaults({ date: date ?? toISODate(cursor), startTime });
    setActiveModal(kind);
  }

  function toggleType(kind: CalendarItem["kind"]) {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind); else next.add(kind);
      return next;
    });
  }

  // Group items by date for quick lookup.
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of items) {
      if (!map.has(it.date)) map.set(it.date, []);
      map.get(it.date)!.push(it);
    }
    return map;
  }, [items]);

  const todayItems = byDate.get(toISODate(today)) ?? [];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainColumn}>
        {/* Header */}
        <div className={styles.headerBlock}>
          <div>
            <h1 className={styles.headerTitle}>Calendar</h1>
            <p className={styles.headerSubtitle}>Events, bookings, visits & birthdays at a glance</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className={styles.btnSecondary} onClick={() => openModal("visit")}>Schedule Visit</button>
            <button className={styles.btnPrimary} onClick={() => openModal("event")}>{Icons.plus} Create Event</button>
          </div>
        </div>

        {/* Controls: navigation + view toggle + filters + center */}
        <div className={styles.controlsBlock}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div className={styles.dateNav}>
              <button className={styles.navBtn} onClick={goPrev}>{Icons.chevronLeft}</button>
              <button className={styles.navBtn} onClick={goNext}>{Icons.chevronRight}</button>
            </div>
            <div className={styles.monthLabel}>{label}</div>
            <button className={styles.todayBtn} onClick={goToday}>Today</button>
            <div className={styles.viewToggles}>
              {(["Month", "Week", "Day"] as CalendarView[]).map((v) => (
                <div
                  key={v}
                  className={`${styles.toggleBtn} ${view === v ? styles.active : ""}`}
                  onClick={() => setView(v)}
                >
                  {v}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
            <div className={styles.filterChips}>
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.kind}
                  className={`${styles.chip} ${enabledTypes.has(t.kind) ? styles.active : ""}`}
                  onClick={() => toggleType(t.kind)}
                >
                  <span className={styles.chipDot} style={{ background: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
            {centers.length > 1 && (
              <select
                className={styles.centerSelect}
                value={effectiveCenterId ?? ""}
                onChange={(e) => setCenterId(e.target.value || undefined)}
              >
                {centers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {error && <div className={styles.errorBanner}>Couldn’t load calendar data. <button onClick={() => refetch()} style={{ background: "none", border: "none", color: "#991B1B", textDecoration: "underline", cursor: "pointer" }}>Retry</button></div>}

        {/* View body */}
        {loading && items.length === 0 ? (
          <div className={styles.loadingState}>Loading calendar…</div>
        ) : view === "Month" ? (
          <MonthGrid
            cursor={cursor}
            byDate={byDate}
            today={today}
            onDayClick={(d) => setSelectedDay(d)}
          />
        ) : (
          <TimeGridView
            view={view}
            cursor={cursor}
            byDate={byDate}
            today={today}
            onSlotClick={(date, hour) => openModal("event", date, `${String(hour).padStart(2, "0")}:00`)}
          />
        )}
      </div>

      {/* Side rail */}
      <div className={styles.sideColumn}>
        <TodayScheduleRail items={todayItems} />
        <BirthdaysRail items={items.filter((i) => i.kind === "BIRTHDAY")} onWish={(name) => openModal("birthday")} />
        <Legend />
      </div>

      {/* Day popup */}
      {selectedDay && (
        <DayPopup
          date={selectedDay}
          items={byDate.get(toISODate(selectedDay)) ?? []}
          onClose={() => setSelectedDay(null)}
          onAdd={(kind) => { const d = toISODate(selectedDay); setSelectedDay(null); openModal(kind, d); }}
          onEditEvent={async (id) => { setSelectedDay(null); /* cancel quick-action for v1 */ }}
        />
      )}

      {/* Modals */}
      {activeModal === "event" && (
        <CreateEventModal
          defaults={modalDefaults}
          centerId={effectiveCenterId}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "visit" && (
        <ScheduleVisitModal
          defaults={modalDefaults}
          centerId={effectiveCenterId}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "room" && (
        <BookRoomModal
          defaults={modalDefaults}
          centerId={effectiveCenterId}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "block" && (
        <BlockTimeModal
          defaults={modalDefaults}
          centerId={effectiveCenterId}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "birthday" && <BirthdayModal onClose={() => setActiveModal(null)} />}
    </div>
  );
}

// ─── Month grid ─────────────────────────────────────────────────────────────
function MonthGrid({
  cursor, byDate, today, onDayClick,
}: {
  cursor: Date; byDate: Map<string, CalendarItem[]>; today: Date;
  onDayClick: (d: Date) => void;
}) {
  const first = startOfMonth(cursor);
  const last = endOfMonth(cursor);
  const gridStart = startOfWeek(first);
  const days: Date[] = [];
  const d = new Date(gridStart);
  while (d <= last || days.length % 7 !== 0) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
    if (days.length > 42) break;
  }
  return (
    <div className={styles.calendarContainer}>
      <div className={styles.weekdaysRow}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.weekday}>{w}</div>
        ))}
      </div>
      <div className={styles.daysGrid}>
        {days.map((day, i) => {
          const iso = toISODate(day);
          const dayItems = byDate.get(iso) ?? [];
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className={`${styles.dayCell} ${!inMonth ? styles.empty : ""} ${isToday ? styles.active : ""}`}
              onClick={() => onDayClick(day)}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.dayNumber} style={isToday ? { background: "#FF7847", color: "#fff", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center" } : {}}>
                {day.getDate()}
              </div>
              {dayItems.slice(0, 3).map((it) => (
                <div key={it.id} className={`${styles.eventPill} ${styles[colorClass(it.kind, it.color)]}`}>
                  {it.kind === "BIRTHDAY" ? "🎂 " : ""}{it.title}
                </div>
              ))}
              {dayItems.length > 3 && <div className={styles.moreText}>+{dayItems.length - 3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week / Day time-grid view ──────────────────────────────────────────────
function TimeGridView({
  view, cursor, byDate, today, onSlotClick,
}: {
  view: "Week" | "Day"; cursor: Date; byDate: Map<string, CalendarItem[]>;
  today: Date; onSlotClick: (date: string, hour: number) => void;
}) {
  const days = view === "Week"
    ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i))
    : [cursor];

  return (
    <div className={styles.timeGrid}>
      <div className={styles.timeGridHeader} style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
        <div className={styles.timeGridHeaderCell}></div>
        {days.map((d) => (
          <div key={toISODate(d)} className={`${styles.timeGridHeaderCell} ${isSameDay(d, today) ? styles.today : ""}`}>
            {WEEKDAYS[d.getDay()]} {d.getDate()}
          </div>
        ))}
      </div>
      <div className={styles.timeGridBody}>
        {HOURS.map((hour) => (
          <div key={hour} className={styles.timeSlotRow} style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
            <div className={styles.timeLabel}>{formatTime(`${String(hour).padStart(2, "0")}:00`)}</div>
            {days.map((d) => {
              const iso = toISODate(d);
              const cellItems = (byDate.get(iso) ?? []).filter((it) => {
                if (!it.startTime) return false;
                const h = parseInt(it.startTime.split(":")[0], 10);
                return h === hour;
              });
              return (
                <div
                  key={iso}
                  className={styles.slotCell}
                  onClick={() => onSlotClick(iso, hour)}
                >
                  {cellItems.map((it) => (
                    <div key={it.id} className={`${styles.timeItem} ${styles[timeItemClass(it.kind, it.color)]}`}>
                      <strong>{formatTime(it.startTime)}</strong> {it.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Day popup ──────────────────────────────────────────────────────────────
function DayPopup({
  date, items, onClose, onAdd, onEditEvent,
}: {
  date: Date; items: CalendarItem[]; onClose: () => void;
  onAdd: (kind: ModalKind) => void; onEditEvent: (id: string) => void;
}) {
  const iso = toISODate(date);
  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={styles.popupCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.popupHeader}>
          <div className={styles.popupDate}>
            {WEEKDAYS[date.getDay()]}, {MONTHS[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
          </div>
          <button className={styles.popupClose} onClick={onClose}>{Icons.close}</button>
        </div>
        <div className={styles.popupBody}>
          {items.length === 0 ? (
            <div className={styles.popupEmpty}>Nothing scheduled. Use the buttons below to add.</div>
          ) : (
            items.map((it) => {
              const meta = parseMeta(it);
              const colorBg =
                it.color === "orange" ? "#FF7847" :
                it.color === "blue" ? "#3B82F6" :
                it.color === "pink" ? "#EC4899" :
                it.color === "grey" ? "#6B7280" : "#8B5CF6";
              return (
                <div key={it.id} className={styles.popupRow}>
                  <div className={styles.popupRowIcon} style={{ background: colorBg }}>
                    {KIND_INITIAL[it.kind]}
                  </div>
                  <div className={styles.popupRowInfo}>
                    <p className={styles.popupRowTitle}>{it.title}</p>
                    <p className={styles.popupRowMeta}>
                      {it.startTime ? `${formatTime(it.startTime)}${it.endTime ? ` – ${formatTime(it.endTime)}` : ""}` : "All day"}
                      {it.status ? ` · ${it.status}` : ""}
                      {meta.company ? ` · ${meta.company}` : ""}
                      {meta.partySize ? ` · ${meta.partySize} guest(s)` : ""}
                    </p>
                  </div>
                  <div className={styles.popupRowActions}>
                    {(it.kind === "EVENT" || it.kind === "VISIT") && (
                      <button className={styles.popupActionBtn} onClick={() => onEditEvent(it.referenceId ?? "")}>
                        {Icons.edit}
                      </button>
                    )}
                    {(it.kind === "EVENT" || it.kind === "VISIT") && (
                      <button className={`${styles.popupActionBtn} ${styles.danger}`}>
                        {Icons.trash}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div className={styles.popupAddRow}>
            <button className={styles.popupAddBtn} onClick={() => onAdd("event")}>{Icons.plus} Event</button>
            <button className={styles.popupAddBtn} onClick={() => onAdd("visit")}>{Icons.plus} Visit</button>
            <button className={styles.popupAddBtn} onClick={() => onAdd("room")}>{Icons.plus} Room</button>
            <button className={styles.popupAddBtn} onClick={() => onAdd("block")}>{Icons.plus} Block</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Side rails ─────────────────────────────────────────────────────────────
function TodayScheduleRail({ items }: { items: CalendarItem[] }) {
  return (
    <div className={styles.sideModule}>
      <div className={styles.sideModuleTitle}>Today’s Schedule</div>
      {items.length === 0 ? (
        <p style={{ fontSize: "13px", color: "#9CA3AF", padding: "8px 0" }}>Nothing scheduled today.</p>
      ) : (
        items.slice(0, 6).map((it) => {
          const bg =
            it.color === "orange" ? "#FF7847" :
            it.color === "blue" ? "#3B82F6" :
            it.color === "pink" ? "#EC4899" :
            it.color === "grey" ? "#6B7280" : "#8B5CF6";
          return (
            <div key={it.id} className={styles.scheduleItem}>
              <div className={styles.scheduleIconWrap} style={{ background: bg }}>
                {KIND_INITIAL[it.kind]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {it.title}
                </div>
                <div style={{ fontSize: "11px", color: "#6B7280" }}>
                  {it.startTime ? formatTime(it.startTime) : "All day"}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function BirthdaysRail({ items, onWish }: { items: CalendarItem[]; onWish: (name: string) => void }) {
  return (
    <div className={styles.sideModule}>
      <div className={styles.sideModuleTitle}>Birthdays This Month</div>
      {items.length === 0 ? (
        <p style={{ fontSize: "13px", color: "#9CA3AF", padding: "8px 0" }}>No birthdays this month.</p>
      ) : (
        items.map((it) => {
          const meta = parseMeta(it);
          return (
            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #F9FAFB" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FDF2F8", color: "#EC4899", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎂</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1F2937" }}>{meta.name ?? it.title.replace("'s Birthday", "")}</div>
                <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{it.date.slice(5)}</div>
              </div>
              <button className={styles.popupActionBtn} onClick={() => onWish(meta.name ?? "")}>Wish</button>
            </div>
          );
        })
      )}
    </div>
  );
}

function Legend() {
  const legend = [
    { c: "#FF7847", label: "Meeting Room" },
    { c: "#3B82F6", label: "Visits" },
    { c: "#8B5CF6", label: "Events" },
    { c: "#6B7280", label: "Bookings" },
    { c: "#EC4899", label: "Birthdays" },
  ];
  return (
    <div className={styles.sideModule}>
      <div className={styles.sideModuleTitle}>Legend</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "4px 0" }}>
        {legend.map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4B5563" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: l.c }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modals (wired to mutations) ────────────────────────────────────────────
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={styles.popupCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className={styles.popupHeader}>
          <div className={styles.popupDate}>{title}</div>
          <button className={styles.popupClose} onClick={onClose}>{Icons.close}</button>
        </div>
        <div className={styles.popupBody}>{children}</div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#1F2937", background: "#fff", marginBottom: 10,
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 4 };
const rowStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };

function CreateEventModal({ defaults, centerId, onClose }: { defaults: { date?: string; startTime?: string }; centerId?: string; onClose: () => void }) {
  const { create, saving } = useCreateEvent();
  const [form, setForm] = useState({
    title: "", description: "", eventDate: defaults.date ?? toISODate(new Date()),
    startTime: defaults.startTime ?? "10:00", endTime: "11:00", attendeesCount: 1, type: "MEETING", centerId: centerId ?? "",
  });

  async function submit() {
    if (!form.title.trim()) return;
    await create({
      title: form.title, description: form.description, eventDate: form.eventDate,
      startTime: form.startTime, endTime: form.endTime, attendeesCount: Number(form.attendeesCount),
      type: form.type, centerId: form.centerId || undefined,
    });
    onClose();
  }

  return (
    <ModalShell title="Create Event" onClose={onClose}>
      <label style={labelStyle}>Title *</label>
      <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Team sync, workshop…" />
      <label style={labelStyle}>Description</label>
      <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Date *</label>
          <input type="date" style={inputStyle} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {["MEETING", "MEETING_ROOM", "CONFERENCE", "WORKSHOP", "TRAINING", "SOCIAL", "OTHER"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div style={rowStyle}>
        <div><label style={labelStyle}>Start</label><input type="time" style={inputStyle} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
        <div><label style={labelStyle}>End</label><input type="time" style={inputStyle} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
      </div>
      <label style={labelStyle}>Attendees</label>
      <input type="number" min={1} style={{ ...inputStyle, maxWidth: 120 }} value={form.attendeesCount} onChange={(e) => setForm({ ...form, attendeesCount: Number(e.target.value) })} />
      <button className={styles.btnPrimary} style={{ width: "100%", marginTop: 6, justifyContent: "center" }} onClick={submit} disabled={saving || !form.title.trim()}>
        {saving ? "Creating…" : "Create Event"}
      </button>
    </ModalShell>
  );
}

function ScheduleVisitModal({ defaults, centerId, onClose }: { defaults: { date?: string; startTime?: string }; centerId?: string; onClose: () => void }) {
  const { create, saving } = useCreateVisit();
  const [form, setForm] = useState({
    visitorName: "", visitorPhone: "", visitorEmail: "", company: "",
    visitDate: defaults.date ?? toISODate(new Date()),
    startTime: defaults.startTime ?? "11:00", endTime: "12:00",
    tourType: "SCHEDULED_TOUR", partySize: 1, interestedPlan: "", notes: "",
    centerId: centerId ?? "",
  });

  async function submit() {
    if (!form.visitorName.trim() || !form.visitorPhone.trim()) return;
    await create({
      visitorName: form.visitorName, visitorPhone: form.visitorPhone, visitorEmail: form.visitorEmail || undefined,
      company: form.company || undefined, visitDate: form.visitDate, startTime: form.startTime, endTime: form.endTime,
      tourType: form.tourType, partySize: Number(form.partySize), interestedPlan: form.interestedPlan || undefined,
      notes: form.notes || undefined, centerId: form.centerId || undefined,
    });
    onClose();
  }

  return (
    <ModalShell title="Schedule Visit" onClose={onClose}>
      <div style={rowStyle}>
        <div><label style={labelStyle}>Visitor Name *</label><input style={inputStyle} value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} /></div>
        <div><label style={labelStyle}>Phone *</label><input style={inputStyle} value={form.visitorPhone} onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })} /></div>
      </div>
      <div style={rowStyle}>
        <div><label style={labelStyle}>Email</label><input style={inputStyle} value={form.visitorEmail} onChange={(e) => setForm({ ...form, visitorEmail: e.target.value })} /></div>
        <div><label style={labelStyle}>Company</label><input style={inputStyle} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
      </div>
      <div style={rowStyle}>
        <div><label style={labelStyle}>Date *</label><input type="date" style={inputStyle} value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} /></div>
        <div><label style={labelStyle}>Tour Type</label>
          <select style={inputStyle} value={form.tourType} onChange={(e) => setForm({ ...form, tourType: e.target.value })}>
            {["SCHEDULED_TOUR", "WALK_IN", "VIRTUAL", "FOLLOW_UP"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div style={rowStyle}>
        <div><label style={labelStyle}>Start</label><input type="time" style={inputStyle} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
        <div><label style={labelStyle}>End</label><input type="time" style={inputStyle} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
      </div>
      <div style={rowStyle}>
        <div><label style={labelStyle}>Party Size</label><input type="number" min={1} style={inputStyle} value={form.partySize} onChange={(e) => setForm({ ...form, partySize: Number(e.target.value) })} /></div>
        <div><label style={labelStyle}>Interested Plan</label><input style={inputStyle} value={form.interestedPlan} onChange={(e) => setForm({ ...form, interestedPlan: e.target.value })} /></div>
      </div>
      <label style={labelStyle}>Notes</label>
      <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <button className={styles.btnPrimary} style={{ width: "100%", marginTop: 6, justifyContent: "center" }} onClick={submit} disabled={saving || !form.visitorName.trim() || !form.visitorPhone.trim()}>
        {saving ? "Scheduling…" : "Schedule Visit"}
      </button>
    </ModalShell>
  );
}

function BookRoomModal({ defaults, centerId, onClose }: { defaults: { date?: string; startTime?: string }; centerId?: string; onClose: () => void }) {
  const { book, saving } = useBookRoom();
  const [form, setForm] = useState({
    roomId: "", eventDate: defaults.date ?? toISODate(new Date()),
    startTime: defaults.startTime ?? "10:00", endTime: "11:00",
    title: "", attendeesCount: 1, centerId: centerId ?? "",
  });
  const { rooms } = useMeetingRooms(form.centerId ? { centerId: form.centerId } : undefined);

  async function submit() {
    if (!form.roomId || !form.title.trim()) return;
    await book({
      roomId: form.roomId, centerId: form.centerId, eventDate: form.eventDate,
      startTime: form.startTime, endTime: form.endTime, title: form.title,
      attendeesCount: Number(form.attendeesCount),
    });
    onClose();
  }

  return (
    <ModalShell title="Book Meeting Room" onClose={onClose}>
      <label style={labelStyle}>Room *</label>
      <select style={inputStyle} value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
        <option value="">Select a room…</option>
        {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name} (cap {r.capacity})</option>)}
      </select>
      <label style={labelStyle}>Title *</label>
      <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Meeting purpose" />
      <label style={labelStyle}>Date *</label>
      <input type="date" style={inputStyle} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
      <div style={rowStyle}>
        <div><label style={labelStyle}>Start</label><input type="time" style={inputStyle} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
        <div><label style={labelStyle}>End</label><input type="time" style={inputStyle} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
      </div>
      <label style={labelStyle}>Attendees</label>
      <input type="number" min={1} style={{ ...inputStyle, maxWidth: 120 }} value={form.attendeesCount} onChange={(e) => setForm({ ...form, attendeesCount: Number(e.target.value) })} />
      <button className={styles.btnPrimary} style={{ width: "100%", marginTop: 6, justifyContent: "center" }} onClick={submit} disabled={saving || !form.roomId || !form.title.trim()}>
        {saving ? "Booking…" : "Book Room"}
      </button>
      {rooms.length === 0 && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>No rooms available for this center.</p>}
    </ModalShell>
  );
}

function BlockTimeModal({ defaults, centerId, onClose }: { defaults: { date?: string; startTime?: string }; centerId?: string; onClose: () => void }) {
  // v1: block-time writes a Request of type MAINTENANCE (closest existing model).
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    reason: "", blockType: "MAINTENANCE",
    visitDate: defaults.date ?? toISODate(new Date()),
    startTime: defaults.startTime ?? "10:00", endTime: "11:00",
    notes: "", centerId: centerId ?? "",
  });

  const CREATE_REQUEST = gql`mutation CreateRequestCal($input: CreateRequestInput!) { createRequest(input: $input) { id } }`;

  async function submit() {
    if (!form.reason.trim()) return;
    setSaving(true);
    try {
      await client.mutate({
        mutation: CREATE_REQUEST,
        variables: {
          input: {
            title: `Blocked: ${form.reason}`,
            description: form.notes || form.reason,
            requestType: form.blockType,
            urgency: "MEDIUM",
            centerId: form.centerId || undefined,
            dueDate: `${form.visitDate}T${form.startTime}:00`,
            metadata: JSON.stringify({ block: true, startTime: form.startTime, endTime: form.endTime }),
          },
        },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Block Time" onClose={onClose}>
      <label style={labelStyle}>Reason *</label>
      <input style={inputStyle} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Maintenance, cleaning, setup…" />
      <label style={labelStyle}>Block Type</label>
      <select style={inputStyle} value={form.blockType} onChange={(e) => setForm({ ...form, blockType: e.target.value })}>
        {["MAINTENANCE", "CLEANING", "SECURITY", "OTHER"].map((t) => <option key={t}>{t}</option>)}
      </select>
      <label style={labelStyle}>Date</label>
      <input type="date" style={inputStyle} value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} />
      <div style={rowStyle}>
        <div><label style={labelStyle}>Start</label><input type="time" style={inputStyle} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
        <div><label style={labelStyle}>End</label><input type="time" style={inputStyle} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
      </div>
      <label style={labelStyle}>Notes</label>
      <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <button className={styles.btnPrimary} style={{ width: "100%", marginTop: 6, justifyContent: "center" }} onClick={submit} disabled={saving || !form.reason.trim()}>
        {saving ? "Blocking…" : "Block Time"}
      </button>
    </ModalShell>
  );
}

function BirthdayModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="Send Birthday Wishes" onClose={onClose}>
      <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
        Birthday wishes are sent via your configured notification channels (WhatsApp/Email). Configure the message template in Settings → Notifications → Automations. This modal is a placeholder for v1.
      </p>
      <button className={styles.btnSecondary} style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={onClose}>Close</button>
    </ModalShell>
  );
}
