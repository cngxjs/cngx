import { describe, expect, it } from 'vitest';
import { createPathBuilder } from './path-builder';
import type { ScaleFn, XScaleInput } from '../chart/chart-context';

const xScale: ScaleFn<XScaleInput> = (v) => Number(v);
const yScale: ScaleFn<number> = (v) => v;

describe('createPathBuilder — compute-guard (isolated)', () => {
  it('rebuilds once for the very first call', () => {
    const builder = createPathBuilder<number>({
      y: (v) => v,
      curve: 'linear',
    });
    expect(builder.rebuildCount()).toBe(0);
    builder.build([1, 2, 3], xScale, yScale);
    expect(builder.rebuildCount()).toBe(1);
  });

  it('does NOT rebuild when the same (data, xScale, yScale) triple is passed by reference', () => {
    const builder = createPathBuilder<number>({
      y: (v) => v,
      curve: 'linear',
    });
    const data = [1, 2, 3];
    builder.build(data, xScale, yScale);
    builder.build(data, xScale, yScale);
    builder.build(data, xScale, yScale);
    expect(builder.rebuildCount()).toBe(1);
  });

  it('rebuilds when a structurally identical but reference-different data array is passed', () => {
    const builder = createPathBuilder<number>({
      y: (v) => v,
      curve: 'linear',
    });
    builder.build([1, 2, 3], xScale, yScale);
    builder.build([1, 2, 3], xScale, yScale);
    expect(builder.rebuildCount()).toBe(2);
  });

  it('rebuilds when the scale function reference changes', () => {
    const builder = createPathBuilder<number>({
      y: (v) => v,
      curve: 'linear',
    });
    const data = [1, 2, 3];
    builder.build(data, xScale, yScale);
    builder.build(data, (v) => Number(v), yScale);
    expect(builder.rebuildCount()).toBe(2);
  });

  it('returns the cached d-string by value equality', () => {
    const builder = createPathBuilder<number>({
      y: (v) => v,
      curve: 'linear',
    });
    const data = [1, 2, 3];
    const a = builder.build(data, xScale, yScale);
    const b = builder.build(data, xScale, yScale);
    expect(a).toBe(b);
  });

  it('handles a 500-point dataset and skips the second-call concat work', () => {
    const builder = createPathBuilder<number>({
      y: (v) => v,
      curve: 'linear',
    });
    const data = Array.from({ length: 500 }, (_, i) => i);
    builder.build(data, xScale, yScale);
    builder.build(data, xScale, yScale);
    expect(builder.rebuildCount()).toBe(1);
  });

  it('uses the provided x accessor when supplied (otherwise falls back to index)', () => {
    const builder = createPathBuilder<{ x: number; y: number }>({
      x: (d) => d.x,
      y: (d) => d.y,
      curve: 'linear',
    });
    const d = builder.build(
      [
        { x: 10, y: 1 },
        { x: 30, y: 2 },
      ],
      xScale,
      yScale,
    );
    expect(d).toBe('M 10 1 L 30 2');
  });
});
