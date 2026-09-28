import {
  inject,
  InjectionToken,
  LOCALE_ID,
  makeEnvironmentProviders,
  signal,
  type EnvironmentProviders,
  type Provider,
  type Signal,
} from '@angular/core';

import { coerceSignal } from './coerce.util';
import { memoize } from './memo.util';

const LOCALE_SIGNAL_CACHE_LIMIT = 32;

const localeSignalFor = memoize((id: string): Signal<string> => signal(id).asReadonly(), {
  cacheLimit: LOCALE_SIGNAL_CACHE_LIMIT,
});

/**
 * The one locale source every cngx formatter reads. Numbers, percents and
 * dates rendered by a cngx atom format with this locale, never with a direct
 * `LOCALE_ID` injection.
 *
 * Deliberately has no root factory: without a provider, {@link injectLocale}
 * falls back to the nearest `LOCALE_ID` at the call site, so a component-level
 * `{ provide: LOCALE_ID, useValue: 'de-DE' }` keeps working. A root factory
 * would only ever see the root `LOCALE_ID` and silently drop that override.
 * When provided (anywhere up the injector tree), the nearest `CNGX_LOCALE`
 * wins over any `LOCALE_ID`. `LOCALE_ID` is static; to switch the locale at
 * runtime, provide a `Signal` through {@link provideLocale} or
 * {@link provideLocaleAt}.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo injectLocale, provideLocale, provideLocaleAt
 */
export const CNGX_LOCALE = new InjectionToken<Signal<string>>('CNGX_LOCALE');

/**
 * Read the locale signal cngx formats with, in an injection context.
 * Returns the nearest {@link CNGX_LOCALE} when one is provided, else a signal
 * of the nearest `LOCALE_ID` (one shared signal per locale id). Read it inside
 * the `computed()` that formats, so a locale flip re-formats:
 * `computed(() => numberFormatterFor(this.locale(), OPTS).format(v))`.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo CNGX_LOCALE, provideLocale, numberFormatterFor, dateTimeFormatterFor
 */
export function injectLocale(): Signal<string> {
  return inject(CNGX_LOCALE, { optional: true }) ?? localeSignalFor(inject(LOCALE_ID));
}

/**
 * Provide the locale cngx formats with, environment-scoped (bootstrap or route
 * `providers`). Pass a `Signal<string>` to switch the locale at runtime; a
 * plain string pins it. Outranks `LOCALE_ID` for every cngx formatter below.
 * For a per-subtree override in a component's `viewProviders`, use
 * {@link provideLocaleAt}.
 *
 * ```ts
 * const locale = signal('en-US');
 * bootstrapApplication(AppComponent, {
 *   providers: [provideLocale(locale)],
 * });
 * ```
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo CNGX_LOCALE, provideLocaleAt, injectLocale
 */
export function provideLocale(source: string | Signal<string>): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_LOCALE, useFactory: () => coerceSignal(source) },
  ]);
}

/**
 * Element-injector twin of {@link provideLocale}. Returns `Provider[]` so it
 * can go in a component's `viewProviders` (or `providers`) array and scope
 * the cngx locale to that DI subtree.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo CNGX_LOCALE, provideLocale, injectLocale
 */
export function provideLocaleAt(source: string | Signal<string>): Provider[] {
  return [{ provide: CNGX_LOCALE, useFactory: () => coerceSignal(source) }];
}
