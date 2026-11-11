/**
 * Recommended `position-try-fallbacks` chain for menu submenu popovers.
 *
 * A template cannot read a module constant, so expose it as a component
 * field and bind that field on the submenu's `cngxPopover` element:
 * ```ts
 * protected readonly submenuFallbacks = CNGX_SUBMENU_TRY_FALLBACKS;
 * ```
 * ```html
 * <div cngxPopover [positionTryFallbacks]="submenuFallbacks">
 *   <!-- submenu items -->
 * </div>
 * ```
 *
 * The chain matches the
 * `projects/forms/select/shared/select-base.css:759` precedent
 * (`flip-block, flip-inline, flip-block flip-inline`) - `flip-inline`
 * is the dominant submenu clip case (right submenu hits the viewport
 * right edge → flips to the left side of its parent item),
 * `flip-block` covers the vertical case, and the composed form
 * covers diagonal clipping.
 *
 * `CngxMenuItemSubmenu` emits a one-shot dev-mode warning when a
 * submenu popover ships without `positionTryFallbacks` - the const
 * is documented as the canonical opt-in.
 *
 * Typed as a string-literal tuple via `as const` rather than the
 * `PopoverPositionTryFallback` union from `@cngx/common/popover` -
 * the cross-entry-point import would reverse the existing
 * `popover -> interactive` dependency direction and break ng-packagr.
 * Consumers binding the const to `[positionTryFallbacks]` get
 * compile-time type checking from the input's typed signature on the
 * popover side.
 */
export const CNGX_SUBMENU_TRY_FALLBACKS = Object.freeze([
  'flip-inline',
  'flip-block',
  'flip-block flip-inline',
] as const);

/**
 * Default `position-try-fallbacks` chain a `CngxMenuTrigger` claims on its
 * popover ({@link CngxMenuConfig.tryFallbacks}). Block flip first: a menu
 * hangs below its trigger and clips at the viewport bottom far more often
 * than at an inline edge. A `[positionTryFallbacks]` bound on the popover
 * wins over the claim; replace or drop the chain app-wide or per scope via
 * `withTryFallbacks`.
 */
export const CNGX_MENU_TRY_FALLBACKS = Object.freeze([
  'flip-block',
  'flip-inline',
  'flip-block flip-inline',
] as const);
