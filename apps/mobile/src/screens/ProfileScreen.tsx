/**
 * File:        apps/mobile/src/screens/ProfileScreen.tsx
 * Module:      Mobile · Screens · Profile
 * Purpose:     Animated profile screen with staggered menu entrances and press feedback
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
} from 'react-native';
import Svg, { Path, Circle, Polyline, Line, Rect } from 'react-native-svg';

import { PolishedCard } from '../components/PolishedCard';
import { FloatingNavBar, type NavTab } from '../components/FloatingNavBar';
import { StatusPill } from '../components/StatusPill';

import { palette, space, radius, elevation, type as typeScale } from '../theme/tokens';
import { useFadeIn, useSlideIn, staggerDelay, usePressFeedback } from '../theme/animations';

export default function ProfileScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [activeNav, setActiveNav] = useState<NavTab>('profile');

  const handleNavChange = (tab: NavTab) => {
    setActiveNav(tab);
    const map: Record<string, string> = { home: 'Home', events: 'Events', bookings: 'MyBookings', profile: 'Profile' };
    onNavigate(map[tab]);
  };

  const menuItems = [
    { id: 'EditProfile', title: 'Personal Info', icon: 'user' },
    { id: 'NotificationSettings', title: 'Notification Settings', icon: 'bell' },
    { id: 'Terms', title: 'Terms & Conditions', icon: 'document' },
    { id: 'About', title: 'About', icon: 'info' },
    { id: 'Support', title: 'Support & Feedback', icon: 'chat' },
  ];

  const iconMap: Record<string, React.ReactNode> = {
    user: (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle cx="12" cy="7" r="4" />
      </Svg>
    ),
    bell: (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </Svg>
    ),
    document: (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <Polyline points="14 2 14 8 20 8" />
        <Line x1="16" y1="13" x2="8" y2="13" />
        <Line x1="16" y1="17" x2="8" y2="17" />
        <Polyline points="10 9 9 9 8 9" />
      </Svg>
    ),
    info: (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="10" />
        <Line x1="12" y1="16" x2="12" y2="12" />
        <Line x1="12" y1="8" x2="12.01" y2="8" />
      </Svg>
    ),
    chat: (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <Path d="M9 9h.01" />
        <Path d="M15 9h.01" />
        <Path d="M12 13.5a2.5 2.5 0 0 0-2.5-2.5" />
      </Svg>
    ),
  };

  const headerFade = useSlideIn('down', 0, 20, duration.slow);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Profile Header */}
        <Animated.View style={headerFade}>
          <ProfileHeader onEdit={() => onNavigate('EditProfile')} />
        </Animated.View>

        <View style={styles.divider} />

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, i) => (
            <MenuRow
              key={item.id}
              item={item}
              index={i}
              onPress={() => onNavigate(item.id)}
            />
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <FloatingNavBar activeTab={activeNav} onTabChange={handleNavChange} />
    </View>
  );
}

// ─── Profile Header ───────────────────────────────────────────────────────────

const ProfileHeader = ({ onEdit }: { onEdit: () => void }) => {
  const { pressIn: editPressIn, pressOut: editPressOut } = usePressFeedback({ scale: 0.92, speed: 100 });
  const { opacity: avatarOp, translateY: avatarY } = useFadeIn(0, { fromY: 16 });
  const { opacity: textOp, translateY: textY } = useFadeIn(100, { fromY: 12 });

  return (
    <View style={styles.profileHeader}>
      <Animated.View style={{ opacity: avatarOp, transform: [{ translateY: avatarY }], marginBottom: 16 }}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <Circle cx="12" cy="7" r="4" />
            </Svg>
          </View>
          <TouchableWithoutFeedback onPressIn={editPressIn} onPressOut={editPressOut} onPress={onEdit}>
            <Animated.View style={{ transform: [{ scale: editPressIn ? 0.92 : 1 }] }}>
              <View style={styles.cameraIcon}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <Circle cx="12" cy="13" r="4" />
                </Svg>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: textOp, transform: [{ translateY: textY }], alignItems: 'center' }}>
        <Text style={styles.name}>Rahul Sharma</Text>
        <Text style={styles.role}>Center Manager</Text>
        <Text style={styles.company}>Tech Innovations Pvt Ltd</Text>
      </Animated.View>
    </View>
  );
};

// ─── Menu Row ─────────────────────────────────────────────────────────────────

const MenuRow = ({ item, index, onPress }: any) => {
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 200, 70), { fromY: 10 });
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.985, speed: 80 });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
        <PolishedCard elevation="subtle" borderRadius={radius.md} padding={16}>
          <View style={styles.menuItemInner}>
            <View style={styles.menuIconContainer}>
              {item.icon === 'user' && (
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <Circle cx="12" cy="7" r="4" />
                </Svg>
              )}
              {item.icon === 'bell' && (
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </Svg>
              )}
              {item.icon === 'document' && (
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <Polyline points="14 2 14 8 20 8" />
                  <Line x1="16" y1="13" x2="8" y2="13" />
                  <Line x1="16" y1="17" x2="8" y2="17" />
                </Svg>
              )}
              {item.icon === 'info' && (
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="10" />
                  <Line x1="12" y1="16" x2="12" y2="12" />
                  <Line x1="12" y1="8" x2="12.01" y2="8" />
                </Svg>
              )}
              {item.icon === 'chat' && (
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <Path d="M9 9h.01" />
                  <Path d="M15 9h.01" />
                  <Path d="M12 13.5a2.5 2.5 0 0 0-2.5-2.5" />
                </Svg>
              )}
            </View>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.mutedSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="9 18 15 12 9 6" />
            </Svg>
          </View>
        </PolishedCard>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 120,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: space.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: palette.brand,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.raised,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: palette.brand,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: palette.surface,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 4,
  },
  role: {
    fontSize: 15,
    color: palette.muted,
    marginBottom: 2,
  },
  company: {
    fontSize: 15,
    color: palette.muted,
  },

  divider: {
    height: 1,
    backgroundColor: palette.borderSoft,
    marginVertical: 24,
    marginHorizontal: space.lg,
  },

  // Menu
  menuContainer: {
    paddingHorizontal: space.lg,
    gap: 12,
  },
  menuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.brandWash,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: palette.ink,
  },
});