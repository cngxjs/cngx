import { computed, inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import { CNGX_LAYOUT_LANGUAGE_EN, type CngxLayoutLanguageSection } from './layout-language-section';

/**
 * Layout i18n surface. Library defaults are English; consumers override via
 * {@link provideLayoutI18n}. Reactive from birth: the token carries a
 * `Signal`, and {@link withLayoutI18nLabels} accepts a `Signal` of a partial
 * bundle.
 *
 * Both keys are the fallback of the `CngxExpandableText` `moreLabel` /
 * `lessLabel` inputs, resolved in a `computed()`: a bound input wins, and an
 * unbound one follows a language switch. The same shape as the layout
 * section of a language pack, declared once as
 * {@link CngxLayoutLanguageSection}.
 *
 * @category common/layout/i18n
 * @since 0.1.0
 */
export type CngxLayoutI18n = CngxLayoutLanguageSection;

const NO_SECTION: Partial<CngxLayoutI18n> = {};

/** @internal The English section with the active pack's layout section on top. */
function layoutBundleFromPack(): Signal<CngxLayoutI18n> {
  const section = injectLanguageSection('layout');
  return createOverrideMerge(
    CNGX_LAYOUT_LANGUAGE_EN,
    computed(() => section() ?? NO_SECTION),
  );
}

/**
 * DI token for the layout i18n bundle. `providedIn: 'root'`: the layout
 * section of the active language pack over the English defaults; the value
 * is a `Signal`, shared by every reader under one injector.
 *
 * @category common/layout/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/i18n/layout-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxExpandableText
 */
export const CNGX_LAYOUT_I18N = new InjectionToken<Signal<CngxLayoutI18n>>('CngxLayoutI18n', {
  providedIn: 'root',
  factory: layoutBundleFromPack,
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
 * Override layout labels via a partial bundle - unset keys keep the
 * language pack's copy, or the English default. Pass a `Signal` of a partial
 * bundle to switch languages at runtime.
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
 * also scopes a subtree through `viewProviders`. The features apply on top
 * of the active language pack.
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
        layoutBundleFromPack(),
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
