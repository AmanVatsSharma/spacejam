'use client';

/**
 * File:        apps/web/src/app/dashboard/operations/meeting-room/page.tsx
 * Module:      Web · Dashboard · Meeting Room
 * Purpose:     Meeting Room status dashboard — Apollo-wired
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */

import {
  useMeetingRooms,
  useCancelRoomBooking,
  useBulkUpdateStatus,
  useCreateMeetingRoom,
  useUpdateMeetingRoom,
  useDeleteMeetingRoom,
} from '@/hooks/use-operations';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import styles from './meeting-room.module.css';
import { BookRoomModal, BookRoomModalProps } from '../modals/book-room-modal';
import {
  QueryLoading,
  QueryError,
  QueryEmpty,
} from '@/components/ui/query-status';
import { useQuery } from '@apollo/client';
import { GET_EVENTS, GET_MY_CENTERS } from '@/lib/apollo/operations';
import { ViewDetailsModal } from './view-details-modal';
import { MeetingRoomFormModal } from './meeting-room-form-modal';

type RoomStatus = 'occupied' | 'available' | 'booked' | 'maintenance';
type BookingInfo = { label: string; title: string; time: string };
type RoomCard = {
  id: string;
  name: string;
  capacity: number;
  status: RoomStatus;
  booking?: BookingInfo;
  // Carried through from the MEETING_ROOMS query so the Edit and View Details
  // modals can pre-fill correctly (previously discarded by displayRooms, which
  // left those modals opening blank).
  centerId?: string | null;
  floorId?: string | null;
  roomType?: string | null;
  hourlyRate?: number | null;
  amenities?: string[] | null;
};

const STATUS_PILL: Record<
  RoomStatus,
  { label: string; color: string; bg: string }
> = {
  occupied: { label: 'Occupied', color: '#FF6A2F', bg: '#FFEBE0' },
  available: { label: 'Available', color: '#10B981', bg: '#D1FAE5' },
  booked: { label: 'Booked', color: '#FF6A2F', bg: '#FFEBE0' },
  maintenance: { label: 'Maintenance', color: '#06B6D4', bg: '#CFFAFE' },
};

const ACTION_BTN: Record<
  RoomStatus,
  { label: string; bg: string; color: string }
> = {
  occupied: { label: 'Extend', bg: '#10B981', color: '#FFFFFF' },
  available: { label: 'Book Now', bg: '#F59E0B', color: '#FFFFFF' },
  booked: { label: 'View Booking', bg: '#FF6A4F', color: '#FFFFFF' },
  maintenance: { label: 'Unavailable', bg: '#94A3B8', color: '#FFFFFF' },
};

