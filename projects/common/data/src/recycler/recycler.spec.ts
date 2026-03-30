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

function createMockState(overrides?: Partial<{
  status: WritableSignal<AsyncStatus>;
  isFirstLoad: WritableSignal<boolean>;
  isBusy: WritableSignal<boolean>;
  isRefreshing: WritableSignal<boolean>;
}>): CngxAsyncState<unknown> {
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
    Object.defineProperty(mockContainer, 'scrollTop', { value: 0, writable: true, configurable: true });
    Object.defineProperty(mockContainer, 'clientHeight', { value: 500, writable: true, configurable: true });
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

  describe('Phase 2+ stubs', () => {
    it('should have placeholders always at 0', () => {
      const recycler = createRecycler();
      expect(recycler.placeholdersBefore()).toBe(0);
      expect(recycler.placeholdersAfter()).toBe(0);
    });

    it('should have lostFocus always at null', () => {
      const recycler = createRecycler();
      expect(recycler.lostFocus()).toBeNull();
    });

    it('should warn on anchorTo in dev mode', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const recycler = createRecycler();
      recycler.anchorTo(5);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('anchorTo'));
    });

    it('should warn on measure in dev mode', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const recycler = createRecycler();
      recycler.measure(0, document.createElement('div'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('measure'));
    });
  });

  describe('reset', () => {
    it('should set scrollTop to 0', () => {
      const recycler = createRecycler();
      Object.defineProperty(mockContainer, 'scrollTop', { value: 500, writable: true, configurable: true });
      recycler.reset();
      expect(mockContainer.scrollTop).toBe(0);
    });
  });
});
