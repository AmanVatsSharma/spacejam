/**
 * File:        apps/mobile/src/screens/QuickBookingScreen.tsx
 * Module:      Mobile · Booking · Quick Booking
 * Purpose:     Select a room, date, time, and create a booking via GraphQL
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-07
 */
import React, { useState, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_AVAILABLE_ROOMS, CREATE_BOOKING, GET_SEATS, GET_ME } from '../lib/apollo/operations';
import Toast from 'react-native-toast-message';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';

const { height: SH } = Dimensions.get('window');

const BRAND = '#FE7A47';
const TEAL = '#48C9B0';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BG = '#fff';

const BG_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200';

/* ─── helpers ─── */
function to24h(time12: string): string {
  const [time, modifier] = time12.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function buildIsoDate(dayNum: string, time12: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = new Date(year, month, parseInt(dayNum, 10), 0, 0, 0);
  const time24 = to24h(time12);
  return `${date.toISOString().split('T')[0]}T${time24}`;
}

function formatDateLabel(dayNum: string): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), parseInt(dayNum, 10));
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[d.getDay()];
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${dayName}, ${dateStr}`;
}

const TIME_SLOTS = [
  { time: '9:00 AM', available: true },
  { time: '10:00 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '12:00 PM', available: false },
  { time: '1:00 PM', available: true },
  { time: '2:00 PM', available: true },
  { time: '3:00 PM', available: false },
  { time: '4:00 PM', available: false },
  { time: '5:00 PM', available: true },
  { time: '6:00 PM', available: true },
];

const DAYS = [
  { day: 'M', num: '5' },
  { day: 'T', num: '6' },
  { day: 'W', num: '7' },
  { day: 'T', num: '8' },
  { day: 'F', num: '9' },
  { day: 'S', num: '10' },
];

const AMENITY_ICONS = [
  // wifi
  <Svg key="wifi" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <Path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <Line x1="12" y1="20" x2="12.01" y2="20" />
  </Svg>,
  // projector
  <Svg key="proj" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="7" width="20" height="10" rx="2" ry="2"/>
    <Path d="M6 17v4M18 17v4M6 7V3M18 7V3"/>
  </Svg>,
  // monitor
  <Svg key="mon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <Line x1="8" y1="21" x2="16" y2="21" />
    <Line x1="12" y1="17" x2="12" y2="21" />
  </Svg>,
];

export default function QuickBookingScreen() {
  const navigation = useNavigation<any>();

  /* ─── Apollo ─── */
  const { data: roomsData, loading: roomsLoading, error: roomsError } = useQuery(GET_AVAILABLE_ROOMS);
  const { data: meData } = useQuery(GET_ME);

  const rooms = roomsData?.availableRooms ?? [];
  const selectedRoom = rooms[0] ?? null;

  const { data: seatsData, loading: seatsLoading } = useQuery(GET_SEATS, {
    variables: { floorId: selectedRoom?.id },
    skip: !selectedRoom,
  });

  const seats = seatsData?.seats ?? [];
  const selectedSeat = seats[0] ?? null;

  const [selectedDay, setSelectedDay] = useState('5');
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleSlotPress = (time: string, available: boolean) => {
    if (!available) return;
    if (selectedStart == null) {
      setSelectedStart(time);
      setSelectedEnd(null);
    } else if (selectedEnd == null) {
      if (time < selectedStart) {
        setSelectedStart(time);
        setSelectedEnd(null);
      } else {
        setSelectedEnd(time);
      }
    } else {
      setSelectedStart(time);
      setSelectedEnd(null);
    }
  };

  const [createBooking] = useMutation(CREATE_BOOKING, {
    onCompleted: (data) => {
      Toast.show({ type: 'success', text1: 'Booking Confirmed' });
      setCreating(false);
      navigation.navigate('EventSuccess');
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Booking Failed', text2: err.message });
      setCreating(false);
    },
  });

  const handleConfirm = async () => {
    if (!selectedSeat || !selectedStart || !selectedEnd) {
      Toast.show({ type: 'info', text1: 'Please select date and time range' });
      return;
    }

    const startIso = buildIsoDate(selectedDay, selectedStart);
    const endIso = buildIsoDate(selectedDay, selectedEnd);

    setCreating(true);
    try {
      await createBooking({
        variables: {
          input: {
            seatId: selectedSeat.id,
            startTime: startIso,
            endTime: endIso,
          },
        },
      });
    } catch {
      // onError handles the toast; setCreating is reset there
    }
  };

  const canConfirm = selectedSeat && selectedStart && selectedEnd && !creating;
  const durationHours = selectedStart && selectedEnd
    ? (() => {
        const s = to24h(selectedStart);
        const e = to24h(selectedEnd);
        const [sh, sm] = s.split(':').map(Number);
        const [eh, em] = e.split(':').map(Number);
        const diff = (eh * 60 + em - sh * 60 - sm) / 60;
        return diff > 0 ? diff : 0;
      })()
    : 0;

  const totalPrice = useMemo(() => {
    if (!selectedRoom || durationHours <= 0) return 0;
    return Math.round(selectedRoom.hourlyRate * durationHours);
  }, [selectedRoom, durationHours]);

  /* ─── Loading ─── */
  if (roomsLoading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={BRAND} />
        <Text style={styles.loadingTxt}>Finding available rooms…</Text>
      </View>
    );
  }

  if (roomsError) {
    return (
      <View style={styles.centerLoading}>
        <Text style={styles.errorTxt}>Failed to load rooms</Text>
        <Text style={styles.errorSub}>{roomsError.message}</Text>
      </View>
    );
  }

  if (!selectedRoom) {
    return (
      <View style={styles.centerLoading}>
        <Text style={styles.errorTxt}>No rooms available right now</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Header Image ── */}
        <ImageBackground source={{ uri: BG_IMAGE }} style={styles.headerImage}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M19 12H5M12 19l-7-7 7-7"/>
                </Svg>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Book Meeting Room</Text>
            </View>
          </SafeAreaView>
          <View style={styles.imageOverlay} />
        </ImageBackground>

        {/* ── Floating Info Card ── */}
        <View style={styles.infoCardWrapper}>
          <View style={styles.infoCard}>
            <Text style={styles.roomName}>{selectedRoom.name}</Text>
            <View style={styles.roomSubRow}>
              <View>
                <Text style={styles.roomFloor}>Capacity: {selectedRoom.capacity} Seats</Text>
                <Text style={styles.roomLoc}>₹{selectedRoom.hourlyRate}/hour</Text>
              </View>
              <View style={styles.amenities}>
                {selectedRoom.amenities?.length
                  ? selectedRoom.amenities.map((_: string, idx: number) => (
                      <View key={idx}>{AMENITY_ICONS[idx % AMENITY_ICONS.length]}</View>
                    ))
                  : AMENITY_ICONS}
              </View>
            </View>
          </View>
        </View>

        {/* ── Details Sections ── */}
        <View style={styles.bodyContent}>

          {/* Room Selection */}
          <Text style={styles.sectionTitle}>Select Room</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomList}>
            {rooms.map((room: any) => {
              const isActive = room.id === selectedRoom.id;
              return (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomChip, isActive && styles.roomChipActive]}
                  onPress={() => {
                    // Selecting a different room will trigger GET_SEATS re-run via skip
                  }}
                >
                  <Text style={[styles.roomChipName, isActive && styles.roomChipNameActive]}>
                    {room.name}
                  </Text>
                  <Text style={[styles.roomChipCap, isActive && styles.roomChipCapActive]}>
                    ₹{room.hourlyRate}/hr
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Date Selection */}
          <Text style={styles.sectionTitle}>Select Date</Text>
          <View style={styles.dateRow}>
            {DAYS.map((d) => {
              const active = d.num === selectedDay;
              return (
                <TouchableOpacity
                  key={d.num}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                  onPress={() => setSelectedDay(d.num)}
                >
                  <Text style={[styles.dateDay, active && styles.dateDayActive]}>{d.day}</Text>
                  <Text style={[styles.dateNum, active && styles.dateNumActive]}>{d.num}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Selection */}
          <Text style={styles.sectionTitle}>Select Time</Text>
          {seatsLoading ? (
            <ActivityIndicator size="small" color={BRAND} style={{ marginVertical: 12 }} />
          ) : (
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((slot) => {
                const isStart = selectedStart === slot.time;
                const isEnd = selectedEnd === slot.time;
                const inRange = selectedStart && selectedEnd && slot.time > selectedStart && slot.time < selectedEnd;
                const active = isStart || isEnd || inRange;
                return (
                  <TouchableOpacity
                    key={slot.time}
                    style={[
                      styles.timeChip,
                      !slot.available && styles.timeChipDisabled,
                      active && styles.timeChipActive,
                    ]}
                    onPress={() => handleSlotPress(slot.time, slot.available)}
                    disabled={!slot.available}
                  >
                    <Text
                      style={[
                        styles.timeChipTxt,
                        !slot.available && styles.timeChipTxtDisabled,
                        active && styles.timeChipTxtActive,
                      ]}
                    >
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Summary */}
          {selectedStart && selectedEnd && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTxt}>
                {formatDateLabel(selectedDay)} • {selectedStart} – {selectedEnd}
              </Text>
              <Text style={styles.summaryDuration}>
                {durationHours} hour{durationHours !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.summaryPrice}>₹{totalPrice}</Text>
            </View>
          )}

        </View>
      </ScrollView>

      {/* ── Bottom Fixed Footer ── */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerCostLbl}>Total Cost</Text>
          <Text style={styles.footerCostVal}>₹{totalPrice}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="20 6 9 17 4 12" />
              </Svg>
              <Text style={styles.confirmBtnTxt}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Center loading/error
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },
  loadingTxt: {
    fontSize: 15,
    color: MUTED,
    marginTop: 8,
  },
  errorTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  errorSub: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Header Image
  headerImage: {
    width: '100%',
    height: SH * 0.35,
    overflow: 'hidden',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: -1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  // Floating Info Card
  infoCardWrapper: {
    paddingHorizontal: 16,
    marginTop: -50,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  roomName: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
    marginBottom: 8,
  },
  roomSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  roomFloor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 2,
  },
  roomLoc: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  amenities: {
    flexDirection: 'row',
    gap: 12,
  },

  // Body Content
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginBottom: 16,
  },

  // Room selection chips
  roomList: {
    marginBottom: 28,
  },
  roomChip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginRight: 12,
    backgroundColor: '#fff',
    minWidth: 140,
  },
  roomChipActive: {
    borderColor: BRAND,
    backgroundColor: '#FFF5F0',
  },
  roomChipName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  roomChipNameActive: {
    color: DARK,
  },
  roomChipCap: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  roomChipCapActive: {
    color: BRAND,
    fontWeight: '600',
  },

  // Date selection chips
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  dateChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  dateChipActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  dateDay: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  dateDayActive: {
    color: '#fff',
  },
  dateNum: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
  },
  dateNumActive: {
    color: '#fff',
  },

  // Time grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    minWidth: 90,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: '#FFF5F0',
    borderColor: BRAND,
  },
  timeChipDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  timeChipTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
  },
  timeChipTxtActive: {
    color: BRAND,
    fontWeight: '700',
  },
  timeChipTxtDisabled: {
    color: '#D1D5DB',
  },

  // Booking summary card
  summaryCard: {
    backgroundColor: '#FFF5F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE8DB',
  },
  summaryTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    marginBottom: 4,
  },
  summaryDuration: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerCostLbl: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 4,
  },
  footerCostVal: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292B2E',
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 16,
    gap: 8,
    minWidth: 180,
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
