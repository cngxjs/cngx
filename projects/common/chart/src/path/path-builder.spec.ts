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

  it('returns a fresh builder instance per call — no cross-consumer state', () => {
    const opts = { y: (v: number) => v, curve: 'linear' as const };
    const a = createPathBuilder<number>(opts);
    const b = createPathBuilder<number>(opts);
    expect(a).not.toBe(b);

    a.build([1, 2, 3], xScale, yScale);
    expect(a.rebuildCount()).toBe(1);
    expect(b.rebuildCount()).toBe(0);

    b.build([10, 20, 30], xScale, yScale);
    expect(a.rebuildCount()).toBe(1);
    expect(b.rebuildCount()).toBe(1);
  });

  it('two builders sharing the same (data, scale) refs each maintain their own internal cache', () => {
    const a = createPathBuilder<number>({ y: (v) => v, curve: 'linear' });
    const b = createPathBuilder<number>({ y: (v) => v, curve: 'linear' });
    const data = [1, 2, 3];
    a.build(data, xScale, yScale);
    a.build(data, xScale, yScale);
    expect(a.rebuildCount()).toBe(1);
    b.build(data, xScale, yScale);
    expect(b.rebuildCount()).toBe(1);
    a.build(data, xScale, yScale);
    expect(a.rebuildCount()).toBe(1);
  });
});
