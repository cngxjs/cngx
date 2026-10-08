import { memoize } from './memo.util';

const INTL_FORMATTER_CACHE_LIMIT = 32;

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
  { cacheLimit: INTL_FORMATTER_CACHE_LIMIT },
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

const numberFormatterForKey = memoize(
  (key: string): Intl.NumberFormat => {
    const sep = key.indexOf('|');
    return new Intl.NumberFormat(
      key.slice(0, sep),
      JSON.parse(key.slice(sep + 1)) as Intl.NumberFormatOptions,
    );
  },
  { cacheLimit: INTL_FORMATTER_CACHE_LIMIT },
);

/**
 * Bounded `Intl.NumberFormat` cache keyed on locale + options, the number
 * sibling of `dateTimeFormatterFor` with the same key scheme and cap. Read
 * the locale from `injectLocale()` inside the formatting `computed()` so a
 * locale flip re-formats:
 * `computed(() => numberFormatterFor(this.locale(), { style: 'percent' }).format(v))`.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo dateTimeFormatterFor, memoize
 */
export function numberFormatterFor(
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  return numberFormatterForKey(`${locale}|${JSON.stringify(options)}`);
}

const DISPLAY_NUMBER_FORMAT: Intl.NumberFormatOptions = {};
const DISPLAY_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

/** One pair object per cached formatter pair, so equal inputs return the identical object. */
const DISPLAY_FORMATTERS = new WeakMap<
  Intl.NumberFormat,
  WeakMap<Intl.DateTimeFormat, CngxDisplayFormatters>
>();

/**
 * The number and date formatters a default value display uses for one
 * locale. Resolve with {@link displayFormattersFor}, apply with
 * {@link formatDisplayValue}.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo displayFormattersFor, formatDisplayValue
 */
export interface CngxDisplayFormatters {
  readonly number: Intl.NumberFormat;
  readonly date: Intl.DateTimeFormat;
}

/**
 * Resolves the formatters for showing a raw value as text in `locale`: dates
 * with `dateFormat` (date-only by default), numbers with `numberFormat` (the
 * `Intl.NumberFormat` defaults by default). Both come from the bounded
 * formatter caches, and the same locale and formats return the identical
 * object, so a `computed()` over it keeps its reference without an `equal`.
 * Resolve once per locale and format, not per value.
 *
 * ```ts
 * private readonly formatters = computed(() => displayFormattersFor(this.locale()));
 * protected text(value: unknown) { return formatDisplayValue(value, this.formatters()); }
 * ```
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo formatDisplayValue, numberFormatterFor, dateTimeFormatterFor
 */
export function displayFormattersFor(
  locale: string,
  dateFormat: Intl.DateTimeFormatOptions = DISPLAY_DATE_FORMAT,
  numberFormat: Intl.NumberFormatOptions = DISPLAY_NUMBER_FORMAT,
): CngxDisplayFormatters {
  const number = numberFormatterFor(locale, numberFormat);
  const date = dateTimeFormatterFor(locale, dateFormat);
  let byDate = DISPLAY_FORMATTERS.get(number);
  if (!byDate) {
    byDate = new WeakMap();
    DISPLAY_FORMATTERS.set(number, byDate);
  }
  let formatters = byDate.get(date);
  if (!formatters) {
    formatters = { number, date };
    byDate.set(date, formatters);
  }
  return formatters;
}

/**
 * The display text of a raw value: a number or a `Date` formatted with
 * `formatters`, an invalid date empty, every other value unchanged. The
 * fallback a component renders when the consumer supplied no template.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo displayFormattersFor
 */
export function formatDisplayValue(value: unknown, formatters: CngxDisplayFormatters): unknown {
  if (typeof value === 'number') {
    return formatters.number.format(value);
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : formatters.date.format(value);
  }
  return value;
}
