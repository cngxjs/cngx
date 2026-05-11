import { describe, expect, it } from 'vitest';
import { dimensionsEqual, sameNumberArr } from './equal-helpers';

describe('sameNumberArr', () => {
  it('returns true for reference-equal arrays', () => {
    const a = [1, 2, 3];
    expect(sameNumberArr(a, a)).toBe(true);
  });

  it('returns true for same-content fresh-reference arrays', () => {
    expect(sameNumberArr([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('returns false on length mismatch', () => {
    expect(sameNumberArr([1, 2, 3], [1, 2])).toBe(false);
  });

  it('returns false on per-index mismatch', () => {
    expect(sameNumberArr([1, 2, 3], [1, 2, 4])).toBe(false);
  });

  it('treats NaN as equal to NaN (Object.is semantics)', () => {
    expect(sameNumberArr([Number.NaN, 1], [Number.NaN, 1])).toBe(true);
  });

  it('treats +0 and -0 as different (Object.is semantics)', () => {
    expect(sameNumberArr([0], [-0])).toBe(false);
  });
});

describe('dimensionsEqual', () => {
  it('returns true on identical dimension pairs', () => {
    expect(dimensionsEqual({ width: 100, height: 50 }, { width: 100, height: 50 })).toBe(true);
  });

  it('returns false on width mismatch', () => {
    expect(dimensionsEqual({ width: 100, height: 50 }, { width: 101, height: 50 })).toBe(false);
  });

  it('returns false on height mismatch', () => {
    expect(dimensionsEqual({ width: 100, height: 50 }, { width: 100, height: 51 })).toBe(false);
  });

  it('returns true on a zero-by-zero pair (no special-casing)', () => {
    expect(dimensionsEqual({ width: 0, height: 0 }, { width: 0, height: 0 })).toBe(true);
  });
});
