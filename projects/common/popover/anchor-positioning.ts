import type { PopoverPlacement } from './popover.types';

/**
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

const ANCHOR_SUPPORT = detectAnchorSupport();

/** `true` when the browser supports CSS Anchor Positioning. */
export const SUPPORTS_ANCHOR = ANCHOR_SUPPORT.supported;

/** The CSS property name for anchor area positioning (`position-area` or `inset-area`). */
export const ANCHOR_AREA_PROPERTY = ANCHOR_SUPPORT.propertyName;

/**
 * CSS anchor area values mapped from logical placement tokens.
 *
 * Uses physical keywords only — Chrome does not support logical keywords
 * (`start`/`end`/`span-inline-*`) in `position-area` as of Chrome 140.
 * Supported: `top`, `bottom`, `left`, `right`, `span-all`,
 * `top left`, `top right`, `bottom left`, `bottom right`.
 */
export const POSITION_AREA: Record<PopoverPlacement, string> = {
  top: 'top',
  'top-start': 'top left',
  'top-end': 'top right',
  bottom: 'bottom',
  'bottom-start': 'bottom left',
  'bottom-end': 'bottom right',
  left: 'left',
  'left-start': 'top left',
  'left-end': 'bottom left',
  right: 'right',
  'right-start': 'top right',
  'right-end': 'bottom right',
};
