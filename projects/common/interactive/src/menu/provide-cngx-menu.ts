import type { EnvironmentProviders } from '@angular/core';

import { type CngxMenuConfigFeature, provideMenuConfig } from './menu-config';

/**
 * Union of every feature kind the menu family aggregator accepts. Today
 * that is only `CngxMenuConfigFeature` (target `'config'`); future surfaces
 * (e.g. submenu-only or announcer overrides) will widen this union and
 * `provideCngxMenu` will dispatch to the matching `provide*Config` based on
 * each feature's hidden `_target` discriminator.
 *
 * @category interactive
 */
export type CngxMenuFeature = CngxMenuConfigFeature;

/**
 * Unified aggregator for the menu family's configuration. Filters features
 * by `_target` and forwards to the matching `provide*Config` function.
 *
 * Today there is exactly one config surface (`CNGX_MENU_CONFIG`), so all
 * features dispatch to {@link provideMenuConfig}. The discriminator
 * scaffolding is in place so adding a future surface does not break the
 * public API of existing `with*` features.
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
export function provideCngxMenu(...features: CngxMenuFeature[]): EnvironmentProviders {
  const configFeatures = features.filter(
    (f): f is CngxMenuConfigFeature => (f._target ?? 'config') === 'config',
  );
  return provideMenuConfig(...configFeatures);
}
