import type { CngxNavRailLabelPlacement, CngxNavRailSide } from '../nav-rail';
import type { CngxNavRailConfigFeature } from './provide-nav-rail-config';

/**
 * Set the default look of every `cngx-nav-rail` in scope. A bound
 * `[labelPlacement]` still wins.
 *
 * ```ts
 * provideNavRailConfig(withNavRailLabelPlacement('below'));
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/config/features.ts
 * @since 0.3.0
 * @relatedTo provideNavRailConfig, provideNavRailConfigAt, CngxNavRail
 */
export function withNavRailLabelPlacement(
  labelPlacement: CngxNavRailLabelPlacement,
): CngxNavRailConfigFeature {
  return { kind: 'labelPlacement', payload: { labelPlacement } };
}

/**
 * Switch the label tooltip of railed rows on or off (default on). It only
 * applies to the `'end'` look; `'below'` never shows a tooltip. A bound
 * `[tooltip]` on `cngx-nav-rail` still wins. Off, `injectNavRailTooltip`
 * creates no tooltip element and attaches no listener.
 *
 * ```ts
 * provideNavRailConfig(withNavRailTooltip(false));
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/config/features.ts
 * @since 0.3.0
 * @relatedTo provideNavRailConfig, provideNavRailConfigAt, CngxNavRail, injectNavRailTooltip
 */
export function withNavRailTooltip(enabled: boolean): CngxNavRailConfigFeature {
  return { kind: 'tooltip', payload: { tooltip: enabled } };
}

/**
 * Set the pointer dwell in ms before the label tooltip of a railed row shows
 * (default `300`). Keyboard focus shows it at once regardless.
 *
 * ```ts
 * provideNavRailConfig(withNavRailTooltipDelay(500));
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/config/features.ts
 * @since 0.3.0
 * @relatedTo provideNavRailConfig, provideNavRailConfigAt, injectNavRailTooltip
 */
export function withNavRailTooltipDelay(ms: number): CngxNavRailConfigFeature {
  return { kind: 'tooltipDelay', payload: { tooltipDelay: ms } };
}

/**
 * Set the default side of every `cngx-nav-rail` in scope (default `'start'`).
 * Logical, so `'end'` is the left edge under RTL. The border goes on the
 * rail's inner edge and the flyout and the tooltip open away from it; the
 * rail's place on the page stays its DOM order. A bound `[side]` still wins.
 *
 * ```ts
 * provideNavRailConfig(withNavRailSide('end'));
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/config/features.ts
 * @since 0.3.0
 * @relatedTo provideNavRailConfig, provideNavRailConfigAt, CngxNavRail
 */
export function withNavRailSide(side: CngxNavRailSide): CngxNavRailConfigFeature {
  return { kind: 'side', payload: { side } };
}
