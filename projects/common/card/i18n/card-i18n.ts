import { inject, InjectionToken, type Provider } from '@angular/core';

/**
 * Card i18n surface. Library defaults are English; consumers override via
 * {@link provideCardI18n}. Sibling to `CNGX_STEPPER_I18N`, `CNGX_TABS_I18N`
 * and `CNGX_CHART_I18N`.
 *
 * All three keys are live-region copy. A selectable card announces the
 * transition it just made, never the state it is standing in - so these are
 * armed phrases, spent once per change, not a label the card carries.
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
}

const CARD_I18N_DEFAULTS: CngxCardI18n = {
  selected: 'Selected',
  deselected: 'Deselected',
  loading: 'Loading',
};

/**
 * DI token for the card i18n bundle. `providedIn: 'root'` with English
 * defaults.
 *
 * @category common/card/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/card/i18n/card-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxCard
 */
export const CNGX_CARD_I18N = new InjectionToken<CngxCardI18n>('CngxCardI18n', {
  providedIn: 'root',
  factory: () => CARD_I18N_DEFAULTS,
});

/**
 * Branded feature-fn for {@link provideCardI18n}.
 *
 * @category common/card/i18n
 */
export type CngxCardI18nFeature = ((bundle: CngxCardI18n) => CngxCardI18n) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineCardI18nFeature(fn: (bundle: CngxCardI18n) => CngxCardI18n): CngxCardI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override i18n labels via a partial bundle - unset keys keep the English
 * default.
 *
 * @category common/card/i18n
 */
export function withCardI18nLabels(overrides: Partial<CngxCardI18n>): CngxCardI18nFeature {
  return defineCardI18nFeature((bundle) => ({ ...bundle, ...overrides }));
}

/**
 * Provider for the card i18n bundle.
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
    useValue: features.reduce<CngxCardI18n>((bundle, feat) => feat(bundle), CARD_I18N_DEFAULTS),
  };
}

/**
 * Inject the resolved card i18n bundle.
 *
 * @category common/card/i18n
 */
export function injectCardI18n(): CngxCardI18n {
  return inject(CNGX_CARD_I18N);
}
