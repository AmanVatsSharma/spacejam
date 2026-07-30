/**
 * File:        apps/mobile/src/theme/tokens.ts
 * Module:      Mobile · Theme · Design Tokens
 * Purpose:     Centralized design system tokens (colors, spacing, shadows, radii, motion, typography)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */

// ─── Brand Palette ─────────────────────────────────────────────────────────────
export const palette = {
  // Brand
  brand: '#FE7A47',          // Primary orange
  brandDeep: '#E5623A',      // Pressed state, deeper tone
  brandSoft: '#FFE4D6',      // Subtle brand backgrounds
  brandWash: '#FFF0EB',      // Even softer brand wash
  brandAccent: '#FFD166',    // Highlight accent (yellow-orange)

  // Secondary
  teal: '#48C9B0',           // Secondary teal accent
  tealSoft: '#D6F5F0',
  tealDeep: '#2FB39A',

  // Status
  success: '#22C55E',
  successSoft: '#E8F5E9',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  info: '#3B82F6',
  infoSoft: '#E0F2FE',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',

  // Neutrals
  ink: '#1A1D1F',            // Primary text
  inkSub: '#374151',         // Secondary text
  muted: '#6F767E',          // Tertiary / labels
  mutedSoft: '#9CA3AF',
  border: '#E5E7EB',         // Card borders
  borderSoft: '#F3F4F6',
  bg: '#F7F9FC',             // Page background
  surface: '#FFFFFF',        // Card surface
  surfaceSub: '#FAFBFC',

  // Effects
  whiteTranslucent: 'rgba(255,255,255,0.20)',
  whiteTranslucentLight: 'rgba(255,255,255,0.85)',
  blackOverlaySoft: 'rgba(0,0,0,0.35)',
  blackOverlay: 'rgba(0,0,0,0.55)',
} as const;

// ─── Spacing Scale (4pt grid) ──────────────────────────────────────────────────
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

// ─── Radius Scale ──────────────────────────────────────────────────────────────
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  pill: 999,
} as const;

// ─── Elevation / Shadow Levels ─────────────────────────────────────────────────
// Use consistent elevation language across the app
export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    // Cards at rest
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    // Default card
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    // Floating CTAs, hero cards
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  floating: {
    // Floating nav, modals
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  brand: {
    // Brand-colored shadows (CTA buttons, hero elements)
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// ─── Typography ────────────────────────────────────────────────────────────────
export const type = {
  display: {
    fontSize: 36,
    fontWeight: '900' as const,
    letterSpacing: -1,
    lineHeight: 40,
  },
  h1: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '700' as const,
    lineHeight: 22,
  },
  small: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  micro: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
  // Section labels — uppercase tracking
  eyebrow: {
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;

// ─── Motion / Easing curves ────────────────────────────────────────────────────
// iOS-style cubic-bezier presets, mapped to React Native Animated values
export const easing = {
  // Standard "ease out" — for entries, presses
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  // Smooth "ease in out" — for layout transitions
  inOut: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  // Spring-like overshoot
  spring: (t: number) => {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
  // Smooth "ease in" — for exits
  in: (t: number) => t * t * t,
} as const;

// ─── Animation duration presets (in ms) ────────────────────────────────────────
export const duration = {
  micro: 120,    // Tap feedback
  fast: 200,     // Hover/focus states
  base: 300,     // Default transitions
  slow: 450,     // Screen entry
  hero: 700,     // Hero reveals
} as const;

// ─── Press scale values ────────────────────────────────────────────────────────
export const pressScale = {
  light: 0.98,
  base: 0.96,
  strong: 0.94,
} as const;