import { describe, expect, it } from 'vitest';
import { createRingBuffer } from './ring-buffer';

describe('createRingBuffer', () => {
  it('fills up to capacity in push order', () => {
    const ring = createRingBuffer<number>(3);
    ring.push(1);
    ring.push(2);
    ring.push(3);
    expect(ring.length()).toBe(3);
    expect(ring.snapshot()).toEqual([1, 2, 3]);
  });

  it('wraps around keeping the last capacity values, newest last', () => {
    const ring = createRingBuffer<number>(3);
    for (let i = 1; i <= 8; i++) {
      ring.push(i); // capacity 3, push 8 values
    }
    expect(ring.length()).toBe(3);
    expect(ring.snapshot()).toEqual([6, 7, 8]);
  });

  it('clear() resets length without re-allocating, buffer stays usable', () => {
    const ring = createRingBuffer<number>(4);
    ring.push(1);
    ring.push(2);
    ring.clear();
    expect(ring.length()).toBe(0);
    expect(ring.snapshot()).toEqual([]);
    expect(ring.capacity).toBe(4);
    ring.push(9);
    expect(ring.snapshot()).toEqual([9]);
  });

  it('pushBatch larger than capacity keeps only the last N', () => {
    const ring = createRingBuffer<number>(3);
    ring.pushBatch([1, 2, 3, 4, 5, 6, 7]);
    expect(ring.length()).toBe(3);
    expect(ring.snapshot()).toEqual([5, 6, 7]);
  });

  it('snapshot() returns a fresh array on every call', () => {
    const ring = createRingBuffer<number>(3);
    ring.push(1);
    const a = ring.snapshot();
    const b = ring.snapshot();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  it('throws on a non-positive or non-integer capacity', () => {
    expect(() => createRingBuffer<number>(0)).toThrow();
    expect(() => createRingBuffer<number>(-1)).toThrow();
    expect(() => createRingBuffer<number>(2.5)).toThrow();
  });
});
