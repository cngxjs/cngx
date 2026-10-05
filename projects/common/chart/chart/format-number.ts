import { numberFormatterFor } from '@cngx/core/utils';

const FRACTION_OPTIONS: Intl.NumberFormatOptions = {
  maximumSignificantDigits: 12,
  useGrouping: false,
};

const INTEGER_OPTIONS: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
  useGrouping: false,
};

/**
 * Strip floating-point arithmetic noise from a number destined for
 * human-facing text and format it in `locale`: `6.6000000000000005`
 * becomes `'6.6'` (`'6,6'` in `de`), `2.2` stays `'2.2'`, `25` stays
 * `'25'`. 12 significant digits keep every sensible chart value intact
 * while collapsing the trailing 1e-15 noise accumulated float math
 * produces; integers keep every digit. No grouping, so en-US output
 * matches the plain `String(v)` it replaced for every value `String`
 * prints without an exponent; exponential magnitudes print positionally
 * instead (`1e-7` -> `0.0000001`, `1e21` -> 22 digits). Non-finite values
 * format in `locale` too (`∞`, `-∞`, `NaN`), never as the English
 * `Infinity`.
 *
 * Shared by the default axis tick formatter, the default i18n summary
 * and the SR data table, so all three read the same value the same way.
 *
 * @internal
 */
export function formatChartNumber(v: number, locale: string): string {
  const options = Number.isInteger(v) ? INTEGER_OPTIONS : FRACTION_OPTIONS;
  // Intl prints -0 as "-0"; String(-0) is "0".
  return numberFormatterFor(locale, options).format(v === 0 ? 0 : v);
}
