import { computed, inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import { CNGX_CARD_LANGUAGE_EN } from './card-language-section';

/**
 * Card i18n surface. Library defaults are English; consumers override via
 * {@link provideCardI18n}. Sibling to `CNGX_STEPPER_I18N`, `CNGX_TABS_I18N`
 * and `CNGX_CHART_I18N`.
 *
 * `selected`, `deselected` and `loading` are live-region copy. A selectable
 * card announces the transition it just made, never the state it is standing
 * in - so these are armed phrases, spent once per change, not a label the
 * card carries. `timestamp` orders a {@link CngxCardTimestamp} prefix and its
 * date.
 *
 * @category common/card/i18n
 */
export interface CngxCardI18n {
  /** Announced when a selectable card becomes selected. */
  readonly selected: string;
  /** Announced when a selectable card becomes deselected. */
  readonly deselected: string;
  /** Owns the live region while the card loads, pre-empting the selection phrase. */
  readonly loading: string;
  /**
   * `{prefix}` and `{date}` of a timestamp, in reading order; see
   * {@link CngxCardLanguageSection.timestamp}.
   */
  readonly timestamp: string;
}

const NO_SECTION: Partial<CngxCardI18n> = {};

/** @internal The English section with the active pack's card section on top. */
function cardBundleFromPack(): Signal<CngxCardI18n> {
  const section = injectLanguageSection('card');
  return createOverrideMerge(
    CNGX_CARD_LANGUAGE_EN,
    computed(() => section() ?? NO_SECTION),
  );
}

/**
 * DI token for the card i18n bundle, a `Signal` so the phrases follow a
 * runtime language switch. `providedIn: 'root'`: the card section of the
 * active language pack over the English defaults.
 *
 * @category common/card/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/card/i18n/card-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxCard
 */
export const CNGX_CARD_I18N = new InjectionToken<Signal<CngxCardI18n>>('CngxCardI18n', {
  providedIn: 'root',
  factory: cardBundleFromPack,
});

/**
 * Branded feature-fn for {@link provideCardI18n}.
 *
 * @category common/card/i18n
 */
export type CngxCardI18nFeature = ((bundle: Signal<CngxCardI18n>) => Signal<CngxCardI18n>) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineCardI18nFeature(
  fn: (bundle: Signal<CngxCardI18n>) => Signal<CngxCardI18n>,
): CngxCardI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override i18n labels via a partial bundle - unset keys keep the language
 * pack's phrase, or the English default. Pass a `Signal` to switch the
 * language at runtime.
 *
 * @category common/card/i18n
 */
export function withCardI18nLabels(
  overrides: Partial<CngxCardI18n> | Signal<Partial<CngxCardI18n>>,
): CngxCardI18nFeature {
  return defineCardI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
}

/**
 * Provider for the card i18n bundle. The features apply on top of the active
 * language pack, so a subtree can override single keys of the app's language.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideCardI18n(withCardI18nLabels({ selected: 'Ausgewählt', deselected: 'Abgewählt' })),
 *   ],
 * });
 * ```
 *
 * @category common/card/i18n
 */
export function provideCardI18n(...features: readonly CngxCardI18nFeature[]): Provider {
  return {
    provide: CNGX_CARD_I18N,
    useFactory: () =>
      features.reduce<Signal<CngxCardI18n>>((bundle, feat) => feat(bundle), cardBundleFromPack()),
  };
}

/**
 * Inject the resolved card i18n bundle.
 *
 * @category common/card/i18n
 */
export function injectCardI18n(): Signal<CngxCardI18n> {
  return inject(CNGX_CARD_I18N);
}
