import { effect, provideZonelessChangeDetection, untracked } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createResizeObserverMock } from '@cngx/testing';

import { injectRecycler, type CngxRecycler } from './recycler';

// Reproduces the windowed data-availability load wiring the demo documents
// (examples/stories/common/data/recycler/windowed-data-availability.story.ts) and
// promotes its loop-safety property to a CI gate: one tracked neededRange() read,
// all dispatch inside untracked(), plain non-reactive Sets for dedup.

const SERVER_TOTAL = 10_000;
const PAGE_SIZE = 100;
const LATENCY = 400;
// A viewport of clientHeight/estimateSize + 2*overscan rows is 21 rows here, so
// a window straddles at most two 100-row pages.
const PAGES_PER_WINDOW = 2;

interface LoadState {
  readonly loadedPages: Set<number>;
  readonly inFlightPages: Set<number>;
  readonly dispatchCounts: Map<number, number>;
  maxInFlight: number;
}

function createHarness(container: HTMLElement): { recycler: CngxRecycler; state: LoadState } {
  const state: LoadState = {
    loadedPages: new Set<number>(),
    inFlightPages: new Set<number>(),
    dispatchCounts: new Map<number, number>(),
    maxInFlight: 0,
  };
  let recycler!: CngxRecycler;
  TestBed.runInInjectionContext(() => {
    recycler = injectRecycler({
      scrollElement: container,
      totalCount: () => SERVER_TOTAL,
      estimateSize: 56,
      overscan: 6,
    });
    effect(() => {
      const { start, end } = recycler.neededRange();
      untracked(() => {
        const firstPage = Math.floor(start / PAGE_SIZE);
        const lastPage = Math.floor((end - 1) / PAGE_SIZE);
        for (let page = firstPage; page <= lastPage; page++) {
          if (page < 0 || state.loadedPages.has(page) || state.inFlightPages.has(page)) {
            continue;
          }
          state.dispatchCounts.set(page, (state.dispatchCounts.get(page) ?? 0) + 1);
          state.inFlightPages.add(page);
          state.maxInFlight = Math.max(state.maxInFlight, state.inFlightPages.size);
          setTimeout(() => {
            state.inFlightPages.delete(page);
            state.loadedPages.add(page);
          }, LATENCY);
        }
      });
    });
  });
  TestBed.flushEffects();
  return { recycler, state };
}

function scrollTo(container: HTMLElement, top: number): void {
  container.scrollTop = top;
  container.dispatchEvent(new Event('scroll'));
  TestBed.flushEffects();
}

describe('windowed data-availability load pattern', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    createResizeObserverMock().install(window);
    vi.useFakeTimers();
    container = document.createElement('div');
    Object.defineProperty(container, 'scrollTop', { value: 0, writable: true, configurable: true });
    Object.defineProperty(container, 'clientHeight', {
      value: 500,
      writable: true,
      configurable: true,
    });
    container.scrollTo = vi.fn() as unknown as typeof container.scrollTo;
    document.body.appendChild(container);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => {
    container.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps in-flight bounded and dispatches each page at most once across a fling', () => {
    const { recycler, state } = createHarness(container);
    expect(recycler.end()).toBeGreaterThan(0);

    // Teleport across distinct windows, then revisit already-loaded regions;
    // loads resolve between steps (the recycler keeps up).
    const flingOffsets = [0, 50_000, 150_000, 300_000, 450_000, 550_000, 150_000, 0];
    for (const top of flingOffsets) {
      scrollTo(container, top);
      vi.advanceTimersByTime(LATENCY);
      TestBed.flushEffects();
    }

    expect(state.maxInFlight).toBeLessThanOrEqual(PAGES_PER_WINDOW);
    // Dedup held across re-fires AND revisits to loaded regions.
    expect([...state.dispatchCounts.values()].every((count) => count === 1)).toBe(true);
    expect(state.inFlightPages.size).toBe(0);
  });

  it('settles: a re-fire at an unchanged position dispatches nothing new', () => {
    const { state } = createHarness(container);
    scrollTo(container, 300_000);
    vi.advanceTimersByTime(LATENCY);
    TestBed.flushEffects();
    const pagesAfterSettle = state.dispatchCounts.size;

    TestBed.flushEffects();
    container.dispatchEvent(new Event('scroll'));
    TestBed.flushEffects();

    expect(state.dispatchCounts.size).toBe(pagesAfterSettle);
  });

  it('does not re-dispatch an in-flight page when the effect re-fires before it resolves', () => {
    const { recycler, state } = createHarness(container);

    // Scroll into a fresh page and leave it in-flight (timers not advanced).
    scrollTo(container, 300_000);
    const page = Math.floor(recycler.start() / PAGE_SIZE);
    const startBefore = recycler.start();
    expect(state.dispatchCounts.get(page)).toBe(1);
    expect(state.inFlightPages.has(page)).toBe(true);

    // Nudge within the same page's window: the effect re-fires but the page is
    // still in-flight, so the Set dedup blocks a second dispatch.
    scrollTo(container, 305_000);
    expect(recycler.start()).toBeGreaterThan(startBefore);
    expect(state.dispatchCounts.get(page)).toBe(1);
  });
});
