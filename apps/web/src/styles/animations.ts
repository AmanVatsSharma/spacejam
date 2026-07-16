/**
 * Animation utility helpers — compose CSS class strings for
 * staggered entry animations, hover lift, and interactive states.
 *
 * Usage:
 *   import { stagger } from '@/styles/animations';
 *   <div className={stagger.flip(true).fadeInUp(0.06)}>…</div>
 */

type Option = boolean | number | string | undefined;

function cls(...parts: Option[]): string {
  return parts.filter(Boolean).join(" ");
}

const base = {
  /** Fade in from nothing */
  fadeIn: (delay = 0) => cls("anim-fade-in", delay && `stagger-item`),
  /** Fade in from below */
  fadeInUp: (delay = 0) => cls("anim-fade-in-up"),
  /** Fade in with scale */
  fadeInScale: (delay = 0) => cls("anim-fade-in-scale"),
  /** Slide from the right */
  slideInRight: (delay = 0) => cls("anim-slide-in-right"),
  /** Scale spring entrance */
  scaleIn: (delay = 0) => cls("anim-scale-in"),
  /** Shimmer loading state */
  shimmer: () => "anim-shimmer",
  /** Rotating spinner */
  spin: () => "anim-spin",
  /** Subtle float */
  float: () => "anim-float",
  /** Press-down effect */
  press: () => "press",
  /** Lift-on-hover effect */
  lift: () => "lift",
  /** Pulsing ring */
  pulseRing: () => "anim-pulse-ring",
  /** Glow effect */
  glow: () => "anim-glow",
};

/**
 * Stagger wrapper — apply to a list container so children animate
 * with progressively increasing delays via CSS custom property.
 */
export function staggerWrapper(className = "") {
  return `stagger-children ${className}`.trim();
}

/**
 * Returns a CSS inline style with animation-delay computed from index.
 * Use alongside a CSS animation class.
 */
export function staggerDelay(index: number, baseMs = 60) {
  return { animationDelay: `${index * baseMs}ms` } as const;
}

/**
 * Full animation composition for a list item at a given index.
 */
export function staggerItem(
  index: number,
  variant: keyof typeof base = "fadeInUp",
  baseMs = 60,
  extra = ""
) {
  const animClass = base[variant](baseMs);
  const delayStyle = staggerDelay(index, baseMs);
  return { className: cls(animClass, extra), style: delayStyle };
}

/**
 * Button ripple effect — returns a span that covers the button
 * and expands on click.
 */
export const rippleEffect = () => ({
  position: "relative",
  overflow: "hidden",
} as const);

export default base;
