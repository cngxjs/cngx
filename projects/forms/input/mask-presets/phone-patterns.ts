/**
 * Telephone format masks per region (ISO 3166-1 alpha-2 keys).
 *
 * Format: `<cc-mask> <landline-mask>|<cc-mask> <mobile-mask>`; `0` is a digit
 * slot, every other char is a literal. `selectPattern` picks the alternate by
 * digit count, so a `|` only switches where landline and mobile differ in
 * length; equal-length plans ship a single pattern (the grouping is fixed,
 * not length-derived).
 *
 * IMPORTANT - more so than with date formats: phone numbers are NOT
 * fixed-length in most countries. Area-code lengths vary (DE: 2-5 digits), so
 * the total length floats. These masks are coarse approximations / the common
 * cases, not validation. For real validation use a library like
 * `libphonenumber-js` (ITU/Google metadata); this table is at best a UI
 * placeholder/hint, never a validator.
 *
 * `UK` is kept as a back-compat alias of `GB`.
 * @internal
 */
export const PHONE_PATTERNS: Record<string, string> = {
  // DACH
  DE: '+00 00 00000000|+00 000 00000000', // +49, landline area 2-5 digits (approx) | mobile 3-digit prefix (15x/16x/17x) + 7-8
  AT: '+00 0 0000000|+00 000 0000000', // +43, mobile prefix usually 3-digit (6xx)
  CH: '+00 00 000 00 00', // +41, landline and mobile same length (9 digits); only the prefix differs
  // Western Europe
  FR: '+00 0 00 00 00 00', // +33, leading 0 dropped internationally; prefix 1-5 landline, 6-7 mobile, same structure
  BE: '+00 00 000 000|+00 000 00 00 00', // +32, landline 8-digit (region), mobile 9-digit (4xx)
  NL: '+00 00 0000000|+00 0 00000000', // +31, mobile prefix 6 then 8 digits
  LU: '+000 000 000|+000 000 000 000', // +352, landline very variable (6-9 digits, approx), mobile usually 9-digit (6xx)
  IE: '+000 0 0000000|+000 00 0000000', // +353, mobile prefix 8x, landline area length varies
  GB: '+00 0000 000000', // +44, leading 0 dropped internationally; mobile 7xxx, landline area length varies (approx)
  UK: '+00 0000 000000', // back-compat alias of GB
  MT: '+000 0000 0000', // +356, no area codes, landline and mobile same length
  // Southern Europe
  ES: '+00 000 00 00 00', // +34, landline and mobile both 9-digit, only the prefix differs (6/7 mobile)
  IT: '+00 00 0000000|+00 000 0000000', // +39, leading 0 stays on landline internationally (+39 06...), not on mobile
  PT: '+000 000 000 000', // +351, landline and mobile both 9-digit (mobile prefix 9x)
  GR: '+00 00 0000 0000|+00 000 0000000', // +30, both variants 10-digit
  // Northern Europe
  SE: '+00 00 000 00 00', // +46, area length varies, approx
  NO: '+00 000 00 000', // +47, no area codes, both 8-digit
  DK: '+00 00 00 00 00', // +45, no area codes, both 8-digit
  FI: '+000 00 0000000', // +358, lengths vary more than the other Nordics, approx
  IS: '+000 000 0000', // +354, no area codes, 7-digit
  // Central Europe
  PL: '+00 000 000 000', // +48, landline and mobile both 9-digit
  CZ: '+000 000 000 000', // +420, both 9-digit
  SK: '+000 000 000 000', // +421, both 9-digit
  HU: '+00 0 000 0000|+00 00 000 0000', // +36, mobile prefix 2-digit (20/30/70), landline area 1-2 digit
  // Eastern Europe / Balkans
  RO: '+00 000 000 000', // +40, both 9-digit
  BG: '+000 0 000 0000|+000 00 000 0000', // +359, lengths vary, approx
  HR: '+000 0 0000 000|+000 00 000 0000', // +385, mobile 8-9 digit after prefix, approx
  RS: '+000 00 0000000', // +381, lengths vary a lot
  SI: '+000 0 000 00 00|+000 00 000 000', // +386, both usually 8-digit
  UA: '+000 00 000 0000', // +380, both 9-digit
  LT: '+000 0 00 00 00|+000 000 00000', // +370, both usually 8-digit
  LV: '+000 00 000 000', // +371, both 8-digit, no area codes
  EE: '+000 000 0000|+000 0000 0000', // +372, landline 7-digit, mobile 7-8 digit, approx
  RU: '+0 000 000 00 00', // +7, both 10-digit, mobile prefix 9xx
  TR: '+00 000 000 00 00', // +90, both 10-digit, mobile prefix 5xx
  // North America (NANP)
  US: '+0 000 000 0000', // +1, NANP: landline and mobile share structure, no technical distinction
  CA: '+0 000 000 0000', // +1, NANP like US
  // Latin America
  MX: '+00 00 0000 0000|+00 0 00 0000 0000', // +52, mobile historically adds a "1" after the country code, approx
  AR: '+00 00 0000 0000|+00 0 0 00 0000 0000', // +54, mobile inserts a "9" after the country code (+54 9 11 ...)
  BR: '+00 00 0000 0000|+00 00 0 0000 0000', // +55, mobile gained a leading "9" (9-digit instead of 8)
  // East Asia
  JP: '+00 00 0000 0000', // +81, leading 0 dropped internationally; mobile prefix 70/80/90, landline area length varies
  CN: '+00 000 0000 0000', // +86, mobile always 11-digit; landline area length varies, approx
  TW: '+000 0 0000 0000|+000 000 000 000', // +886, mobile 9-digit (9xx), landline area length varies
  HK: '+000 0000 0000', // +852, no area codes, landline and mobile both 8-digit
  KR: '+00 00 0000 0000', // +82, leading 0 dropped internationally; mobile prefix 10, landline area length varies
  // Oceania
  AU: '+00 0 0000 0000|+00 000 000 000', // +61, leading 0 dropped internationally; mobile 4xx, landline area 1-digit (2/3/7/8)
};
