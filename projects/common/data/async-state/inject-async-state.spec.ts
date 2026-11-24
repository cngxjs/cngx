import { Component, signal } from '@angular/core';
import { EMPTY, Subject, of, throwError, type Observable } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
// Host component - injectAsyncState must be called in injection context
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
    this.filter(); // tracked signal - triggers re-query on change
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

    // Change filter - triggers re-load
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
    // refresh() calls executeQuery immediately - no debounce
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

    // Resolve the first - should be ignored (aborted)
    firstDeferred.resolve('stale');
    await vi.runAllTimersAsync();
    expect(host.state.data()).not.toBe('stale');

    // Resolve the second - should be accepted
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

  it('a superseded capture that rejects never surfaces as unhandled', async () => {
    const host = setup();
    TestBed.flushEffects();
    const firstDeferred = host.current!;

    // Second dependency change within the debounce window supersedes the
    // first capture before the timer ever consumes it.
    host.filter.set('changed');
    TestBed.flushEffects();
    const secondDeferred = host.current!;

    // The superseded promise rejects; without the pre-attached no-op catch
    // this would blow up as an unhandled rejection and fail the test run.
    firstDeferred.reject(new Error('superseded failure'));
    vi.advanceTimersByTime(50);
    secondDeferred.resolve('fresh');
    await vi.runAllTimersAsync();

    expect(host.state.status()).toBe('success');
    expect(host.state.data()).toBe('fresh');
  });

  describe('stream and refresh premises', () => {
    it('follows every emission of an Observable fn and stays subscribed until destroy', async () => {
      const source = new Subject<string>();
      @Component({ template: '' })
      class StreamHost {
        readonly state = injectAsyncState(() => source);
      }
      TestBed.configureTestingModule({ imports: [StreamHost] });
      const fixture = TestBed.createComponent(StreamHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      vi.advanceTimersByTime(50);

      source.next('one');
      source.next('two');
      expect(fixture.componentInstance.state.data()).toBe('two');
      expect(source.observed).toBe(true);

      fixture.destroy();
      expect(source.observed).toBe(false);
    });

    it('a synchronous throw of fn in refresh() escapes and leaves the status loading', () => {
      let shouldThrow = false;
      @Component({ template: '' })
      class ThrowHost {
        readonly state = injectAsyncState<string>(() => {
          if (shouldThrow) {
            throw new Error('sync');
          }
          return new Promise<string>(() => undefined);
        });
      }
      TestBed.configureTestingModule({ imports: [ThrowHost] });
      const fixture = TestBed.createComponent(ThrowHost);
      fixture.detectChanges();
      const state = fixture.componentInstance.state;

      shouldThrow = true;
      expect(() => state.refresh()).toThrow('sync');
      expect(state.status()).toBe('loading');
    });
  });

  describe('Observable fn and lifetime', () => {
    function streamHost<T>(fn: () => Observable<T>) {
      @Component({ template: '' })
      class ObsHost {
        readonly dep = signal(0);
        readonly state = injectAsyncState<T>(() => {
          this.dep();
          return fn();
        });
      }
      TestBed.configureTestingModule({ imports: [ObsHost] });
      const fixture = TestBed.createComponent(ObsHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      vi.advanceTimersByTime(50);
      return fixture;
    }

    it('settles an Observable fn with its value and an erroring one with its error', () => {
      expect(streamHost(() => of('v')).componentInstance.state.data()).toBe('v');
      TestBed.resetTestingModule();
      const failed = streamHost(() => throwError(() => new Error('te'))).componentInstance.state;
      expect(failed.status()).toBe('error');
      expect((failed.error() as Error).message).toBe('te');
    });

    it('an EMPTY fn settles success with undefined data', () => {
      const state = streamHost(() => EMPTY).componentInstance.state;
      expect(state.status()).toBe('success');
      expect(state.data()).toBeUndefined();
    });

    it('destroy mid-flight unsubscribes the source', () => {
      const source = new Subject<string>();
      const fixture = streamHost(() => source);
      expect(source.observed).toBe(true);
      fixture.destroy();
      expect(source.observed).toBe(false);
    });

    it('a dependency change unsubscribes the superseded Observable', () => {
      const sources: Subject<string>[] = [];
      const fixture = streamHost(() => {
        const s = new Subject<string>();
        sources.push(s);
        return s;
      });
      fixture.componentInstance.dep.set(1);
      TestBed.flushEffects();
      vi.advanceTimersByTime(50);
      expect(sources[0].observed).toBe(false);
      expect(sources.at(-1)?.observed).toBe(true);
    });

    it('refresh() after destroy never calls fn', () => {
      const fn = vi.fn(() => new Subject<string>());
      const fixture = streamHost(fn);
      const state = fixture.componentInstance.state;
      fixture.destroy();
      fn.mockClear();
      state.refresh();
      expect(fn).not.toHaveBeenCalled();
      expect(state.status()).toBe('loading');
    });

    it('a synchronous throw in the effect path settles error after the debounce', () => {
      @Component({ template: '' })
      class ThrowingHost {
        readonly state = injectAsyncState<string>(() => {
          throw new Error('effect-sync');
        });
      }
      TestBed.configureTestingModule({ imports: [ThrowingHost] });
      const fixture = TestBed.createComponent(ThrowingHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(fixture.componentInstance.state.status()).toBe('idle');
      vi.advanceTimersByTime(50);
      expect(fixture.componentInstance.state.status()).toBe('error');
    });
  });
});
