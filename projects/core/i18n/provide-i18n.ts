import {
  computed,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  signal,
  type EnvironmentProviders,
  type Signal,
} from '@angular/core';
import { coerceSignal } from '@cngx/core/utils';

import type {
  CngxLanguagePack,
  CngxLanguagePackMeta,
  CngxPartialLanguagePack,
} from './language-pack';

/**
 * A pack every key of every section of which is present, plus its locale.
 *
 * @category core/i18n
 * @since 0.1.0
 */
export type CngxCompleteLanguagePack = CngxLanguagePack & CngxLanguagePackMeta;

/**
 * The pack cngx reads: any section or key may be missing and then reads English.
 *
 * @category core/i18n
 * @since 0.1.0
 */
export type CngxActiveLanguagePack = CngxPartialLanguagePack & CngxLanguagePackMeta;

const ENGLISH: CngxActiveLanguagePack = { locale: 'en' };
const ENGLISH_PACK = signal(ENGLISH).asReadonly();

/**
 * The active language pack as a `Signal`. Without {@link provideCngxI18n} it
 * holds an English pack with no sections, so every section reads its English
 * defaults. Libs read their section through {@link injectLanguageSection}.
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo provideCngxI18n, injectLanguageSection
 */
export const CNGX_LANGUAGE_PACK = new InjectionToken<Signal<CngxActiveLanguagePack>>(
  'CNGX_LANGUAGE_PACK',
  { providedIn: 'root', factory: () => ENGLISH_PACK },
);

/**
 * A feature of {@link provideCngxI18n}.
 *
 * @category core/i18n
 * @since 0.1.0
 */
export interface CngxI18nFeature {
  readonly _target: 'pack';
  readonly source: Signal<CngxActiveLanguagePack | undefined>;
}

/**
 * Sets the app's language pack. Pass a `Signal` to switch at runtime;
 * `undefined` means English. The pack must be complete for every cngx entry
 * the app's types import - a missing key is a compile error. Use
 * {@link withPartialPack} to accept gaps.
 *
 * ```ts
 * const pack = signal<CngxCompleteLanguagePack | undefined>(undefined);
 * bootstrapApplication(App, { providers: [provideCngxI18n(withPack(pack))] });
 * pack.set((await import('./i18n/de')).default);
 * ```
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo provideCngxI18n, withPartialPack
 */
export function withPack(
  pack: CngxCompleteLanguagePack | Signal<CngxCompleteLanguagePack | undefined>,
): CngxI18nFeature {
  return { _target: 'pack', source: coerceSignal<CngxActiveLanguagePack | undefined>(pack) };
}

/**
 * Like {@link withPack}, but accepts a pack with missing sections or keys;
 * every missing key reads English.
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo provideCngxI18n, withPack
 */
export function withPartialPack(
  pack: CngxActiveLanguagePack | Signal<CngxActiveLanguagePack | undefined>,
): CngxI18nFeature {
  return { _target: 'pack', source: coerceSignal<CngxActiveLanguagePack | undefined>(pack) };
}

/**
 * Provides the app's language file: one call in the app config replaces the
 * per-token `provide*I18n` calls. Per-token providers still apply on top of
 * the pack, key by key. With several pack features the last one wins.
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideCngxI18n(withPack(de))] });
 * ```
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo withPack, withPartialPack, CNGX_LANGUAGE_PACK
 */
export function provideCngxI18n(...features: readonly CngxI18nFeature[]): EnvironmentProviders {
  let source: Signal<CngxActiveLanguagePack | undefined> | undefined;
  for (const feature of features) {
    source = feature.source;
  }
  return makeEnvironmentProviders([
    {
      provide: CNGX_LANGUAGE_PACK,
      useFactory: () => (source ? computed(() => source() ?? ENGLISH) : ENGLISH_PACK),
    },
  ]);
}

/**
 * Reads one section of the active language pack, in an injection context.
 * `undefined` while the pack has no such section - the lib then reads its
 * English defaults.
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo CNGX_LANGUAGE_PACK
 */
export function injectLanguageSection<K extends keyof CngxLanguagePack>(
  key: K,
): Signal<CngxPartialLanguagePack[K] | undefined> {
  const pack = inject(CNGX_LANGUAGE_PACK);
  return computed(() => pack()[key]);
}
