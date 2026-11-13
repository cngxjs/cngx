import { InjectionToken } from '@angular/core';

import type { CngxNavRailConfig } from './nav-rail.config';

/**
 * Library defaults for the nav rail configuration cascade: the look and the
 * hover delay the rail shipped with before the cascade, so an un-configured
 * consumer sees no change.
 *
 * Exported for intra-lib consumers (`provideNavRailConfig` merges over it)
 * but not re-exported from `public-api.ts`; consumers read the resolved value
 * through `injectNavRailConfig()`.
 *
 * @internal
 */
export const CNGX_NAV_RAIL_DEFAULTS: Required<CngxNavRailConfig> = {
  labelPlacement: 'end',
  side: 'start',
  tooltip: true,
  tooltipDelay: 300,
};

/**
 * App-wide configuration cascade for `cngx-nav-rail` and
 * `injectNavRailTooltip`. Resolves in priority order:
 *
 *   1. Per-instance Input binding.
 *   2. `provideNavRailConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideNavRailConfig(...)` at the application root.
 *   4. Library defaults (this token's `factory`).
 *
 * `providedIn: 'root'` with a default factory, so `inject(CNGX_NAV_RAIL_CONFIG)`
 * always resolves.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/config/nav-rail.config.defaults.ts
 * @since 0.3.0
 * @relatedTo CngxNavRail, provideNavRailConfig, provideNavRailConfigAt, injectNavRailConfig
 */
export const CNGX_NAV_RAIL_CONFIG = new InjectionToken<CngxNavRailConfig>('CNGX_NAV_RAIL_CONFIG', {
  providedIn: 'root',
  factory: () => CNGX_NAV_RAIL_DEFAULTS,
});
