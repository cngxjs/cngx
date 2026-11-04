import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createLanguageSection, createSectionBundle, formatMessage } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import { CNGX_LAYOUT_LANGUAGE_EN, type CngxLayoutLanguageSection } from './layout-language-section';

/**
 * Layout i18n surface. Library defaults are English; consumers override via
 * {@link provideLayoutI18n}. Reactive from birth: the token carries a
 * `Signal`, and {@link withLayoutI18nLabels} accepts a `Signal` of a partial
 * bundle.
 *
 * Every key is the fallback of a copy input on a layout atom, resolved in a
 * `computed()`: a bound input wins, and an unbound one follows a language
 * switch. The keys mirror the layout section of a language pack
 * ({@link CngxLayoutLanguageSection}); composed copy is a function of its
 * parameters, formatted for the reading locale.
 *
 * @since 0.1.0
 */
export interface CngxLayoutI18n {
  /** Fallback of `CngxExpandableText.moreLabel`. */
  readonly expandableTextMore: string;
  /** Fallback of `CngxExpandableText.lessLabel`. */
  readonly expandableTextLess: string;
  /** Fallback of `CngxResizable.label`, the handle's accessible name. */
  readonly resizeHandle: string;
  /** Fallback of `CngxResizable.valueText`: the handle's `aria-valuetext` for a px size. */
  readonly resizeValueText: (size: number) => string;
}

/** @internal The English section with the active pack's layout section on top. */
const injectLayoutSection = createLanguageSection('layout', CNGX_LAYOUT_LANGUAGE_EN);

/** @internal Turns a layout section into the token's keys for a locale. */
function layoutBundleFrom(section: CngxLayoutLanguageSection, locale: string): CngxLayoutI18n {
  return {
    expandableTextMore: section.expandableTextMore,
    expandableTextLess: section.expandableTextLess,
    resizeHandle: section.resizeHandle,
    resizeValueText: (size) => formatMessage(section.resizeValueText, { size }, locale),
  };
}

/** @internal Builds and reads the token, formatted for the reading locale. */
const layoutBundle = createSectionBundle<CngxLayoutLanguageSection, CngxLayoutI18n>({
  section: injectLayoutSection,
  toBundle: layoutBundleFrom,
});

/**
 * DI token for the layout i18n bundle. `providedIn: 'root'`: the layout
 * section of the active language pack over the English defaults; the value
 * is a `Signal`, shared by every reader under one injector.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/i18n/layout-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxExpandableText, CngxResizable
 */
export const CNGX_LAYOUT_I18N = new InjectionToken<Signal<CngxLayoutI18n>>('CngxLayoutI18n', {
  providedIn: 'root',
  factory: () => layoutBundle.build(),
});

/**
 * Branded feature-fn for {@link provideLayoutI18n}.
 *
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
 * @since 0.1.0
 */
export function provideLayoutI18n(...features: readonly CngxLayoutI18nFeature[]): Provider {
  return {
    provide: CNGX_LAYOUT_I18N,
    useFactory: () => layoutBundle.build(features),
  };
}

/**
 * Inject the resolved layout i18n bundle signal. Read it inside a
 * `computed()` or template so a runtime override flip re-derives.
 *
 * @since 0.1.0
 */
export function injectLayoutI18n(): Signal<CngxLayoutI18n> {
  return layoutBundle.resolve(inject(CNGX_LAYOUT_I18N));
}
