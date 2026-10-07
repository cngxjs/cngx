import { dateTimeFormatterFor, numberFormatterFor } from '@cngx/core/utils';

const ITEM_NUMBER_FORMAT: Intl.NumberFormatOptions = {};
const ITEM_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

/**
 * The built-in row text of an item without an item slot: a number or a `Date`
 * formatted for `locale` (dates date-only), an invalid date empty, everything
 * else unchanged.
 *
 * @internal
 */
export function itemTextFor(item: unknown, locale: string): unknown {
  if (typeof item === 'number') {
    return numberFormatterFor(locale, ITEM_NUMBER_FORMAT).format(item);
  }
  if (item instanceof Date) {
    return Number.isNaN(item.getTime())
      ? ''
      : dateTimeFormatterFor(locale, ITEM_DATE_FORMAT).format(item);
  }
  return item;
}
