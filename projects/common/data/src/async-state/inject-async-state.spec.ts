import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { injectAsyncState, type ReactiveAsyncState } from './inject-async-state';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
} {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ---------------------------------------------------------------------------
// Host component — injectAsyncState must be called in injection context
// ---------------------------------------------------------------------------

@Component({ template: '' })
class Host {
  readonly filter = signal('initial');
  private readonly pending = signal<{
    promise: Promise<string>;
    resolve: (v: string) => void;
    reject: (e: unknown) => void;
  } | null>(null);

  /** Expose the deferred so the test can resolve/reject at will. */
  get current() {
    return this.pending();
  }

  readonly state: ReactiveAsyncState<string> = injectAsyncState(() => {
    this.filter(); // tracked signal — triggers re-query on change
    const d = deferred<string>();
    this.pending.set(d);
    return d.promise;
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('injectAsyncState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(): Host {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('starts in idle before debounce fires', () => {
    const host = setup();
    // Effect is scheduled but debounce has not elapsed
    expect(host.state.status()).toBe('idle');
  });

  it('auto-loads on creation (idle -> loading -> success)', async () => {
    const host = setup();
    TestBed.flushEffects();

    // Advance past debounce (50ms default)
    vi.advanceTimersByTime(50);
    expect(host.state.status()).toBe('loading');
    expect(host.state.isFirstLoad()).toBe(true);

    host.current!.resolve('result');
    await vi.runAllTimersAsync();

    expect(host.state.status()).toBe('success');
    expect(host.state.data()).toBe('result');
    expect(host.state.isFirstLoad()).toBe(false);
  });

  it('re-loads when signal dependency changes', async () => {
    const host = setup();
    TestBed.flushEffects();
    vi.advanceTimersByTime(50);
    host.current!.resolve('first');
    await vi.runAllTimersAsync();
    expect(host.state.data()).toBe('first');

    // Change filter — triggers re-load
    host.filter.set('updated');
    TestBed.flushEffects();
    vi.advanceTimersByTime(50);

    expect(host.state.status()).toBe('refreshing');

    host.current!.resolve('second');
    await vi.runAllTimersAsync();

    expect(host.state.status()).toBe('success');
    expect(host.state.data()).toBe('second');
  });

  it('debounces by default (50ms)', () => {
    const host = setup();
    TestBed.flushEffects();

    // At 30ms the query should not have started
    vi.advanceTimersByTime(30);
    expect(host.state.status()).toBe('idle');

    // At 50ms total the query should start
    vi.advanceTimersByTime(20);
    expect(host.state.status()).toBe('loading');
  });

  it('refresh() forces reload bypassing debounce', async () => {
    const host = setup();
    TestBed.flushEffects();
    vi.advanceTimersByTime(50);
    host.current!.resolve('initial');
    await vi.runAllTimersAsync();

    host.state.refresh();
    // refresh() calls executeQuery immediately — no debounce
    expect(host.state.status()).toBe('refreshing');

    host.current!.resolve('refreshed');
    await vi.runAllTimersAsync();

    expect(host.state.data()).toBe('refreshed');
  });

  it('first load is "loading", subsequent loads are "refreshing"', async () => {
    const host = setup();
    TestBed.flushEffects();
    vi.advanceTimersByTime(50);
    expect(host.state.status()).toBe('loading');

    host.current!.resolve('data');
    await vi.runAllTimersAsync();

    // Trigger another load
    host.filter.set('changed');
    TestBed.flushEffects();
    vi.advanceTimersByTime(50);
    expect(host.state.status()).toBe('refreshing');
  });

  it('cancels previous load when deps change before resolve', async () => {
    const host = setup();
    TestBed.flushEffects();
    vi.advanceTimersByTime(50);
    const firstDeferred = host.current!;
    expect(host.state.status()).toBe('loading');

    // Change dep before first resolves
    host.filter.set('new');
    TestBed.flushEffects();
    vi.advanceTimersByTime(50);
    const secondDeferred = host.current!;

    // Resolve the first — should be ignored (aborted)
    firstDeferred.resolve('stale');
    await vi.runAllTimersAsync();
    expect(host.state.data()).not.toBe('stale');

    // Resolve the second — should be accepted
    secondDeferred.resolve('fresh');
    await vi.runAllTimersAsync();
    expect(host.state.status()).toBe('success');
    expect(host.state.data()).toBe('fresh');
  });

  it('error handling sets error status', async () => {
    const host = setup();
    TestBed.flushEffects();
    vi.advanceTimersByTime(50);

    host.current!.reject(new Error('network failure'));
    await vi.runAllTimersAsync();

    expect(host.state.status()).toBe('error');
    expect(host.state.error()).toBeInstanceOf(Error);
    expect((host.state.error() as Error).message).toBe('network failure');
  });
});
