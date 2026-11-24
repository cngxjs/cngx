import { describe, expect, it } from 'vitest';

import { progressPercent } from './progress-percent';

describe('progressPercent', () => {
  it('rounds to an integer percent', () => {
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(2, 3)).toBe(67);
    expect(progressPercent(50, 200)).toBe(25);
  });

  it('clamps loaded above total to 100 and a negative loaded to 0', () => {
    expect(progressPercent(150, 100)).toBe(100);
    expect(progressPercent(-5, 100)).toBe(0);
  });

  it('returns undefined without a positive total', () => {
    expect(progressPercent(10, 0)).toBeUndefined();
    expect(progressPercent(10, -1)).toBeUndefined();
    expect(progressPercent(10, null)).toBeUndefined();
    expect(progressPercent(10, undefined)).toBeUndefined();
  });
});
