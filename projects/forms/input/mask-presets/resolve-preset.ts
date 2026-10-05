import { dateTimeFormatterFor } from '@cngx/core/utils';
import type { InputConfig } from '../input-config';
import type { MaskTokenMap } from '../input-mask.directive';
import type { MaskPresetTables } from './registry';

/**
 * A preset name resolved to its mask patterns, plus the preset-scoped tokens
 * (meridiem slots for 12-hour time) and optional static affixes.
 * @internal
 */
export interface MaskPresetResolution {
  readonly patterns: string[];
  readonly tokens?: MaskTokenMap;
  readonly prefix?: string;
  readonly suffix?: string;
}

/**
 * Inline fallback masks used while a lazily-loaded preset table is still in
 * flight (and as the final default when no region matches).
 * @internal
 */
const PRESET_FALLBACKS = {
  phone: '+000000000000',
  date: '00/00/0000',
  dateShort: '00/00/00',
  iban: 'AA00 0000 0000 0000 0000 00',
  zip: '00000',
} as const;

/**
 * Resolves a date mask for a locale: exact BCP-47 key first (case-insensitive),
 * then a bare language key (back-compat with language-keyed `withDateFormats`
 * config), then any same-language locale, then the provided fallback pattern.
 * @internal
 */
function resolveDateFormat(
  locale: string,
  table: Record<string, string>,
  fallback: string,
): string {
  const lc = locale.toLowerCase();
  const lang = lc.split('-')[0];
  for (const key of Object.keys(table)) {
    if (key.toLowerCase() === lc) {
      return table[key];
    }
  }
  if (table[lang]) {
    return table[lang];
  }
  for (const key of Object.keys(table)) {
    if (key.toLowerCase().startsWith(`${lang}-`)) {
      return table[key];
    }
  }
  return fallback;
}

const TIME_24 = '00:00';
const TIME_12 = '00:00 PM';

/**
 * Meridiem slots of {@link TIME_12}: `P` takes `A` or `P`, `M` takes `M`, both
 * uppercased. Scoped to the time presets (merged in the directive's
 * `resolvedCustomTokens`) so
 * a `P` / `M` literal in a consumer pattern keeps its meaning.
 * @internal
 */
const MERIDIEM_TOKENS: MaskTokenMap = {
  P: { pattern: /[ap]/i, transform: (c) => c.toUpperCase() },
  M: { pattern: /m/i, transform: (c) => c.toUpperCase() },
};

/** @internal Tokens a resolved time pattern needs (12-hour only). */
function timeTokens(pattern: string): MaskTokenMap | undefined {
  return pattern.endsWith(TIME_12) ? MERIDIEM_TOKENS : undefined;
}

/**
 * The time mask of a locale's hour cycle: `h11` / `h12` locales (`en-US`) get
 * the 12-hour mask with its AM/PM slots, `h23` / `h24` locales (`de`) the
 * 24-hour mask.
 * @internal
 */
function localeTimePattern(locale: string): string {
  const { hourCycle } = dateTimeFormatterFor(locale, { hour: 'numeric' }).resolvedOptions();
  return hourCycle === 'h11' || hourCycle === 'h12' ? TIME_12 : TIME_24;
}

/** @internal The `time` mask: a pinned `24` / `12` cycle, else the locale's. */
function timePattern(cycle: string | undefined, locale: string): string {
  if (cycle === '24') {
    return TIME_24;
  }
  if (cycle === '12') {
    return TIME_12;
  }
  return localeTimePattern(locale);
}

/**
 * Resolves a preset name to its mask patterns. Built-in region tables arrive
 * lazily via {@link maskPresetTables}; until a table loads, the inline
 * {@link PRESET_FALLBACKS} stand in. Consumer overrides (`config.*Patterns`)
 * are synchronous and always merged on top.
 * @internal
 */
export function resolvePreset(
  maskInput: string,
  locale: string,
  tables: MaskPresetTables,
  config?: InputConfig,
): MaskPresetResolution | null {
  const parts = maskInput.split(':');
  const name = parts[0].toLowerCase();
  const regionHint = parts[1]?.toUpperCase();
  const region = regionHint ?? localeToRegion(locale);
  // Optional `phone:<region>:<mobile|landline>` segment forces one alternate.
  const lineType = parts[2]?.toLowerCase();

  const phones = { ...tables.phone, ...config?.phonePatterns };
  const ibans = { ...tables.iban, ...config?.ibanPatterns };
  const zips = { ...tables.zip, ...config?.zipPatterns };
  const dates = { ...tables.date, ...config?.dateFormats };

  switch (name) {
    case 'date':
      // `name` is the segment before the first `:`, so `date:short` lands here.
      if (parts[1]?.toLowerCase() === 'short') {
        return {
          patterns: [resolveDateFormat(locale, tables.dateShort ?? {}, PRESET_FALLBACKS.dateShort)],
        };
      }
      return { patterns: [resolveDateFormat(locale, dates, PRESET_FALLBACKS.date)] };
    case 'time': {
      // `time:24` / `time:12` pin the cycle; bare `time` follows the locale.
      const pattern = timePattern(parts[1], locale);
      return { patterns: [pattern], tokens: timeTokens(pattern) };
    }
    case 'datetime': {
      const pattern = `${resolveDateFormat(locale, dates, PRESET_FALLBACKS.date)} ${localeTimePattern(locale)}`;
      return { patterns: [pattern], tokens: timeTokens(pattern) };
    }
    case 'phone': {
      const raw = phones[region] ?? PRESET_FALLBACKS.phone;
      const alts = raw.split('|');
      if (lineType === 'mobile' && alts.length > 1) {
        return { patterns: [alts[alts.length - 1]] };
      }
      if (lineType === 'landline') {
        return { patterns: [alts[0]] };
      }
      return { patterns: [raw] };
    }
    case 'creditcard':
      return { patterns: ['0000 000000 00000|0000 0000 0000 0000'] };
    case 'iban':
      return { patterns: [ibans[region] ?? PRESET_FALLBACKS.iban] };
    case 'zip':
      return resolveZip(region, zips);
    case 'ip':
    case 'ipv4':
      return { patterns: ['099.099.099.099'] };
    case 'mac':
      return { patterns: ['AA:AA:AA:AA:AA:AA'] };
    default:
      return null;
  }
}

function resolveZip(region: string, zips: Record<string, string>): { patterns: string[] } {
  const pattern = zips[region];
  if (!pattern) {
    return { patterns: ['00000'] };
  }
  if (pattern.includes('|')) {
    return { patterns: pattern.split('|') };
  }
  return { patterns: [pattern] };
}

function localeToRegion(locale: string): string {
  const parts = locale.split('-');
  if (parts.length >= 2) {
    return parts[1].toUpperCase();
  }
  const fallback: Record<string, string> = {
    en: 'US',
    de: 'DE',
    fr: 'FR',
    it: 'IT',
    es: 'ES',
    pt: 'BR',
    nl: 'NL',
    ru: 'RU',
    ja: 'JP',
    zh: 'CN',
    ko: 'KR',
  };
  return fallback[parts[0].toLowerCase()] ?? 'US';
}
