/**
 * IBAN lengths and groupings by country.
 * @internal
 */
export const IBAN_PATTERNS: Record<string, string> = {
  CH: 'AA00 0000 0000 0000 0000 0',
  DE: 'AA00 0000 0000 0000 0000 00',
  AT: 'AA00 0000 0000 0000 0000',
  FR: 'AA00 0000 0000 0000 0000 000',
  IT: 'AA00 A000 0000 0000 0000 0000 000',
  ES: 'AA00 0000 0000 0000 0000 0000',
  NL: 'AA00 AAAA 0000 0000 00',
  GB: 'AA00 AAAA 0000 0000 00',
};
