import { describe, expect, it } from 'vitest';

import { computeRange } from './range-computer';

describe('computeRange', () => {
  describe('edge cases', () => {
    it('should return empty range for zero items', () => {
      const result = computeRange(0, 500, 0, 48, 5);
      expect(result).toEqual({
        start: 0,
        end: 0,
        offsetBefore: 0,
        offsetAfter: 0,
        totalSize: 0,
      });
    });

    it('should return empty range for zero clientHeight', () => {
      const result = computeRange(0, 0, 100, 48, 5);
      expect(result).toEqual({
        start: 0,
        end: 0,
        offsetBefore: 0,
        offsetAfter: 0,
        totalSize: 0,
      });
    });

    it('should handle a single item', () => {
      const result = computeRange(0, 500, 1, 48, 5);
      expect(result.start).toBe(0);
      expect(result.end).toBe(1);
      expect(result.totalSize).toBe(48);
    });
  });

  describe('fixed estimateSize', () => {
    const itemSize = 48;
    const overscan = 5;
    const totalCount = 1000;

    it('should compute correct range at scrollTop=0', () => {
      const result = computeRange(0, 500, totalCount, itemSize, overscan);
      expect(result.start).toBe(0);
      // ceil(500/48) = 11, + 5 overscan = 16
      expect(result.end).toBe(16);
      expect(result.offsetBefore).toBe(0);
      expect(result.totalSize).toBe(totalCount * itemSize);
    });

    it('should compute correct range in the middle', () => {
      // scrollTop = 4800 → floor(4800/48) = 100
      const result = computeRange(4800, 500, totalCount, itemSize, overscan);
      expect(result.start).toBe(100 - overscan); // 95
      // ceil((4800+500)/48) = ceil(110.4) = 111, + 5 = 116
      expect(result.end).toBe(116);
      expect(result.offsetBefore).toBe(95 * itemSize);
    });

    it('should clamp start to 0', () => {
      // scrollTop near the top: floor(100/48) = 2, 2-5 = -3 → clamped to 0
      const result = computeRange(100, 500, totalCount, itemSize, overscan);
      expect(result.start).toBe(0);
    });

    it('should clamp end to totalCount', () => {
      // scrollTop near the bottom
      const scrollTop = (totalCount - 5) * itemSize;
      const result = computeRange(scrollTop, 500, totalCount, itemSize, overscan);
      expect(result.end).toBe(totalCount);
      expect(result.offsetAfter).toBe(0);
    });

    it('should compute correct totalSize', () => {
      const result = computeRange(0, 500, totalCount, itemSize, overscan);
      expect(result.totalSize).toBe(totalCount * itemSize);
    });

    it('should compute correct offsetAfter', () => {
      const result = computeRange(0, 500, totalCount, itemSize, overscan);
      expect(result.offsetAfter).toBe((totalCount - result.end) * itemSize);
    });

    it('should handle small list that fits entirely in viewport', () => {
      const result = computeRange(0, 500, 3, itemSize, overscan);
      expect(result.start).toBe(0);
      expect(result.end).toBe(3);
      expect(result.offsetBefore).toBe(0);
      expect(result.offsetAfter).toBe(0);
    });
  });

  describe('function estimateSize', () => {
    it('should handle variable item heights', () => {
      // First item is 100px, rest are 48px
      const estimateSize = (i: number) => (i === 0 ? 100 : 48);
      const totalCount = 100;

      const result = computeRange(0, 500, totalCount, estimateSize, 2);
      expect(result.start).toBe(0);
      // 100 + 48*N >= 500 → N >= 8.33 → end = 9 or 10 items + 2 overscan
      expect(result.end).toBeGreaterThan(8);
      expect(result.totalSize).toBe(100 + 99 * 48);
    });

    it('should handle scroll offset with variable heights', () => {
      const estimateSize = (i: number) => (i < 10 ? 100 : 48);
      const totalCount = 100;

      // Scroll past the tall items: 10 * 100 = 1000
      const result = computeRange(1000, 500, totalCount, estimateSize, 2);
      expect(result.start).toBeLessThanOrEqual(10);
      expect(result.end).toBeGreaterThan(10);
    });
  });

  describe('overscan', () => {
    it('should respect overscan=0', () => {
      const result = computeRange(480, 480, 100, 48, 0);
      // floor(480/48) = 10, ceil(960/48) = 20
      expect(result.start).toBe(10);
      expect(result.end).toBe(20);
    });

    it('should handle large overscan without exceeding bounds', () => {
      const result = computeRange(0, 500, 10, 48, 100);
      expect(result.start).toBe(0);
      expect(result.end).toBe(10);
    });
  });

  describe('grid mode (columns > 1)', () => {
    const rowHeight = 100;
    const columns = 4;
    const overscan = 5;
    const totalCount = 100; // 25 rows

    it('should compute row-aligned range at scrollTop=0', () => {
      const result = computeRange(0, 500, totalCount, rowHeight, overscan, columns);
      // 5 visible rows (500/100), overscanRows = ceil(5/4) = 2
      // startRow = max(0, 0-2) = 0, endRow = min(25, 5+2) = 7
      expect(result.start).toBe(0);
      expect(result.end).toBe(28); // 7 rows * 4 columns
      expect(result.offsetBefore).toBe(0);
      expect(result.totalSize).toBe(25 * rowHeight);
    });

    it('should snap start and end to row boundaries', () => {
      // scrollTop=250 → rawStartRow = floor(250/100) = 2, rawEndRow = ceil(750/100) = 8
      const result = computeRange(250, 500, totalCount, rowHeight, overscan, columns);
      // startRow = max(0, 2-2) = 0, endRow = min(25, 8+2) = 10
      expect(result.start % columns).toBe(0);
      // end may not be a multiple if clamped to totalCount, but here 10*4=40 < 100
      expect(result.end % columns).toBe(0);
    });

    it('should apply overscan after row alignment', () => {
      // scrollTop=500 → rawStartRow=5, rawEndRow=10
      const result = computeRange(500, 500, totalCount, rowHeight, overscan, columns);
      // overscanRows = 2
      // startRow = 5-2 = 3, endRow = 10+2 = 12
      expect(result.start).toBe(12); // row 3 * 4
      expect(result.end).toBe(48); // row 12 * 4
    });

    it('should clamp end to totalCount for partial last row', () => {
      // 13 items = 4 rows (last row has 1 item), near bottom
      const result = computeRange(300, 500, 13, rowHeight, 0, columns);
      expect(result.end).toBe(13); // not rounded up to 16
    });

    it('should compute correct totalSize based on rows', () => {
      const result = computeRange(0, 500, totalCount, rowHeight, overscan, columns);
      expect(result.totalSize).toBe(Math.ceil(totalCount / columns) * rowHeight);
    });

    it('should compute correct offsetBefore and offsetAfter', () => {
      const result = computeRange(500, 500, totalCount, rowHeight, overscan, columns);
      // startRow = 3, offsetBefore = 3 * 100 = 300
      expect(result.offsetBefore).toBe(3 * rowHeight);
      // endRow = 12, totalRows = 25, offsetAfter = (25-12) * 100 = 1300
      expect(result.offsetAfter).toBe((25 - 12) * rowHeight);
    });

    it('should handle small grid that fits entirely in viewport', () => {
      const result = computeRange(0, 500, 8, rowHeight, overscan, columns);
      // 2 rows fit in 500px, all visible
      expect(result.start).toBe(0);
      expect(result.end).toBe(8);
      expect(result.offsetBefore).toBe(0);
      expect(result.offsetAfter).toBe(0);
    });

    it('should ignore columns for variable estimateSize', () => {
      const varSize = (i: number) => (i < 10 ? 100 : 50);
      const result = computeRange(0, 500, 50, varSize, 5, columns);
      // Should behave like list mode — start not necessarily row-aligned
      expect(result.start).toBe(0);
    });
  });

  describe('totalCount changes', () => {
    it('should handle totalCount increase (infinite scroll)', () => {
      const r1 = computeRange(0, 500, 50, 48, 5);
      const r2 = computeRange(0, 500, 100, 48, 5);
      // Same visible range, but totalSize differs
      expect(r1.start).toBe(r2.start);
      expect(r1.end).toBe(r2.end);
      expect(r2.totalSize).toBe(r1.totalSize * 2);
    });

    it('should handle totalCount decrease (filter)', () => {
      const result = computeRange(4800, 500, 50, 48, 5);
      // After filter, end is clamped to new totalCount
      expect(result.end).toBe(50);
    });
  });
});
