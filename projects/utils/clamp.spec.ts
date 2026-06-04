import { describe, expect, it } from 'vitest';
import { clamp } from './clamp';

describe('clamp', () => {
  it('returns value unchanged when in bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps below to min', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps above to max', () => {
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it('returns value at min (inclusive lower bound)', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns value at max (inclusive upper bound)', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('treats null min as -Infinity (open lower)', () => {
    expect(clamp(-1000, null, 10)).toBe(-1000);
    expect(clamp(50, null, 10)).toBe(10);
  });

  it('treats null max as +Infinity (open upper)', () => {
    expect(clamp(1000, 0, null)).toBe(1000);
    expect(clamp(-5, 0, null)).toBe(0);
  });

  it('treats both-null as fully open and returns value unchanged', () => {
    expect(clamp(42, null, null)).toBe(42);
  });

  it('treats undefined identically to null', () => {
    expect(clamp(5, undefined, 10)).toBe(5);
    expect(clamp(-5, undefined, 10)).toBe(-5);
    expect(clamp(50, 0, undefined)).toBe(50);
  });

  it('propagates NaN value', () => {
    expect(Number.isNaN(clamp(NaN, 0, 10))).toBe(true);
    expect(Number.isNaN(clamp(NaN, null, null))).toBe(true);
  });

  it('returns min when bounds invert (min > max)', () => {
    expect(clamp(5, 10, 0)).toBe(10);
    expect(clamp(-100, 10, 0)).toBe(10);
  });
});
