import type { CngxDirection } from '@cngx/core';

import type { PopoverPlacement } from './popover.types';

/**
 * @internal
 * Detect CSS Anchor Positioning support.
 *
 * The spec renamed `inset-area` to `position-area` (Chrome 129+, Safari 18.4+).
 * Chrome 125-128 only supports the old `inset-area` name.
 * We detect whichever is available and use it consistently.
 */
function detectAnchorSupport(): { supported: boolean; propertyName: string } {
  if (typeof CSS === 'undefined') {
    return { supported: false, propertyName: 'position-area' };
  }
  if (CSS.supports('position-area', 'bottom')) {
    return { supported: true, propertyName: 'position-area' };
  }
  if (CSS.supports('inset-area', 'bottom')) {
    return { supported: true, propertyName: 'inset-area' };
  }
  return { supported: false, propertyName: 'position-area' };
}

/** @internal */
const ANCHOR_SUPPORT = detectAnchorSupport();

/** @internal `true` when the browser supports CSS Anchor Positioning. */
export const SUPPORTS_ANCHOR = ANCHOR_SUPPORT.supported;

/** @internal The CSS property name for anchor area positioning (`position-area` or `inset-area`). */
export const ANCHOR_AREA_PROPERTY = ANCHOR_SUPPORT.propertyName;

/**
 * @internal
 * CSS anchor area values mapped from logical placement tokens.
 *
 * Uses physical keywords only - Chrome does not support logical keywords
 * (`start`/`end`/`span-inline-*`) in `position-area` as of Chrome 140.
 *
 * `*-start` and `*-end` resolve to a `<direction> <span-*>` pair, NOT a
 * corner cell (`top right` etc.). Corner-cell values produce diagonal
 * placement relative to the anchor - visually wrong for edge-aligned
 * popovers. The `<direction> <span-*>` form keeps the popover on the
 * named edge while spanning toward the named alignment:
 *   `right-start` → `right span-bottom` (right column, anchor's top edge aligned)
 *   `right-end`   → `right span-top`    (right column, anchor's bottom edge aligned)
 * Single-keyword placements (`top`/`bottom`/`left`/`right`) resolve to
 * the edge-centered case (`position-area: right` + default
 * `justify-self: anchor-center`) and need no span keyword.
 */
export const POSITION_AREA: Record<PopoverPlacement, string> = {
  top: 'top span-all',
  'top-start': 'top span-right',
  'top-end': 'top span-left',
  bottom: 'bottom span-all',
  'bottom-start': 'bottom span-right',
  'bottom-end': 'bottom span-left',
  left: 'left span-all',
  'left-start': 'left span-bottom',
  'left-end': 'left span-top',
  right: 'right span-all',
  'right-start': 'right span-bottom',
  'right-end': 'right span-top',
};

/**
 * @internal
 * Full physical mirror of every placement token under `rtl`: the left/right
 * side swaps, and a block-placement's inline *alignment* (`-start <-> -end`)
 * swaps too. Feeds the CSS-anchor path only - {@link POSITION_AREA} uses
 * physical keywords with no direction awareness, so the whole mirror must
 * happen in TS. The block edge (`top`/`bottom`) never flips.
 *
 * Total `Record` (identity entries for `top`/`bottom`) so a future placement
 * token fails the exhaustiveness check at compile time rather than silently
 * losing its mirror at runtime - the same guard {@link POSITION_AREA} and
 * `FLOATING_PLACEMENT` already carry.
 */
const INLINE_MIRROR: Record<PopoverPlacement, PopoverPlacement> = {
  top: 'top',
  bottom: 'bottom',
  'top-start': 'top-end',
  'top-end': 'top-start',
  'bottom-start': 'bottom-end',
  'bottom-end': 'bottom-start',
  left: 'right',
  right: 'left',
  'left-start': 'right-start',
  'right-start': 'left-start',
  'left-end': 'right-end',
  'right-end': 'left-end',
};

/**
 * @internal
 * Side-only mirror for the floating-ui path under `rtl`: the left/right side
 * swaps (keeping any `-start`/`-end` suffix), but a block-placement's inline
 * alignment is left untouched. `@floating-ui/dom`'s `computePosition` already
 * flips the alignment of vertical placements under `rtl` (its default
 * `platform.isRTL` reads the floating element's `direction`), while keeping
 * the side physical. Pre-flipping the alignment here as well would double-flip
 * `top-start` / `bottom-end` back to their ltr position - so the floating path
 * mirrors the side and defers alignment to floating-ui.
 *
 * Total `Record` for the same compile-time exhaustiveness guard as
 * {@link INLINE_MIRROR}.
 */
const FLOATING_MIRROR: Record<PopoverPlacement, PopoverPlacement> = {
  top: 'top',
  bottom: 'bottom',
  'top-start': 'top-start',
  'top-end': 'top-end',
  'bottom-start': 'bottom-start',
  'bottom-end': 'bottom-end',
  left: 'right',
  right: 'left',
  'left-start': 'right-start',
  'right-start': 'left-start',
  'left-end': 'right-end',
  'right-end': 'left-end',
};

/**
 * @internal
 * Resolve a logical placement token for the **CSS-anchor** path against the
 * writing direction: full inline mirror under `rtl`, identity under `ltr`.
 * {@link POSITION_AREA} is keyed by physical placement with no direction
 * awareness, so mirroring the key here - before the lookup - is what places
 * the panel on the direction-forward side.
 *
 * The block axis never flips: `top`/`bottom` (no inline component) are the
 * identity, and `top-start`/`bottom-start` mirror only their inline
 * *alignment* (`-start <-> -end`), not the block edge. Same inline-only rule
 * the keyboard direction-awareness applies (`resolveInlineStep`).
 *
 * NOTE: the floating-ui path must NOT use this - floating-ui flips vertical
 * alignment itself under `rtl`. Use {@link resolveFloatingPlacement} there.
 *
 * Pure, O(1) lookup - a mechanical kernel, not a DI chokepoint; each surface
 * injects its own direction and calls this at its CSS-anchor placement source.
 *
 * @param placement The logical placement token the consumer requested.
 * @param direction The document writing direction from `injectDirection`.
 * @returns The fully inline-mirrored token under `rtl`, else `placement`.
 */
export function resolveDirectionalPlacement(
  placement: PopoverPlacement,
  direction: CngxDirection,
): PopoverPlacement {
  if (direction !== 'rtl') {
    return placement;
  }
  return INLINE_MIRROR[placement];
}

/**
 * @internal
 * Resolve a logical placement token for the **floating-ui fallback** path
 * against the writing direction: side-only mirror under `rtl`, identity under
 * `ltr`. `@floating-ui/dom` already flips the inline alignment of vertical
 * placements under `rtl`, so this mirrors the side (`left <-> right`, suffix
 * preserved) and leaves the alignment for floating-ui - avoiding the
 * double-flip that a full mirror would cause on `top-start` / `bottom-end`.
 *
 * @param placement The logical placement token the consumer requested.
 * @param direction The document writing direction from `injectDirection`.
 * @returns The side-mirrored token under `rtl`, else `placement`.
 */
export function resolveFloatingPlacement(
  placement: PopoverPlacement,
  direction: CngxDirection,
): PopoverPlacement {
  if (direction !== 'rtl') {
    return placement;
  }
  return FLOATING_MIRROR[placement];
}
