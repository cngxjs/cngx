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
      expect(formatDelta(5.3, 'percent', 'en-US')).toBe('+5.3\u202f%');
      expect(formatDelta(-2.1, 'percent', 'en-US')).toBe('2.1\u202f%');
      expect(formatDelta(0, 'percent', 'en-US')).toBe('0.0\u202f%');
    });

    it('percent mode honours Intl format options', () => {
      expect(formatDelta(5.3, 'percent', 'en-US', { maximumFractionDigits: 0 })).toBe('+5\u202f%');
    });

    it('absolute mode uses locale grouping and drops the percent sign', () => {
      expect(formatDelta(1234, 'absolute', 'en-US')).toBe('+1,234');
      expect(formatDelta(-1234, 'absolute', 'en-US')).toBe('1,234');
    });
  });
});
