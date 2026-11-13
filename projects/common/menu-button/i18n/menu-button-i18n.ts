import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import {
  CNGX_MENU_BUTTON_LANGUAGE_EN,
  type CngxMenuButtonLanguageSection,
} from './menu-button-language-section';

/**
 * The menu-button copy: the name of a split caret and its description while the main action
 * runs. Same shape as the `menuButton` section of a language pack, declared once as
 * {@link CngxMenuButtonLanguageSection}.
 */
export type CngxMenuButtonI18n = CngxMenuButtonLanguageSection;

/** @internal The English section with the active pack's menu-button section on top. */
const menuButtonBundleFromPack = createLanguageSection('menuButton', CNGX_MENU_BUTTON_LANGUAGE_EN);

/**
 * The resolved menu-button copy, a `Signal` so the names follow a runtime language switch. By
 * default the `menuButton` section of the active language pack over the English defaults.
 *
 * Override single keys with `provideMenuButtonI18n(withMenuButtonI18nLabels({ ... }))` or
 * `provideCngxMenuButton(withMenuButtonI18nLabels({ ... }))`. `CngxSplitCaret` reads it.
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
 * A label override feature for `provideMenuButtonI18n` and `provideCngxMenuButton(At)`.
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
 * Overrides `splitToggle` and `splitMainBusy` with a partial bundle. Unset keys keep the language
 * pack's phrase, or the English default. Pass a `Signal` to switch the language at runtime.
 *
 * Hand it to `provideMenuButtonI18n` or `provideCngxMenuButton(At)`.
 */
export function withMenuButtonI18nLabels(
  overrides: Partial<CngxMenuButtonI18n> | Signal<Partial<CngxMenuButtonI18n>>,
): CngxMenuButtonI18nFeature {
  return defineMenuButtonI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
}

/**
 * Provides the menu-button copy. The features apply on top of the active language pack, so a
 * subtree overrides single keys of the app's language.
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
 * Reads the resolved menu-button copy in an injection context. `CngxSplitCaret` already exposes
 * it as `label()` and `busyNote()`, so only a host outside that directive needs this.
 */
export function injectMenuButtonI18n(): Signal<CngxMenuButtonI18n> {
  return inject(CNGX_MENU_BUTTON_I18N);
}
