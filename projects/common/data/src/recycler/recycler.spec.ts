import { provideZonelessChangeDetection, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { CngxAsyncState, AsyncStatus } from '@cngx/core/utils';

import { injectRecycler, type CngxRecycler } from './recycler';

class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function createMockState(
  overrides?: Partial<{
    status: WritableSignal<AsyncStatus>;
    isFirstLoad: WritableSignal<boolean>;
    isBusy: WritableSignal<boolean>;
    isRefreshing: WritableSignal<boolean>;
  }>,
): CngxAsyncState<unknown> {
  return {
    status: overrides?.status ?? signal<AsyncStatus>('loading'),
    data: signal(undefined),
    error: signal(undefined),
    progress: signal(undefined),
    isLoading: signal(true),
    isPending: signal(false),
    isRefreshing: overrides?.isRefreshing ?? signal(false),
    isBusy: overrides?.isBusy ?? signal(true),
    isFirstLoad: overrides?.isFirstLoad ?? signal(true),
    isEmpty: signal(false),
    hasData: signal(false),
    isSettled: signal(false),
    lastUpdated: signal(undefined),
  };
}

describe('injectRecycler', () => {
  let mockContainer: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);

    mockContainer = document.createElement('div');
    mockContainer.id = 'recycler-test';
    Object.defineProperty(mockContainer, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockContainer, 'clientHeight', {
      value: 500,
      writable: true,
      configurable: true,
    });
    mockContainer.scrollTo = vi.fn();
    document.body.appendChild(mockContainer);

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  afterEach(() => {
    mockContainer.remove();
  });

  function createRecycler(overrides?: Partial<Parameters<typeof injectRecycler>[0]>): CngxRecycler {
    const items = signal(Array.from({ length: 1000 }, (_, i) => ({ id: i })));
    let recycler!: CngxRecycler;

    TestBed.runInInjectionContext(() => {
      recycler = injectRecycler({
        scrollElement: mockContainer,
        totalCount: () => items().length,
        estimateSize: 48,
        ...overrides,
      });
    });

    TestBed.flushEffects();
    return recycler;
  }

  describe('range computation', () => {
    it('should compute initial range at scrollTop=0', () => {
      const recycler = createRecycler();

      expect(recycler.start()).toBe(0);
      expect(recycler.end()).toBeGreaterThan(10);
      expect(recycler.offsetBefore()).toBe(0);
      expect(recycler.totalSize()).toBe(1000 * 48);
    });

    it('should compute correct offsetAfter', () => {
      const recycler = createRecycler();
      const end = recycler.end();
      expect(recycler.offsetAfter()).toBe((1000 - end) * 48);
    });
  });

  describe('sliced()', () => {
    it('should return a computed signal slicing the array', () => {
      const items = signal(Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` })));
      let recycler!: CngxRecycler;

      TestBed.runInInjectionContext(() => {
        recycler = injectRecycler({
          scrollElement: mockContainer,
          totalCount: () => items().length,
          estimateSize: 48,
        });
      });

      TestBed.flushEffects();

      const visible = recycler.sliced(items);
      expect(visible().length).toBe(recycler.end() - recycler.start());
      expect(visible()[0]).toEqual({ id: 0, name: 'Item 0' });
    });
  });

  describe('async state', () => {
    it('should derive isLoading from state.isFirstLoad()', () => {
      const isFirstLoad = signal(true);
      const isBusy = signal(true);
      const mockState = createMockState({ isFirstLoad, isBusy });

      let recycler!: CngxRecycler;
      TestBed.runInInjectionContext(() => {
        recycler = injectRecycler({
          scrollElement: mockContainer,
          totalCount: () => 0,
          estimateSize: 48,
          state: mockState,
        });
      });

      TestBed.flushEffects();

      expect(recycler.isLoading()).toBe(true);
      expect(recycler.isEmpty()).toBe(false);

      isFirstLoad.set(false);
      isBusy.set(false);

      expect(recycler.isLoading()).toBe(false);
      expect(recycler.isEmpty()).toBe(true);
    });

    it('should compute skeletonSlots based on clientHeight and estimateSize', () => {
      const recycler = createRecycler();
      expect(recycler.skeletonSlots()).toBe(Math.ceil(500 / 48));
    });
  });

  describe('showSkeleton with delay', () => {
    it('should show skeleton immediately when delay=0', () => {
      const mockState = createMockState();

      let recycler!: CngxRecycler;
      TestBed.runInInjectionContext(() => {
        recycler = injectRecycler({
          scrollElement: mockContainer,
          totalCount: () => 0,
          estimateSize: 48,
          state: mockState,
          skeletonDelay: 0,
        });
      });

      TestBed.flushEffects();
      expect(recycler.showSkeleton()).toBe(true);
    });

    it('should delay skeleton when skeletonDelay > 0', () => {
      vi.useFakeTimers();

      const mockState = createMockState();

      let recycler!: CngxRecycler;
      TestBed.runInInjectionContext(() => {
        recycler = injectRecycler({
          scrollElement: mockContainer,
          totalCount: () => 0,
          estimateSize: 48,
          state: mockState,
          skeletonDelay: 300,
        });
      });

      TestBed.flushEffects();
      expect(recycler.showSkeleton()).toBe(false);

      vi.advanceTimersByTime(300);
      TestBed.flushEffects();
      expect(recycler.showSkeleton()).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('ariaSetSize', () => {
    it('should use totalCount when serverTotal is not set', () => {
      const recycler = createRecycler();
      expect(recycler.ariaSetSize()).toBe(1000);
    });

    it('should use serverTotal when set', () => {
      const recycler = createRecycler({ serverTotal: () => 5000 });
      expect(recycler.ariaSetSize()).toBe(5000);
    });
  });

  describe('visibility signals', () => {
    it('should compute firstVisible and lastVisible without overscan', () => {
      const recycler = createRecycler();
      expect(recycler.firstVisible()).toBeGreaterThanOrEqual(0);
      expect(recycler.lastVisible()).toBeGreaterThan(recycler.firstVisible());
      expect(recycler.visibleCount()).toBeGreaterThan(0);
    });

    it('should return 0 for empty list', () => {
      const recycler = createRecycler({ totalCount: () => 0 });
      expect(recycler.visibleCount()).toBe(0);
    });

    it('should handle small list where totalCount < overscan', () => {
      const recycler = createRecycler({ totalCount: () => 3 });
      expect(recycler.firstVisible()).toBeLessThan(3);
      expect(recycler.lastVisible()).toBeLessThan(3);
    });
  });

  describe('grid mode', () => {
    it('should compute row-aligned range', () => {
      const recycler = createRecycler({
        totalCount: () => 100,
        estimateSize: 100,
        layout: 'grid',
        columns: 4,
      });
      // start/end should be multiples of 4 (row-aligned)
      expect(recycler.start() % 4).toBe(0);
    });

    it('should return pixel offsets as 0 in grid mode', () => {
      const recycler = createRecycler({
        totalCount: () => 100,
        estimateSize: 100,
        layout: 'grid',
        columns: 4,
      });
      expect(recycler.offsetBefore()).toBe(0);
      expect(recycler.offsetAfter()).toBe(0);
    });

    it('should compute placeholdersBefore from start index', () => {
      const recycler = createRecycler({
        totalCount: () => 100,
        estimateSize: 100,
        layout: 'grid',
        columns: 4,
      });
      expect(recycler.placeholdersBefore()).toBe(recycler.start());
    });

    it('should compute placeholdersAfter from end index', () => {
      const recycler = createRecycler({
        totalCount: () => 100,
        estimateSize: 100,
        layout: 'grid',
        columns: 4,
      });
      expect(recycler.placeholdersAfter()).toBe(100 - recycler.end());
    });

    it('should have placeholders at 0 in list mode', () => {
      const recycler = createRecycler();
      expect(recycler.placeholdersBefore()).toBe(0);
      expect(recycler.placeholdersAfter()).toBe(0);
    });

    it('should make measure() a no-op in grid mode', () => {
      const recycler = createRecycler({
        totalCount: () => 100,
        estimateSize: 100,
        layout: 'grid',
        columns: 4,
      });
      const el = document.createElement('div');
      Object.defineProperty(el, 'getBoundingClientRect', {
        value: () => ({
          height: 200, width: 100, top: 0, left: 0, bottom: 200, right: 100,
          x: 0, y: 0, toJSON: () => {},
        }),
      });
      // Should not throw and should not affect range computation
      expect(() => recycler.measure(0, el)).not.toThrow();
    });

    it('should fallback to columns=1 with console.error when columns not set', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const recycler = createRecycler({
        totalCount: () => 100,
        estimateSize: 100,
        layout: 'grid',
      });
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('requires explicit `columns`'),
      );
      // Still functional — degrades to single-column list
      expect(recycler.start()).toBe(0);
      errorSpy.mockRestore();
    });

    it('should support columns as a function', () => {
      const cols = signal(4);
      const recycler = createRecycler({
        totalCount: () => 100,
        estimateSize: 100,
        layout: 'grid',
        columns: () => cols(),
      });
      const startBefore = recycler.start();
      expect(startBefore % 4).toBe(0);
    });
  });

  describe('deep-link scrollToIndex', () => {
    it('should store pending target when index >= totalCount', () => {
      const totalCount = signal(50);
      let recycler!: CngxRecycler;
      TestBed.runInInjectionContext(() => {
        recycler = injectRecycler({
          scrollElement: mockContainer,
          totalCount: () => totalCount(),
          estimateSize: 48,
        });
      });
      TestBed.flushEffects();

      recycler.scrollToIndex(100);
      expect(recycler.pendingTarget()).toBe(100);
    });

    it('should clear pending target when totalCount grows past it', () => {
      const totalCount = signal(50);
      let recycler!: CngxRecycler;
      TestBed.runInInjectionContext(() => {
        recycler = injectRecycler({
          scrollElement: mockContainer,
          totalCount: () => totalCount(),
          estimateSize: 48,
        });
      });
      TestBed.flushEffects();

      recycler.scrollToIndex(80);
      expect(recycler.pendingTarget()).toBe(80);

      totalCount.set(200);
      TestBed.flushEffects();
      expect(recycler.pendingTarget()).toBeNull();
    });

    it('should not store pending target when index < totalCount', () => {
      const recycler = createRecycler();
      recycler.scrollToIndex(5);
      expect(recycler.pendingTarget()).toBeNull();
    });

    it('should clear pending target on direct scrollToIndex', () => {
      const totalCount = signal(50);
      let recycler!: CngxRecycler;
      TestBed.runInInjectionContext(() => {
        recycler = injectRecycler({
          scrollElement: mockContainer,
          totalCount: () => totalCount(),
          estimateSize: 48,
        });
      });
      TestBed.flushEffects();

      recycler.scrollToIndex(100);
      expect(recycler.pendingTarget()).toBe(100);

      // Now scroll to a reachable index — clears pending
      recycler.scrollToIndex(10);
      expect(recycler.pendingTarget()).toBeNull();
    });
  });

  describe('focus preservation', () => {
    it('should have lostFocus always at null', () => {
      const recycler = createRecycler();
      expect(recycler.lostFocus()).toBeNull();
    });

    it('should accept anchorTo without error', () => {
      const recycler = createRecycler();
      expect(() => recycler.anchorTo(5)).not.toThrow();
      expect(() => recycler.releaseAnchor()).not.toThrow();
    });

    it('should accept measure without error', () => {
      const recycler = createRecycler();
      const el = document.createElement('div');
      Object.defineProperty(el, 'getBoundingClientRect', {
        value: () => ({
          height: 64,
          width: 100,
          top: 0,
          left: 0,
          bottom: 64,
          right: 100,
          x: 0,
          y: 0,
          toJSON: () => {},
        }),
      });
      expect(() => recycler.measure(0, el)).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should set scrollTop to 0', () => {
      const recycler = createRecycler();
      Object.defineProperty(mockContainer, 'scrollTop', {
        value: 500,
        writable: true,
        configurable: true,
      });
      recycler.reset();
      expect(mockContainer.scrollTop).toBe(0);
    });
  });
});
