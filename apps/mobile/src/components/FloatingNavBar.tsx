/**
 * File:        apps/mobile/src/components/FloatingNavBar.tsx
 * Module:      Mobile · Components · Navigation
 * Purpose:     Shared floating bottom navigation with micro-animations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import Svg, { Path, Polyline, Rect, Circle, Line } from 'react-native-svg';
import { palette, type as typeScale, elevation, pressScale, duration, easing } from '../theme/tokens';
import { usePressFeedback, usePulse } from '../theme/animations';

export type NavTab = 'home' | 'events' | 'bookings' | 'profile';

export interface NavTabConfig {
  key: NavTab;
  label: string;
  icon: (props: IconProps) => React.ReactNode;
  activeIcon: (props: IconProps) => React.ReactNode;
}

export interface IconProps {
  color: string;
  strokeWidth?: number;
  filled?: boolean;
}

// ─── Built-in Icons ────────────────────────────────────────────────────────────

export const icons: Record<string, (p: IconProps) => React.ReactNode> = {
  home: ({ color, strokeWidth = 1.8 }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  ),
  events: ({ color, strokeWidth = 1.8 }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
      <Line x1="7" y1="14" x2="17" y2="14" />
      <Line x1="7" y1="18" x2="13" y2="18" />
    </Svg>
  ),
  bookings: ({ color, strokeWidth = 1.8 }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="3" width="16" height="18" rx="4" ry="4" />
      <Path d="M9 8h4a2 2 0 0 1 0 4H9V8z" />
      <Path d="M9 14h4a2 2 0 0 1 0 4H9v-4z" />
      <Circle cx="16" cy="15" r="1.5" fill={color} stroke="none" />
    </Svg>
  ),
  profile: ({ color, strokeWidth = 1.8 }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  ),
};

// ─── Tab Configs ───────────────────────────────────────────────────────────────

const TABS: NavTabConfig[] = [
  {
    key: 'home',
    label: 'Home',
    icon: (p) => icons.home({ ...p, strokeWidth: 1.8 }),
    activeIcon: (p) => icons.home({ ...p, filled: true }),
  },
  {
    key: 'events',
    label: 'Events',
    icon: (p) => icons.events({ ...p, strokeWidth: 1.8 }),
    activeIcon: (p) => icons.events({ ...p, filled: true }),
  },
  {
    key: 'bookings',
    label: 'Bookings',
    icon: (p) => icons.bookings({ ...p, strokeWidth: 1.8 }),
    activeIcon: (p) => icons.bookings({ ...p, filled: true }),
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: (p) => icons.profile({ ...p, strokeWidth: 1.8 }),
    activeIcon: (p) => icons.profile({ ...p, filled: true }),
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

interface FloatingNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {TABS.map((tab) => (
          <NavTabItem
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onPress={() => onTabChange(tab.key)}
          />
        ))}
      </View>
    </View>
  );
};

// ─── Nav Tab Item ─────────────────────────────────────────────────────────────

interface NavTabItemProps {
  tab: NavTabConfig;
  isActive: boolean;
  onPress: () => void;
}

const NavTabItem: React.FC<NavTabItemProps> = ({ tab, isActive, onPress }) => {
  const { scaleAnim, pressIn, pressOut } = usePressFeedback({
    scale: pressScale.light,
    speed: 100,
  });

  // Pulse animation on active indicator dot
  const pulse = usePulse({ minScale: 0.7, maxScale: 1, duration: 2000 });

  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[styles.tabItem, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconBox}>
          <Animated.View style={isActive && { transform: [{ scale: pulse.scale }] }}>
            {isActive ? tab.activeIcon({ color: palette.ink, filled: true }) : tab.icon({ color: palette.mutedSoft })}
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            styles.label,
            isActive ? styles.labelActive : styles.labelInactive,
          ]}
        >
          {tab.label}
        </Animated.Text>

        {isActive && (
          <Animated.View style={[styles.indicator, { transform: [{ scale: pulse.scale }] }]} />
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  track: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(215,212,210,0.88)',
    borderRadius: 40,
    width: '92%',
    paddingVertical: 14,
    paddingHorizontal: 8,
    ...elevation.floating,
    borderWidth: 1,
    borderColor: palette.whiteTranslucent,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  iconBox: {
    marginBottom: 6,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  labelActive: {
    fontSize: 12,
    color: palette.ink,
    fontWeight: '700',
  },
  labelInactive: {
    fontSize: 11,
    color: palette.mutedSoft,
    fontWeight: '500',
  },
  indicator: {
    position: 'absolute',
    bottom: -10,
    width: 40,
    height: 2,
    backgroundColor: palette.ink,
    borderRadius: 2,
  },
});