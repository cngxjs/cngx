import { computed, inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge, injectLocale } from '@cngx/core/utils';

import {
  CNGX_INTERACTIVE_LANGUAGE_EN,
  type CngxInteractiveLanguageSection,
} from './interactive-language-section';

/**
 * Interactive i18n surface. Library defaults are English; consumers override
 * via {@link provideInteractiveI18n}. Reactive from birth: the token carries a
 * `Signal`, and {@link withInteractiveI18nLabels} accepts a `Signal` of a
 * partial bundle, so a runtime language switch re-derives every read.
 *
 * `asyncClickSucceeded` / `asyncClickFailed` are live-region copy:
 * `CngxAsyncClick` (and `CngxActionButton`, which wraps it) announces the
 * settle it just made, spent once per transition. The other keys seed
 * string inputs at construction (`CngxCopyBlock`, `CngxRangeSlider`,
 * `CngxBreadcrumb`), so a bound input still wins and an unbound one is
 * static per instance. They are optional so a bundle built before they
 * existed keeps compiling; the English defaults fill them.
 *
 * @category common/interactive/i18n
 */
export interface CngxInteractiveI18n {
  /** Announced when an async click action resolves. */
  readonly asyncClickSucceeded: string;
  /** Announced when an async click action rejects. */
  readonly asyncClickFailed: string;
  /** Default of the `CngxCopyBlock` `buttonLabel` input. */
  readonly copy?: string;
  /** Default of the `CngxCopyBlock` `copiedLabel` input. */
  readonly copied?: string;
  /** Default of the `CngxCopyBlock` `srAnnouncement` input (live region). */
  readonly copiedAnnouncement?: string;
  /** Default of the `CngxRangeSlider` `startLabel` input. */
  readonly rangeMinimum?: string;
  /** Default of the `CngxRangeSlider` `endLabel` input. */
  readonly rangeMaximum?: string;
  /** Default of the `CngxBreadcrumb` `label` input (landmark name). */
  readonly breadcrumb?: string;
  /** Default confirmation of `canDeactivateWhenClean`. */
  readonly unsavedChanges?: string;
  /**
   * Visible `start - end` value of `CngxRangeSlider`. Receives both values
   * already formatted; one message, so a locale owns the order and the joiner.
   */
  readonly rangeValue?: (start: string, end: string) => string;
}

/** @internal Turns an interactive section into the token's keys for a locale. */
function interactiveBundleFrom(
  section: CngxInteractiveLanguageSection,
  locale: string,
): Required<CngxInteractiveI18n> {
  return {
    asyncClickSucceeded: section.asyncClickSucceeded,
    asyncClickFailed: section.asyncClickFailed,
    copy: section.copy,
    copied: section.copied,
    copiedAnnouncement: section.copiedAnnouncement,
    rangeMinimum: section.rangeMinimum,
    rangeMaximum: section.rangeMaximum,
    breadcrumb: section.breadcrumb,
    unsavedChanges: section.unsavedChanges,
    rangeValue: (start, end) => formatMessage(section.rangeValue, { start, end }, locale),
  };
}

/** @internal English for every key, filling keys a directly provided bundle predates. */
const INTERACTIVE_I18N_DEFAULTS = interactiveBundleFrom(CNGX_INTERACTIVE_LANGUAGE_EN, 'en');

const NO_SECTION: Partial<CngxInteractiveLanguageSection> = {};

/** @internal The interactive section of the active pack over English, mapped for the locale. */
function interactiveBundleFromPack(): Signal<CngxInteractiveI18n> {
  const pack = injectLanguageSection('interactive');
  const locale = injectLocale();
  const section = createOverrideMerge(
    CNGX_INTERACTIVE_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
  return computed(() => interactiveBundleFrom(section(), locale()));
}

/**
 * DI token for the interactive i18n bundle. `providedIn: 'root'`: the
 * interactive section of the active language pack over the English defaults;
 * the value is a `Signal`, shared by every reader under one injector.
 *
 * @category common/interactive/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/i18n/interactive-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxAsyncClick
 */
export const CNGX_INTERACTIVE_I18N = new InjectionToken<Signal<CngxInteractiveI18n>>(
  'CngxInteractiveI18n',
  {
    providedIn: 'root',
    factory: interactiveBundleFromPack,
  },
);

/**
 * Branded feature-fn for {@link provideInteractiveI18n}.
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 */
export type CngxInteractiveI18nFeature = ((
  bundle: Signal<CngxInteractiveI18n>,
) => Signal<CngxInteractiveI18n>) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineInteractiveI18nFeature(
  fn: (bundle: Signal<CngxInteractiveI18n>) => Signal<CngxInteractiveI18n>,
): CngxInteractiveI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override i18n labels via a partial bundle - unset keys keep the language
 * pack's copy, or the English default. Pass a `Signal` of a partial bundle to switch languages at
 * runtime.
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 */
export function withInteractiveI18nLabels(
  overrides: Partial<CngxInteractiveI18n> | Signal<Partial<CngxInteractiveI18n>>,
): CngxInteractiveI18nFeature {
  return defineInteractiveI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
}

/**
 * Provider for the interactive i18n bundle. Returns a plain `Provider`, so it
 * also scopes a subtree through `viewProviders`. The features apply on top of
 * the active language pack.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideInteractiveI18n(
 *       withInteractiveI18nLabels({ asyncClickSucceeded: 'Erledigt', asyncClickFailed: 'Fehlgeschlagen' }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 */
export function provideInteractiveI18n(
  ...features: readonly CngxInteractiveI18nFeature[]
): Provider {
  return {
    provide: CNGX_INTERACTIVE_I18N,
    useFactory: () =>
      features.reduce<Signal<CngxInteractiveI18n>>(
        (bundle, feat) => feat(bundle),
        interactiveBundleFromPack(),
      ),
  };
}

/**
 * Inject the resolved interactive i18n bundle signal. Read it inside a
 * `computed()` or template so a runtime override flip re-derives.
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 */
export function injectInteractiveI18n(): Signal<CngxInteractiveI18n> {
  return inject(CNGX_INTERACTIVE_I18N);
}

/**
 * @internal - the interactive bundle as a shared signal with every optional
 * key filled from the English defaults, so a directly provided token value
 * that predates a key still resolves it. One `computed()` per injected
 * bundle.
 */
export function injectResolvedInteractiveI18n(): Signal<Required<CngxInteractiveI18n>> {
  return createOverrideMerge<Required<CngxInteractiveI18n>>(
    INTERACTIVE_I18N_DEFAULTS,
    injectInteractiveI18n(),
  );
}
