import { describe, expect, it } from 'vitest';

import { chipFitSnapshotEqual, fitChipCount, type ChipFitSnapshot } from './chip-fit';

function snap(available: number, widths: number[], gap = 4, reserve = 32): ChipFitSnapshot {
  return { available, gap, reserve, widths };
}

describe('fitChipCount', () => {
  it('returns every slot when all of them plus their gaps fit', () => {
    expect(fitChipCount(snap(300, [80, 80, 80]))).toBe(3);
  });

  it('counts the exact boundary as fitting', () => {
    // 80 + 4 + 80 + 4 + 80 = 248
    expect(fitChipCount(snap(248, [80, 80, 80]))).toBe(3);
    expect(fitChipCount(snap(247, [80, 80, 80]))).toBe(2);
  });

  it('lets the badge reserve tip one slot out', () => {
    // without reserve: 80+4+80 = 164 fits 170 for two; with three slots 248 > 170.
    // with reserve: 32 + 84 + 84 = 200 > 170, so only one slot sits next to the badge.
    expect(fitChipCount(snap(170, [80, 80, 80]))).toBe(1);
    // 32 + 84 + 84 = 200 fits 200: two slots plus the badge.
    expect(fitChipCount(snap(200, [80, 80, 80]))).toBe(2);
  });

  it('gives 1 for a slot as wide as available minus reserve', () => {
    expect(fitChipCount(snap(300, [268, 80, 80]))).toBe(1);
  });

  it('floors at 1 when even the first slot does not fit next to the reserve', () => {
    expect(fitChipCount(snap(100, [300, 300]))).toBe(1);
  });

  it('gives 0 (badge only) when the strip leaves no room for a capped slot', () => {
    // reserve 32 + gap 4 = 36: the slot cap is 0 or less, the slot collapses.
    expect(fitChipCount(snap(36, [0, 0]))).toBe(0);
    expect(fitChipCount(snap(20, [0, 0]))).toBe(0);
    expect(fitChipCount(snap(37, [1, 40]))).toBe(1);
  });

  it('returns 0 for a strip without slots', () => {
    expect(fitChipCount(snap(300, []))).toBe(0);
  });

  it('returns null before the first measurement', () => {
    expect(fitChipCount(null)).toBeNull();
  });
});

describe('chipFitSnapshotEqual', () => {
  it('is true for equal values in fresh arrays', () => {
    expect(chipFitSnapshotEqual(snap(300, [10, 20]), snap(300, [10, 20]))).toBe(true);
  });

  it('is false when any field differs', () => {
    const base = snap(300, [10, 20]);
    expect(chipFitSnapshotEqual(base, snap(301, [10, 20]))).toBe(false);
    expect(chipFitSnapshotEqual(base, snap(300, [10, 20], 5))).toBe(false);
    expect(chipFitSnapshotEqual(base, snap(300, [10, 20], 4, 40))).toBe(false);
    expect(chipFitSnapshotEqual(base, snap(300, [10, 21]))).toBe(false);
    expect(chipFitSnapshotEqual(base, snap(300, [10]))).toBe(false);
  });

  it('handles null on either side', () => {
    expect(chipFitSnapshotEqual(null, null)).toBe(true);
    expect(chipFitSnapshotEqual(null, snap(1, []))).toBe(false);
    expect(chipFitSnapshotEqual(snap(1, []), null)).toBe(false);
  });
});
