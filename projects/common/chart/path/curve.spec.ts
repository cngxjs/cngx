import { describe, expect, it } from 'vitest';
import { buildCurvePath, type PathPoint } from './curve';

const points: readonly PathPoint[] = [
  { x: 0, y: 10 },
  { x: 10, y: 20 },
  { x: 20, y: 5 },
];

describe('buildCurvePath', () => {
  it('returns an empty string for an empty point list', () => {
    expect(buildCurvePath([], 'linear')).toBe('');
    expect(buildCurvePath([], 'monotone')).toBe('');
  });

  it('returns just the move command for a single-point input', () => {
    expect(buildCurvePath([{ x: 5, y: 7 }], 'linear')).toBe('M 5 7');
    expect(buildCurvePath([{ x: 5, y: 7 }], 'monotone')).toBe('M 5 7');
  });

  it('builds a linear path with M + L commands', () => {
    expect(buildCurvePath(points, 'linear')).toBe('M 0 10 L 10 20 L 20 5');
  });

  it('builds a monotone path with M + C commands of the same arity as linear', () => {
    const d = buildCurvePath(points, 'monotone');
    expect(d.startsWith('M 0 10')).toBe(true);
    const cubicSegments = d.split(' C ').length - 1;
    expect(cubicSegments).toBe(points.length - 1);
  });

  it('keeps the monotone curve flat when the slopes change sign at an interior point', () => {
    const d = buildCurvePath(points, 'monotone');
    expect(d).toContain('C 3.3333333333333335 13.333333333333334');
  });
});
