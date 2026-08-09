/**
 * File:        apps/mobile/src/screens/BookingDetailsScreen.tsx
 * Module:      Mobile · Booking · Details
 * Purpose:     Select date, time slot, and details for booking a seat
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-07
 */
import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_BOOKING, GET_SEATS, GET_ME, GET_SEAT_AVAILABILITY } from '../lib/apollo/operations';
import Toast from 'react-native-toast-message';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';
import CalendarModal from './CalendarModal';
import ConfirmBookingModal from './ConfirmBookingModal';

const BRAND = '#FE7A47';
const TEAL = '#48C9B0';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#F3F4F6';
const BG_GRAY = '#F9FAFB';

const DATES = [
  { day: 'M', num: '5' },
  { day: 'T', num: '6' },
  { day: 'W', num: '7' },
  { day: 'T', num: '8' },
  { day: 'F', num: '9' },
  { day: 'S', num: '10' },
];

const TIME_SLOTS = [
  { time: '9:00 AM', status: 'available' },
  { time: '10:00 AM', status: 'available' },
  { time: '11:00 AM', status: 'booked' },
  { time: '12:00 PM', status: 'booked' },
  { time: '1:00 PM', status: 'available' },
  { time: '2:00 PM', status: 'available' },
  { time: '3:00 PM', status: 'booked' },
  { time: '4:00 PM', status: 'booked' },
  { time: '5:00 PM', status: 'available' },
  { time: '6:00 PM', status: 'available' },
];

