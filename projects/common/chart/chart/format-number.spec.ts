import { describe, expect, it } from 'vitest';

import { formatChartNumber } from './format-number';

describe('formatChartNumber', () => {
  it('strips float noise and formats in the locale without grouping', () => {
    expect(formatChartNumber(6.6000000000000005, 'en-US')).toBe('6.6');
    expect(formatChartNumber(6.6000000000000005, 'de')).toBe('6,6');
    expect(formatChartNumber(12000, 'en-US')).toBe('12000');
    expect(formatChartNumber(-0, 'en-US')).toBe('0');
  });

  it('formats non-finite values in the locale instead of the English String() form', () => {
    expect(formatChartNumber(Number.POSITIVE_INFINITY, 'en-US')).toBe('∞');
    expect(formatChartNumber(Number.NEGATIVE_INFINITY, 'de')).toBe('-∞');
    expect(formatChartNumber(Number.NaN, 'en-US')).toBe('NaN');
    expect(formatChartNumber(1, 'ar-EG')).toBe('١');
  });
});
