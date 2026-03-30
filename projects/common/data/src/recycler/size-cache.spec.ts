import { describe, expect, it } from 'vitest';

import { createSizeCache } from './size-cache';

describe('createSizeCache', () => {
  it('should return undefined for unmeasured indices', () => {
    const cache = createSizeCache();
    expect(cache.get(0)).toBeUndefined();
    expect(cache.get(99)).toBeUndefined();
  });

  it('should store and retrieve measured sizes', () => {
    const cache = createSizeCache();
    cache.set(0, 48);
    cache.set(5, 96);
    expect(cache.get(0)).toBe(48);
    expect(cache.get(5)).toBe(96);
  });

  it('should increment version on set', () => {
    const cache = createSizeCache();
    expect(cache.version()).toBe(0);
    cache.set(0, 48);
    expect(cache.version()).toBe(1);
    cache.set(1, 64);
    expect(cache.version()).toBe(2);
  });

  it('should not increment version when setting same value', () => {
    const cache = createSizeCache();
    cache.set(0, 48);
    expect(cache.version()).toBe(1);
    cache.set(0, 48);
    expect(cache.version()).toBe(1);
  });

  it('should resolve to measured value when available', () => {
    const cache = createSizeCache();
    cache.set(0, 72);
    expect(cache.resolve(0, 48)).toBe(72);
  });

  it('should resolve to fixed estimateSize when not measured', () => {
    const cache = createSizeCache();
    expect(cache.resolve(0, 48)).toBe(48);
  });

  it('should resolve to function estimateSize when not measured', () => {
    const cache = createSizeCache();
    expect(cache.resolve(0, (i) => (i === 0 ? 100 : 48))).toBe(100);
    expect(cache.resolve(5, (i) => (i === 0 ? 100 : 48))).toBe(48);
  });

  it('should track count of measured entries', () => {
    const cache = createSizeCache();
    expect(cache.count).toBe(0);
    cache.set(0, 48);
    cache.set(5, 96);
    expect(cache.count).toBe(2);
  });

  it('should clear all measurements', () => {
    const cache = createSizeCache();
    cache.set(0, 48);
    cache.set(1, 64);
    const vBefore = cache.version();
    cache.clear();
    expect(cache.count).toBe(0);
    expect(cache.get(0)).toBeUndefined();
    expect(cache.version()).toBe(vBefore + 1);
  });

  it('should not increment version on clear when already empty', () => {
    const cache = createSizeCache();
    const v = cache.version();
    cache.clear();
    expect(cache.version()).toBe(v);
  });
});
