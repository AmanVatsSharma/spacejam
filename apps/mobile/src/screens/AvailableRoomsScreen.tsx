/**
 * File:        apps/mobile/src/screens/AvailableRoomsScreen.tsx
 * Module:      Mobile · Screens · Rooms
 * Purpose:     Polished available rooms screen with staggered card entrances and image placeholders
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { GET_SEATS } from '../lib/apollo/operations';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  Animated,
  Image,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Polyline, Circle, Rect, Line, Polygon } from 'react-native-svg';

import { PolishedCard } from '../components/PolishedCard';
import { StatusPill } from '../components/StatusPill';

import { palette, space, radius, elevation, duration } from '../theme/tokens';
import { useFadeIn, useSlideIn, staggerDelay, usePressFeedback } from '../theme/animations';
import FilterModal from './FilterModal';
import LocationModal from './LocationModal';
import DateTimeModal from './DateTimeModal';

const ROOM_IMAGE_1 = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';
const ROOM_IMAGE_2 = 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=800';

export default function AvailableRoomsScreen() {
  const navigation = useNavigation<any>();

  const [showFilter, setShowFilter] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showDateTime, setShowDateTime] = useState(false);

  const { data, loading } = useQuery(GET_SEATS);

  const headerSlide = useSlideIn('down', 0, 20, duration.slow);
  const filterSlide = useSlideIn('down', 100, 16, duration.slow);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <Animated.View style={headerSlide}>
        <PolishedCard
          elevation="brand"
          borderRadius={radius.xl}
          padding={0}
          style={{ marginHorizontal: space.lg, marginTop: space.lg, padding: 0, backgroundColor: palette.brand }}
        >
          <View style={styles.headerCard}>
            <View style={styles.headerTop}>
              <BackButton onPress={() => navigation.goBack()} />
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Available Rooms</Text>
                <Text style={styles.headerSub}>Book rooms for your team with just a few taps</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableWithoutFeedback onPress={() => setShowLocation(true)}>
              <View style={styles.locationSelector}>
                <View style={styles.locLeft}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <Circle cx="12" cy="10" r="3" />
                  </Svg>
                  <View>
                    <Text style={styles.locTitle}>X11 Space</Text>
                    <Text style={styles.locSub}>Mohali</Text>
                  </View>
                </View>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="6 9 12 15 18 9" />
                </Svg>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </PolishedCard>
      </Animated.View>

      {/* Filters Row */}
      <Animated.View style={[styles.filterRow, filterSlide]}>
        <FilterButton onPress={() => setShowFilter(true)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterPill label="Today" />
          <FilterPill label="12:30 pm • 30m" />
        </ScrollView>
      </Animated.View>

      {/* Room Cards */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>Loading rooms...</Text>
        ) : !data?.seats || data.seats.length === 0 ? (
          <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>No rooms available</Text>
        ) : (
          data.seats.map((seat: any, i: number) => (
            <RoomCard
              key={seat.id}
              image={i % 2 === 0 ? ROOM_IMAGE_1 : ROOM_IMAGE_2}
              name={seat.floor?.center?.name || 'Center'}
              details={`${seat.name} • ${seat.seatType}`}
              status="Available"
              features={['WiFi', 'Display', 'Whiteboard']}
              onPress={() => navigation.navigate('BookingDetails', { seatId: seat.id })}
              onCalendarPress={() => setShowDateTime(true)}
              index={i}
            />
          ))
        )}
      </ScrollView>

      <FilterModal visible={showFilter} onClose={() => setShowFilter(false)} />
      <LocationModal visible={showLocation} onClose={() => setShowLocation(false)} />
      <DateTimeModal visible={showDateTime} onClose={() => setShowDateTime(false)} />
    </SafeAreaView>
  );
}

// ─── Back Button ──────────────────────────────────────────────────────────────

const BackButton = ({ onPress }: { onPress: () => void }) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.88, speed: 80 });
  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={{ transform: [{ scale: pressIn ? 0.88 : 1 }], marginRight: 12 }}>
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M19 12H5M12 19l-7-7 7-7" />
        </Svg>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ─── Filter Button ───────────────────────────────────────────────────────────

