import { effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';

import { createLatencyProbe, type CngxLatencyProbe } from './latency-probe';

describe('createLatencyProbe', () => {
  /**
   * A fake clock: a plain counter advanced explicitly per edge, so the measured
   * durations are deterministic without mixing `vi.useFakeTimers()` with the
   * real `performance.now()`.
   */
  function fakeClock(start = 0) {
    let value = start;
    return {
      now: () => value,
      advance: (ms: number) => {
        value += ms;
      },
      set: (v: number) => {
        value = v;
      },
    };
  }

  function setup(clock = fakeClock()) {
    const busy = signal(false);
    let probe!: CngxLatencyProbe;
    TestBed.runInInjectionContext(() => {
      probe = createLatencyProbe(() => busy(), clock.now);
    });
    TestBed.flushEffects();
    return { busy, probe, clock };
  }

  it('lastDuration is undefined before the first completed window', () => {
    const { probe } = setup();
    expect(probe.lastDuration()).toBeUndefined();
  });

  it('isBusy mirrors the source', () => {
    const { busy, probe } = setup();
    expect(probe.isBusy()).toBe(false);
    busy.set(true);
    expect(probe.isBusy()).toBe(true);
    busy.set(false);
    expect(probe.isBusy()).toBe(false);
  });

  it('records a small duration for a fast window', () => {
    const { busy, probe, clock } = setup();

    busy.set(true);
    TestBed.flushEffects();
    clock.advance(30);
    busy.set(false);
    TestBed.flushEffects();

    expect(probe.lastDuration()).toBe(30);
  });

  it('records a large duration for a slow window', () => {
    const { busy, probe, clock } = setup();

    busy.set(true);
    TestBed.flushEffects();
    clock.advance(1500);
    busy.set(false);
    TestBed.flushEffects();

    expect(probe.lastDuration()).toBe(1500);
  });

  it('keeps a single envelope when a concurrent op re-enters mid-window', () => {
    // Aggregate busy source: stays busy across a fast then a slow overlap.
    // The envelope spans first false->true to last true->false, not per-op.
    const { busy, probe, clock } = setup();

    busy.set(true); // envelope opens
    TestBed.flushEffects();
    clock.advance(100); // a second op starts while still busy (source stays true)
    // busy remains true - no edge, no new envelope
    TestBed.flushEffects();
    clock.advance(400); // both finish
    busy.set(false); // envelope closes
    TestBed.flushEffects();

    expect(probe.lastDuration()).toBe(500);
  });

  it('measures each subsequent window independently', () => {
    const { busy, probe, clock } = setup();

    busy.set(true);
    TestBed.flushEffects();
    clock.advance(20);
    busy.set(false);
    TestBed.flushEffects();
    expect(probe.lastDuration()).toBe(20);

    busy.set(true);
    TestBed.flushEffects();
    clock.advance(900);
    busy.set(false);
    TestBed.flushEffects();
    expect(probe.lastDuration()).toBe(900);
  });

  it('stamps the duration at the busy edge, read-independently (late-read accuracy)', () => {
    // Regression guard against a pull-based fold: the value must be the edge
    // duration even when read only after an intervening no-op cycle, not a
    // read-time-influenced value.
    const { busy, probe, clock } = setup();

    busy.set(true);
    TestBed.flushEffects();
    clock.advance(250);
    busy.set(false);
    TestBed.flushEffects();

    // Intervening cycles with the clock advancing further, but no busy edge.
    clock.advance(5000);
    TestBed.flushEffects();
    clock.advance(5000);
    TestBed.flushEffects();

    expect(probe.lastDuration()).toBe(250);
  });

  it('measures once per envelope and never loops (write-count across redundant flushes)', () => {
    const clock = fakeClock();
    const busy = signal(false);
    const observed: (number | undefined)[] = [];
    let probe!: CngxLatencyProbe;

    TestBed.runInInjectionContext(() => {
      probe = createLatencyProbe(() => busy(), clock.now);
      // Records every distinct lastDuration value; this effect only re-runs when
      // lastDuration actually changes, so its length tracks the write count.
      effect(() => {
        observed.push(probe.lastDuration());
      });
    });
    TestBed.flushEffects();

    busy.set(true);
    TestBed.flushEffects();
    clock.advance(300);
    busy.set(false);
    TestBed.flushEffects();

    // Redundant flushes must not re-measure.
    TestBed.flushEffects();
    TestBed.flushEffects();

    // [undefined, 300] => exactly one write.
    expect(observed).toEqual([undefined, 300]);

    // Re-setting busy to its current value must not re-measure either.
    busy.set(false);
    TestBed.flushEffects();
    expect(observed).toEqual([undefined, 300]);
  });
});
