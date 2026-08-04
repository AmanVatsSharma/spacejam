/**
 * File:        apps/mobile/src/components/PolishedCard.tsx
 * Module:      Mobile · Components · Cards
 * Purpose:     Reusable card with consistent border-radius, elevation, and press feedback
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */

import React from 'react';
import { View, type StyleProp, type ViewStyle, Pressable } from 'react-native';
import { elevation, palette, type as typeScale } from '../theme/tokens';
import { PressedTouchable } from './PressedTouchable';

type CardElevation = 'subtle' | 'card' | 'raised' | 'none';

interface PolishedCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevation?: CardElevation;
  borderColor?: string;
  borderRadius?: number;
  padding?: number;
  animated?: boolean;
  index?: number;
  staggerBase?: number;
}

export const PolishedCard: React.FC<PolishedCardProps> = ({
  children,
  style,
  onPress,
  elevation: el = 'card',
  borderColor = palette.borderSoft,
  borderRadius = 16,
  padding = 16,
  animated = true,
  index = 0,
  staggerBase = 0,
}) => {
  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    { borderRadius, borderColor, padding },
    el !== 'none' && elevation[el],
    style,
  ];

  if (onPress) {
    return (
      <PressedTouchable
        style={cardStyle}
        onPress={onPress}
        index={index}
        staggerBase={staggerBase}
        animatedOpacity={animated}
        slideFromY={8}
      >
        {children}
      </PressedTouchable>
    );
  }

  // Non-pressable: wrap in Animated.View for stagger
  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = {
  base: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    shadowColor: '#0F172A',
    overflow: 'hidden' as const,
  },
};