import { InjectionToken, type Provider } from '@angular/core';

import type { PopoverPlacement } from './popover.types';

/**
 * Signature matching `@floating-ui/dom` `computePosition`.
 * The consumer provides the actual function — the library never imports it directly.
 */
export type ComputePositionFn = (
  reference: HTMLElement,
  floating: HTMLElement,
  options?: {
    placement?: string;
    middleware?: unknown[];
  },
) => Promise<{ x: number; y: number; placement: string }>;

/** Configuration for the Floating UI positioning fallback. */
export interface FloatingFallbackConfig {
  /** The `computePosition` function from `@floating-ui/dom`. */
  computePosition: ComputePositionFn;
  /** Middleware array (e.g. `[offset(8), flip(), shift()]`). */
  middleware?: unknown[];
}

/**
 * Injection token for the Floating UI fallback.
 * `null` when not provided — CSS Anchor Positioning is used instead.
 */
export const CNGX_FLOATING_FALLBACK = new InjectionToken<FloatingFallbackConfig | null>(
  'CngxFloatingFallback',
  { factory: () => null },
);

/**
 * Provides the Floating UI positioning fallback for browsers without
 * CSS Anchor Positioning support.
 *
 * The consumer must install `@floating-ui/dom` themselves — this library
 * never imports it directly, keeping the bundle at zero cost for modern browsers.
 *
 * @usageNotes
 * ```typescript
 * import { computePosition, flip, offset, shift } from '@floating-ui/dom';
 *
 * // In app.config.ts or component providers:
 * providers: [
 *   provideFloatingFallback(computePosition, [offset(8), flip(), shift()]),
 * ]
 * ```
 */
export function provideFloatingFallback(
  computePosition: ComputePositionFn,
  middleware?: unknown[],
): Provider {
  return {
    provide: CNGX_FLOATING_FALLBACK,
    useValue: { computePosition, middleware } satisfies FloatingFallbackConfig,
  };
}

/** Maps cngx placement tokens to Floating UI placement strings. */
export const FLOATING_PLACEMENT: Record<PopoverPlacement, string> = {
  top: 'top',
  'top-start': 'top-start',
  'top-end': 'top-end',
  bottom: 'bottom',
  'bottom-start': 'bottom-start',
  'bottom-end': 'bottom-end',
  left: 'left',
  'left-start': 'left-start',
  'left-end': 'left-end',
  right: 'right',
  'right-start': 'right-start',
  'right-end': 'right-end',
};
