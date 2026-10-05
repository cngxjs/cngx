import { computed, inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createSectionBundle, formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

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
 * settle it just made, spent once per transition. The other keys are the
 * fallback of string inputs (`CngxCopyBlock`, `CngxRangeSlider`,
 * `CngxBreadcrumb`), resolved in a `computed()`: a bound input wins, and an
 * unbound one follows a language switch. They are optional so a bundle
 * built before they existed keeps compiling; the active language pack (or
 * its English section) fills them at the reading site.
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

const NO_SECTION: Partial<CngxInteractiveLanguageSection> = {};

/** @internal The interactive section of the active pack over English. */
function injectInteractiveSection(): Signal<CngxInteractiveLanguageSection> {
  const pack = injectLanguageSection('interactive');
  return createOverrideMerge(
    CNGX_INTERACTIVE_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/** @internal Builds and reads the token, formatted for the reading locale. */
const interactiveBundle = createSectionBundle<CngxInteractiveLanguageSection, CngxInteractiveI18n>({
  section: injectInteractiveSection,
  toBundle: interactiveBundleFrom,
});

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
    factory: () => interactiveBundle.build(),
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
    useFactory: () => interactiveBundle.build(features),
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
  return interactiveBundle.resolve(inject(CNGX_INTERACTIVE_I18N));
}

/**
 * @internal - {@link injectInteractiveI18n} typed with every key present.
 * The reading-site resolve already fills each key a directly provided token
 * value leaves out from the active pack's section, so no key is ever unset.
 */
export function injectResolvedInteractiveI18n(): Signal<Required<CngxInteractiveI18n>> {
  return injectInteractiveI18n() as Signal<Required<CngxInteractiveI18n>>;
}