const FilterButton = ({ onPress }: { onPress: () => void }) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.92, speed: 100 });
  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[styles.filterBtn, { transform: [{ scale: pressIn ? 0.92 : 1 }] }]}>
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const FilterPill = ({ label }: { label: string }) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.96, speed: 80 });
  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[styles.pillDropdown, { transform: [{ scale: pressIn ? 0.96 : 1 }] }]}>
        <Text style={styles.pillTxt}>{label}</Text>
        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="6 9 12 15 18 9" />
        </Svg>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ─── Room Card ────────────────────────────────────────────────────────────────

const RoomCard = ({ image, name, details, status, features, onPress, onCalendarPress, index }: any) => {
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 200, 100), { fromY: 16 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageOpacity = React.useRef(new Animated.Value(0)).current;

  const onImageLoad = () => {
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    setImageLoaded(true);
  };

  const variant = status === 'Available' ? 'available' : 'ongoing';

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <PolishedCard elevation="raised" borderRadius={radius.xl} padding={0} style={{ marginBottom: 20, overflow: 'hidden' }}>
        <View style={styles.imgWrapper}>
          {/* Skeleton placeholder */}
          {!imageLoaded && <View style={styles.imgPlaceholder} />}
          <Animated.View style={{ opacity: imageOpacity, width: '100%', height: '100%' }}>
            <Image source={{ uri: image }} style={styles.img} onLoad={onImageLoad} />
          </Animated.View>
          <View style={styles.imgOverlay}>
            <View>
              <Text style={styles.roomName}>{name}</Text>
              <Text style={styles.roomDetails}>{details}</Text>
            </View>
            <StatusPill label={status} variant={variant as any} />
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.featuresRow}>
            {features.map((feat: string, i: number) => (
              <View key={i} style={styles.featPill}>
                <Text style={styles.featTxt}>{feat}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <BookButton label="Book Now" onPress={onPress} />
            <IconBtn color={palette.teal} onPress={onCalendarPress} icon="calendar" />
            <IconBtn color={palette.teal} onPress={onPress} icon="bolt" />
          </View>
        </View>
      </PolishedCard>
    </Animated.View>
  );
};

// ─── Book Button ──────────────────────────────────────────────────────────────

const BookButton = ({ label, onPress }: any) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.96, speed: 100 });
  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[styles.bookBtn, { transform: [{ scale: pressIn ? 0.96 : 1 }] }]}>
        <Text style={styles.bookBtnTxt}>{label}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ─── Icon Button ──────────────────────────────────────────────────────────────

const IconBtn = ({ color, onPress, icon }: any) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.92, speed: 80 });
  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[styles.iconBtn, { transform: [{ scale: pressIn ? 0.92 : 1 }] }]}>
        {icon === 'calendar' ? (
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <Line x1="16" y1="2" x2="16" y2="6" />
            <Line x1="8" y1="2" x2="8" y2="6" />
            <Line x1="3" y1="10" x2="21" y2="10" />
          </Svg>
        ) : (
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </Svg>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  headerCard: {
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  locationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    marginTop: 20,
    marginBottom: 16,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...elevation.raised,
  },
  filterScroll: {
    gap: 12,
    paddingRight: space.lg,
  },
  pillDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    gap: 8,
    backgroundColor: palette.surface,
  },
  pillTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.ink,
  },
  scrollContent: {
    paddingHorizontal: space.lg,
    paddingBottom: 40,
  },

  // Room Card
  imgWrapper: {
    height: 200,
    position: 'relative',
    backgroundColor: palette.borderSoft,
  },
  imgPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.borderSoft,
  },
  img: {
    width: '100%',
    height: '100%',
  },
  imgOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  roomName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  roomDetails: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  cardBody: {
    padding: 16,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  featPill: {
    backgroundColor: palette.surfaceSub,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  featTxt: {
    fontSize: 12,
    color: palette.muted,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookBtn: {
    flex: 1,
    backgroundColor: palette.brand,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    borderRadius: radius.md,
    ...elevation.brand,
  },
  bookBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surface,
  },
});