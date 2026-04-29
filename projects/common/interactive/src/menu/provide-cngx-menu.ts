import type { EnvironmentProviders } from '@angular/core';

import { type CngxMenuConfigFeature, provideMenuConfig } from './menu-config';

/**
 * Unified aggregator for the menu family's configuration. Currently
 * delegates to {@link provideMenuConfig} since `CNGX_MENU_CONFIG` is the
 * single config surface. The wrapper is the public-facing single-entry
 * provider so that introducing future surfaces (e.g. submenu-only
 * overrides, menubar-specific defaults) can compose through this same
 * call without churning the public API.
 *
 * Mirrors `provideCngxSelect` from the select-family A+ closure.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideCngxMenu(
 *       withAriaLabels({ submenuOpened: 'Untermenü geöffnet' }),
 *       withTypeaheadDebounce(500),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export function provideCngxMenu(...features: CngxMenuConfigFeature[]): EnvironmentProviders {
  return provideMenuConfig(...features);
}
