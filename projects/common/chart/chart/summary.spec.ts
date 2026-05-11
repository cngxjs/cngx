import { describe, expect, it } from 'vitest';
import { computeChartSummary } from './summary';

describe('computeChartSummary', () => {
  it('returns a flat zero-summary for empty input', () => {
    const s = computeChartSummary([], []);
    expect(s).toEqual({ trend: 'flat', min: 0, max: 0, current: 0, thresholds: [] });
  });

  it('reports min, max, and current for a non-empty series', () => {
    const s = computeChartSummary([5, 12, 3, 18, 9], []);
    expect(s.min).toBe(3);
    expect(s.max).toBe(18);
    expect(s.current).toBe(9);
  });

  it('classifies a clearly rising series as trend=up', () => {
    const s = computeChartSummary([10, 12, 14, 18, 22], []);
    expect(s.trend).toBe('up');
  });

  it('classifies a clearly falling series as trend=down', () => {
    const s = computeChartSummary([22, 18, 14, 12, 10], []);
    expect(s.trend).toBe('down');
  });

  it('treats a series within the 5%-of-range deadband as flat', () => {
    // First=10, last=10.4, max=11, min=10. Range=1, deadband=0.05. Delta=0.4 > 0.05 -> not flat.
    // Tighten: first=10, last=10.04, max=11, min=10 -> deadband=0.05, delta=0.04 < 0.05.
    const s = computeChartSummary([10, 10.5, 11, 10.5, 10.04], []);
    expect(s.trend).toBe('flat');
  });

  it('returns the subset of thresholds that the series actually crosses', () => {
    // Series goes 5 -> 50 -> 5 -> 50, so crosses 10 and 25 multiple times,
    // but not 100 (always below).
    const s = computeChartSummary([5, 50, 5, 50], [10, 25, 100]);
    expect(s.thresholds).toEqual([10, 25]);
  });

  it('does not list a threshold that the series never crosses', () => {
    const s = computeChartSummary([5, 6, 7, 8], [100]);
    expect(s.thresholds).toEqual([]);
  });

  it('preserves input order in the crossed-thresholds array', () => {
    const s = computeChartSummary([0, 10, 0], [3, 7, 5]);
    expect(s.thresholds).toEqual([3, 7, 5]);
  });
});
