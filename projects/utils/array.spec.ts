import { describe, expect, it } from 'vitest';
import { coerceArray } from './array';

describe('coerceArray', () => {
  it('returns an array input unchanged (same reference)', () => {
    const arr = [1, 2];
    expect(coerceArray(arr)).toBe(arr);
  });

  it('wraps a scalar in a single-element array', () => {
    expect(coerceArray(7)).toEqual([7]);
    expect(coerceArray('a')).toEqual(['a']);
  });

  it('wraps null and undefined instead of dropping them', () => {
    expect(coerceArray(null)).toEqual([null]);
    expect(coerceArray(undefined)).toEqual([undefined]);
  });

  it('keeps an empty array empty', () => {
    expect(coerceArray([])).toEqual([]);
  });
});
