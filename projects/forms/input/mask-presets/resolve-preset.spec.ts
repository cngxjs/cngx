import { DATE_FORMATS, DATE_SHORT_FORMATS } from './date-formats';
import type { MaskPresetTables } from './registry';
import { resolvePreset } from './resolve-preset';

const DATE_TABLES: MaskPresetTables = { date: DATE_FORMATS, dateShort: DATE_SHORT_FORMATS };

describe('resolvePreset', () => {
  describe('date:short', () => {
    it('resolves the en-US short date mask', () => {
      expect(resolvePreset('date:short', 'en-US', DATE_TABLES)?.patterns).toEqual(['00/00/00']);
    });

    it('resolves the de-DE short date mask', () => {
      expect(resolvePreset('date:short', 'de-DE', DATE_TABLES)?.patterns).toEqual(['00.00.00']);
    });

    it('falls back to the inline short mask while the table is not loaded', () => {
      expect(resolvePreset('date:short', 'de-DE', {})?.patterns).toEqual(['00/00/00']);
    });

    it('applies config dateFormats with a two-digit year', () => {
      const config = { dateFormats: { 'de-DE': '0000-00-00', 'en-NZ': '00.00.0000' } };
      expect(resolvePreset('date:short', 'de-DE', DATE_TABLES, config)?.patterns).toEqual([
        '00-00-00',
      ]);
      expect(resolvePreset('date:short', 'en-NZ', DATE_TABLES, config)?.patterns).toEqual([
        '00.00.00',
      ]);
      expect(resolvePreset('date:short', 'en-NZ', {}, config)?.patterns).toEqual(['00.00.00']);
    });

    it('keeps the built-in short mask for a locale the config does not set', () => {
      const config = { dateFormats: { 'de-DE': '0000-00-00' } };
      expect(resolvePreset('date:short', 'en-US', DATE_TABLES, config)?.patterns).toEqual([
        '00/00/00',
      ]);
    });

    it('lets config dateShortFormats win over the mask derived from dateFormats', () => {
      const config = {
        dateFormats: { 'de-DE': '0000-00-00' },
        dateShortFormats: { 'de-DE': '00.00' },
      };
      expect(resolvePreset('date:short', 'de-DE', DATE_TABLES, config)?.patterns).toEqual([
        '00.00',
      ]);
      expect(resolvePreset('date:short', 'de-DE', {}, config)?.patterns).toEqual(['00.00']);
      expect(resolvePreset('date', 'de-DE', DATE_TABLES, config)?.patterns).toEqual(['0000-00-00']);
    });

    it('applies dateShortFormats without dateFormats over the built-in short table', () => {
      const config = { dateShortFormats: { 'en-US': '00-00' } };
      expect(resolvePreset('date:short', 'en-US', DATE_TABLES, config)?.patterns).toEqual([
        '00-00',
      ]);
      expect(resolvePreset('date', 'en-US', DATE_TABLES, config)?.patterns).toEqual(['00/00/0000']);
    });

    it('keeps the derived short mask for a locale dateShortFormats does not set', () => {
      const config = {
        dateFormats: { 'de-DE': '0000-00-00' },
        dateShortFormats: { 'en-NZ': '00.00' },
      };
      expect(resolvePreset('date:short', 'de-DE', DATE_TABLES, config)?.patterns).toEqual([
        '00-00-00',
      ]);
      expect(resolvePreset('date:short', 'en-US', DATE_TABLES, config)?.patterns).toEqual([
        '00/00/00',
      ]);
    });

    it('matches every built-in short mask to its long mask', () => {
      for (const [locale, long] of Object.entries(DATE_FORMATS)) {
        expect(
          resolvePreset('date:short', locale, { dateShort: DATE_SHORT_FORMATS }, {
            dateFormats: { [locale]: long },
          })?.patterns,
        ).toEqual([DATE_SHORT_FORMATS[locale]]);
      }
    });
  });

  describe('date', () => {
    it('matches a bare language to a same-language locale', () => {
      expect(resolvePreset('date', 'de', DATE_TABLES)?.patterns).toEqual(['00.00.0000']);
    });

    it('lets config dateFormats override the table', () => {
      const result = resolvePreset('date', 'de-DE', DATE_TABLES, {
        dateFormats: { 'de-DE': '0000-00-00' },
      });
      expect(result?.patterns).toEqual(['0000-00-00']);
    });
  });

  describe('time', () => {
    it('follows the 12-hour cycle of en-US with meridiem tokens', () => {
      const result = resolvePreset('time', 'en-US', {});
      expect(result?.patterns).toEqual(['00:00 PM']);
      expect(Object.keys(result?.tokens ?? {})).toEqual(['P', 'M']);
    });

    it('follows the 24-hour cycle of de without meridiem tokens', () => {
      const result = resolvePreset('time', 'de', {});
      expect(result?.patterns).toEqual(['00:00']);
      expect(result?.tokens).toBeUndefined();
    });

    it('pins the 24-hour mask with time:24 regardless of locale', () => {
      const result = resolvePreset('time:24', 'en-US', {});
      expect(result?.patterns).toEqual(['00:00']);
      expect(result?.tokens).toBeUndefined();
    });

    it('pins the 12-hour mask with time:12 regardless of locale', () => {
      const result = resolvePreset('time:12', 'de', {});
      expect(result?.patterns).toEqual(['00:00 PM']);
      expect(result?.tokens).toBeDefined();
    });

    it('uppercases accepted meridiem characters', () => {
      const tokens = resolvePreset('time:12', 'de', {})?.tokens ?? {};
      expect(tokens['P'].pattern.test('a')).toBe(true);
      expect(tokens['P'].pattern.test('x')).toBe(false);
      expect(tokens['P'].transform?.('p')).toBe('P');
      expect(tokens['M'].transform?.('m')).toBe('M');
    });
  });

  describe('datetime', () => {
    it('joins the locale date with the locale hour cycle', () => {
      const result = resolvePreset('datetime', 'en-US', DATE_TABLES);
      expect(result?.patterns).toEqual(['00/00/0000 00:00 PM']);
      expect(result?.tokens).toBeDefined();
    });

    it('carries no meridiem tokens for a 24-hour locale', () => {
      const result = resolvePreset('datetime', 'de-DE', DATE_TABLES);
      expect(result?.patterns).toEqual(['00.00.0000 00:00']);
      expect(result?.tokens).toBeUndefined();
    });
  });

  describe('region presets', () => {
    it('derives the region from a bare language locale', () => {
      const zip = resolvePreset('zip', 'de', { zip: { DE: '00000', NL: '0000 AA' } });
      expect(zip?.patterns).toEqual(['00000']);
    });

    it('splits a multi-pattern zip entry', () => {
      const zip = resolvePreset('zip:XX', 'en-US', { zip: { XX: '000|0000' } });
      expect(zip?.patterns).toEqual(['000', '0000']);
    });

    it('forces the mobile or landline phone alternate', () => {
      const tables: MaskPresetTables = { phone: { CH: '+41 00 000 00 00|+41 00 000 00 000' } };
      expect(resolvePreset('phone:CH:mobile', 'en-US', tables)?.patterns).toEqual([
        '+41 00 000 00 000',
      ]);
      expect(resolvePreset('phone:CH:landline', 'en-US', tables)?.patterns).toEqual([
        '+41 00 000 00 00',
      ]);
    });
  });

  it('returns null for a custom pattern', () => {
    expect(resolvePreset('000-000', 'en-US', {})).toBeNull();
  });
});
