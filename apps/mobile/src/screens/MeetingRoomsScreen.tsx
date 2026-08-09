/**
 * File:        apps/mobile/src/screens/MeetingRoomsScreen.tsx
 * Module:      Mobile · Screens · Meeting Rooms
 * Purpose:     Standalone meeting-room booking — wires the previously-unused
 *              GET_MEETING_ROOMS query into a reachable screen. Lists a
 *              center's meeting rooms, lets the user pick a date + time slot,
 *              and books via BOOK_ROOM_MUTATION. Replaces the orphan
 *              QuickBookingScreen (which booked seats despite its name).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@apollo/client';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  SafeAreaView,
  ToastAndroid,
} from 'react-native';

import {
  GET_MEETING_ROOMS,
  GET_MY_CENTERS,
  BOOK_ROOM_MUTATION,
} from '../lib/apollo/operations';
import { palette, space, radius, duration } from '../theme/tokens';
import { useFadeIn, useSlideIn, staggerDelay, usePressFeedback } from '../theme/animations';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function MeetingRoomsScreen() {
  const navigation = useNavigation<any>();

  const { data: centersData } = useQuery(GET_MY_CENTERS);
  const centerId = centersData?.myCenters?.[0]?.id;
  const centerName = centersData?.myCenters?.[0]?.name ?? 'your center';

  const { data, loading } = useQuery(GET_MEETING_ROOMS, {
    variables: { filters: { centerId } },
    skip: !centerId,
  });

  const [bookRoom, { loading: booking }] = useMutation(BOOK_ROOM_MUTATION, {
    onCompleted: () => {
      ToastAndroid.show('Meeting room booked!', ToastAndroid.SHORT);
      navigation.navigate('MyBookingsTab');
    },
    onError: (err) => ToastAndroid.show(err.message || 'Booking failed', ToastAndroid.SHORT),
  });

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [slot, setSlot] = useState<string | null>(null);

  const headerSlide = useSlideIn('down', 0, 16, duration.slow);
  const rooms = (data?.meetingRooms ?? []).filter((r: any) => r.active !== false);

  const handleBook = () => {
    if (!selectedRoom || !slot || !centerId) {
      ToastAndroid.show('Pick a room and a time slot', ToastAndroid.SHORT);
      return;
    }
    const startIdx = TIME_SLOTS.indexOf(slot);
    const endSlot = TIME_SLOTS[Math.min(startIdx + 1, TIME_SLOTS.length - 1)];
    bookRoom({
      variables: {
        roomId: selectedRoom,
        centerId,
        eventDate: date,
        startTime: slot,
        endTime: endSlot,
        title: 'Meeting room booking',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={headerSlide}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Meeting Rooms</Text>
            <Text style={styles.headerSub}>Book a room by the hour at {centerName}</Text>
          </View>
        </Animated.View>

        {/* Date picker (simple: today / tomorrow) */}
        <View style={styles.dateRow}>
          {[0, 1, 2].map((offset) => {
            const d = new Date();
            d.setDate(d.getDate() + offset);
            const val = d.toISOString().slice(0, 10);
            const label =
              offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' });
            return (
              <TouchableOpacity
                key={val}
                onPress={() => setDate(val)}
                style={[styles.datePill, date === val && styles.datePillActive]}
              >
                <Text style={[styles.datePillTxt, date === val && styles.datePillTxtActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={palette.brand} style={{ padding: 24 }} />
        ) : rooms.length === 0 ? (
          <Text style={styles.empty}>No meeting rooms available at this center.</Text>
        ) : (
          rooms.map((r: any, i: number) => (
            <RoomCard
              key={r.id}
              room={r}
              index={i}
              selected={selectedRoom === r.id}
              onSelect={() => setSelectedRoom(r.id)}
            />
          ))
        )}

        {/* Time slots (shown once a room is picked) */}
        {selectedRoom && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pick a time</Text>
            <View style={styles.slotGrid}>
              {TIME_SLOTS.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setSlot(t)}
                  style={[styles.slot, slot === t && styles.slotActive]}
                >
                  <Text style={[styles.slotTxt, slot === t && styles.slotTxtActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableWithoutFeedback onPressIn={() => {}} onPressOut={() => {}} onPress={handleBook} disabled={booking || !selectedRoom || !slot}>
          <View style={[styles.bookBtn, (booking || !selectedRoom || !slot) && { opacity: 0.5 }]}>
            <Text style={styles.bookBtnTxt}>{booking ? 'Booking…' : 'Book room'}</Text>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Room card ──────────────────────────────────────────────────────────────
const RoomCard = ({ room, index, selected, onSelect }: any) => {
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 80, 50), { fromY: 12 });
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.98 });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginBottom: space.md }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onSelect}>
        <View style={[styles.roomCard, selected && styles.roomCardSelected]}>
          <View style={styles.roomHead}>
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.roomRate}>₹{room.hourlyRate ?? '—'}/hr</Text>
          </View>
          <Text style={styles.roomMeta}>
            {room.roomType?.replace(/_/g, ' ') ?? 'Meeting room'} · seats {room.capacity ?? '—'} · {room.status}
          </Text>
          {room.amenities?.length ? (
            <Text style={styles.roomAmenities}>{room.amenities.join(' · ')}</Text>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  scrollContent: { padding: space.lg, paddingBottom: 120 },
  header: { marginBottom: space.md },
  headerTitle: { fontSize: 24, fontWeight: '700', color: palette.ink },
  headerSub: { fontSize: 14, color: palette.muted, marginTop: 4 },
  dateRow: { flexDirection: 'row', gap: 10, marginVertical: space.md },
  datePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  datePillActive: { backgroundColor: palette.brand, borderColor: palette.brand },
  datePillTxt: { fontSize: 13, fontWeight: '600', color: palette.muted },
  datePillTxtActive: { color: '#fff' },
  empty: { fontSize: 14, color: palette.muted, padding: 8 },
  section: { marginTop: space.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: palette.ink, marginBottom: space.sm },
  roomCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
  },
  roomCardSelected: { borderColor: palette.brand, borderWidth: 2 },
  roomHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomName: { fontSize: 16, fontWeight: '700', color: palette.ink, flex: 1 },
  roomRate: { fontSize: 14, fontWeight: '700', color: palette.brand },
  roomMeta: { fontSize: 13, color: palette.muted, marginTop: 4 },
  roomAmenities: { fontSize: 12, color: palette.mutedSoft, marginTop: 4 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  slotActive: { backgroundColor: palette.brand, borderColor: palette.brand },
  slotTxt: { fontSize: 13, fontWeight: '600', color: palette.muted },
  slotTxtActive: { color: '#fff' },
  bookBtn: {
    backgroundColor: palette.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: space.lg,
  },
  bookBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
