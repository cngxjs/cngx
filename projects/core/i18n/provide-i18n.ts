import { DOCUMENT } from '@angular/common';
import {
  computed,
  effect,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
  untracked,
  type EnvironmentProviders,
  type Provider,
  type Signal,
} from '@angular/core';
import { CNGX_DIRECTION, type CngxDirection } from '@cngx/core';
import { CNGX_LOCALE, coerceSignal, memoize } from '@cngx/core/utils';

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
export type CngxI18nFeature =
  | { readonly _target: 'pack'; readonly source: Signal<CngxActiveLanguagePack | undefined> }
  | { readonly _target: 'documentLanguage'; readonly mode: 'on' | 'off' };

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
 * Whether {@link provideCngxI18n} writes `<html lang>` and `<html dir>` from
 * the active pack. On by default. `'off'` leaves both attributes to the app;
 * `CNGX_DIRECTION` then keeps reading `dir` from the DOM.
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo provideCngxI18n
 */
export function withDocumentLanguage(mode: 'on' | 'off'): CngxI18nFeature {
  return { _target: 'documentLanguage', mode };
}

const RTL_LANGUAGES = new Set([
  'ar',
  'arc',
  'ckb',
  'dv',
  'fa',
  'he',
  'iw',
  'ks',
  'ps',
  'sd',
  'syr',
  'ug',
  'ur',
  'yi',
]);

interface TextInfoLocale {
  readonly language: string;
  readonly getTextInfo?: () => { readonly direction?: string };
  readonly textInfo?: { readonly direction?: string };
}

const directionOf = memoize(
  (locale: string): CngxDirection => {
    let intlLocale: TextInfoLocale;
    try {
      intlLocale = new Intl.Locale(locale) as unknown as TextInfoLocale;
    } catch {
      return 'ltr';
    }
    const direction = (intlLocale.getTextInfo?.() ?? intlLocale.textInfo)?.direction;
    if (direction) {
      return direction === 'rtl' ? 'rtl' : 'ltr';
    }
    return RTL_LANGUAGES.has(intlLocale.language) ? 'rtl' : 'ltr';
  },
  { cacheLimit: 32 },
);

// The pack's own direction; CNGX_DIRECTION aliases it until a later
// provideDirection() replaces the alias, while <html dir> keeps following the pack.
const PACK_DIRECTION = new InjectionToken<Signal<CngxDirection>>('CngxPackDirection');

function reflectDocumentLanguage(): void {
  const root = inject(DOCUMENT).documentElement;
  const direction = inject(PACK_DIRECTION);
  const pack = inject(CNGX_LANGUAGE_PACK);
  effect(() => {
    const lang = pack().locale;
    const dir = direction();
    untracked(() => {
      root.lang = lang;
      root.dir = dir;
    });
  });
}

/**
 * Provides the app's language file: one call in the app config replaces the
 * per-token `provide*I18n` calls. Per-token providers still apply on top of
 * the pack, key by key. With several pack features the last one wins.
 *
 * The pack also drives the locale and the direction: `CNGX_LOCALE` is the
 * pack's `locale`, `CNGX_DIRECTION` its `dir` (else derived from `locale`),
 * and `<html lang>` / `<html dir>` follow it unless
 * {@link withDocumentLanguage} is `'off'`. A `provideLocale()` or
 * `provideDirection()` listed after this call wins.
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideCngxI18n(withPack(de))] });
 * ```
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo withPack, withPartialPack, withDocumentLanguage, CNGX_LANGUAGE_PACK
 */
export function provideCngxI18n(...features: readonly CngxI18nFeature[]): EnvironmentProviders {
  let source: Signal<CngxActiveLanguagePack | undefined> | undefined;
  let documentLanguage = true;
  for (const feature of features) {
    if (feature._target === 'pack') {
      source = feature.source;
    } else {
      documentLanguage = feature.mode === 'on';
    }
  }

  const providers: (Provider | EnvironmentProviders)[] = [
    {
      provide: CNGX_LANGUAGE_PACK,
      useFactory: () => (source ? computed(() => source() ?? ENGLISH) : ENGLISH_PACK),
    },
    {
      provide: CNGX_LOCALE,
      useFactory: () => {
        const pack = inject(CNGX_LANGUAGE_PACK);
        return computed(() => pack().locale);
      },
    },
  ];
  if (documentLanguage) {
    providers.push(
      {
        provide: PACK_DIRECTION,
        useFactory: () => {
          const pack = inject(CNGX_LANGUAGE_PACK);
          return computed(() => pack().dir ?? directionOf(pack().locale));
        },
      },
      { provide: CNGX_DIRECTION, useExisting: PACK_DIRECTION },
      provideEnvironmentInitializer(reflectDocumentLanguage),
    );
  }
  return makeEnvironmentProviders(providers);
}

/**
 * @internal A section without its `undefined` keys, so a TS pack's
 * `{ key: maybe }` reads English like a missing key instead of overriding it.
 * Returns the section itself when every key is defined.
 */
function withoutUndefinedKeys<T extends object>(section: T | undefined): T | undefined {
  if (!section || !Object.values(section).includes(undefined)) {
    return section;
  }
  return Object.fromEntries(
    Object.entries(section).filter(([, value]) => value !== undefined),
  ) as T;
}

/**
 * Reads one section of the active language pack, in an injection context.
 * `undefined` while the pack has no such section - the lib then reads its
 * English defaults. A key whose value is `undefined` is left out, so it reads
 * English too.
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo CNGX_LANGUAGE_PACK
 */
export function injectLanguageSection<K extends keyof CngxLanguagePack>(
  key: K,
): Signal<CngxPartialLanguagePack[K] | undefined> {
  const pack = inject(CNGX_LANGUAGE_PACK);
  const section = computed(() => pack()[key]);
  return computed(() => withoutUndefinedKeys(section()));
}
