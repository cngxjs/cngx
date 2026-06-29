/**
 * Postal-code format masks per country (ISO 3166-1 alpha-2 keys).
 * `A` = letter, `0` = digit; a `|` declares length alternates picked by input
 * length.
 *
 * Note (like phone numbers): not every country has a strictly fixed format
 * (Ireland's Eircode is highly irregular), so treat these as UI hints, not hard
 * validators. Countries with no postal-code system (HK, AE, ...) are
 * intentionally omitted - do not apply a `zip:` mask there.
 *
 * @category forms/input
 */
export const ZIP_PATTERNS: Record<string, string> = {
  // DACH
  DE: '00000',
  AT: '0000',
  CH: '0000',
  // Western Europe
  FR: '00000',
  BE: '0000',
  NL: '0000 AA', // e.g. 1234 AB
  LU: '0000',
  IE: 'A00 0000', // Eircode since 2015; highly irregular
  GB: 'A0A 0AA|AA0 0AA|AA00 0AA|A0 0AA|A00 0AA|AA0A 0AA', // incl. AA0A 0AA (e.g. EC1A 1BB)
  UK: 'A0A 0AA|AA0 0AA|AA00 0AA|A0 0AA|A00 0AA|AA0A 0AA', // back-compat alias of GB
  MT: 'AAA 0000', // e.g. VLT 1117
  // Southern Europe
  ES: '00000',
  IT: '00000',
  PT: '0000-000',
  GR: '000 00',
  // Northern Europe
  SE: '000 00',
  NO: '0000',
  DK: '0000',
  FI: '00000',
  IS: '000', // 3-digit, very small system
  // Central Europe
  PL: '00-000',
  CZ: '000 00',
  SK: '000 00',
  HU: '0000',
  // Eastern Europe / Balkans
  RO: '000000',
  BG: '0000',
  HR: '00000',
  RS: '00000',
  SI: '0000',
  UA: '00000',
  LT: '00000', // often written with an "LT-" prefix
  LV: '0000', // often written with an "LV-" prefix
  EE: '00000',
  RU: '000000',
  TR: '00000',
  // North America
  US: '00000', // ZIP+4 (00000-0000) not modelled here
  CA: 'A0A 0A0', // alternating letter/digit
  MX: '00000',
  // East Asia
  JP: '000-0000',
  CN: '000000',
  KR: '00000', // 5-digit since 2015
  TW: '00000', // modern 5-digit (3+2)
  // Southeast Asia
  SG: '000000',
  MY: '00000',
  TH: '00000',
  VN: '000000',
  PH: '0000',
  ID: '00000',
  // South Asia
  IN: '000 000', // PIN code, also written without the space
  // Middle East
  IL: '0000000',
  SA: '00000-0000', // base 5-digit, "-0000" extension often omitted
  // Africa
  ZA: '0000',
  EG: '00000',
  NG: '000000',
  // Latin America
  AR: 'A0000AAA', // format since 1999 (e.g. C1425CKC); older 4-digit still seen
  CL: '0000000',
  CO: '000000',
  PE: '00000',
  BR: '00000-000',
  // Oceania
  AU: '0000',
  NZ: '0000',
};
