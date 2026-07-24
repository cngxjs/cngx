import { effect } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ChartBufferOptions, type CngxChartBuffer, injectChartBuffer } from './inject-chart-buffer';

const baseOpts: ChartBufferOptions<number> = {
  capacity: 5,
  xAccessor: (_d, i) => i,
  yAccessor: (d) => d,
};

function make(opts?: Partial<ChartBufferOptions<number>>): CngxChartBuffer<number> {
  return TestBed.runInInjectionContext(() => injectChartBuffer<number>({ ...baseOpts, ...opts }));
}

/** Count how many times `points` re-emits (the initial run counts as 1). */
function trackEmissions(buf: CngxChartBuffer<number>): () => number {
  let count = 0;
  TestBed.runInInjectionContext(() =>
    effect(() => {
      buf.points();
      count++;
    }),
  );
  TestBed.flushEffects();
  return () => count;
}

/** Advance a single animation frame so a scheduled flush runs. */
function flushFrame(): void {
  vi.advanceTimersByTime(16);
  TestBed.flushEffects();
}

beforeEach(() => {
  vi.useFakeTimers();
  TestBed.configureTestingModule({});
});

afterEach(() => {
  vi.useRealTimers();
  TestBed.resetTestingModule();
});

describe('injectChartBuffer', () => {
  it('seeds an empty window before any push', () => {
    const buf = make();
    expect(buf.points()).toEqual([]);
    expect(buf.length()).toBe(0);
    expect(buf.pendingFlush()).toBe(false);
  });

  it('coalesces many same-frame pushes into one emission', () => {
    const buf = make();
    const emissions = trackEmissions(buf);
    expect(emissions()).toBe(1); // initial run, empty window

    buf.push(1);
    buf.push(2);
    buf.push(3);
    expect(buf.pendingFlush()).toBe(true);
    TestBed.flushEffects();
    expect(emissions()).toBe(1); // nothing emitted before the frame

    flushFrame();
    expect(emissions()).toBe(2); // single coalesced re-emission
    expect(buf.points()).toEqual([1, 2, 3]);
    expect(buf.pendingFlush()).toBe(false);
  });

  it('caps the window at capacity on wraparound', () => {
    const buf = make({ capacity: 3 });
    buf.pushBatch([1, 2, 3, 4, 5]);
    flushFrame();
    expect(buf.length()).toBe(3);
    expect(buf.points()).toEqual([3, 4, 5]);
  });

  it('clears within the next frame, coalesced', () => {
    const buf = make();
    buf.pushBatch([1, 2, 3]);
    flushFrame();
    expect(buf.points()).toEqual([1, 2, 3]);

    buf.clear();
    expect(buf.points()).toEqual([1, 2, 3]); // still the old window until the frame
    flushFrame();
    expect(buf.points()).toEqual([]);
  });

  it('downsamples when downsampleTo is below the window length', () => {
    const buf = make({ capacity: 100, downsampleTo: 5 });
    buf.pushBatch(Array.from({ length: 50 }, (_, i) => i));
    flushFrame();
    expect(buf.points().length).toBe(5);
  });

  it('returns the window unchanged when downsampleTo is not below the length', () => {
    const buf = make({ capacity: 100, downsampleTo: 50 });
    buf.pushBatch([1, 2, 3]);
    flushFrame();
    expect(buf.points()).toEqual([1, 2, 3]);
  });

  it('short-circuits a clear-then-identical-refill but re-emits a genuine append', () => {
    const buf = make({ capacity: 10 });
    const emissions = trackEmissions(buf);

    buf.pushBatch([1, 2, 3]);
    flushFrame();
    const afterFirst = emissions();
    expect(buf.points()).toEqual([1, 2, 3]);

    buf.clear();
    buf.pushBatch([1, 2, 3]); // same rows, same order, in one frame
    flushFrame();
    expect(emissions()).toBe(afterFirst); // element-wise-equal -> no cascade

    buf.push(4); // genuinely new row grows the window
    flushFrame();
    expect(emissions()).toBe(afterFirst + 1);
    expect(buf.points()).toEqual([1, 2, 3, 4]);
  });

  it('short-circuits a downsample that reselects the identical point set', () => {
    const buf = make({ capacity: 100, downsampleTo: 5 });
    const emissions = trackEmissions(buf);
    const seq = Array.from({ length: 40 }, (_, i) => i * i);

    buf.pushBatch(seq);
    flushFrame();
    const afterFirst = emissions();

    buf.clear();
    buf.pushBatch(seq); // identical input downsamples to the identical selection
    flushFrame();
    expect(emissions()).toBe(afterFirst); // downsample guard short-circuits too
  });
});
