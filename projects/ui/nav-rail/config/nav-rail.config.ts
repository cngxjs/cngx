import type { CngxNavRailLabelPlacement, CngxNavRailSide } from '../nav-rail';

/**
 * App-wide cascade for the nav rail's look, its side and its label tooltip. Settings
 * only; the rail's copy lives on `CNGX_NAV_RAIL_I18N`.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding (`[labelPlacement]`, `[side]`, `[tooltip]`).
 *   2. `provideNavRailConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideNavRailConfig(...)` at the application root.
 *   4. Library defaults (`labelPlacement: 'end'`, `side: 'start'`,
 *      `tooltip: true`, `tooltipDelay: 300`).
 *
 * Every key is a flat top-level scalar, so a later feature replaces the
 * earlier value of the same key.
 *
 * @since 0.3.0
 */
export interface CngxNavRailConfig {
  /**
   * Default look of every `cngx-nav-rail`: `'end'` (icon only, label in a
   * tooltip) or `'below'` (icon over a short label). A bound
   * `[labelPlacement]` still wins.
   */
  readonly labelPlacement?: CngxNavRailLabelPlacement;

  /**
   * Default side of every `cngx-nav-rail`: `'start'` or `'end'`, logical. The
   * border goes on the rail's inner edge and the flyout and the tooltip open
   * away from it. A bound `[side]` still wins.
   */
  readonly side?: CngxNavRailSide;

  /**
   * Whether a railed row shows its label in a tooltip (default `true`). Only
   * the `'end'` look has a tooltip; `'below'` never shows one. A bound
   * `[tooltip]` still wins.
   */
  readonly tooltip?: boolean;

  /**
   * Pointer dwell in ms before the label tooltip of a railed row shows.
   * Keyboard focus shows it at once, whatever the delay. Read by
   * `injectNavRailTooltip`, so it applies to every organism that calls it.
   */
  readonly tooltipDelay?: number;
}
