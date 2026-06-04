import { describe, expect, it } from 'vitest';
import { createLinearScale } from './linear';

describe('createLinearScale', () => {
  it('maps domain edges to range edges', () => {
    const scale = createLinearScale([0, 100], [0, 200]);
    expect(scale(0)).toBe(0);
    expect(scale(100)).toBe(200);
  });

  it('linearly interpolates the midpoint', () => {
    const scale = createLinearScale([0, 100], [0, 200]);
    expect(scale(50)).toBe(100);
  });

  it('supports an inverted domain (e.g. SVG Y-axis)', () => {
    const scale = createLinearScale([100, 0], [0, 200]);
    expect(scale(100)).toBe(0);
    expect(scale(0)).toBe(200);
    expect(scale(50)).toBe(100);
  });

  it('extrapolates values outside the domain', () => {
    const scale = createLinearScale([0, 100], [0, 200]);
    expect(scale(150)).toBe(300);
    expect(scale(-10)).toBe(-20);
  });

  it('collapses to a constant when domain endpoints are equal', () => {
    const scale = createLinearScale([5, 5], [10, 200]);
    expect(scale(5)).toBe(10);
    expect(scale(0)).toBe(10);
    expect(scale(99)).toBe(10);
  });
});
