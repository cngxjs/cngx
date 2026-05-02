import { describe, expect, it } from 'vitest';
import { createTimeScale } from './time';

describe('createTimeScale', () => {
  it('maps Date domain edges to range edges', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-02T00:00:00Z');
    const scale = createTimeScale([start, end], [0, 100]);
    expect(scale(start)).toBe(0);
    expect(scale(end)).toBe(100);
  });

  it('accepts numeric timestamps interchangeably with Date', () => {
    const start = new Date('2026-01-01T00:00:00Z').getTime();
    const end = new Date('2026-01-02T00:00:00Z');
    const scale = createTimeScale([start, end], [0, 100]);
    expect(scale(start)).toBe(0);
    expect(scale(end)).toBe(100);
  });

  it('linearly interpolates the midpoint Date', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-02T00:00:00Z');
    const mid = new Date('2026-01-01T12:00:00Z');
    const scale = createTimeScale([start, end], [0, 100]);
    expect(scale(mid)).toBe(50);
  });

  it('supports an inverted time domain', () => {
    const start = new Date('2026-01-02T00:00:00Z');
    const end = new Date('2026-01-01T00:00:00Z');
    const scale = createTimeScale([start, end], [0, 100]);
    expect(scale(start)).toBe(0);
    expect(scale(end)).toBe(100);
  });
});
