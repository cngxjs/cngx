import { describe, it, expect } from 'vitest';
import '@angular/compiler';
import { coerceBooleanProperty, coerceNumberProperty } from './coerce.util';

describe('coerceBooleanProperty', () => {
  it('returns true for truthy strings', () => {
    expect(coerceBooleanProperty('true')).toBe(true);
    expect(coerceBooleanProperty('')).toBe(true);
    expect(coerceBooleanProperty('anything')).toBe(true);
  });

  it('returns false for "false"', () => {
    expect(coerceBooleanProperty('false')).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(coerceBooleanProperty(null)).toBe(false);
    expect(coerceBooleanProperty(undefined)).toBe(false);
  });
});

describe('coerceNumberProperty', () => {
  it('parses numeric strings', () => {
    expect(coerceNumberProperty('42')).toBe(42);
    expect(coerceNumberProperty('3.14')).toBe(3.14);
  });

  it('returns fallback for non-numeric input', () => {
    expect(coerceNumberProperty('abc')).toBe(0);
    expect(coerceNumberProperty('abc', -1)).toBe(-1);
  });

  it('passes through numbers', () => {
    expect(coerceNumberProperty(7)).toBe(7);
  });
});
