import type { PopoverPositionTryFallback } from '@cngx/common/popover';

/**
 * Recommended `position-try-fallbacks` chain for menu submenu popovers.
 *
 * Consumers wire the const on the submenu's `cngxPopover` element:
 * ```html
 * <div cngxPopover [positionTryFallbacks]="CNGX_SUBMENU_TRY_FALLBACKS">
 *   <!-- submenu items -->
 * </div>
 * ```
 *
 * The chain matches the
 * `projects/forms/select/shared/select-base.css:759` precedent
 * (`flip-block, flip-inline, flip-block flip-inline`) — `flip-inline`
 * is the dominant submenu clip case (right submenu hits the viewport
 * right edge → flips to the left side of its parent item),
 * `flip-block` covers the vertical case, and the composed form
 * covers diagonal clipping.
 *
 * `CngxMenuItemSubmenu` emits a one-shot dev-mode warning when a
 * submenu popover ships without `positionTryFallbacks` — the const
 * is documented as the canonical opt-in.
 */
export const CNGX_SUBMENU_TRY_FALLBACKS: readonly PopoverPositionTryFallback[] = Object.freeze([
  'flip-inline',
  'flip-block',
  'flip-block flip-inline',
]);
