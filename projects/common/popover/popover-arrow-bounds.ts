import { InjectionToken } from '@angular/core';

/**
 * Geometry contract for the popover panel's arrow ornament.
 *
 * Provided by `CngxPopoverPanel` (via `useExisting`) so that `CngxPopover`
 * can read panel-side layout constants - primarily the border-radius
 * used to clamp the arrow inside the panel's rounded corners - through a
 * typed contract rather than reaching into the panel's CSS custom
 * properties directly. Inverts the atom -> molecule dependency direction
 * that an earlier `getComputedStyle('--cngx-popover-panel-border-radius')`
 * read had introduced on `CngxPopover`.
 *
 * `CngxPopover` injects the token with `{ optional: true }` so it keeps
 * working when used outside a `CngxPopoverPanel` (e.g. bare `[cngxPopover]`
 * on a `<div>`). The fallback value matches the panel's default
 * border-radius initial value (12 px).
 *
 * @category common/popover
 */
export interface CngxPopoverArrowBounds {
  /**
   * Panel border-radius in CSS pixels. Used by `CngxPopover` to clamp
   * the arrow offset inside the panel's rounded-corner extent.
   */
  readonly borderRadius: number;
}

/**
 * Injection token for the arrow-bounds contract.
 *
 * @category common/popover
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-arrow-bounds.ts
 * @since 0.1.0
 */
export const CNGX_POPOVER_ARROW_BOUNDS = new InjectionToken<CngxPopoverArrowBounds>(
  'CngxPopoverArrowBounds',
);
