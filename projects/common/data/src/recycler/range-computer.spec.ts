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
