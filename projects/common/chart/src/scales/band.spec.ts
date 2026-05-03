import { describe, expect, it } from 'vitest';
import { createBandScale } from './band';

describe('createBandScale', () => {
  it('positions a 4-band domain evenly across the range with no padding', () => {
    const scale = createBandScale(['a', 'b', 'c', 'd'], [0, 100]);
    expect(scale('a')).toBe(0);
    expect(scale('b')).toBe(25);
    expect(scale('c')).toBe(50);
    expect(scale('d')).toBe(75);
    expect(scale.bandwidth()).toBe(25);
  });

  it('shrinks bandwidth proportionally to padding and centers each band in its slot', () => {
    const scale = createBandScale(['a', 'b'], [0, 100], 0.2);
    expect(scale.bandwidth()).toBe(40);
    expect(scale('a')).toBe(5);
    expect(scale('b')).toBe(55);
  });

  it('returns NaN for unknown domain values', () => {
    const scale = createBandScale(['a', 'b'], [0, 100]);
    expect(scale('c')).toBeNaN();
  });

  it('handles an empty domain (zero bandwidth, NaN lookups)', () => {
    const scale = createBandScale<string>([], [0, 100]);
    expect(scale.bandwidth()).toBe(0);
    expect(scale('any')).toBeNaN();
  });

  it('supports any value type, not just strings', () => {
    const a = { id: 1 };
    const b = { id: 2 };
    const scale = createBandScale([a, b], [0, 100]);
    expect(scale(a)).toBe(0);
    expect(scale(b)).toBe(50);
  });
});
