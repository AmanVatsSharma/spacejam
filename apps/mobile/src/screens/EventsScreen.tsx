/**
 * File:        apps/mobile/src/screens/EventsScreen.tsx
 * Module:      Mobile · Screens · Events
 * Purpose:     Polished events list with staggered card entrances, press feedback, and shimmer placeholder
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { GET_EVENTS } from '../lib/apollo/operations';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Animated,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Polyline, Circle, Line, Rect } from 'react-native-svg';

import { PolishedCard } from '../components/PolishedCard';
import { StatusPill } from '../components/StatusPill';
import { FloatingNavBar, type NavTab } from '../components/FloatingNavBar';

import { palette, space, radius, elevation, duration } from '../theme/tokens';
import { useFadeIn, useSlideIn, staggerDelay, usePressFeedback, usePulse } from '../theme/animations';

const EVENT_IMG_1 = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800';
const EVENT_IMG_2 = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800';

export default function EventsScreen() {
  const navigation = useNavigation<any>();
  const { data, loading } = useQuery(GET_EVENTS);

  const [activeNav, setActiveNav] = useState<NavTab>('events');

  const handleNavChange = () => {
    setActiveNav(tab);
    const map: Record<string, string> = { home: 'Home', events: 'Events', bookings: 'MyBookings', profile: 'Profile' };
    onNavigate?.(map[tab]);
  };

  const headerSlide = useSlideIn('down', 0, 16, duration.slow);
  const pulse = usePulse({ minScale: 0.8, maxScale: 1.1, duration: 2000 });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Header Card */}
          <Animated.View style={headerSlide}>
            <PolishedCard elevation="brand" borderRadius={radius.xl} style={{ backgroundColor: palette.brand }}>
              <View style={styles.headerCard}>
                <Text style={styles.headerTitle}>Events</Text>
                <Text style={styles.headerSub}>Discover workshops and masterclasses</Text>

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
                  <Animated.View style={{ transform: [{ scale: pulse.scale }] }}>
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <Polyline points="6 9 12 15 18 9" />
                    </Svg>
                  </Animated.View>
                </View>
              </View>
            </PolishedCard>
          </Animated.View>

          {/* Filters */}
          <Animated.View style={useSlideIn('down', 120, 12, duration.slow)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
              <FilterIconBtn />
              <FilterPill label="Today" />
              <FilterPill label="12:30 pm • 30m" />
            </ScrollView>
          </Animated.View>

          {/* Events */}
          {loading ? (
             <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>Loading events...</Text>
          ) : !data?.upcomingEvents || data.upcomingEvents.length === 0 ? (
             <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>No upcoming events</Text>
          ) : (
             data.upcomingEvents.map((evt: any, index: number) => (
                <EventCard
                  key={evt.id}
                  img={index % 2 === 0 ? EVENT_IMG_1 : EVENT_IMG_2}
                  title={evt.title}
                  date={new Date(parseInt(evt.date)).toLocaleDateString()}
                  time={evt.startTime}
                  location="X11 Space, Mohali"
                  presenter={evt.description || 'Host'}
                  role=""
                  price={evt.status}
                  tag="Event"
                  onPress={() => navigation.navigate('EventDetails', { eventId: evt.id })}
                  index={index}
                />
             ))
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* FloatingNavBar is inside TabNavigator for home flow */}
    </View>
  );
}

// ─── Filter Icon Button ───────────────────────────────────────────────────────

const FilterIconBtn = () => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.92, speed: 100 });
  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[styles.filterBtnIcon, { transform: [{ scale: pressIn ? 0.92 : 1 }] }]}>
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Line x1="4" y1="21" x2="4" y2="14" />
          <Line x1="4" y1="10" x2="4" y2="3" />
          <Line x1="12" y1="21" x2="12" y2="12" />
          <Line x1="12" y1="8" x2="12" y2="3" />
          <Line x1="20" y1="21" x2="20" y2="16" />
          <Line x1="20" y1="12" x2="20" y2="3" />
          <Line x1="1" y1="14" x2="7" y2="14" />
          <Line x1="9" y1="8" x2="15" y2="8" />
          <Line x1="17" y1="16" x2="23" y2="16" />
        </Svg>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ─── Filter Pill ──────────────────────────────────────────────────────────────

