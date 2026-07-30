/**
 * File:        apps/mobile/src/components/PressedTouchable.tsx
 * Module:      Mobile · Components · Pressed Touchable
 * Purpose:     Animated Touchable with press-scale feedback + stagger fade-in
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */

import React, { useEffect, useRef } from 'react';
import {
  TouchableWithoutFeedback,
  Animated,
  type StyleProp,
  type ViewStyle,
  type GestureResponderEvent,
} from 'react-native';
import { usePressFeedback, useFadeIn, staggerDelay } from '../../theme/animations';
import { duration } from '../../theme/tokens';

interface PressedTouchableProps {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  activeOpacity?: number;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  scale?: number;
  feedbackSpeed?: number;
  index?: number;
  staggerBase?: number;
  staggerInterval?: number;
  animatedOpacity?: boolean;
  slideFromY?: number;
}

/**
 * Wraps children with press-scale animation and optional staggered fade-in.
 *
 * Usage:
 *   <PressedTouchable onPress={handle} index={0} style={styles.card}>
 *     <Text>Content</Text>
 *   </PressedTouchable>
 */
export const PressedTouchable: React.FC<PressedTouchableProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  style,
  containerStyle,
  scale,
  feedbackSpeed,
  index = 0,
  staggerBase = 0,
  staggerInterval = 50,
  animatedOpacity = true,
  slideFromY = 10,
}) => {
  const { scaleAnim, pressIn, pressOut } = usePressFeedback({ scale, speed: feedbackSpeed });
  const delay = animatedOpacity ? staggerDelay(index, staggerBase, staggerInterval) : 0;
  const { opacity, translateY } = useFadeIn(delay, {
    fromY: slideFromY,
    durationOverride: duration.slow,
  });

  return (
    <Animated.View
      style={[
        style,
        containerStyle,
        animatedOpacity && {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableWithoutFeedback
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
        >
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};