import { memoize, numberFormatterFor } from '@cngx/core/utils';
import { cngxDevWarn } from '@cngx/utils';

import type { CngxPluralMessage } from './language-pack';

/**
 * Arguments a message is formatted with, keyed by placeholder name.
 *
 * @since 0.1.0
 */
export type CngxMessageArgs = Readonly<Record<string, string | number>>;

/**
 * Escape hatch for a TS pack: a message the data format cannot express.
 *
 * @since 0.1.0
 */
export type CngxMessageFn = (args: CngxMessageArgs, locale: string) => string;

/**
 * One message of a language section: a sentence with `{name}` placeholders,
 * a {@link CngxPluralMessage}, or a {@link CngxMessageFn}.
 *
 * @since 0.1.0
 */
export type CngxMessage = string | CngxPluralMessage | CngxMessageFn;

const PLACEHOLDER = /\{(\w+)\}/g;
const FIRST_STRONG_ISOLATE = '⁨';
const POP_DIRECTIONAL_ISOLATE = '⁩';
const NUMBER_FORMAT: Intl.NumberFormatOptions = {};

const FALLBACK_LOCALE = 'en';

/**
 * @internal Invalid tags CNGX0001 has reported. Separate from the memoize below,
 * whose 32-entry cache can evict a tag and would otherwise re-warn on its next
 * read. Capped, so a stream of distinct bad tags cannot grow it without bound.
 */
const warnedLocaleTags = new Set<string>();
const WARNED_LOCALE_TAG_LIMIT = 256;

/**
 * @internal The canonical BCP 47 form of `locale`. A tag `Intl` rejects
 * (`'de_DE'`, `''`) reads as English with one dev warning, so a bad pack
 * `locale` can never make every message throw.
 */
export const canonicalLocale = memoize(
  (locale: string): string => {
    try {
      return Intl.getCanonicalLocales(locale)[0] ?? FALLBACK_LOCALE;
    } catch {
      if (
        typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        !warnedLocaleTags.has(locale) &&
        warnedLocaleTags.size < WARNED_LOCALE_TAG_LIMIT
      ) {
        warnedLocaleTags.add(locale);
        cngxDevWarn(
          'CNGX0001',
          `formatMessage(): "${locale}" is not a BCP 47 locale; reading it as English.`,
        );
      }
      return FALLBACK_LOCALE;
    }
  },
  { cacheLimit: 32 },
);

const pluralRulesFor = memoize((locale: string) => new Intl.PluralRules(locale), {
  cacheLimit: 32,
});

function selectPluralForm(
  message: CngxPluralMessage,
  args: CngxMessageArgs,
  locale: string,
): string {
  const count = args['count'];
  if (typeof count !== 'number') {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      cngxDevWarn(
        'CNGX0002',
        `formatMessage(): plural message without a numeric "count" argument: "${message.other}"`,
      );
    }
    return message.other;
  }
  const category = pluralRulesFor(locale).select(count) as keyof CngxPluralMessage;
  return message[category] ?? message.other;
}

/**
 * Formats one message for a locale. `{name}` placeholders are replaced by
 * `args[name]`: numbers through the locale's number format, strings wrapped
 * in U+2068 / U+2069 so a Latin name inside an Arabic sentence (or the
 * reverse) keeps its own direction. A {@link CngxPluralMessage} picks its
 * form with `Intl.PluralRules` from the `count` argument and falls back to
 * `other`. There is no nesting and no escape syntax; a message that needs
 * more is a {@link CngxMessageFn}.
 *
 * ```ts
 * formatMessage({ one: '{count} error', other: '{count} errors' }, { count: 1200 }, 'de');
 * // '1.200 errors'
 * ```
 *
 * In dev mode a placeholder without an argument logs a warning and stays
 * visible in the output. A `locale` that is not a BCP 47 tag formats as
 * English, with one dev warning per tag.
 *
 * @since 0.1.0
 */
export function formatMessage(
  message: CngxMessage,
  args: CngxMessageArgs,
  requestedLocale: string,
): string {
  const locale = canonicalLocale(requestedLocale);
  if (typeof message === 'function') {
    return message(args, locale);
  }
  const template = typeof message === 'string' ? message : selectPluralForm(message, args, locale);
  return template.replace(PLACEHOLDER, (placeholder, name: string) => {
    const value = args[name];
    if (value === undefined) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        cngxDevWarn('CNGX0003', `formatMessage(): no argument for ${placeholder} in "${template}"`);
      }
      return placeholder;
    }
    if (typeof value === 'number') {
      return numberFormatterFor(locale, NUMBER_FORMAT).format(value);
    }
    return `${FIRST_STRONG_ISOLATE}${value}${POP_DIRECTIONAL_ISOLATE}`;
  });
}
