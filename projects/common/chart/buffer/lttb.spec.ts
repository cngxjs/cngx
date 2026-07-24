import { describe, expect, it } from 'vitest';
import { downsampleLTTB } from './lttb';

const xIdx = (_d: number, i: number): number => i;
const yVal = (d: number): number => d;

describe('downsampleLTTB', () => {
  it('returns the input unchanged when the target is not below the length', () => {
    const data = [1, 2, 3];
    expect(downsampleLTTB(data, 5, xIdx, yVal)).toBe(data);
    expect(downsampleLTTB(data, 3, xIdx, yVal)).toBe(data);
  });

  it('preserves the first and last points', () => {
    const data = Array.from({ length: 50 }, (_, i) => Math.sin(i));
    const out = downsampleLTTB(data, 10, xIdx, yVal);
    expect(out[0]).toBe(data[0]);
    expect(out[out.length - 1]).toBe(data[data.length - 1]);
  });

  it('emits exactly targetSize points', () => {
    const data = Array.from({ length: 100 }, (_, i) => i * 1.3);
    expect(downsampleLTTB(data, 20, xIdx, yVal).length).toBe(20);
    expect(downsampleLTTB(data, 3, xIdx, yVal).length).toBe(3);
  });

  it('preserves monotonicity on monotone input', () => {
    const data = Array.from({ length: 200 }, (_, i) => i * 2);
    const out = downsampleLTTB(data, 25, xIdx, yVal);
    for (let i = 1; i < out.length; i++) {
      expect(out[i]).toBeGreaterThan(out[i - 1]);
    }
  });

  it('keeps a true peak that naive uniform sampling drops', () => {
    const n = 100;
    const target = 10;
    const data = Array.from({ length: n }, () => 0);
    data[37] = 1000; // a single sharp spike

    // Naive every-Nth sampling: the spike falls between sample indices.
    const step = (n - 1) / (target - 1);
    const uniform = Array.from({ length: target }, (_, i) => data[Math.round(i * step)]);
    expect(uniform).not.toContain(1000);

    const lttb = downsampleLTTB(data, target, xIdx, yVal);
    expect(lttb).toContain(1000);
  });
});
