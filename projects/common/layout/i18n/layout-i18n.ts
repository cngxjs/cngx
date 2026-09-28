import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { coerceSignal, createOverrideMerge } from '@cngx/core/utils';

/**
 * Layout i18n surface. Library defaults are English; consumers override via
 * {@link provideLayoutI18n}. Reactive from birth: the token carries a
 * `Signal`, and {@link withLayoutI18nLabels} accepts a `Signal` of a partial
 * bundle.
 *
 * Both keys seed the `CngxExpandableText` `moreLabel` / `lessLabel` inputs
 * at construction, so a bound input still wins and an unbound one is static
 * per instance.
 *
 * @category common/layout/i18n
 */
export interface CngxLayoutI18n {
  /** Default of the `CngxExpandableText` `moreLabel` input. */
  readonly expandableTextMore: string;
  /** Default of the `CngxExpandableText` `lessLabel` input. */
  readonly expandableTextLess: string;
}

const LAYOUT_I18N_DEFAULTS: CngxLayoutI18n = {
  expandableTextMore: 'Show more',
  expandableTextLess: 'Show less',
};

/**
 * DI token for the layout i18n bundle. `providedIn: 'root'` with English
 * defaults; the value is a `Signal`, shared by every reader under one
 * injector.
 *
 * @category common/layout/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/i18n/layout-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxExpandableText
 */
export const CNGX_LAYOUT_I18N = new InjectionToken<Signal<CngxLayoutI18n>>('CngxLayoutI18n', {
  providedIn: 'root',
  factory: () => coerceSignal(LAYOUT_I18N_DEFAULTS),
});

/**
 * Branded feature-fn for {@link provideLayoutI18n}.
 *
 * @category common/layout/i18n
 * @since 0.1.0
 */
export type CngxLayoutI18nFeature = ((bundle: Signal<CngxLayoutI18n>) => Signal<CngxLayoutI18n>) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineLayoutI18nFeature(
  fn: (bundle: Signal<CngxLayoutI18n>) => Signal<CngxLayoutI18n>,
): CngxLayoutI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override layout labels via a partial bundle - unset keys keep the English
 * default. Pass a `Signal` of a partial bundle to switch languages at
 * runtime.
 *
 * @category common/layout/i18n
 * @since 0.1.0
 */
export function withLayoutI18nLabels(
  overrides: Partial<CngxLayoutI18n> | Signal<Partial<CngxLayoutI18n>>,
): CngxLayoutI18nFeature {
  return defineLayoutI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
}

/**
 * Provider for the layout i18n bundle. Returns a plain `Provider`, so it
 * also scopes a subtree through `viewProviders`.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideLayoutI18n(
 *       withLayoutI18nLabels({ expandableTextMore: 'Mehr anzeigen', expandableTextLess: 'Weniger anzeigen' }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category common/layout/i18n
 * @since 0.1.0
 */
export function provideLayoutI18n(...features: readonly CngxLayoutI18nFeature[]): Provider {
  return {
    provide: CNGX_LAYOUT_I18N,
    useFactory: () =>
      features.reduce<Signal<CngxLayoutI18n>>(
        (bundle, feat) => feat(bundle),
        coerceSignal(LAYOUT_I18N_DEFAULTS),
      ),
  };
}

/**
 * Inject the resolved layout i18n bundle signal. Read it inside a
 * `computed()` or template so a runtime override flip re-derives.
 *
 * @category common/layout/i18n
 * @since 0.1.0
 */
export function injectLayoutI18n(): Signal<CngxLayoutI18n> {
  return inject(CNGX_LAYOUT_I18N);
}
