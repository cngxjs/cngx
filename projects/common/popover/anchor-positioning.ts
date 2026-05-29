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
