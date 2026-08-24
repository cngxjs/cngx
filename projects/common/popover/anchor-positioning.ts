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
 * Physical mirror of every inline-axis placement token. Used only under
 * `rtl` - the block axis (`top`/`bottom` and their `-start`/`-end`
 * alignment) mirrors its inline component, the left/right edges swap. Any
 * token absent from this map has no inline component to flip (`top`,
 * `bottom`) and is returned unchanged by {@link resolveDirectionalPlacement}.
 */
const INLINE_MIRROR: Partial<Record<PopoverPlacement, PopoverPlacement>> = {
  left: 'right',
  right: 'left',
  'left-start': 'right-start',
  'right-start': 'left-start',
  'left-end': 'right-end',
  'right-end': 'left-end',
  'top-start': 'top-end',
  'top-end': 'top-start',
  'bottom-start': 'bottom-end',
  'bottom-end': 'bottom-start',
};

/**
 * @internal
 * Resolve a logical placement token against the writing direction, mirroring
 * the inline (horizontal) axis under `rtl` and returning the token unchanged
 * under `ltr`. `POSITION_AREA` and `FLOATING_PLACEMENT` are keyed by physical
 * placement, so mirroring the key here - before either lookup - keeps both
 * maps correct as-is while placing the panel on the direction-forward side.
 *
 * The block axis never flips: `top`/`bottom` (no inline component) are the
 * identity, and `top-start`/`bottom-start` mirror only their inline
 * *alignment* (`-start <-> -end`), not the block edge. Same inline-only rule
 * the keyboard direction-awareness applies (`resolveInlineStep`).
 *
 * Pure, O(1) lookup - a mechanical kernel, not a DI chokepoint; each surface
 * injects its own direction and calls this at its placement source.
 *
 * @param placement The logical placement token the consumer requested.
 * @param direction The document writing direction from `injectDirection`.
 * @returns The inline-mirrored token under `rtl`, else `placement` unchanged.
 */
export function resolveDirectionalPlacement(
  placement: PopoverPlacement,
  direction: CngxDirection,
): PopoverPlacement {
  if (direction !== 'rtl') {
    return placement;
  }
  return INLINE_MIRROR[placement] ?? placement;
}
