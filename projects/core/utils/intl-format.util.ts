import { memoize } from './memo.util';

const DATE_TIME_FORMATTER_CACHE_LIMIT = 32;

// Key is `locale|serialized-options`; BCP-47 tags cannot contain `|`.
// The parse runs on cache miss only.
const formatterForKey = memoize(
  (key: string): Intl.DateTimeFormat => {
    const sep = key.indexOf('|');
    return new Intl.DateTimeFormat(
      key.slice(0, sep),
      JSON.parse(key.slice(sep + 1)) as Intl.DateTimeFormatOptions,
    );
  },
  { cacheLimit: DATE_TIME_FORMATTER_CACHE_LIMIT },
);

/**
 * Bounded `Intl.DateTimeFormat` cache keyed on locale + options.
 * Constructing an Intl formatter is the expensive half of formatting;
 * this makes repeated formatting allocation-free. Consumers bind static
 * option literals, so the key space stays tiny; the FIFO cap guards a
 * consumer generating per-row options (e.g. varying `timeZone`) from
 * growing the cache for the app's lifetime.
 *
 * Keys serialize via `JSON.stringify`, so two option objects with
 * different property order occupy two (bounded) cache slots - they still
 * format identically.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo memoize
 */
export function dateTimeFormatterFor(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return formatterForKey(`${locale}|${JSON.stringify(options)}`);
}
