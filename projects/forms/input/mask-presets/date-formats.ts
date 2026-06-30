/**
 * Date format masks per locale (BCP-47 keys).
 *
 * `0` is a digit slot. These masks capture STRUCTURE only (separators, group
 * count), NOT field order (DD/MM vs MM/DD): en-US (MM/DD/YYYY) and en-GB
 * (DD/MM/YYYY) look identical here (`00/00/0000`) though the first two groups
 * swap meaning. Source: CLDR common usage; verify against
 * `Intl.DateTimeFormat(locale).formatToParts()` for legal/form documents,
 * since some countries deviate officially from everyday usage.
 * @internal
 */
export const DATE_FORMATS: Record<string, string> = {
  'de-DE': '00.00.0000',
  'de-AT': '00.00.0000',
  'de-CH': '00.00.0000',
  'fr-FR': '00/00/0000',
  'fr-BE': '00/00/0000',
  'fr-CH': '00.00.0000', // Switzerland: dots in French too
  'fr-CA': '0000-00-00', // Canada (fr): ISO, not slash
  'es-ES': '00/00/0000',
  'es-MX': '00/00/0000',
  'es-AR': '00/00/0000',
  'it-IT': '00/00/0000',
  'it-CH': '00.00.0000', // Switzerland: dots like all CH locales
  'pt-PT': '00/00/0000',
  'pt-BR': '00/00/0000',
  'nl-NL': '00-00-0000', // NL: hyphen
  'nl-BE': '00/00/0000', // BE: slash, not hyphen like nl-NL
  'ru-RU': '00.00.0000',
  'ja-JP': '0000/00/00',
  'zh-CN': '0000-00-00', // Mainland China: ISO with hyphen
  'zh-TW': '0000/00/00',
  'zh-HK': '00/00/0000', // HK = DD/MM/YYYY (British influence), NOT year-first
  'ko-KR': '0000.00.00',
  'en-US': '00/00/0000', // MM/DD/YYYY
  'en-GB': '00/00/0000', // DD/MM/YYYY - same mask, different order
  'en-AU': '00/00/0000',
  'en-CA': '0000-00-00', // ISO
  'en-IE': '00/00/0000',
  'pl-PL': '00.00.0000',
  'cs-CZ': '00.00.0000',
  'sk-SK': '00.00.0000',
  'hu-HU': '0000.00.00', // year-first + dots
  'ro-RO': '00.00.0000',
  'bg-BG': '00.00.0000',
  'el-GR': '00/00/0000',
  'sv-SE': '0000-00-00', // Sweden: ISO 8601 in everyday use
  'nb-NO': '00.00.0000',
  'da-DK': '00-00-0000', // Denmark: hyphen
  'fi-FI': '00.00.0000',
  'hr-HR': '00.00.0000',
  'sr-RS': '00.00.0000',
  'sl-SI': '00.00.0000',
  'uk-UA': '00.00.0000',
  'lt-LT': '0000-00-00', // Lithuania: ISO
  'lv-LV': '00.00.0000',
  'et-EE': '00.00.0000',
  'is-IS': '00.00.0000',
  'mt-MT': '00/00/0000',
  'ga-IE': '00/00/0000',
  'lb-LU': '00.00.0000',
  'tr-TR': '00.00.0000',
};

export const DATE_SHORT_FORMATS: Record<string, string> = {
  'de-DE': '00.00.00',
  'de-AT': '00.00.00',
  'de-CH': '00.00.00',
  'fr-FR': '00/00/00',
  'fr-BE': '00/00/00',
  'fr-CH': '00.00.00',
  'fr-CA': '00-00-00',
  'es-ES': '00/00/00',
  'es-MX': '00/00/00',
  'es-AR': '00/00/00',
  'it-IT': '00/00/00',
  'it-CH': '00.00.00',
  'pt-PT': '00/00/00',
  'pt-BR': '00/00/00',
  'nl-NL': '00-00-00',
  'nl-BE': '00/00/00',
  'ru-RU': '00.00.00',
  'ja-JP': '00/00/00',
  'zh-CN': '00-00-00',
  'zh-TW': '00/00/00',
  'zh-HK': '00/00/00',
  'ko-KR': '00.00.00',
  'en-US': '00/00/00',
  'en-GB': '00/00/00',
  'en-AU': '00/00/00',
  'en-CA': '00-00-00',
  'en-IE': '00/00/00',
  'pl-PL': '00.00.00',
  'cs-CZ': '00.00.00',
  'sk-SK': '00.00.00',
  'hu-HU': '00.00.00',
  'ro-RO': '00.00.00',
  'bg-BG': '00.00.00',
  'el-GR': '00/00/00',
  'sv-SE': '00-00-00',
  'nb-NO': '00.00.00',
  'da-DK': '00-00-00',
  'fi-FI': '00.00.00',
  'hr-HR': '00.00.00',
  'sr-RS': '00.00.00',
  'sl-SI': '00.00.00',
  'uk-UA': '00.00.00',
  'lt-LT': '00-00-00',
  'lv-LV': '00.00.00',
  'et-EE': '00.00.00',
  'is-IS': '00.00.00',
  'mt-MT': '00/00/00',
  'ga-IE': '00/00/00',
  'lb-LU': '00.00.00',
  'tr-TR': '00.00.00',
};
