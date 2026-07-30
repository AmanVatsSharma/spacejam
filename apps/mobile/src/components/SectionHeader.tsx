/**
 * File:        apps/mobile/src/components/SectionHeader.tsx
 * Module:      Mobile · Components · Section Header
 * Purpose:     Consistent "QUICK ACCESS" / "UPCOMING" section headers with animated entrance
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */

import React from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet, Animated } from 'react-native';
import { palette, type as typeScale, space } from '../../theme/tokens';
import { useFadeIn, staggerDelay, usePressFeedback } from '../../theme/animations';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  index?: number;
  staggerBase?: number;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onAction,
  index = 0,
  staggerBase = 0,
}) => {
  const delay = staggerDelay(index, staggerBase, 60);
  const { opacity, translateY } = useFadeIn(delay, { fromY: 6, durationOverride: 350 });

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction && (
        <ActionButton label={actionLabel} onPress={onAction} />
      )}
    </Animated.View>
  );
};

const ActionButton: React.FC<{ label: string; onPress: () => void }> = ({
  label,
  onPress,
}) => {
  const { scaleAnim, pressIn, pressOut } = usePressFeedback({ scale: 0.95, speed: 100 });

  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.Text style={[styles.action, { transform: [{ scale: scaleAnim }] }]}>
        {label} ›
      </Animated.Text>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: space.lg,
  },
  title: {
    ...typeScale.eyebrow,
    color: palette.muted,
  },
  action: {
    fontSize: 12,
    color: palette.brand,
    fontWeight: '600',
  },
});