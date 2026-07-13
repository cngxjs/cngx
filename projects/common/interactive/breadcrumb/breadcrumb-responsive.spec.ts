import { describe, expect, it } from 'vitest';

import {
  DEFAULT_BREADCRUMB_WIDTH_TIERS,
  resolveBreadcrumbTier,
  type CngxBreadcrumbWidthTier,
} from './breadcrumb-responsive';

describe('resolveBreadcrumbTier', () => {
  const tiers = DEFAULT_BREADCRUMB_WIDTH_TIERS;

  it('returns the widest tier at and above its minWidth', () => {
    expect(resolveBreadcrumbTier(640, tiers)).toBe(6);
    expect(resolveBreadcrumbTier(999, tiers)).toBe(6);
  });

  it('drops to the middle tier between boundaries', () => {
    expect(resolveBreadcrumbTier(440, tiers)).toBe(4);
    expect(resolveBreadcrumbTier(639, tiers)).toBe(4);
  });

  it('floors at the narrowest tier below the middle boundary', () => {
    expect(resolveBreadcrumbTier(439, tiers)).toBe(2);
    expect(resolveBreadcrumbTier(0, tiers)).toBe(2);
  });

  it('picks the exact tier on each boundary (inclusive lower bound)', () => {
    for (const tier of tiers) {
      expect(resolveBreadcrumbTier(tier.minWidth, tiers)).toBe(tier.maxVisible);
    }
  });

  it('falls back to the narrowest tier when width is below every minWidth', () => {
    const noFloor: readonly CngxBreadcrumbWidthTier[] = [
      { minWidth: 800, maxVisible: 8 },
      { minWidth: 400, maxVisible: 3 },
    ];
    // 399 sits below both bounds -> narrowest (400/3) is the floor.
    expect(resolveBreadcrumbTier(399, noFloor)).toBe(3);
    expect(resolveBreadcrumbTier(0, noFloor)).toBe(3);
  });

  it('normalises unsorted tier input before matching', () => {
    const unsorted: readonly CngxBreadcrumbWidthTier[] = [
      { minWidth: 0, maxVisible: 2 },
      { minWidth: 640, maxVisible: 6 },
      { minWidth: 440, maxVisible: 4 },
    ];
    expect(resolveBreadcrumbTier(700, unsorted)).toBe(6);
    expect(resolveBreadcrumbTier(500, unsorted)).toBe(4);
    expect(resolveBreadcrumbTier(100, unsorted)).toBe(2);
  });

  it('never collapses (returns Infinity) for an empty tier list', () => {
    expect(resolveBreadcrumbTier(320, [])).toBe(Number.POSITIVE_INFINITY);
  });
});
