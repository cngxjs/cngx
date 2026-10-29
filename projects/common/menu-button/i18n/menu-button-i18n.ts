import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import {
  CNGX_MENU_BUTTON_LANGUAGE_EN,
  type CngxMenuButtonLanguageSection,
} from './menu-button-language-section';

/**
 * Menu-button i18n surface. Library defaults are English; consumers override
 * via {@link provideMenuButtonI18n}. Sibling to `CNGX_CARD_I18N`.
 *
 * `splitToggle` is the default accessible name of a `cngxIconMenuButton`
 * inside a `cngxSplitButton`. A consumer `aria-label` on the button wins
 * over it. The same shape as the menu-button section of a language pack,
 * declared once as {@link CngxMenuButtonLanguageSection}.
 */
export type CngxMenuButtonI18n = CngxMenuButtonLanguageSection;

/** @internal The English section with the active pack's menu-button section on top. */
const menuButtonBundleFromPack = createLanguageSection('menuButton', CNGX_MENU_BUTTON_LANGUAGE_EN);

/**
 * DI token for the menu-button i18n bundle, a `Signal` so the names follow a
 * runtime language switch. `providedIn: 'root'`: the menu-button section of
 * the active language pack over the English defaults.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/i18n/menu-button-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxIconMenuButton, CngxSplitButton
 */
export const CNGX_MENU_BUTTON_I18N = new InjectionToken<Signal<CngxMenuButtonI18n>>(
  'CngxMenuButtonI18n',
  {
    providedIn: 'root',
    factory: menuButtonBundleFromPack,
  },
);

/**
 * Branded feature-fn for {@link provideMenuButtonI18n}.
 */
export type CngxMenuButtonI18nFeature = ((
  bundle: Signal<CngxMenuButtonI18n>,
) => Signal<CngxMenuButtonI18n>) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineMenuButtonI18nFeature(
  fn: (bundle: Signal<CngxMenuButtonI18n>) => Signal<CngxMenuButtonI18n>,
): CngxMenuButtonI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override i18n labels via a partial bundle - unset keys keep the language
 * pack's phrase, or the English default. Pass a `Signal` to switch the
 * language at runtime.
 */
export function withMenuButtonI18nLabels(
  overrides: Partial<CngxMenuButtonI18n> | Signal<Partial<CngxMenuButtonI18n>>,
): CngxMenuButtonI18nFeature {
  return defineMenuButtonI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
}

/**
 * Provider for the menu-button i18n bundle. The features apply on top of the
 * active language pack, so a subtree can override single keys of the app's
 * language.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideMenuButtonI18n(withMenuButtonI18nLabels({ splitToggle: 'More actions' }))],
 * });
 * ```
 */
export function provideMenuButtonI18n(...features: readonly CngxMenuButtonI18nFeature[]): Provider {
  return {
    provide: CNGX_MENU_BUTTON_I18N,
    useFactory: () =>
      features.reduce<Signal<CngxMenuButtonI18n>>(
        (bundle, feat) => feat(bundle),
        menuButtonBundleFromPack(),
      ),
  };
}

/**
 * Inject the resolved menu-button i18n bundle.
 */
export function injectMenuButtonI18n(): Signal<CngxMenuButtonI18n> {
  return inject(CNGX_MENU_BUTTON_I18N);
}
