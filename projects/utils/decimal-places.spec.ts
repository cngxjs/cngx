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

  it('expands exponent notation instead of reporting 0', () => {
    // These magnitudes stringify as '1e-7' / '1.5e-8' / '1.23e-21'.
    expect(decimalPlaces(1e-7)).toBe(7);
    expect(decimalPlaces(1.5e-8)).toBe(9);
    expect(decimalPlaces(1.23e-21)).toBe(23);
  });

  it('clamps a positive exponent overshoot to 0 (large integers)', () => {
    // '1.23e+22' / '1e+21' - mantissa places never exceed the exponent here.
    expect(decimalPlaces(1.23e22)).toBe(0);
    expect(decimalPlaces(1e21)).toBe(0);
  });

  it('counts plain-notation values born from exponent literals', () => {
    // Below the e-notation thresholds String() emits plain decimals:
    // 1.5e-3 -> '0.0015', 1.23e5 -> '123000'.
    expect(decimalPlaces(1.5e-3)).toBe(4);
    expect(decimalPlaces(1.23e5)).toBe(0);
  });

  it('handles negative numbers in both notations', () => {
    expect(decimalPlaces(-0.125)).toBe(3);
    expect(decimalPlaces(-1e-7)).toBe(7);
  });

  it('returns 0 for non-finite input', () => {
    expect(decimalPlaces(Number.NaN)).toBe(0);
    expect(decimalPlaces(Number.POSITIVE_INFINITY)).toBe(0);
    expect(decimalPlaces(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});
