import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { coerceSignal, createOverrideMerge } from '@cngx/core/utils';

import type { DeltaDirection, DeltaSentiment } from './delta-format';

/**
 * KPI atom i18n surface. Library defaults are English; consumers override
 * via {@link provideKpiI18n}. Reactive from birth: the token carries a
 * `Signal`, and {@link withKpiI18nLabels} accepts a `Signal` of a partial
 * bundle, so a runtime language switch re-derives every label.
 *
 * Every key is a formatter, so word order and plural rules belong to the
 * translator. The magnitude arrives already formatted in the app locale
 * (`CNGX_LOCALE`); the per-instance `label` / `valueTextFormat` inputs still
 * win over the bundle.
 *
 * @category common/data/i18n
 * @since 0.1.0
 */
export interface CngxKpiI18n {
  /** `CngxDelta` accessible name: formatted magnitude plus the sentiment word. */
  readonly deltaLabel: (formatted: string, sentiment: DeltaSentiment) => string;
  /** `CngxTrend` accessible name: formatted magnitude plus the direction word. */
  readonly trendLabel: (formatted: string, direction: DeltaDirection) => string;
  /** `CngxGoal` `aria-valuetext`: clamped value and target. */
  readonly goalValueText: (now: number, max: number) => string;
}

const SENTIMENT_WORD: Record<DeltaSentiment, string> = {
  positive: 'improved',
  negative: 'declined',
  neutral: 'unchanged',
};

const DIRECTION_WORD: Record<DeltaDirection, string> = {
  up: 'up',
  down: 'down',
  flat: 'unchanged',
};

const KPI_I18N_DEFAULTS: CngxKpiI18n = {
  deltaLabel: (formatted, sentiment) => `${formatted} ${SENTIMENT_WORD[sentiment]}`,
  trendLabel: (formatted, direction) => `${formatted} ${DIRECTION_WORD[direction]}`,
  goalValueText: (now, max) => `${now} of ${max}`,
};

/**
 * DI token for the KPI i18n bundle. `providedIn: 'root'` with English
 * defaults; the value is a `Signal`, shared by every reader under one
 * injector.
 *
 * @category common/data/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/display/shared/kpi-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxDelta, CngxTrend, CngxGoal
 */
export const CNGX_KPI_I18N = new InjectionToken<Signal<CngxKpiI18n>>('CngxKpiI18n', {
  providedIn: 'root',
  factory: () => coerceSignal(KPI_I18N_DEFAULTS),
});

/**
 * Branded feature-fn for {@link provideKpiI18n}.
 *
 * @category common/data/i18n
 * @since 0.1.0
 */
export type CngxKpiI18nFeature = ((bundle: Signal<CngxKpiI18n>) => Signal<CngxKpiI18n>) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineKpiI18nFeature(
  fn: (bundle: Signal<CngxKpiI18n>) => Signal<CngxKpiI18n>,
): CngxKpiI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override KPI labels via a partial bundle - unset keys keep the English
 * default. Pass a `Signal` of a partial bundle to switch languages at
 * runtime.
 *
 * @category common/data/i18n
 * @since 0.1.0
 */
export function withKpiI18nLabels(
  overrides: Partial<CngxKpiI18n> | Signal<Partial<CngxKpiI18n>>,
): CngxKpiI18nFeature {
  return defineKpiI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
}

/**
 * Provider for the KPI i18n bundle. Returns a plain `Provider`, so it also
 * scopes a subtree through `viewProviders`.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideKpiI18n(
 *       withKpiI18nLabels({
 *         goalValueText: (now, max) => `${now} von ${max}`,
 *       }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category common/data/i18n
 * @since 0.1.0
 */
export function provideKpiI18n(...features: readonly CngxKpiI18nFeature[]): Provider {
  return {
    provide: CNGX_KPI_I18N,
    useFactory: () =>
      features.reduce<Signal<CngxKpiI18n>>(
        (bundle, feat) => feat(bundle),
        coerceSignal(KPI_I18N_DEFAULTS),
      ),
  };
}

/**
 * Inject the resolved KPI i18n bundle signal. Read it inside a `computed()`
 * or template so a runtime override flip re-derives.
 *
 * @category common/data/i18n
 * @since 0.1.0
 */
export function injectKpiI18n(): Signal<CngxKpiI18n> {
  return inject(CNGX_KPI_I18N);
}
