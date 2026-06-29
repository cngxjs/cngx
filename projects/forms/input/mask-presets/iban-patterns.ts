/**
 * IBAN format masks per country (ISO 3166-1 alpha-2 keys).
 * `A` = letter, `0` = digit.
 *
 * Source: official IBAN registry (SWIFT/ISO 13616). Unlike phone numbers,
 * IBAN lengths are FIXED and officially standardised, so these masks are
 * actually reliable, not approximations. IBAN is used in ~70 countries
 * (mostly Europe + parts of the Middle East), hence no US/JP/CN/KR entries.
 *
 * @category forms/input
 */
export const IBAN_PATTERNS: Record<string, string> = {
  // DACH
  CH: 'AA00 0000 0000 0000 0000 0', // 21
  DE: 'AA00 0000 0000 0000 0000 00', // 22
  AT: 'AA00 0000 0000 0000 0000', // 20
  // Western Europe
  FR: 'AA00 0000 0000 0000 0000 0000 000', // 27
  BE: 'AA00 0000 0000 0000', // 16, BBAN fully numeric
  NL: 'AA00 AAAA 0000 0000 00', // 18
  LU: 'AA00 0000 0000 0000 0000', // 20
  IE: 'AA00 AAAA 0000 0000 0000 00', // 22, 4-letter bank code + 14 digits
  GB: 'AA00 AAAA 0000 0000 0000 00', // 22
  MT: 'AA00 AAAA 0000 0000 0000 0000 000', // 31, longest IBAN in Europe
  // Southern Europe
  ES: 'AA00 0000 0000 0000 0000 0000', // 24
  IT: 'AA00 A000 0000 0000 0000 0000 000', // 27, 1 letter (CIN check char) at BBAN start
  PT: 'AA00 0000 0000 0000 0000 0000 0', // 25
  GR: 'AA00 0000 0000 0000 0000 0000 000', // 27
  // Northern Europe
  SE: 'AA00 0000 0000 0000 0000 0000', // 24
  NO: 'AA00 0000 0000 000', // 15, shortest in Europe
  DK: 'AA00 0000 0000 0000 00', // 18
  FI: 'AA00 0000 0000 0000 00', // 18
  IS: 'AA00 0000 0000 0000 0000 0000 00', // 26
  // Central Europe
  PL: 'AA00 0000 0000 0000 0000 0000 0000', // 28, fully numeric BBAN
  CZ: 'AA00 0000 0000 0000 0000 0000', // 24
  SK: 'AA00 0000 0000 0000 0000 0000', // 24
  HU: 'AA00 0000 0000 0000 0000 0000 0000', // 28
  // Eastern Europe / Balkans
  RO: 'AA00 AAAA 0000 0000 0000 0000', // 24, account part is alphanumeric
  BG: 'AA00 AAAA 0000 0000 0000 00', // 22
  HR: 'AA00 0000 0000 0000 0000 0', // 21
  RS: 'AA00 0000 0000 0000 0000 00', // 22
  SI: 'AA00 0000 0000 0000 000', // 19
  UA: 'AA00 0000 0000 0000 0000 0000 0000 0', // 29
  LT: 'AA00 0000 0000 0000 0000', // 20
  LV: 'AA00 AAAA 0000 0000 0000 0', // 21
  EE: 'AA00 0000 0000 0000 0000', // 20
  RU: 'AA00 0000 0000 0000 0000 0000 00', // 33, in the IBAN registry since 2021
  TR: 'AA00 0000 0000 0000 0000 0000 00', // 26, 1 reserved digit after the bank code
};
