import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createLanguageSection } from '@cngx/core/i18n';
import { createFilledOverrideMerge } from '@cngx/core/utils';

import {
  CNGX_NAV_RAIL_LANGUAGE_EN,
  type CngxNavRailLanguageSection,
} from './i18n/nav-rail-language-section';

/**
 * Nav rail i18n surface: the `navRail` section of the language pack (English
 * without one); override single keys via {@link provideNavRailI18n}. Reactive
 * from birth: the token carries a `Signal`, and {@link withNavRailI18nLabels}
 * accepts a `Signal` of a partial bundle.
 *
 * `CngxNavRail` reads `ariaLabel` inside a `computed()` while its `ariaLabel`
 * input is unbound, so the landmark name follows a language switch.
 */
export type CngxNavRailI18n = CngxNavRailLanguageSection;

/** The English navRail section with the active pack's navRail section on top, shared app-wide. */
const navRailBundleFromPack = createLanguageSection('navRail', CNGX_NAV_RAIL_LANGUAGE_EN);

/**
 * DI token for the nav rail i18n bundle. `providedIn: 'root'`: the `navRail`
 * section of the active language pack over the English defaults. The value is
 * a `Signal`, shared by every reader under one injector.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/nav-rail-i18n.ts
 * @since 0.3.0
 * @relatedTo CngxNavRail
 */
export const CNGX_NAV_RAIL_I18N = new InjectionToken<Signal<CngxNavRailI18n>>('CngxNavRailI18n', {
  providedIn: 'root',
  factory: navRailBundleFromPack,
});

/**
 * Branded feature-fn for {@link provideNavRailI18n}.
 *
 * @since 0.3.0
 */
export type CngxNavRailI18nFeature = ((
  bundle: Signal<CngxNavRailI18n>,
) => Signal<CngxNavRailI18n>) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineNavRailI18nFeature(
  fn: (bundle: Signal<CngxNavRailI18n>) => Signal<CngxNavRailI18n>,
): CngxNavRailI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override i18n labels via a partial bundle - unset keys, and keys set to
 * `null` or `undefined`, keep the language pack's copy, or the English
 * default, so the landmark never loses its name. Pass a `Signal` of a partial
 * bundle to switch languages at runtime.
 *
 * @since 0.3.0
 */
export function withNavRailI18nLabels(
  overrides: Partial<CngxNavRailI18n> | Signal<Partial<CngxNavRailI18n>>,
): CngxNavRailI18nFeature {
  return defineNavRailI18nFeature((bundle) => createFilledOverrideMerge(bundle, overrides));
}

/**
 * Provider for the nav rail i18n bundle. Returns a plain `Provider`, so it
 * also scopes a subtree through `viewProviders`.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideNavRailI18n(withNavRailI18nLabels({ ariaLabel: 'Hauptnavigation' }))],
 * });
 * ```
 *
 * @since 0.3.0
 */
export function provideNavRailI18n(...features: readonly CngxNavRailI18nFeature[]): Provider {
  return {
    provide: CNGX_NAV_RAIL_I18N,
    useFactory: () =>
      features.reduce<Signal<CngxNavRailI18n>>(
        (bundle, feat) => feat(bundle),
        navRailBundleFromPack(),
      ),
  };
}

/**
 * Inject the resolved nav rail i18n bundle signal.
 *
 * @since 0.3.0
 */
export function injectNavRailI18n(): Signal<CngxNavRailI18n> {
  return inject(CNGX_NAV_RAIL_I18N);
}
