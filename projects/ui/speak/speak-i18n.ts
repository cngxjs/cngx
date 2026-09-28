import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { coerceSignal, createOverrideMerge } from '@cngx/core/utils';

/**
 * Speak i18n surface. Library defaults are English; consumers override via
 * {@link provideSpeakI18n}. Reactive from birth: the token carries a `Signal`,
 * and {@link withSpeakI18nLabels} accepts a `Signal` of a partial bundle.
 *
 * `CngxSpeakButton` reads both keys once at construction as the defaults of its
 * `readAloudLabel` / `stopLabel` inputs.
 *
 * @category ui/speak/i18n
 */
export interface CngxSpeakI18n {
  /** Accessible name of the speak button while idle. */
  readonly readAloud: string;
  /** Accessible name of the speak button while speaking. */
  readonly stopSpeaking: string;
}

const SPEAK_I18N_DEFAULTS: CngxSpeakI18n = {
  readAloud: 'Read aloud',
  stopSpeaking: 'Stop speaking',
};

/**
 * DI token for the speak i18n bundle. `providedIn: 'root'` with English
 * defaults; the value is a `Signal`, shared by every reader under one injector.
 *
 * @category ui/speak/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/speak/speak-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxSpeakButton
 */
export const CNGX_SPEAK_I18N = new InjectionToken<Signal<CngxSpeakI18n>>('CngxSpeakI18n', {
  providedIn: 'root',
  factory: () => coerceSignal(SPEAK_I18N_DEFAULTS),
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
 * Override i18n labels via a partial bundle - unset keys keep the English
 * default. Pass a `Signal` of a partial bundle to switch languages at runtime.
 *
 * @category ui/speak/i18n
 * @since 0.1.0
 */
export function withSpeakI18nLabels(
  overrides: Partial<CngxSpeakI18n> | Signal<Partial<CngxSpeakI18n>>,
): CngxSpeakI18nFeature {
  return defineSpeakI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
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
      features.reduce<Signal<CngxSpeakI18n>>(
        (bundle, feat) => feat(bundle),
        coerceSignal(SPEAK_I18N_DEFAULTS),
      ),
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
