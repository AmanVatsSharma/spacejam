/**
 * File:        apps/mobile/src/components/StatusPill.tsx
 * Module:      Mobile · Components · Status Pill
 * Purpose:     Consistent status badge across all screens (Ongoing, Upcoming, Completed, Paid, Pending, etc.)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, type as typeScale } from '../theme/tokens';

export type StatusVariant =
  | 'ongoing'
  | 'upcoming'
  | 'completed'
  | 'paid'
  | 'pending'
  | 'available'
  | 'requested'
  | 'brand'
  | 'info';

interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
}

const STATUS_THEME: Record<StatusVariant, { bg: string; text: string }> = {
  ongoing: { bg: '#FFF0EB', text: palette.brand },
  upcoming: { bg: '#E8F5E9', text: '#22C55E' },
  completed: { bg: '#F3F4F6', text: '#4B5563' },
  paid: { bg: '#E8F5E9', text: '#22C55E' },
  pending: { bg: '#FFF0EB', text: palette.brand },
  available: { bg: '#FFF0EB', text: palette.brand },
  requested: { bg: '#E0F2FE', text: '#3B82F6' },
  brand: { bg: palette.brandSoft, text: palette.brand },
  info: { bg: '#E0F2FE', text: '#3B82F6' },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = 'brand',
  size = 'md',
}) => {
  const theme = STATUS_THEME[variant] || STATUS_THEME.brand;

  return (
    <View style={[styles.pill, { backgroundColor: theme.bg }, size === 'sm' && styles.pillSm]}>
      <Text
        style={[
          styles.text,
          { color: theme.text },
          size === 'sm' && styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pillSm: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  text: {
    ...typeScale.micro,
    fontWeight: '700',
  },
  textSm: {
    fontSize: 10,
    lineHeight: 13,
  },
});