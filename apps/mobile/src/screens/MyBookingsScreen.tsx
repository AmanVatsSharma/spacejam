/**
 * File:        apps/mobile/src/screens/MyBookingsScreen.tsx
 * Module:      Mobile · Screens · MyBookings
 * Purpose:     Polished bookings list with staggered entrances and tab navigation
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */
import React, { useState } from 'react';
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
import { FloatingNavBar, type NavTab } from '../components/FloatingNavBar';

import { palette, space, radius, elevation } from '../theme/tokens';
import { useFadeIn, useSlideIn, staggerDelay, usePressFeedback } from '../theme/animations';

export default function MyBookingsScreen({
  onBack,
  onNavigate,
}: {
  onBack: () => void;
  onNavigate: (s: string) => void;
}) {
  const [activeNav, setActiveNav] = useState<NavTab>('bookings');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const headerSlide = useSlideIn('down', 0, 16, duration.slow);

  const handleNavChange = (tab: NavTab) => {
    setActiveNav(tab);
    const map: Record<string, string> = { home: 'Home', events: 'Events', bookings: 'MyBookings', profile: 'Profile' };
    onNavigate(map[tab]);
  };

  const upcoming = [
    { id: 1, icon: 'door', title: 'Ocean View - MR-201', details: 'Meeting Room • 2 hrs', date: '10 Dec 2025 • 10:00 AM', status: 'Booked' },
    { id: 2, icon: 'desk', title: 'Garden Suite - MR-105', details: 'Meeting Room • 1.5 hrs', date: '14 Dec 2025 • 3:00 PM', status: 'Booked' },
  ];

  const history = [
    { id: 3, icon: 'desk', title: 'Desk 12 - Open Area', details: 'Open Desk • 8 hrs', date: '2 Dec 2025 • 09:00 AM', status: 'Completed', amount: '₹650' },
  ];

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
                    <Text style={styles.locTitle}>X11 Space</Text>
                    <Text style={styles.locSub}>Mohali</Text>
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
          {items.map((item, i) => (
            <BookingItem key={item.id} item={item} index={i} onPress={() => onNavigate('MyRoomDetails')} />
          ))}
        </View>
      </ScrollView>

      <FloatingNavBar activeTab={activeNav} onTabChange={handleNavChange} />
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