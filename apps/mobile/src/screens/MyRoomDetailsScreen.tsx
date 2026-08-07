import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation } from '@apollo/client';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { GET_MY_BOOKINGS, CANCEL_BOOKING_MUTATION, EXTEND_BOOKING_MUTATION } from '../lib/apollo/operations';

/**
 * File:        MyRoomDetailsScreen.tsx
 * Module:      Mobile · My Room Details
 * Purpose:     Show the user's active booking details for a specific room
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-07
 */

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function MyRoomDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const roomId = route.params?.roomId;
  const bookingIdParam = route.params?.bookingId;

  const { data, loading, error } = useQuery(GET_MY_BOOKINGS);

  const [cancelBooking, { loading: cancelLoading }] = useMutation(
    CANCEL_BOOKING_MUTATION,
    {
      onCompleted: () => {
        Toast.show({ type: 'success', text1: 'Booking cancelled successfully' });
      },
      onError: (err) => {
        Toast.show({ type: 'error', text1: 'Cancellation failed', text2: err.message });
      },
      refetchQueries: [{ query: GET_MY_BOOKINGS }],
    }
  );

  const [extendBooking, { loading: extendLoading }] = useMutation(
    EXTEND_BOOKING_MUTATION,
    {
      onError: (err) => {
        Toast.show({ type: 'error', text1: 'Extension failed', text2: err.message });
      },
      refetchQueries: [{ query: GET_MY_BOOKINGS }],
    }
  );

  // Find the active booking — match by bookingId if provided, else by roomId.
  const booking = React.useMemo(() => {
    if (!data?.myBookings) return null;
    if (bookingIdParam) {
      return (
        data.myBookings.find((b: any) => b.id === bookingIdParam) || null
      );
    }
    if (!roomId) return null;
    return (
      data.myBookings.find(
        (b: any) =>
          b.meetingRoom?.id === roomId &&
          ['CONFIRMED', 'ONGOING', 'ACTIVE'].includes(b.status)
      ) || null
    );
  }, [data, roomId, bookingIdParam]);

  // Live countdown to the booking end time.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  useEffect(() => {
    if (!booking?.endDate) return;
    const tick = () => {
      const ms = new Date(booking.endDate).getTime() - Date.now();
      setRemainingMs(ms > 0 ? ms : 0);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [booking?.endDate]);

  const formatCountdown = (ms: number | null) => {
    if (ms == null) return '--:--:--';
    const totalSec = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleExtend = () => {
    if (!booking?.endDate) return;
    const currentEnd = new Date(booking.endDate);
    const newEnd = new Date(currentEnd.getTime() + 60 * 60 * 1000); // +1 hour
    Alert.alert(
      'Extend Booking',
      `Extend this booking by 1 hour to ${newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Extend',
          onPress: async () => {
            try {
              await extendBooking({ variables: { id: booking.id, endTime: newEnd.toISOString() } });
              Toast.show({ type: 'success', text1: 'Booking extended by 1 hour' });
            } catch {
              // onError already toasted.
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (!booking) return;
    cancelBooking({ variables: { id: booking.id } });
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BRAND} />
          <Text style={styles.loadingText}>Loading booking…</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load booking.</Text>
          <Text style={styles.errorSub}>{error.message}</Text>
        </View>
      );
    }

    if (!booking) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No active booking</Text>
          <Text style={styles.emptySub}>
            You don't have an active booking for this room right now.
          </Text>
          <TouchableOpacity
            style={styles.backToRoomsBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToRoomsTxt}>Browse Rooms</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const seatLabel = booking.seat?.name || '—';
    const floorLabel = booking.seat?.floor?.name || '—';
    const centerLabel = booking.center?.name || '—';

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Timer Section */}
        <View style={styles.timerContainer}>
          <View style={styles.timerWrapper}>
            <Svg width="200" height="200" viewBox="0 0 200 200">
              <Circle
                cx="100"
                cy="100"
                r="80"
                stroke="#FFF0EB"
                strokeWidth="12"
                fill="none"
              />
              <Circle
                cx="100"
                cy="100"
                r="80"
                stroke={BRAND}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="150.8 50.3"
                transform="rotate(-90 100 100)"
              />
            </Svg>
            <View style={styles.timerTextOverlay}>
              <Text style={styles.timerTime}>{formatCountdown(remainingMs)}</Text>
              <Text style={styles.timerLabel}>Remaining Time</Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.tag}>
              <Text style={styles.tagTxt}>{booking.status}</Text>
            </View>
            <View style={styles.timeTag}>
              <Svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={BRAND}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 6v6l4 2" />
              </Svg>
              <Text style={styles.timeTagTxt}>Booking active</Text>
            </View>
          </View>

          <Text style={styles.title}>
            {booking.meetingRoom?.name || 'Meeting Room'}
          </Text>

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Seat</Text>
            <Text style={styles.rowVal}>{seatLabel}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Floor</Text>
            <Text style={styles.rowVal}>{floorLabel}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Center</Text>
            <Text style={styles.rowVal}>{centerLabel}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Date</Text>
            <Text style={styles.rowVal}>{formatDate(booking.startDate)}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Start Time</Text>
            <Text style={styles.rowVal}>{formatTime(booking.startDate)}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>End Time</Text>
            <Text style={styles.rowVal}>{formatTime(booking.endDate)}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Status</Text>
            <Text style={[styles.rowVal, { color: BRAND }]}>{booking.status}</Text>
          </View>

          <TouchableOpacity
            style={styles.extendBtn}
            activeOpacity={0.8}
            onPress={handleExtend}
            disabled={extendLoading}
          >
            <Text style={styles.extendBtnTxt}>{extendLoading ? 'Extending...' : 'Extend Booking (+1h)'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.8}
            onPress={handleCancel}
            disabled={cancelLoading}
          >
            <Text style={styles.cancelBtnTxt}>
              {cancelLoading ? 'Cancelling…' : 'Cancel Booking'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={DARK}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Room Details</Text>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginLeft: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: MUTED,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
    textAlign: 'center',
  },
  errorSub: {
    marginTop: 8,
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },
  backToRoomsBtn: {
    marginTop: 24,
    backgroundColor: BRAND,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  backToRoomsTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  timerWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  timerTextOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerTime: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0A1B3F',
  },
  timerLabel: {
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagTxt: {
    color: BRAND,
    fontSize: 13,
    fontWeight: '600',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeTagTxt: {
    color: BRAND,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLbl: {
    fontSize: 15,
    color: MUTED,
  },
  rowVal: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
  extendBtn: {
    backgroundColor: BRAND,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  extendBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#fff',
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  cancelBtnTxt: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
