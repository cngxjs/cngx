import type { DestroyRef } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { createTouchFloorSignal, type TouchFloorHost } from './touch-floor';

interface FakeWindow {
  readonly win: TouchFloorHost;
  /** Delivers one resize entry to the observer. */
  resize(): void;
  /** Flips the coarse-pointer media query. */
  setCoarse(matches: boolean): void;
  /** The value `getComputedStyle(host).getPropertyValue('--cngx-target-min')` returns. */
  floor: string;
  reads: number;
}

function fakeWindow(coarse = false): FakeWindow {
  let observerCallback: ResizeObserverCallback | null = null;
  const mediaListeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = coarse;

  class FakeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      observerCallback = callback;
    }
    observe(): void {
      /* entries are delivered by resize() */
    }
    unobserve(): void {
      /* not used */
    }
    disconnect(): void {
      observerCallback = null;
    }
  }

  const state: FakeWindow = {
    floor: '',
    reads: 0,
    win: {
      ResizeObserver: FakeResizeObserver as unknown as typeof ResizeObserver,
      matchMedia: (query: string) =>
        ({
          get matches() {
            return matches;
          },
          media: query,
          addEventListener: (_: string, fn: (event: MediaQueryListEvent) => void) =>
            mediaListeners.add(fn),
          removeEventListener: (_: string, fn: (event: MediaQueryListEvent) => void) =>
            mediaListeners.delete(fn),
        }) as unknown as MediaQueryList,
      getComputedStyle: (() => {
        state.reads++;
        return { getPropertyValue: () => state.floor } as unknown as CSSStyleDeclaration;
      }) as Window['getComputedStyle'],
    },
    resize: () => {
      observerCallback?.([{} as ResizeObserverEntry], {} as ResizeObserver);
    },
    setCoarse: (next: boolean) => {
      matches = next;
      for (const fn of mediaListeners) {
        fn({ matches: next } as MediaQueryListEvent);
      }
    },
  };
  return state;
}

function fakeDestroyRef(): DestroyRef & { destroy(): void } {
  const callbacks: (() => void)[] = [];
  return {
    onDestroy: (fn: () => void) => {
      callbacks.push(fn);
      return () => undefined;
    },
    destroyed: false,
    destroy: () => callbacks.forEach((fn) => fn()),
  } as unknown as DestroyRef & { destroy(): void };
}

const host = {} as Element;

describe('createTouchFloorSignal', () => {
  it('falls back to the coarse-pointer query before the first resize entry', () => {
    const coarse = fakeWindow(true);
    expect(createTouchFloorSignal(host, fakeDestroyRef(), coarse.win)()).toBe(true);
    expect(coarse.reads).toBe(0);

    const fine = fakeWindow(false);
    expect(createTouchFloorSignal(host, fakeDestroyRef(), fine.win)()).toBe(false);
  });

  it('is false without layout or media support (SSR, jsdom)', () => {
    expect(createTouchFloorSignal(host, fakeDestroyRef(), null)()).toBe(false);
    expect(createTouchFloorSignal(host, fakeDestroyRef(), {})()).toBe(false);
  });

  it('reads the resolved floor once a resize entry has arrived', () => {
    const fake = fakeWindow(true);
    const active = createTouchFloorSignal(host, fakeDestroyRef(), fake.win);

    fake.floor = '44px';
    fake.resize();
    expect(active()).toBe(true);

    fake.floor = '0px';
    fake.resize();
    expect(active()).toBe(false);

    fake.floor = '';
    fake.resize();
    expect(active()).toBe(false);
  });

  it('lets the resolved floor win over the media query once observed', () => {
    const fake = fakeWindow(true);
    const active = createTouchFloorSignal(host, fakeDestroyRef(), fake.win);
    fake.floor = '0px';
    fake.resize();
    // A coarse pointer under a `data-touch="off"` island: no floor, no summary.
    expect(active()).toBe(false);
  });

  it('re-reads the floor when the coarse-pointer query flips', () => {
    const fake = fakeWindow(false);
    const active = createTouchFloorSignal(host, fakeDestroyRef(), fake.win);
    fake.floor = '0px';
    fake.resize();
    expect(active()).toBe(false);

    fake.floor = '44px';
    fake.setCoarse(true);
    expect(active()).toBe(true);
  });

  it('keeps one value for identical re-reads and does not re-read without a trigger', () => {
    const fake = fakeWindow(false);
    const active = createTouchFloorSignal(host, fakeDestroyRef(), fake.win);
    fake.floor = '44px';
    fake.resize();
    expect(active()).toBe(true);
    const reads = fake.reads;
    expect(active()).toBe(true);
    expect(active()).toBe(true);
    expect(fake.reads).toBe(reads);
  });

  it('stops observing once the scope is destroyed', () => {
    const fake = fakeWindow(false);
    const destroyRef = fakeDestroyRef();
    const active = createTouchFloorSignal(host, destroyRef, fake.win);
    fake.floor = '0px';
    fake.resize();
    expect(active()).toBe(false);

    destroyRef.destroy();
    fake.floor = '44px';
    fake.resize();
    fake.setCoarse(true);
    expect(active()).toBe(false);
  });
});
