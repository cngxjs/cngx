import { describe, expect, it } from 'vitest';
import { clampedRatio, presetIndexDomain, presetValueDomain, scanMinMax } from './preset-math';

describe('scanMinMax', () => {
  it('returns null for an empty input', () => {
    expect(scanMinMax([])).toBeNull();
  });

  it('scans min and max in one pass', () => {
    expect(scanMinMax([3, -1, 7, 2])).toEqual({ min: -1, max: 7 });
  });

  it('collapses a single value to min === max', () => {
    expect(scanMinMax([5])).toEqual({ min: 5, max: 5 });
  });
});

describe('presetIndexDomain', () => {
  it('returns [0, 1] below two points', () => {
    expect(presetIndexDomain(0)).toEqual([0, 1]);
    expect(presetIndexDomain(1)).toEqual([0, 1]);
  });

  it('returns [0, n - 1] from two points on', () => {
    expect(presetIndexDomain(2)).toEqual([0, 1]);
    expect(presetIndexDomain(5)).toEqual([0, 4]);
  });
});

describe('presetValueDomain', () => {
  it('returns [0, 1] for an empty series', () => {
    expect(presetValueDomain([])).toEqual([0, 1]);
  });

  it('pads a flat series to [v - 1, v + 1]', () => {
    expect(presetValueDomain([4, 4, 4])).toEqual([3, 5]);
  });

  it('returns [min, max] for a varying series', () => {
    expect(presetValueDomain([2, 8, 5])).toEqual([2, 8]);
  });
});

describe('clampedRatio', () => {
  it('positions the value inside the range', () => {
    expect(clampedRatio(25, 0, 100)).toBe(0.25);
    expect(clampedRatio(150, 100, 200)).toBe(0.5);
  });

  it('clamps below the range to 0 and above to 1', () => {
    expect(clampedRatio(-10, 0, 100)).toBe(0);
    expect(clampedRatio(250, 0, 100)).toBe(1);
  });

  it('yields 0 for a degenerate range (max <= min)', () => {
    expect(clampedRatio(5, 10, 10)).toBe(0);
    expect(clampedRatio(5, 10, 0)).toBe(0);
  });
});