/** Convert "9:00 AM" / "1:00 PM" → "HH:MM:SS" 24-hour */
function to24h(time12: string): string {
  const [time, modifier] = time12.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

/** Build an ISO datetime string from selected day + 24h time */
function buildIsoDate(dayNum: string, time12: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const date = new Date(year, month, parseInt(dayNum, 10), 0, 0, 0);
  const time24 = to24h(time12);
  return `${date.toISOString().split('T')[0]}T${time24}`;
}

export default function BookingDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const seatId = route.params?.seatId;
  const { data: seatsData } = useQuery(GET_SEATS);
  const { data: meData } = useQuery(GET_ME);

  // Real availability: fetch booked slots for this seat today, then mark any
  // TIME_SLOT overlapping a booked range as 'booked' instead of the static
  // placeholder flags.
  const todayISO = new Date().toISOString().slice(0, 10);
  const { data: availData } = useQuery(GET_SEAT_AVAILABILITY, {
    variables: { seatId, date: todayISO },
    skip: !seatId,
  });
  const bookedRanges: { start: string; end: string }[] = availData?.seatAvailability ?? [];
  const slots = TIME_SLOTS.map((s) => {
    const slot24 = to24h(s.time);
    const slotStartHr = parseInt(slot24.slice(0, 2), 10);
    const overlaps = bookedRanges.some((r) => {
      const bStart = new Date(r.start).getUTCHours();
      const bEnd = new Date(r.end).getUTCHours() + (new Date(r.end).getUTCMinutes() > 0 ? 1 : 0);
      return slotStartHr >= bStart && slotStartHr < bEnd;
    });
    return { ...s, status: overlaps ? 'booked' : 'available' };
  });

  const seat = (seatsData?.seats)?.find((s: any) => s.id === seatId) || {};
  const userTokenBalance = meData?.me?.tokenBalance ?? 0;

  const [selectedDate, setSelectedDate] = useState('5');
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [participants, setParticipants] = useState(8);
  const [showCalendar, setShowCalendar] = useState(false);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Compute booking cost from seat price × selected hours
  const seatPrice = seat.price ?? 0;
  const selectedHours = (() => {
    if (!selectedStart || !selectedEnd) return 0;
    const [sh, sm] = selectedStart.split(':').map(Number);
    const [eh, em] = selectedEnd.split(':').map(Number);
    const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
    return diffMinutes > 0 ? diffMinutes / 60 : 0;
  })();
  const bookingCost = selectedHours > 0 ? Math.ceil(selectedHours) * seatPrice : 0;

  const [createBooking, { loading }] = useMutation(CREATE_BOOKING, {
    onCompleted: () => {
      Toast.show({ type: 'success', text1: 'Booking Confirmed' });
      setShowConfirmModal(false);
      navigation.navigate('BookingSuccess');
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Booking Failed', text2: err.message });
      setShowConfirmModal(false);
    },
  });

  const handleSlotPress = (time: string, status: string) => {
    if (status === 'booked') return;
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

  const handleBook = () => {
    if (!selectedStart || !selectedEnd) {
      Toast.show({ type: 'error', text1: 'Please select a start and end time.' });
      return;
    }

    const startIso = buildIsoDate(selectedDate, selectedStart);
    const endIso = buildIsoDate(selectedDate, selectedEnd);

    createBooking({
      variables: {
        input: {
          seatId,
          startTime: startIso,
          endTime: endIso,
        },
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select time and Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Seat Summary ── */}
        <View style={styles.card}>
          <View style={styles.roomRow}>
            <View style={styles.roomThumb} />
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>{seat.name || 'Seat'}</Text>
              <Text style={styles.roomSub}>
                {seat.seatType || 'Seat'} • {seat.floor?.name || ''}
              </Text>
            </View>
          </View>
          {seat.amenities && seat.amenities.length > 0 && (
            <View style={styles.amenities}>
              {seat.amenities.slice(0, 3).map((a: string, i: number) => (
                <View key={i} style={styles.amenityPill}>
                  <Text style={styles.amenityTxt}>{a}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Select Date ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <TouchableOpacity
              style={styles.otherDatesBtn}
              onPress={() => setShowCalendar(true)}
            >
              <Text style={styles.otherDatesTxt}>Other dates</Text>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <Line x1="16" y1="2" x2="16" y2="6" />
                <Line x1="8" y1="2" x2="8" y2="6" />
                <Line x1="3" y1="10" x2="21" y2="10" />
              </Svg>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
            {DATES.map((d, i) => {
              const isActive = selectedDate === d.num;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dateBox, isActive && styles.dateBoxActive]}
                  onPress={() => { setSelectedDate(d.num); setSelectedStart(null); setSelectedEnd(null); }}
                >
                  <Text style={[styles.dateDay, isActive && styles.dateTxtActive]}>{d.day}</Text>
                  <Text style={[styles.dateNum, isActive && styles.dateTxtActive]}>{d.num}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Select Time Slot ── */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Select Time Slot</Text>
          <View style={styles.timeGrid}>
            {slots.map((slot, i) => {
              const isStart = selectedStart === slot.time;
              const isEnd = selectedEnd === slot.time;
              const isBooked = slot.status === 'booked';

              let boxStyle = styles.timeBoxAvail;
              let txtStyle = styles.timeTxtAvail;
              if (isBooked) {
                boxStyle = styles.timeBoxBooked;
                txtStyle = styles.timeTxtBooked;
              } else if (isEnd) {
                boxStyle = styles.timeBoxEnd;
                txtStyle = styles.timeTxtEnd;
              } else if (isStart) {
                boxStyle = styles.timeBoxStart;
                txtStyle = styles.timeTxtStart;
              }

              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.timeBox, boxStyle]}
                  activeOpacity={isBooked ? 1 : 0.7}
                  onPress={() => handleSlotPress(slot.time, slot.status)}
                  disabled={isBooked}
                >
                  <Text style={[styles.timeTxt, txtStyle]}>{slot.time}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedStart && (
            <Text style={styles.selectionInfo}>
              {selectedStart} {selectedEnd ? `— ${selectedEnd}` : '(tap end time)'}
            </Text>
          )}

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: TEAL }]} />
              <Text style={styles.legendTxt}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: BRAND }]} />
              <Text style={styles.legendTxt}>Booked</Text>
            </View>
          </View>
        </View>

        {/* ── Meeting Purpose ── */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Meeting Purpose</Text>
          <TouchableOpacity style={styles.dropdownBtn}>
            <View />
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="6 9 12 15 18 9" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* ── Number of Participants ── */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Number of Participants</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setParticipants(Math.max(1, participants - 1))}
            >
              <Text style={styles.counterBtnTxt}>-</Text>
            </TouchableOpacity>
            <View style={styles.counterDisplay}>
              <Text style={styles.counterVal}>{participants}</Text>
              <Text style={styles.counterLbl}>people</Text>
            </View>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setParticipants(participants + 1)}
            >
              <Text style={styles.counterBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Additional Requirements ── */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Additional Requirements</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Type your special requirements here..."
            placeholderTextColor={MUTED}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* ── Coupon Code ── */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 12, textDecorationLine: 'underline' }]}>Coupon Code</Text>
          <View style={styles.inputBox} />
        </View>

        {/* ── Insufficient Tokens Warning ── */}
        {!hasSufficientBalance && (
          <View style={[styles.card, { borderColor: '#FEE2E2', backgroundColor: '#fff' }]}>
            <View style={styles.warningRow}>
              <View style={styles.warningIconBox}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <Line x1="12" y1="8" x2="12" y2="12" />
                  <Line x1="12" y1="16" x2="12.01" y2="16" />
                </Svg>
              </View>
              <View style={styles.warningInfo}>
                <Text style={styles.warningTitle}>Insufficient Tokens</Text>
                <Text style={styles.warningSub}>You need 500 tokens but you have only 250. Please recharge to continue.</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.warningBtn}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="12" cy="12" r="10" />
                <Line x1="12" y1="8" x2="12" y2="16" />
                <Line x1="8" y1="12" x2="16" y2="12" />
              </Svg>
              <Text style={styles.warningBtnTxt}>Click to Recharge</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLbl}>Token Balance</Text>
          <View style={styles.footerBalRow}>
            <Text style={styles.footerBalBold}>{userTokenBalance}</Text>
            <Text style={styles.footerBalSub}>
              {selectedHours > 0 ? ` / ₹${bookingCost}` : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.rechargeBtn}
          onPress={() => {
            if (hasSufficientBalance) {
              setShowConfirmModal(true);
            } else {
              // Handle recharge
            }
          }}
        >
          {!hasSufficientBalance && (
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="12" cy="12" r="10" />
              <Line x1="12" y1="8" x2="12" y2="16" />
              <Line x1="8" y1="12" x2="16" y2="12" />
            </Svg>
          )}
          <Text style={styles.rechargeBtnTxt}>
            {hasSufficientBalance ? 'Book Space' : 'Recharge Now'}
          </Text>
        </TouchableOpacity>
      </View>

      <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} />
      <ConfirmBookingModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleBook}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },

  // Base Card
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },

  // Seat Summary
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND,
    marginRight: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  roomSub: {
    fontSize: 12,
    color: MUTED,
  },
  amenities: {
    flexDirection: 'row',
    gap: 12,
  },
  amenityPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFE0D3',
    borderRadius: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityTxt: {
    color: BRAND,
    fontSize: 12,
    fontWeight: '600',
  },

  // Select Date
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  otherDatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  otherDatesTxt: {
    fontSize: 12,
    color: MUTED,
  },
  dateScroll: {
    gap: 10,
  },
  dateBox: {
    width: 50,
    height: 64,
    borderRadius: 12,
    backgroundColor: BG_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBoxActive: {
    backgroundColor: BRAND,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 4,
  },
  dateNum: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  dateTxtActive: {
    color: '#fff',
  },

  // Select Time Slot
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeBox: {
    width: '48%',
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  timeBoxStart: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  timeTxtStart: {
    color: '#fff',
    fontWeight: '700',
  },
  timeBoxEnd: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  timeTxtEnd: {
    color: '#fff',
    fontWeight: '700',
  },
  timeBoxAvail: {
    backgroundColor: '#fff',
    borderColor: TEAL,
  },
  timeTxtAvail: {
    color: TEAL,
  },
  timeBoxBooked: {
    backgroundColor: '#fff',
    borderColor: '#FFC8B4',
  },
  timeTxtBooked: {
    color: BRAND,
  },
  timeTxt: {
    fontSize: 13,
    fontWeight: '500',
  },

  selectionInfo: {
    fontSize: 13,
    color: MUTED,
    marginTop: 12,
    fontStyle: 'italic',
  },

  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendTxt: {
    fontSize: 12,
    color: MUTED,
  },

  // Meeting Purpose
  dropdownBtn: {
    height: 48,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // Participants
  counterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  counterBtn: {
    width: 48,
    height: 48,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnTxt: {
    fontSize: 20,
    color: DARK,
    fontWeight: '500',
  },
  counterDisplay: {
    flex: 1,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  counterVal: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  counterLbl: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  // Text Area
  textArea: {
    height: 100,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: DARK,
  },

  inputBox: {
    height: 48,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
  },

  // Warning
  warningRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  warningIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  warningInfo: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  warningSub: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
  },
  warningBtn: {
    backgroundColor: BRAND,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  warningBtnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  footerLbl: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 4,
  },
  footerBalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  footerBalBold: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND,
  },
  footerBalSub: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 4,
  },
  rechargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  rechargeBtnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
