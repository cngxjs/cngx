import { describe, expect, it } from 'vitest';
import {
  deltaDirection,
  deltaSentiment,
  directionGlyph,
  formatDelta,
  type DeltaDirection,
  type DeltaPolarity,
  type DeltaSentiment,
} from './delta-format';

describe('delta-format', () => {
  describe('deltaDirection', () => {
    it('maps sign to direction', () => {
      expect(deltaDirection(5.3)).toBe('up');
      expect(deltaDirection(-2.1)).toBe('down');
      expect(deltaDirection(0)).toBe('flat');
    });
  });

  describe('deltaSentiment matrix (3 polarities × 3 directions)', () => {
    const cases: ReadonlyArray<[DeltaPolarity, DeltaDirection, DeltaSentiment]> = [
      ['higher-is-better', 'up', 'positive'],
      ['higher-is-better', 'down', 'negative'],
      ['higher-is-better', 'flat', 'neutral'],
      ['lower-is-better', 'up', 'negative'],
      ['lower-is-better', 'down', 'positive'],
      ['lower-is-better', 'flat', 'neutral'],
      ['neutral', 'up', 'neutral'],
      ['neutral', 'down', 'neutral'],
      ['neutral', 'flat', 'neutral'],
    ];

    it.each(cases)('%s + %s → %s', (polarity, direction, expected) => {
      expect(deltaSentiment(direction, polarity)).toBe(expected);
    });

    it('diverges from direction under lower-is-better (a drop reads positive)', () => {
      expect(deltaSentiment('down', 'lower-is-better')).toBe('positive');
      expect(directionGlyph('down')).toBe('↓');
    });
  });

  describe('directionGlyph', () => {
    it('renders one arrow per direction', () => {
      expect(directionGlyph('up')).toBe('↑');
      expect(directionGlyph('down')).toBe('↓');
      expect(directionGlyph('flat')).toBe('→');
    });
  });

  describe('formatDelta', () => {
    it('percent mode: positive gains +, others print unsigned magnitude', () => {
      expect(formatDelta(5.3, 'percent', 'en-US')).toBe('+5.3%');
      expect(formatDelta(-2.1, 'percent', 'en-US')).toBe('2.1%');
      expect(formatDelta(0, 'percent', 'en-US')).toBe('0.0%');
    });

    it('percent mode honours Intl format options', () => {
      expect(formatDelta(5.3, 'percent', 'en-US', { maximumFractionDigits: 0 })).toBe('+5%');
    });

    it('absolute mode uses locale grouping and drops the percent sign', () => {
      expect(formatDelta(1234, 'absolute', 'en-US')).toBe('+1,234');
      expect(formatDelta(-1234, 'absolute', 'en-US')).toBe('1,234');
    });

    it('percent mode is locale-aware like absolute mode', () => {
      // de-DE writes the decimal separator as a comma; toFixed would print ".".
      expect(formatDelta(5.3, 'percent', 'de-DE')).toBe('+5,3\u00a0%');
      expect(formatDelta(0, 'percent', 'de-DE')).toBe('0,0\u00a0%');
    });

    it('percent mode lets the locale place the percent sign', () => {
      expect(formatDelta(5.3, 'percent', 'tr-TR')).toBe('+%5,3');
    });
  });
});

describe('formatDelta sign', () => {
  it('lets the locale draw the plus sign and prints a negative unsigned', () => {
    expect(formatDelta(5.3, 'percent', 'en-US')).toBe('+5.3%');
    expect(formatDelta(5.3, 'percent', 'de')).toBe('+5,3\u00a0%');
    expect(formatDelta(-5.3, 'percent', 'de')).toBe('5,3\u00a0%');
    expect(formatDelta(1200, 'absolute', 'de')).toBe('+1.200');
    expect(formatDelta(0, 'absolute', 'en-US')).toBe('0');
  });
});

describe('formatDelta formatter reuse', () => {
  it('builds one Intl.NumberFormat per locale and options, not one per call', () => {
    const Real = Intl.NumberFormat;
    let constructed = 0;
    Intl.NumberFormat = new Proxy(Real, {
      construct(target, args: ConstructorParameters<typeof Intl.NumberFormat>) {
        constructed++;
        return Reflect.construct(target, args);
      },
    });
    try {
      for (let i = 0; i < 5; i++) {
        formatDelta(12.5 + i, 'percent', 'fr-CA');
      }
      expect(constructed).toBeLessThanOrEqual(1);
    } finally {
      Intl.NumberFormat = Real;
    }
  });
});
