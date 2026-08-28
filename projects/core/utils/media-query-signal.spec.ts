import type { DestroyRef } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { createMediaQuerySignal, observeMediaQuery } from './media-query-signal';

interface FakeMql {
  matches: boolean;
  fire: (matches: boolean) => void;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

function fakeHost(initialMatches: boolean) {
  const queries: string[] = [];
  const mqls = new Map<string, FakeMql>();

  return {
    queries,
    mqlFor: (query: string) => mqls.get(query),
    matchMedia: (query: string): MediaQueryList => {
      queries.push(query);
      const listeners = new Set<(e: MediaQueryListEvent) => void>();
      const mql: FakeMql = {
        matches: initialMatches,
        fire(matches: boolean) {
          mql.matches = matches;
          for (const cb of listeners) {
            cb({ matches } as MediaQueryListEvent);
          }
        },
        addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
          listeners.add(cb);
        }),
        removeEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
          listeners.delete(cb);
        }),
      };
      mqls.set(query, mql);
      return mql as unknown as MediaQueryList;
    },
  };
}

function fakeDestroyRef() {
  const callbacks: Array<() => void> = [];
  return {
    destroy: () => callbacks.forEach((cb) => cb()),
    ref: {
      onDestroy(cb: () => void) {
        callbacks.push(cb);
        return () => {};
      },
    } as DestroyRef,
  };
}

describe('observeMediaQuery', () => {
  it('seeds apply synchronously and re-applies on change events', () => {
    const host = fakeHost(true);
    const apply = vi.fn();

    observeMediaQuery(host, '(max-width: 640px)', apply);

    expect(host.queries).toEqual(['(max-width: 640px)']);
    expect(apply).toHaveBeenCalledWith(true);

    host.mqlFor('(max-width: 640px)')!.fire(false);
    expect(apply).toHaveBeenLastCalledWith(false);
  });

  it('returns a teardown that removes the listener', () => {
    const host = fakeHost(false);
    const apply = vi.fn();

    const unsubscribe = observeMediaQuery(host, '(max-width: 640px)', apply);
    unsubscribe();

    const mql = host.mqlFor('(max-width: 640px)')!;
    expect(mql.removeEventListener).toHaveBeenCalled();
    mql.fire(true);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('wires nothing on a host without matchMedia', () => {
    const apply = vi.fn();
    const unsubscribe = observeMediaQuery({}, '(max-width: 640px)', apply);
    expect(apply).not.toHaveBeenCalled();
    expect(() => unsubscribe()).not.toThrow();
  });

  it('wires nothing on a null host', () => {
    const apply = vi.fn();
    expect(() => observeMediaQuery(null, '(max-width: 640px)', apply)()).not.toThrow();
    expect(apply).not.toHaveBeenCalled();
  });
});

describe('createMediaQuerySignal', () => {
  it('seeds the signal from the current match state', () => {
    const host = fakeHost(true);
    const { ref } = fakeDestroyRef();
    const matches = createMediaQuerySignal('(max-width: 640px)', ref, host);
    expect(matches()).toBe(true);
  });

  it('updates the signal on change events', () => {
    const host = fakeHost(false);
    const { ref } = fakeDestroyRef();
    const matches = createMediaQuerySignal('(max-width: 640px)', ref, host);

    expect(matches()).toBe(false);
    host.mqlFor('(max-width: 640px)')!.fire(true);
    expect(matches()).toBe(true);
  });

  it('stays false without matchMedia (SSR guard)', () => {
    const { ref } = fakeDestroyRef();
    const matches = createMediaQuerySignal('(max-width: 640px)', ref, null);
    expect(matches()).toBe(false);
  });

  it('removes the listener when the destroy scope tears down', () => {
    const host = fakeHost(false);
    const { ref, destroy } = fakeDestroyRef();
    const matches = createMediaQuerySignal('(max-width: 640px)', ref, host);

    destroy();
    host.mqlFor('(max-width: 640px)')!.fire(true);

    expect(matches()).toBe(false);
    expect(host.mqlFor('(max-width: 640px)')!.removeEventListener).toHaveBeenCalled();
  });
});