const Fp = ({ label }: { label: string }) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.96, speed: 80 });
  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[styles.filterPill, { transform: [{ scale: pressIn ? 0.96 : 1 }] }]}>
        <Text style={styles.filterPillTxt}>{label}</Text>
        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="6 9 12 15 18 9" />
        </Svg>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ─── Event Card ───────────────────────────────────────────────────────────────

const EventCard = ({ img, title, date, time, location, presenter, role, price, tag, onPress, index }: any) => {
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 200, 120), { fromY: 16 });
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.985, speed: 100 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageOpacity = React.useRef(new Animated.Value(0)).current;

  const onImageLoad = () => {
    Animated.timing(imageOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    setImageLoaded(true);
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
        <Animated.View style={{ transform: [{ scale: pressIn ? 0.985 : 1 }] }}>
          <PolishedCard elevation="card" borderRadius={radius.xl} style={{ overflow: 'hidden' }}>
            <View style={styles.eventImgWrapper}>
              {!imageLoaded && <View style={styles.imgPlaceholder} />}
              <Animated.View style={{ opacity: imageOpacity, width: '100%', height: '100%' }}>
                <Image source={{ uri: img }} style={styles.eventImg} onLoad={onImageLoad} />
              </Animated.View>
              <StatusPill label={tag} variant="info" />
            </View>

            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>{title}</Text>

              <View style={styles.eventRow}>
                <InfoItem icon="calendar" text={date} />
                <Text style={styles.eventDot}>•</Text>
                <InfoItem icon="clock" text={time} />
              </View>

              <View style={styles.eventRow}>
                <InfoItem icon="location" text={location} />
              </View>

              <View style={styles.eventDivider} />

              <View style={styles.eventFooter}>
                <View style={styles.presenterRow}>
                  <View style={styles.presenterAvatar}>
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <Circle cx="12" cy="7" r="4" />
                    </Svg>
                  </View>
                  <View>
                    <Text style={styles.presenterName}>{presenter}</Text>
                    <Text style={styles.presenterRole}>{role}</Text>
                  </View>
                </View>
                <Text style={styles.eventPrice}>{price}</Text>
              </View>
            </View>
          </PolishedCard>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const InfoItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.eventInfoItem}>
    {icon === 'calendar' && (
      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={palette.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <Line x1="16" y1="2" x2="16" y2="6" />
        <Line x1="8" y1="2" x2="8" y2="6" />
        <Line x1="3" y1="10" x2="21" y2="10" />
      </Svg>
    )}
    {icon === 'clock' && (
      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={palette.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="10" />
        <Polyline points="12 6 12 12 16 14" />
      </Svg>
    )}
    {icon === 'location' && (
      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={palette.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <Circle cx="12" cy="10" r="3" />
      </Svg>
    )}
    <Text style={styles.eventInfoTxt}>{text}</Text>
  </View>
);

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.lg,
    paddingTop: 16,
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
  filtersRow: {
    gap: 12,
    marginBottom: 24,
    marginTop: 8,
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  filterBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.raised,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    gap: 8,
  },
  filterPillTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.ink,
  },
  eventCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    marginBottom: 20,
    overflow: 'hidden',
  },
  eventImgWrapper: {
    width: '100%',
    height: 160,
    position: 'relative',
    backgroundColor: palette.borderSoft,
  },
  eventImg: {
    width: '100%',
    height: '100%',
  },
  imgPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.borderSoft,
  },
  eventTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  eventTagTxt: {
    color: palette.brand,
    fontSize: 12,
    fontWeight: '700',
  },
  eventDetails: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 12,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventInfoTxt: {
    fontSize: 13,
    color: palette.muted,
  },
  eventDot: {
    fontSize: 16,
    color: palette.mutedSoft,
    marginHorizontal: 8,
  },
  eventDivider: {
    height: 1,
    backgroundColor: palette.borderSoft,
    marginVertical: 16,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presenterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presenterName: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.ink,
  },
  presenterRole: {
    fontSize: 12,
    color: palette.muted,
  },
  eventPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.brand,
  },
});