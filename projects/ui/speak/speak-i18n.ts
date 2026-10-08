import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createLanguageSection } from '@cngx/core/i18n';
import { createFilledOverrideMerge } from '@cngx/core/utils';

import {
  CNGX_SPEAK_LANGUAGE_EN,
  type CngxSpeakLanguageSection,
} from './i18n/speak-language-section';

/**
 * Speak i18n surface: the `speak` section of the language pack (English
 * without one); override single keys via {@link provideSpeakI18n}. Reactive
 * from birth: the token carries a `Signal`, and {@link withSpeakI18nLabels}
 * accepts a `Signal` of a partial bundle.
 *
 * `CngxSpeakButton` reads both keys inside a `computed()` while its
 * `readAloudLabel` / `stopLabel` inputs are unbound, so the label follows a
 * language switch.
 *
 * @category ui/speak/i18n
 */
export type CngxSpeakI18n = CngxSpeakLanguageSection;

/** The English speak section with the active pack's speak section on top, shared app-wide. */
const speakBundleFromPack = createLanguageSection('speak', CNGX_SPEAK_LANGUAGE_EN);

/**
 * DI token for the speak i18n bundle. `providedIn: 'root'`: the `speak`
 * section of the active language pack over the English defaults. The value is
 * a `Signal`, shared by every reader under one injector.
 *
 * @category ui/speak/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/speak/speak-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxSpeakButton
 */
export const CNGX_SPEAK_I18N = new InjectionToken<Signal<CngxSpeakI18n>>('CngxSpeakI18n', {
  providedIn: 'root',
  factory: speakBundleFromPack,
});

/**
 * Branded feature-fn for {@link provideSpeakI18n}.
 *
 * @category ui/speak/i18n
 * @since 0.1.0
 */
export type CngxSpeakI18nFeature = ((bundle: Signal<CngxSpeakI18n>) => Signal<CngxSpeakI18n>) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineSpeakI18nFeature(
  fn: (bundle: Signal<CngxSpeakI18n>) => Signal<CngxSpeakI18n>,
): CngxSpeakI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override i18n labels via a partial bundle - unset keys, and keys set to
 * `null` or `undefined`, keep the language pack's copy, or the English
 * default, so the button never loses its accessible name. Pass a `Signal` of a
 * partial bundle to switch languages at runtime.
 *
 * @category ui/speak/i18n
 * @since 0.1.0
 */
export function withSpeakI18nLabels(
  overrides: Partial<CngxSpeakI18n> | Signal<Partial<CngxSpeakI18n>>,
): CngxSpeakI18nFeature {
  return defineSpeakI18nFeature((bundle) => createFilledOverrideMerge(bundle, overrides));
}

/**
 * Provider for the speak i18n bundle. Returns a plain `Provider`, so it also
 * scopes a subtree through `viewProviders`.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideSpeakI18n(withSpeakI18nLabels({ readAloud: 'Vorlesen', stopSpeaking: 'Vorlesen beenden' })),
 *   ],
 * });
 * ```
 *
 * @category ui/speak/i18n
 * @since 0.1.0
 */
export function provideSpeakI18n(...features: readonly CngxSpeakI18nFeature[]): Provider {
  return {
    provide: CNGX_SPEAK_I18N,
    useFactory: () =>
      features.reduce<Signal<CngxSpeakI18n>>((bundle, feat) => feat(bundle), speakBundleFromPack()),
  };
}

/**
 * Inject the resolved speak i18n bundle signal.
 *
 * @category ui/speak/i18n
 * @since 0.1.0
 */
export function injectSpeakI18n(): Signal<CngxSpeakI18n> {
  return inject(CNGX_SPEAK_I18N);
}
