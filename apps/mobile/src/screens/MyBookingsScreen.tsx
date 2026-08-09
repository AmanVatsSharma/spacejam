/**
 * File:        apps/mobile/src/screens/MyBookingsScreen.tsx
 * Module:      Mobile · Screens · MyBookings
 * Purpose:     Polished bookings list with staggered entrances and tab navigation
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */
import React, { useState, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MY_BOOKINGS, GET_MY_CENTERS } from '../lib/apollo/operations';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Animated,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg';

import { PolishedCard } from '../components/PolishedCard';
import { StatusPill } from '../components/StatusPill';

import { palette, space, radius, elevation, duration } from '../theme/tokens';
import { useFadeIn, useSlideIn, staggerDelay, usePressFeedback } from '../theme/animations';

// Format a booking's date from the real startDate/endDate fields on the
// GET_MY_BOOKINGS selection (the old code read b.date/b.startTime which don't
// exist in the query — producing "Invalid Date"). Handles monthly (multi-day)
// and hourly bookings gracefully.
const fmtBookingDate = (b: any): string => {
  const start = b.startDate ? new Date(b.startDate) : null;
  const end = b.endDate ? new Date(b.endDate) : null;
  if (!start) return '';
  const sameDay = end && start.toDateString() === end.toDateString();
  const dateStr = start.toLocaleDateString();
  if (sameDay || !end) {
    // Hourly same-day booking — show the time range too.
    const timeStr = end
      ? `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} • ${timeStr}`;
  }
  // Monthly / multi-day — show the range.
  return `${dateStr} → ${end.toLocaleDateString()}`;
};

export default function MyBookingsScreen() {
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const headerSlide = useSlideIn('down', 0, 16, duration.slow);

  const { data, loading, refetch } = useQuery(GET_MY_BOOKINGS);
  const { data: centersData } = useQuery(GET_MY_CENTERS);
  const centerName = centersData?.myCenters?.[0]?.name ?? 'Your Center';

  const upcoming = useMemo(() => {
    if (!data?.myBookings) return [];
    return data.myBookings
      .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING')
      .map((b: any) => ({
        id: b.id,
        icon: 'door', // simplistic map
        title: `${b.seat?.floor?.name || ''} - ${b.seat?.name || ''}`,
        details: `${b.center?.name || b.seat?.floor?.center?.name || 'Center'}`,
        date: fmtBookingDate(b),
        status: b.status,
      }));
  }, [data]);

  const history = useMemo(() => {
    if (!data?.myBookings) return [];
    return data.myBookings
      .filter((b: any) => b.status === 'COMPLETED' || b.status === 'CANCELLED')
      .map((b: any) => ({
        id: b.id,
        icon: 'desk',
        title: `${b.seat?.floor?.name || ''} - ${b.seat?.name || ''}`,
        details: `${b.center?.name || b.seat?.floor?.center?.name || 'Center'}`,
        date: fmtBookingDate(b),
        status: b.status,
        amount: 'Paid',
      }));
  }, [data]);

  const items = activeTab === 'upcoming' ? upcoming : history;

  return (
    <View style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={headerSlide}>
          <PolishedCard elevation="brand" borderRadius={radius.xl} style={{ backgroundColor: palette.brand }}>
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>My Bookings</Text>
              <Text style={styles.headerSub}>Manage and track your reservations</Text>
              <View style={styles.headerDivider} />
              <View style={styles.headerLocRow}>
                <View style={styles.locLeft}>
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <Circle cx="12" cy="10" r="3" />
                  </Svg>
                  <View style={styles.locTexts}>
                    <Text style={styles.locTitle}>{centerName}</Text>
                    <Text style={styles.locSub}>My bookings</Text>
                  </View>
                </View>
              </View>
            </View>
          </PolishedCard>
        </Animated.View>

        {/* Tabs */}
        <Animated.View style={useSlideIn('down', 120, 12, duration.slow)}>
          <View style={styles.tabRow}>
            {(['upcoming', 'history'] as const).map((tab) => (
              <TabBtn
                key={tab}
                label={tab === 'upcoming' ? 'Upcoming' : 'History'}
                active={activeTab === tab}
                onPress={() => setActiveTab(tab)}
                index={tab === 'upcoming' ? 0 : 1}
              />
            ))}
          </View>
        </Animated.View>

        {/* List */}
        <View style={styles.list}>
          {loading ? (
            <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>Loading...</Text>
          ) : items.length === 0 ? (
            <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>No {activeTab} bookings</Text>
          ) : (
            items.map((item: any, i: number) => (
              <BookingItem 
                key={item.id} 
                item={item} 
                index={i} 
                onPress={() => navigation.navigate('MyRoomDetails', { bookingId: item.id })} 
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FloatingNavBar is inside TabNavigator for home flow */}
    </View>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

const TabBtn = ({ label, active, onPress, index }: any) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.96, speed: 80 });
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 200, 60), { fromY: 8 });

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
        <Animated.View style={{ transform: [{ scale: pressIn ? 0.96 : 1 }] }}>
          <View style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}>
            <Text style={[styles.tabTxt, active ? styles.tabTxtActive : null]}>{label}</Text>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ─── Booking Item ─────────────────────────────────────────────────────────────

const BookingItem = ({ item, index, onPress }: any) => {
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 300, 100), { fromY: 16 });
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.985, speed: 80 });

  const iconColor = item.icon === 'door' ? palette.brand : palette.teal;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
        <PolishedCard elevation="subtle" borderRadius={radius.lg}>
          <View style={styles.bkItem}>
            <View style={[styles.bkIconBox, { backgroundColor: iconColor + '18' }]}>
              {item.icon === 'door' ? (
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8">
                  <Rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                  <Path d="M9 22v-4h6v4" />
                </Svg>
              ) : (
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8">
                  <Rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
                  <Path d="M6 17v4M18 17v4M6 7V3M18 7V3" />
                </Svg>
              )}
            </View>
            <View style={[styles.bkContent, { marginLeft: 16 }]}>
              <View style={[styles.bkTopRow, { marginBottom: 4 }]}>
                <Text style={styles.bkTitle}>{item.title}</Text>
              </View>
              <Text style={styles.bkDetails}>{item.details}</Text>
              <View style={styles.bkBottomRow}>
                <View style={[styles.bkPill, { marginRight: 8 }]}>
                  <Text style={styles.bkPillTxt}>{item.status}</Text>
                </View>
                {item.amount && (
                  <Text style={[styles.bkAmount, { color: palette.brand }]}>{item.amount}</Text>
                )}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.mutedSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="9 18 15 12 9 6" />
              </Svg>
              <Text style={styles.bkDate}>{item.date}</Text>
            </View>
          </View>
        </PolishedCard>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scrollContent: {
    padding: space.lg,
    paddingBottom: 120,
  },
  headerCard: {
    padding: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 16,
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  headerLocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locTexts: {
    flex: 1,
  },
  locTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  locSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 24,
  },
  tab: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: palette.brand,
  },
  tabInactive: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  tabTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.muted,
  },
  tabTxtActive: {
    color: '#fff',
  },
  list: {
    gap: 16,
  },
  bkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bkIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bkContent: {
    flex: 1,
  },
  bkTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink,
    flex: 1,
  },
  bkDetails: {
    fontSize: 13,
    color: palette.muted,
    marginBottom: 8,
  },
  bkBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  bkPill: {
    backgroundColor: palette.brandWash,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  bkPillTxt: {
    fontSize: 11,
    color: palette.brand,
    fontWeight: '600',
  },
  bkAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  bkDate: {
    fontSize: 11,
    color: palette.muted,
  },
});