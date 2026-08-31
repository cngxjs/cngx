import { InjectionToken, type Provider } from '@angular/core';

import type { PopoverPlacement } from './popover.types';

/**
 * Signature matching `@floating-ui/dom` `computePosition`.
 * The consumer provides the actual function - the library never imports it directly.
 *
 * @category common/popover
 */
export type ComputePositionFn = (
  reference: HTMLElement,
  floating: HTMLElement,
  options?: {
    placement?: string;
    middleware?: unknown[];
  },
) => Promise<{ x: number; y: number; placement: string }>;

/**
 * Configuration for the Floating UI positioning fallback.
 *
 * @category common/popover
 */
export interface FloatingFallbackConfig {
  /** The `computePosition` function from `@floating-ui/dom`. */
  computePosition: ComputePositionFn;
  /** Middleware array (e.g. `[offset(8), flip(), shift()]`). */
  middleware?: unknown[];
}

/**
 * Injection token for the Floating UI fallback.
 * `null` when not provided - CSS Anchor Positioning is used instead.
 *
 * @category common/popover
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/floating-fallback.ts
 * @since 0.1.0
 */
export const CNGX_FLOATING_FALLBACK = new InjectionToken<FloatingFallbackConfig | null>(
  'CngxFloatingFallback',
  { factory: () => null },
);

/**
 * Provides the Floating UI positioning fallback for browsers without
 * CSS Anchor Positioning support.
 *
 * The consumer must install `@floating-ui/dom` themselves - this library
 * never imports it directly, keeping the bundle at zero cost for modern browsers.
 *
 * ```typescript
 * import { computePosition, flip, offset, shift } from '@floating-ui/dom';
 *
 * // In app.config.ts or component providers:
 * providers: [
 *   provideFloatingFallback(computePosition, [offset(8), flip(), shift()]),
 * ]
 * ```
 *
 * @category common/popover
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

/**
 * @internal
 * Inputs for {@link createFloatingPositioner}. All element/config reads are
 * thunks so the positioner always sees the live value - placement and offset
 * are signal-backed on both call sites.
 */
export interface FloatingPositionerOptions {
  /** The consumer-provided fallback config from `CNGX_FLOATING_FALLBACK`. */
  fallback: FloatingFallbackConfig;
  /** Anchor (trigger) element. `null` skips the positioning pass. */
  getAnchor: () => HTMLElement | null;
  /** The floating element. `null` skips the positioning pass. */
  getElement: () => HTMLElement | null;
  /** Resolved Floating UI placement string (a `FLOATING_PLACEMENT` value). */
  getPlacement: () => string;
  /** Gap between anchor and floating element in px. */
  getOffset: () => number;
  /** Open guard - closes drop queued listener re-runs and in-flight writes. */
  isOpen: () => boolean;
  /** Invoked after every applied coordinate write. */
  onPositioned?: () => void;
}

/** @internal Handle returned by {@link createFloatingPositioner}. */
export interface FloatingPositioner {
  /** One positioning pass (no-op unless open with anchor + element). */
  update(): void;
  /** Position now and re-run on scroll/resize until {@link stop}. */
  start(): void;
  /** Detach the scroll/resize listeners. Idempotent. */
  stop(): void;
}

/**
 * @internal
 * Offset expressed as a Floating UI middleware literal instead of a margin
 * write: margin pushes the panel along BOTH axes and is invisible to the
 * consumer's flip/shift middleware, so collision recovery would compute
 * against the un-offset rect. Runs first in the chain for the same reason
 * `offset()` must in `@floating-ui/dom`.
 */
function makeOffsetMiddleware(offsetPx: number): unknown {
  return {
    name: 'cngxOffset',
    fn: (state: { x: number; y: number; placement: string }): { x?: number; y?: number } => {
      const side = state.placement.split('-')[0];
      if (side === 'top') {
        return { y: state.y - offsetPx };
      }
      if (side === 'bottom') {
        return { y: state.y + offsetPx };
      }
      if (side === 'left') {
        return { x: state.x - offsetPx };
      }
      if (side === 'right') {
        return { x: state.x + offsetPx };
      }
      return {};
    },
  };
}

/**
 * @internal
 * The one floating-ui fallback engine shared by `CngxPopover` and
 * `CngxTooltip`. Owns the three concerns the per-directive copies each
 * half-implemented: the offset (as middleware, see above), the re-run on
 * scroll/resize while open (CSS Anchor tracks the anchor natively; the
 * fallback must do it by hand), and the state guard on the async
 * `computePosition` write (a close during the in-flight promise must not
 * resurrect stale coordinates).
 */
export function createFloatingPositioner(options: FloatingPositionerOptions): FloatingPositioner {
  let listening = false;
  let listenerDoc: Document | null = null;

  const update = (): void => {
    const anchor = options.getAnchor();
    const el = options.getElement();
    if (!anchor || !el || !options.isOpen()) {
      return;
    }
    const fb = options.fallback;
    const middleware = [makeOffsetMiddleware(options.getOffset()), ...(fb.middleware ?? [])];
    void fb
      .computePosition(anchor, el, { placement: options.getPlacement(), middleware })
      .then(({ x, y }) => {
        if (!options.isOpen()) {
          return;
        }
        const target = options.getElement();
        if (!target) {
          return;
        }
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        options.onPositioned?.();
      });
  };

  const handleReposition = (): void => update();

  return {
    update,
    start(): void {
      update();
      if (listening) {
        return;
      }
      const doc = options.getElement()?.ownerDocument ?? null;
      const view = doc?.defaultView ?? null;
      if (!doc || !view) {
        return;
      }
      // Capture phase: scroll events from inner scroll containers do not
      // bubble, but they do traverse the capture path.
      doc.addEventListener('scroll', handleReposition, true);
      view.addEventListener('resize', handleReposition);
      listenerDoc = doc;
      listening = true;
    },
    stop(): void {
      if (!listening) {
        return;
      }
      listenerDoc?.removeEventListener('scroll', handleReposition, true);
      listenerDoc?.defaultView?.removeEventListener('resize', handleReposition);
      listenerDoc = null;
      listening = false;
    },
  };
}

/** @internal Maps cngx placement tokens to Floating UI placement strings. */
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
