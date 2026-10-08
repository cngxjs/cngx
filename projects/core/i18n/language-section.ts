import { computed, inject, InjectionToken, type Signal } from '@angular/core';
import { createDefaultsFill, createOverrideMerge } from '@cngx/core/utils';

import type { CngxLanguagePack } from './language-pack';
import { injectLanguageSection } from './provide-i18n';

const NO_SECTION = {};

/**
 * One area's section of the active language pack over its English section,
 * as a root-shared `Signal`. Call it once per area at module level and read
 * the returned accessor in an injection context: every reader app-wide gets
 * the same `Signal`, so config resolvers keyed on it memoize once. A key the
 * pack leaves out (or sets to `undefined`) reads English.
 *
 * The section is app-wide like the pack; locale-dependent formatting belongs
 * in {@link createSectionBundle}, which takes this accessor as its `section`.
 *
 * ```ts
 * export const injectTocSection = createLanguageSection('toc', CNGX_TOC_LANGUAGE_EN);
 * ```
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo injectLanguageSection, createSectionBundle, createNestedLanguageSection
 */
export function createLanguageSection<K extends keyof CngxLanguagePack>(
  area: K,
  english: NonNullable<CngxLanguagePack[K]>,
): () => Signal<NonNullable<CngxLanguagePack[K]>> {
  type Section = NonNullable<CngxLanguagePack[K]>;
  const token = new InjectionToken<Signal<Section>>(`CngxLanguageSection:${String(area)}`, {
    providedIn: 'root',
    factory: () => {
      const pack = injectLanguageSection(area);
      return createOverrideMerge<Section>(
        english,
        computed(() => (pack() ?? NO_SECTION) as Partial<Section>),
      );
    },
  });
  return () => inject(token);
}

/** `N` when `T[N]` is a plain record (not a function or primitive), else `never`. */
type NestedRecordKey<T, N extends keyof T> =
  NonNullable<T[N]> extends (...args: never[]) => unknown
    ? never
    : NonNullable<T[N]> extends object
      ? N
      : never;

/**
 * {@link createLanguageSection} for a section with one nested record, such as
 * a `statusLabels` map: the pack's record merges key by key over the English
 * record, so a pack that sets one nested label keeps the other English ones. A
 * key the pack leaves out, or sets to `null` / `undefined`, reads English at
 * either level.
 *
 * ```ts
 * export const injectStepperSection = createNestedLanguageSection(
 *   'stepper',
 *   CNGX_STEPPER_LANGUAGE_EN,
 *   'statusLabels',
 * );
 * ```
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo createLanguageSection, createDefaultsFill
 */
export function createNestedLanguageSection<
  K extends keyof CngxLanguagePack,
  N extends keyof NonNullable<CngxLanguagePack[K]>,
>(
  area: K,
  english: NonNullable<CngxLanguagePack[K]>,
  key: NestedRecordKey<NonNullable<CngxLanguagePack[K]>, N>,
): () => Signal<NonNullable<CngxLanguagePack[K]>> {
  type Section = NonNullable<CngxLanguagePack[K]>;
  const token = new InjectionToken<Signal<Section>>(`CngxLanguageSection:${String(area)}`, {
    providedIn: 'root',
    factory: () => {
      const pack = injectLanguageSection(area);
      return createDefaultsFill<Section, never>(
        computed(() => (pack() ?? NO_SECTION) as Partial<Section>),
        english,
        key as never,
      );
    },
  });
  return () => inject(token);
}
