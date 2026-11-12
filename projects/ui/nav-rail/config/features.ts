import type { CngxNavRailLabelPlacement } from '../nav-rail';
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
