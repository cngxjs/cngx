import { describe, expect, it } from 'vitest';

import { sliderTickValues } from './slider-ticks';

describe('sliderTickValues', () => {
  it('returns step stops from min to max inclusive', () => {
    expect(sliderTickValues(0, 100, 25)).toEqual([0, 25, 50, 75, 100]);
  });

  it('handles decimal steps without float drift', () => {
    expect(sliderTickValues(0, 1, 0.25)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('returns [] for an invalid grid', () => {
    expect(sliderTickValues(0, 100, 0)).toEqual([]);
    expect(sliderTickValues(5, 5, 1)).toEqual([]);
  });

  it('returns [] when the grid is denser than maxCount', () => {
    expect(sliderTickValues(0, 1000, 1)).toEqual([]);
    expect(sliderTickValues(0, 100, 10, 5)).toEqual([]);
  });
});