function RoomCard({
  room,
  onBook,
  onExtend,
  onView,
}: {
  room: RoomCard;
  onBook?: (room: RoomCard) => void;
  onExtend?: (room: RoomCard) => void;
  onView?: (room: RoomCard) => void;
}) {
  const pill = STATUS_PILL[room.status];
  const action = ACTION_BTN[room.status];
  const showBooking =
    (room.status === 'occupied' || room.status === 'available') && room.booking;

  return (
    <div
      className={`${styles.roomCard} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className={styles.roomCardHeader}>
        <h3 className={styles.roomCardTitle}>{room.name}</h3>
        <span
          className={styles.statusPill}
          style={{ color: pill.color, background: pill.bg }}
        >
          {pill.label}
        </span>
      </div>
      <div className={styles.roomCardCapacity}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="#6A7282"
          strokeWidth="1.2"
        >
          <circle cx="7" cy="5" r="2.2" />
          <path
            d="M2.5 12.5C2.5 9.74 4.74 8 7 8C9.26 8 11.5 9.74 11.5 12.5"
            strokeLinecap="round"
          />
        </svg>
        <span>{room.capacity} people</span>
      </div>
      {showBooking && room.booking && (
        <div className={styles.roomCardBooking}>
          <div className={styles.bookingLabel}>{room.booking.label}</div>
          {room.booking.title && (
            <div className={styles.bookingTitle}>{room.booking.title}</div>
          )}
          <div className={styles.bookingTime}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke={room.booking.title ? '#FF6A2F' : '#6A7282'}
              strokeWidth="1.2"
            >
              <circle cx="7" cy="7" r="5.5" />
              <path
                d="M7 4V7.5L9.5 9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{room.booking.time}</span>
          </div>
        </div>
      )}
      <button
        type="button"
        className={`${styles.roomCardAction} active:scale-[0.97]`}
        style={{ background: action.bg, color: action.color }}
        onClick={() => {
          if (room.status === 'occupied') onExtend?.(room);
          else if (room.status === 'available') onBook?.(room);
          else if (room.status === 'booked') onView?.(room);
        }}
      >
        {action.label}
      </button>
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function MeetingRoomsPage() {
  const [view, setView] = useState<'layout' | 'table'>('layout');
  const [showBookRoom, setShowBookRoom] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(
    undefined,
  );
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [filters, setFilters] = useState({
    centerId: '',
    floorId: '',
    status: '',
    minCapacity: '',
  });
  const { data: centersData, error: centersError } = useQuery(GET_MY_CENTERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const { rooms, loading, error, refetch } = useMeetingRooms({
    centerId: filters.centerId || undefined,
    floorId: filters.floorId || undefined,
    status: filters.status || undefined,
    minCapacity: filters.minCapacity ? Number(filters.minCapacity) : undefined,
  } as any);
  const { cancel: cancelBooking } = useCancelRoomBooking();

  type DateRange = 'today' | 'week' | 'month' | 'all';
  const [dateRange, setDateRange] = useState<DateRange>('all');

  const dateRangeBounds = (
    range: DateRange,
  ): { start: Date; end: Date } | null => {
    const now = new Date();
    switch (range) {
      case 'today':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59,
          ),
        };
      case 'week':
        const day = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + 1);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return { start: monday, end: sunday };
      case 'month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        };
      default:
        return null;
    }
  };

  const bounds = dateRangeBounds(dateRange);

  const { data: eventsData, error: eventsError } = useQuery(GET_EVENTS, {
    variables: {
      filters: {
        centerId: filters.centerId || undefined,
        meetingRoomId: undefined,
        // bookRoom stores meeting room reservations as eventType MEETING_ROOM,
        // so filter by that (not 'MEETING') or the stats/booking lookups come
        // back empty.
        type: 'MEETING_ROOM',
        ...(bounds
          ? {
              startDate: bounds.start.toISOString().split('T')[0],
              endDate: bounds.end.toISOString().split('T')[0],
            }
          : {}),
      } as any,
    },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const displayRooms: RoomCard[] = rooms.map((r: any) => ({
    id: r.id,
    name: r.name,
    capacity: r.capacity ?? 4,
    status: (r.status ?? 'AVAILABLE').toLowerCase() as RoomStatus,
    booking: undefined,
    centerId: r.centerId ?? null,
    floorId: r.floorId ?? null,
    roomType: r.roomType ?? null,
    hourlyRate: r.hourlyRate ?? null,
    amenities: r.amenities ?? null,
  }));

  const roomIdToBooking = useMemo(() => {
    if (!eventsData?.events || !displayRooms.length)
      return {} as Record<string, any>;
    const roomIds = new Set(displayRooms.map((r: any) => r.id));
    const map: Record<string, any> = {};
    eventsData.events.forEach((ev: any) => {
      if (
        ev.meetingRoom?.id &&
        roomIds.has(ev.meetingRoom.id) &&
        (ev.status === 'CONFIRMED' || ev.status === 'PENDING')
      ) {
        map[ev.meetingRoom.id] = ev;
      }
    });
    return map;
  }, [eventsData, displayRooms]);

  const handleExtend = (room: RoomCard) => {
    const existing = roomIdToBooking[room.id];
    if (existing) {
      const startTime = existing.startTime
        ? existing.startTime.slice(0, 5)
        : '';
      const endTime = existing.endTime ? existing.endTime.slice(0, 5) : '';
      setSelectedRoomId(room.id);
      setPrefillBooking({
        eventDate: existing.eventDate,
        startTime,
        endTime,
        title: existing.title ?? '',
      });
      setShowBookRoom(true);
    } else {
      setSelectedRoomId(room.id);
      setPrefillBooking(undefined);
      setShowBookRoom(true);
    }
  };

  const handleBook = (room: RoomCard) => {
    setSelectedRoomId(room.id);
    setPrefillBooking(undefined);
    setShowBookRoom(true);
  };

  // "View Booking" action on booked-status cards opens the same View Details
  // modal the table view uses.
  const handleView = (room: RoomCard) => {
    setSelectedRoom(room);
  };

  const [prefillBooking, setPrefillBooking] =
    useState<BookRoomModalProps['prefillBooking']>(undefined);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState<any>(null);
  const { create: createRoom } = useCreateMeetingRoom();
  const { update: updateRoom } = useUpdateMeetingRoom();
  const { remove: deleteRoom } = useDeleteMeetingRoom();

  const availableCount = displayRooms.filter(
    (r) => r.status === 'available',
  ).length;

  const { bookingCount, totalHours, peakUsageStr } = useMemo(() => {
    const filtered = bounds
      ? (eventsData?.events ?? []).filter((ev: any) => {
          const evTime = new Date(
            `${ev.eventDate}T${ev.startTime ?? '00:00'}`,
          ).getTime();
          return (
            !isNaN(evTime) &&
            evTime >= bounds.start.getTime() &&
            evTime <= bounds.end.getTime()
          );
        })
      : (eventsData?.events ?? []);

    if (!filtered.length || !displayRooms.length)
      return { bookingCount: 0, totalHours: 0, peakUsageStr: 'No data' };
    const roomIds = new Set(displayRooms.map((r: any) => r.id));
    const validBookings = filtered.filter(
      (ev: any) => ev.meetingRoom?.id && roomIds.has(ev.meetingRoom.id),
    );

    const count = validBookings.length;
    let hours = 0;
    validBookings.forEach((ev: any) => {
      const start = new Date(
        `${ev.eventDate}T${ev.startTime ?? '00:00'}`,
      ).getTime();
      const end = new Date(
        `${ev.eventDate}T${ev.endTime ?? '00:00'}`,
      ).getTime();
      if (!isNaN(start) && !isNaN(end)) {
        hours += (end - start) / (1000 * 60 * 60);
      }
    });

    let peakStr = 'No data';
    if (count > 0) {
      const hourCounts: Record<number, number> = {};
      validBookings.forEach((ev: any) => {
        const h = new Date(
          `${ev.eventDate}T${ev.startTime ?? '00:00'}`,
        ).getHours();
        if (!isNaN(h)) hourCounts[h] = (hourCounts[h] || 0) + 1;
      });
      let maxHour = -1;
      let maxCount = -1;
      for (const [h, c] of Object.entries(hourCounts)) {
        if (c > maxCount) {
          maxCount = c;
          maxHour = Number(h);
        }
      }
      if (maxHour !== -1) {
        const ampm = maxHour >= 12 ? 'PM' : 'AM';
        const hr12 = maxHour % 12 || 12;
        const nextHr = (maxHour + 2) % 24;
        const nextAmpm = nextHr >= 12 ? 'PM' : 'AM';
        const nextHr12 = nextHr % 12 || 12;
        peakStr = `${hr12} ${ampm} - ${nextHr12} ${nextAmpm}`;
      }
    }

    return {
      bookingCount: count,
      totalHours: Math.round(hours),
      peakUsageStr: peakStr,
    };
  }, [eventsData, displayRooms, bounds]);

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>Meeting Room status</h1>
          <p className={styles.heroSubtitle}>
            Monitor meeting room usage, availability and booking status
          </p>
        </div>
        <button
          type="button"
          className={styles.heroAction}
          onClick={() => {
            setSelectedRoomId(undefined);
            setShowBookRoom(true);
          }}
        >
          <span className={styles.plusIcon}>+</span>
          <span>Book Room</span>
        </button>
        <button
          type="button"
          className={styles.heroAction}
          onClick={() => {
            setEditingRoom(null);
            setShowRoomForm(true);
          }}
        >
          <span className={styles.plusIcon}>+</span>
          <span>New Room</span>
        </button>
      </section>

      {/* Date-range selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[13px] font-medium text-gray-500">Period:</span>
        {(['today', 'week', 'month', 'all'] as const).map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => setDateRange(range)}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              dateRange === range
                ? 'bg-[#FF6A2F] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {range === 'all'
              ? 'All Time'
              : range === 'today'
                ? 'Today'
                : range === 'week'
                  ? 'This Week'
                  : 'This Month'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="#FF6A2F"
                strokeWidth="1.2"
              >
                <rect x="2" y="3" width="10" height="9" rx="1.5" />
                <path d="M5 1.5V4M9 1.5V4M2 7H12" strokeLinecap="round" />
              </svg>
            </span>
            <span className={styles.statLabel}>No. of Bookings</span>
          </div>
          <div className={styles.statValue}>{bookingCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="#FF6A2F"
                strokeWidth="1.2"
              >
                <circle cx="7" cy="7" r="5.5" />
                <path
                  d="M7 4V7.5L9.5 9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className={styles.statLabel}>Total Hours used</span>
          </div>
          <div className={styles.statValue}>
            {totalHours} <span className={styles.statUnit}>hrs</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="#FF6A2F"
                strokeWidth="1.2"
              >
                <rect x="2" y="3" width="10" height="9" rx="1.5" />
                <path d="M5 1.5V4M9 1.5V4M2 7H12" strokeLinecap="round" />
              </svg>
            </span>
            <span className={styles.statLabel}>Vacant Slot</span>
          </div>
          <div className={styles.statValue}>{availableCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="#FF6A2F"
                strokeWidth="1.2"
              >
                <circle cx="7" cy="7" r="5.5" />
                <path
                  d="M7 4V7.5L9.5 9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className={styles.statLabel}>Peak usage Hrs</span>
          </div>
          <div className={styles.statValue}>{peakUsageStr}</div>
        </div>
      </section>

      {/* Toggle */}
      <section className={styles.toggleRow}>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.viewBtn} ${view === 'layout' ? styles.viewBtnActive : ''}`}
            onClick={() => setView('layout')}
            aria-pressed={view === 'layout'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect
                x="1"
                y="1"
                width="5"
                height="5"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <rect
                x="8"
                y="1"
                width="5"
                height="5"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <rect
                x="1"
                y="8"
                width="5"
                height="5"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <rect
                x="8"
                y="8"
                width="5"
                height="5"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            <span>Layout View</span>
          </button>
          <button
            type="button"
            className={`${styles.viewBtn} ${view === 'table' ? styles.viewBtnActive : ''}`}
            onClick={() => setView('table')}
            aria-pressed={view === 'table'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect
                x="1"
                y="2"
                width="12"
                height="2.5"
                rx="0.6"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <rect
                x="1"
                y="6"
                width="12"
                height="2.5"
                rx="0.6"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <rect
                x="1"
                y="10"
                width="12"
                height="2.5"
                rx="0.6"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
            <span>Table View</span>
          </button>
        </div>
        <div className={styles.showingCount}>
          Showing {displayRooms.length} room
          {displayRooms.length !== 1 ? 's' : ''}
        </div>
      </section>

      {/* Filters */}
      <section className={styles.filterRow}>
        {centersError && (
          <div className="col-span-full mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[13px]">
            Unable to load centers. Some features may be limited.
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}
        <select
          className={styles.filterSelect}
          value={filters.centerId}
          onChange={(e) => {
            const c = e.target.value;
            setFilters((f) => ({ ...f, centerId: c, floorId: '' }));
          }}
          aria-label="Filter by center"
        >
          <option value="">All Centers</option>
          {(centersData?.myCenters ?? []).map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={filters.floorId}
          onChange={(e) =>
            setFilters((f) => ({ ...f, floorId: e.target.value }))
          }
          aria-label="Filter by floor"
          disabled={!filters.centerId}
        >
          <option value="">All Floors</option>
          {(centersData?.myCenters ?? [])
            .find((c: any) => c.id === filters.centerId)
            ?.floors?.map((f: any) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
        </select>
        <select
          className={styles.filterSelect}
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
          aria-label="Filter by status"
        >
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="BOOKED">Booked</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
        <input
          className={styles.filterInput}
          type="number"
          min={1}
          placeholder="Min capacity"
          value={filters.minCapacity}
          onChange={(e) =>
            setFilters((f) => ({ ...f, minCapacity: e.target.value }))
          }
          aria-label="Minimum capacity"
        />
        <button
          type="button"
          className={styles.filterResetBtn}
          onClick={() =>
            setFilters({
              centerId: '',
              floorId: '',
              status: '',
              minCapacity: '',
            })
          }
        >
          Reset
        </button>
      </section>

      {/* Rooms */}
      {loading && (
        <div className="col-span-full flex items-center justify-center py-12">
          <QueryLoading message="Loading meeting rooms…" />
        </div>
      )}
      {error && !loading && (
        <div className="col-span-full flex items-center justify-center py-12">
          <QueryError
            message="Unable to load meeting rooms."
            onRetry={() => refetch()}
          />
        </div>
      )}
      {!loading && !error && view === 'layout' ? (
        displayRooms.length === 0 ? (
          <section className={styles.roomsGrid}>
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-2xl text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3"
                  />
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-gray-700">
                No meeting rooms available
              </p>
              <p className="text-[13px] text-gray-500 max-w-[320px]">
                There are no meeting rooms configured yet. Add rooms from center
                setup to start booking.
              </p>
            </div>
          </section>
        ) : (
          <section className={styles.roomsGrid}>
            {displayRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onBook={handleBook}
                onExtend={handleExtend}
                onView={handleView}
              />
            ))}
          </section>
        )
      ) : (
        <section className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <div
              className={styles.tableGrid}
              role="table"
              aria-label="Meeting rooms table"
            >
              <div className={styles.tableHeader} role="row">
                <div className={styles.th} role="columnheader">
                  Room Name
                </div>
                <div className={styles.th} role="columnheader">
                  Capacity
                </div>
                <div className={styles.th} role="columnheader">
                  Status
                </div>
                <div className={styles.th} role="columnheader">
                  Actions
                </div>
              </div>
              {displayRooms.map((room) => {
                const p = STATUS_PILL[room.status];
                return (
                  <div
                    key={room.id}
                    className={`${styles.roomCard} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                    role="row"
                  >
                    <div
                      className={`${styles.td} ${styles.tdName}`}
                      role="cell"
                    >
                      {room.name}
                    </div>
                    <div
                      className={`${styles.td} ${styles.tdCapacity}`}
                      role="cell"
                    >
                      {room.capacity} people
                    </div>
                    <div
                      className={`${styles.td} ${styles.tdStatus}`}
                      role="cell"
                    >
                      <span
                        className={styles.tableStatusPill}
                        style={{ color: p.color, background: p.bg }}
                      >
                        {p.label.toUpperCase()}
                      </span>
                    </div>
                    <div
                      className={`${styles.td} ${styles.tdActions}`}
                      role="cell"
                    >
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          className={styles.viewDetailsBtn}
                          onClick={() => setSelectedRoom(room)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className={styles.viewDetailsBtn}
                          onClick={() => {
                            setEditingRoom(room);
                            setShowRoomForm(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.viewDetailsBtn}
                          onClick={() => setConfirmDeleteRoom(room)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Book Room Modal */}
      <BookRoomModal
        open={showBookRoom}
        onClose={() => {
          setShowBookRoom(false);
          setPrefillBooking(undefined);
        }}
        roomId={selectedRoomId}
        prefillBooking={prefillBooking}
      />
      <ViewDetailsModal
        open={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        room={selectedRoom}
        onCancelBooking={async (bookingId) => {
          const ok = await cancelBooking(bookingId, selectedRoom?.id);
          if (!ok) {
            toast.error('Failed to cancel booking');
            return;
          }
          toast.success('Booking cancelled');
          setSelectedRoom(null);
          refetch();
        }}
      />
      <MeetingRoomFormModal
        open={showRoomForm}
        onClose={() => {
          setShowRoomForm(false);
          setEditingRoom(null);
        }}
        editingRoom={editingRoom}
        defaultCenterId={filters.centerId || undefined}
        onSubmit={async (input) => {
          try {
            if (editingRoom) {
              await updateRoom(editingRoom.id, input as any);
              toast.success(`Room "${input.name}" updated`);
            } else {
              await createRoom(input as any);
              toast.success(`Room "${input.name}" created`);
            }
            setShowRoomForm(false);
            setEditingRoom(null);
            refetch();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to save room');
          }
        }}
      />
      {confirmDeleteRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Delete meeting room?
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Permanently delete "{confirmDeleteRoom?.name ?? ''}"? Active
                bookings may block this.
              </p>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => setConfirmDeleteRoom(null)}
                className="bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 px-5 rounded-lg border border-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await deleteRoom(confirmDeleteRoom.id);
                    toast.success(`Room "${confirmDeleteRoom.name}" deleted`);
                    refetch();
                  } catch (err: any) {
                    toast.error(err?.message ?? 'Could not delete room');
                  } finally {
                    setConfirmDeleteRoom(null);
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
