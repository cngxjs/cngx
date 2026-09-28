import { describe, expect, it } from 'vitest';
import { arrayEqual, recordEqual, setEqual } from './equality';

describe('setEqual', () => {
  it('returns true for the same reference', () => {
    const s = new Set<string>(['a', 'b']);
    expect(setEqual(s, s)).toBe(true);
  });

  it('returns true for two empty sets', () => {
    expect(setEqual(new Set(), new Set())).toBe(true);
  });

  it('returns true for structurally equal sets', () => {
    expect(setEqual(new Set(['a', 'b']), new Set(['b', 'a']))).toBe(true);
  });

  it('returns false for different sizes', () => {
    expect(setEqual(new Set(['a', 'b']), new Set(['a']))).toBe(false);
  });

  it('returns false for same size, different elements', () => {
    expect(setEqual(new Set(['a', 'b']), new Set(['a', 'c']))).toBe(false);
  });

  it('treats Set semantics: duplicates collapse before comparison', () => {
    expect(setEqual(new Set(['a', 'a', 'b']), new Set(['a', 'b']))).toBe(true);
  });
});

describe('arrayEqual', () => {
  it('returns true for the same reference', () => {
    const a = [1, 2, 3];
    expect(arrayEqual(a, a)).toBe(true);
  });

  it('returns true for two empty arrays', () => {
    expect(arrayEqual([], [])).toBe(true);
  });

  it('returns true for positionally identical arrays', () => {
    expect(arrayEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('returns false for arrays of different length', () => {
    expect(arrayEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('returns false for arrays with the same values in different order', () => {
    expect(arrayEqual([1, 2, 3], [3, 2, 1])).toBe(false);
  });

  it('returns false for reference-different but value-equal object elements', () => {
    expect(arrayEqual([{ a: 1 }], [{ a: 1 }])).toBe(false);
  });

  it('uses Object.is for NaN equality', () => {
    expect(arrayEqual([NaN], [NaN])).toBe(true);
  });
});

describe('recordEqual', () => {
  it('returns true for the same reference', () => {
    const r = { a: 1 };
    expect(recordEqual(r, r)).toBe(true);
  });

  it('returns true for key-wise equal records', () => {
    expect(recordEqual({ a: 1, b: 'x' }, { b: 'x', a: 1 })).toBe(true);
  });

  it('returns false when a value changed', () => {
    expect(recordEqual({ a: 1, b: 'x' }, { a: 1, b: 'y' })).toBe(false);
  });

  it('returns false for an extra key', () => {
    expect(recordEqual<Record<string, number>>({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('returns false for a missing key with the same key count', () => {
    expect(
      recordEqual<Record<string, number | undefined>>({ a: undefined }, { b: undefined }),
    ).toBe(false);
  });

  it('treats NaN values as equal via Object.is', () => {
    expect(recordEqual({ a: NaN }, { a: NaN })).toBe(true);
  });

  it('compares nested objects by reference', () => {
    const inner = { x: 1 };
    expect(recordEqual({ a: inner }, { a: inner })).toBe(true);
    expect(recordEqual({ a: { x: 1 } }, { a: { x: 1 } })).toBe(false);
  });
});
