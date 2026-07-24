import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { createManualState } from '../async-state/create-manual-state';
import { CngxAsyncRegistry } from './async-registry';
import { injectLatencyProbe } from './inject-latency-probe';
import { provideAsyncRegistry } from './provide-async-registry';

describe('injectLatencyProbe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Stub the monotonic clock the bridge probe reads by default. */
  function stubClock(start = 0) {
    let value = start;
    vi.spyOn(performance, 'now').mockImplementation(() => value);
    return { advance: (ms: number) => (value += ms) };
  }

  it('reflects the registry busy-envelope when the registry is provided', () => {
    const clock = stubClock();
    TestBed.configureTestingModule({ providers: [provideAsyncRegistry()] });
    const registry = TestBed.inject(CngxAsyncRegistry);
    const op = createManualState<number>();
    registry.register(op, 'op');

    const probe = TestBed.runInInjectionContext(() => injectLatencyProbe());
    TestBed.flushEffects();

    expect(probe.isBusy()).toBe(false);
    expect(probe.lastDuration()).toBeUndefined();

    op.set('loading'); // busy-envelope opens
    TestBed.flushEffects();
    expect(probe.isBusy()).toBe(true);

    clock.advance(450);
    op.setSuccess(1); // busy-envelope closes
    TestBed.flushEffects();

    expect(probe.isBusy()).toBe(false);
    expect(probe.lastDuration()).toBe(450);
  });

  it('spans concurrent operations as one envelope', () => {
    const clock = stubClock();
    TestBed.configureTestingModule({ providers: [provideAsyncRegistry()] });
    const registry = TestBed.inject(CngxAsyncRegistry);
    const a = createManualState<number>();
    const b = createManualState<number>();
    registry.register(a, 'a');
    registry.register(b, 'b');

    const probe = TestBed.runInInjectionContext(() => injectLatencyProbe());
    TestBed.flushEffects();

    a.set('loading'); // envelope opens
    TestBed.flushEffects();
    clock.advance(100);
    b.set('loading'); // still busy, no new envelope
    TestBed.flushEffects();
    clock.advance(200);
    a.setSuccess(1); // still busy through b
    TestBed.flushEffects();
    expect(probe.isBusy()).toBe(true);
    clock.advance(300);
    b.setSuccess(2); // envelope closes
    TestBed.flushEffects();

    expect(probe.lastDuration()).toBe(600);
  });

  it('is never busy and never throws when the registry is absent', () => {
    stubClock();
    const probe = TestBed.runInInjectionContext(() => injectLatencyProbe());
    TestBed.flushEffects();

    expect(probe.isBusy()).toBe(false);
    expect(probe.lastDuration()).toBeUndefined();
  });
});
