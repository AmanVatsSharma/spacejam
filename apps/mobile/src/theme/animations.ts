/**
 * File:        apps/mobile/src/theme/animations.ts
 * Module:      Mobile · Theme · Animation Utilities
 * Purpose:     Reusable animation hooks and interpolations built on React Native Animated
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { easing as easingCurves, duration, pressScale } from './tokens';

// ─── Core: Animated value factory ──────────────────────────────────────────────

export function useAnimatedValue(initial: number = 0) {
  return useRef(new Animated.Value(initial)).current;
}

export function useAnimatedSequence(initial: number = 0) {
  return useRef(new Animated.Value(initial)).current;
}

// ─── Press Feedback ────────────────────────────────────────────────────────────
// Attaches press scale + opacity to any component using onPressIn/onPressOut

export function usePressFeedback(opts?: { scale?: number; speed?: number }) {
  const scaleAnim = useAnimatedValue(1);
  const speed = opts?.speed ?? duration.micro;

  const pressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: opts?.scale ?? pressScale.base,
      duration: speed,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: speed + 20,
      easing: Easing.out(Easing.circle),
      useNativeDriver: true,
    }).start();
  };

  return { scaleAnim, pressIn, pressOut };
}

// ─── Fade In (with optional slide up) ─────────────────────────────────────────

export function useFadeIn(
  delay = 0,
  opts?: { fromY?: number; durationOverride?: number }
) {
  const anim = useAnimatedValue(0);
  const fromY = opts?.fromY ?? 12;
  const dur = opts?.durationOverride ?? duration.base;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, {
        toValue: 1,
        duration: dur,
        easing: Easing.out(Easing.cubic),
        // JS driver: mount-time entrance transforms can race with the native
        // animation pipeline in release/Hermes builds, surfacing the animated-node
        // proxy as a raw Map on the `transform` prop and throwing a
        // ClassCastException. JS driver avoids that race for one-shot fades.
        useNativeDriver: false,
      }),
    ]).start();
  }, [delay, dur]);

  return {
    opacity: anim,
    translateY: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [fromY, 0],
    }),
  };
}

// ─── Slide In from Direction ───────────────────────────────────────────────────

export type SlideDirection = 'left' | 'right' | 'up' | 'down';

export function useSlideIn(
  direction: SlideDirection = 'up',
  delay = 0,
  distance = 40,
  dur = duration.slow
) {
  const anim = useAnimatedValue(0);

  const outputRange =
    direction === 'left'
      ? [-distance, 0]
      : direction === 'right'
        ? [distance, 0]
        : direction === 'down'
          ? [-distance, 0]
          : [distance, 0];

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, {
        toValue: 1,
        duration: dur,
        easing: Easing.out(Easing.cubic),
        // JS driver — see useFadeIn for rationale (mount-time transform race in release).
        useNativeDriver: false,
      }),
    ]).start();
  }, [delay, dur]);

  const transform = direction === 'left' || direction === 'right'
    ? [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange }) }]
    : [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange }) }];

  return { opacity: anim, transform };
}

// ─── Stagger Children ──────────────────────────────────────────────────────────
// Returns delay value for index i with base delay and stagger interval

export function staggerDelay(index: number, base = 0, interval = 60): number {
  return base + index * interval;
}

// ─── Shimmer / Skeleton Loading ────────────────────────────────────────────────

export function useShimmer(width = '100%', height = 16, radius = 8) {
  const shimmerAnim = useAnimatedValue(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return {
    shimmerAnim,
    translateX,
    shimmerStyle: {
      width: typeof width === 'number' ? width : undefined,
      height,
      borderRadius: radius,
      backgroundColor: '#E5E7EB',
      overflow: 'hidden',
      position: 'relative' as const,
    } as StyleProp<ViewStyle>,
    shimmerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#F3F4F6',
      transform: [{ translateX }],
      width: '60%',
    },
  };
}

// ─── Pulse Animation ───────────────────────────────────────────────────────────
// Used for notification dots, live indicators

export function usePulse(
  opts?: { minScale?: number; maxScale?: number; duration?: number }
) {
  const pulseAnim = useAnimatedValue(1);
  const dur = opts?.duration ?? 1500;
  const min = opts?.minScale ?? 0.85;
  const max = opts?.maxScale ?? 1;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: min,
          duration: dur / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: max,
          duration: dur / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [dur, min, max]);

  return { scale: pulseAnim };
}

// ─── Rotate Animation ──────────────────────────────────────────────────────────
// Used for loading spinners, refresh indicators

export function useRotate(durationMs = 1200) {
  const rotateAnim = useAnimatedValue(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [durationMs]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return { spin };
}

// ─── Spring Entrance ───────────────────────────────────────────────────────────
// Bouncy entrance for modals, bottom sheets

export function useSpringEntrance(delay = 0) {
  const scale = useAnimatedValue(0.85);
  const opacity = useAnimatedValue(0);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay]);

  return { scale, opacity };
}

// ─── Counter Animation ─────────────────────────────────────────────────────────
// Smoothly counts from `from` to `to` (for balance counters, stats)

export function useCounter(
  to: number,
  opts?: { from?: number; duration?: number; delay?: number }
) {
  const countAnim = useAnimatedValue(opts?.from ?? 0);
  const textRef = useRef('0');
  const dur = opts?.duration ?? 800;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(opts?.delay ?? 0),
      Animated.timing(countAnim, {
        toValue: to,
        duration: dur,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false, // must be false for text interpolation
      }),
    ]).start();
  }, [to]);

  countAnim.addListener(({ value }) => {
    textRef.current = Math.round(value).toLocaleString();
  });

  return textRef.current;
}

// ─── Height Collapse / Expand ──────────────────────────────────────────────────
// For accordions, collapsible sections

export function useHeightCollapse(
  expanded: boolean,
  measuredHeight: number,
  opts?: { duration?: number }
) {
  const heightAnim = useAnimatedValue(expanded ? measuredHeight : 0);
  const dur = opts?.duration ?? 300;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: expanded ? measuredHeight : 0,
      duration: dur,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // height animations need non-native
    }).start();
  }, [expanded, measuredHeight]);

  const marginAnim = useAnimatedValue(expanded ? 1 : 0);
  useEffect(() => {
    Animated.timing(marginAnim, {
      toValue: expanded ? 1 : 0,
      duration: dur - 50,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const marginInterpolated = marginAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });

  return { heightAnim, marginInterpolated };
}