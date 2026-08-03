import { describe, expect, it } from 'vitest';
import type { LayerGeometry } from './chart-layer';
import { derivePointMarks, EMPTY_POINTS, lineAreaGeomEqual, pointsEqual } from './point-geom';

const xScale = (v: number | Date | string): number => Number(v) * 10;
const yScale = (v: number): number => 100 - v;
const yAcc = (d: number): number => d;
const xAcc = (_d: number, i: number): number => i;

describe('derivePointMarks', () => {
  it("'auto' marks a single datum", () => {
    const marks = derivePointMarks('auto', [5], xScale, yScale, yAcc, xAcc);
    expect(marks).toEqual([{ cx: 0, cy: 95 }]);
  });

  it("'auto' marks nothing for a multi-point series (shared empty reference)", () => {
    expect(derivePointMarks('auto', [1, 2, 3], xScale, yScale, yAcc, xAcc)).toBe(EMPTY_POINTS);
  });

  it("'always' marks every datum", () => {
    expect(derivePointMarks('always', [1, 2, 3], xScale, yScale, yAcc, xAcc)).toHaveLength(3);
  });

  it("'never' marks nothing, single or multi", () => {
    expect(derivePointMarks('never', [5], xScale, yScale, yAcc, xAcc)).toBe(EMPTY_POINTS);
    expect(derivePointMarks('never', [1, 2, 3], xScale, yScale, yAcc, xAcc)).toBe(EMPTY_POINTS);
  });

  it('empty data marks nothing', () => {
    expect(derivePointMarks('always', [], xScale, yScale, yAcc, xAcc)).toBe(EMPTY_POINTS);
  });
});

describe('pointsEqual', () => {
  it('treats absent and empty as equal', () => {
    expect(pointsEqual(undefined, EMPTY_POINTS)).toBe(true);
  });

  it('is true for equal coordinates, false for a length or coordinate difference', () => {
    const a = [{ cx: 1, cy: 2 }];
    expect(pointsEqual(a, [{ cx: 1, cy: 2 }])).toBe(true);
    expect(
      pointsEqual(a, [
        { cx: 1, cy: 2 },
        { cx: 3, cy: 4 },
      ]),
    ).toBe(false);
    expect(pointsEqual(a, [{ cx: 1, cy: 9 }])).toBe(false);
  });
});

describe('lineAreaGeomEqual', () => {
  const line = (d: string, points: readonly { cx: number; cy: number }[]): LayerGeometry => ({
    kind: 'line',
    d,
    color: null,
    strokeWidth: null,
    fill: 'none',
    points,
  });

  it('holds when d and markers are unchanged (no-op refresh)', () => {
    expect(
      lineAreaGeomEqual(line('M 0 0', [{ cx: 1, cy: 2 }]), line('M 0 0', [{ cx: 1, cy: 2 }])),
    ).toBe(true);
  });

  it('breaks on a d change or a marker change', () => {
    expect(lineAreaGeomEqual(line('M 0 0', []), line('M 1 1', []))).toBe(false);
    expect(lineAreaGeomEqual(line('M 0 0', []), line('M 0 0', [{ cx: 1, cy: 2 }]))).toBe(false);
  });

  it('covers the area variant (null stroke/fill compare equal)', () => {
    const area = (d: string): LayerGeometry => ({
      kind: 'area',
      d,
      color: null,
      strokeWidth: null,
      fill: null,
      opacity: 0.2,
      points: EMPTY_POINTS,
    });
    expect(lineAreaGeomEqual(area('M 0 0 Z'), area('M 0 0 Z'))).toBe(true);
  });

  it('rejects a line-vs-area comparison outright (kind guard)', () => {
    const area: LayerGeometry = {
      kind: 'area',
      d: 'M 0 0',
      color: null,
      strokeWidth: null,
      fill: null,
      opacity: null,
      points: EMPTY_POINTS,
    };
    expect(lineAreaGeomEqual(line('M 0 0', []), area)).toBe(false);
  });
});
