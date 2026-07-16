import { describe, expect, it } from 'vitest';
import { decimalPlaces } from './decimal-places';

describe('decimalPlaces', () => {
  it('returns 0 for integers', () => {
    expect(decimalPlaces(0)).toBe(0);
    expect(decimalPlaces(7)).toBe(0);
    expect(decimalPlaces(-42)).toBe(0);
  });

  it('counts fractional digits', () => {
    expect(decimalPlaces(0.1)).toBe(1);
    expect(decimalPlaces(0.25)).toBe(2);
    expect(decimalPlaces(0.125)).toBe(3);
    expect(decimalPlaces(-3.14)).toBe(2);
  });

  it('does not count trailing zeros the number literal drops', () => {
    // 0.10 and 1.0 collapse to "0.1" / "1" via String(), so the precision
    // reflects the value, not the source literal.
    expect(decimalPlaces(0.1)).toBe(1);
    expect(decimalPlaces(1.0)).toBe(0);
  });

  it('returns 0 for non-finite input', () => {
    expect(decimalPlaces(Number.NaN)).toBe(0);
    expect(decimalPlaces(Number.POSITIVE_INFINITY)).toBe(0);
    expect(decimalPlaces(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});
