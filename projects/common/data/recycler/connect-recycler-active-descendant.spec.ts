import {
  Component,
  provideZonelessChangeDetection,
  signal,
  type WritableSignal,
  runInInjectionContext,
  Injector,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxActiveDescendant, type ActiveDescendantItem } from '@cngx/common/a11y';

import { connectRecyclerToActiveDescendant } from './connect-recycler-active-descendant';
import type { CngxRecycler } from './recycler';

// The bridge only touches two surfaces on CngxActiveDescendant:
// - pendingHighlight(): Signal<number | null>
// - (no writes - AD clears its own state when the target enters range)
//
// Same for CngxRecycler - just scrollToIndex is called. Minimal mocks.
type BridgeAd = { pendingHighlight: WritableSignal<number | null> };
type BridgeRecycler = { scrollToIndex: (i: number) => void };

function runBridge(ad: BridgeAd, recycler: BridgeRecycler): void {
  const injector = TestBed.inject(Injector);
  runInInjectionContext(injector, () => {
    connectRecyclerToActiveDescendant(
      recycler as unknown as CngxRecycler,
      ad as unknown as import('@cngx/common/a11y').CngxActiveDescendant,
    );
  });
}

describe('connectRecyclerToActiveDescendant', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    vi.useFakeTimers();
  });

  function flushRaf(): void {
    // jsdom / vitest fake timer handles rAF as a setTimeout(0)-like queue;
    // advance minimal time to drain the pending frame.
    vi.advanceTimersByTime(16);
  }

  it('is a no-op while pendingHighlight is null', () => {
    const ad: BridgeAd = { pendingHighlight: signal<number | null>(null) };
    const scrollToIndex = vi.fn();
    const recycler: BridgeRecycler = { scrollToIndex };

    runBridge(ad, recycler);
    TestBed.flushEffects();
    flushRaf();

    expect(scrollToIndex).not.toHaveBeenCalled();
  });

  it('calls recycler.scrollToIndex when pendingHighlight flips to a number', () => {
    const ad: BridgeAd = { pendingHighlight: signal<number | null>(null) };
    const scrollToIndex = vi.fn();
    const recycler: BridgeRecycler = { scrollToIndex };

    runBridge(ad, recycler);
    TestBed.flushEffects();

    ad.pendingHighlight.set(5000);
    TestBed.flushEffects();
    flushRaf();

    expect(scrollToIndex).toHaveBeenCalledExactlyOnceWith(5000);
  });

  it('debounces rapid pendingHighlight changes to a single scrollToIndex', () => {
    const ad: BridgeAd = { pendingHighlight: signal<number | null>(null) };
    const scrollToIndex = vi.fn();
    const recycler: BridgeRecycler = { scrollToIndex };

    runBridge(ad, recycler);
    TestBed.flushEffects();

    // Simulate ArrowDown held - pendingHighlight updates many times before
    // any rAF fires.
    for (let i = 100; i <= 105; i++) {
      ad.pendingHighlight.set(i);
      TestBed.flushEffects();
    }
    flushRaf();

    // Only the latest target should land as one scrollToIndex call.
    expect(scrollToIndex).toHaveBeenCalledExactlyOnceWith(105);
  });

  it('does not call scrollToIndex when pendingHighlight clears before rAF fires', () => {
    const ad: BridgeAd = { pendingHighlight: signal<number | null>(null) };
    const scrollToIndex = vi.fn();
    const recycler: BridgeRecycler = { scrollToIndex };

    runBridge(ad, recycler);
    TestBed.flushEffects();

    ad.pendingHighlight.set(42);
    TestBed.flushEffects();
    ad.pendingHighlight.set(null);
    TestBed.flushEffects();
    flushRaf();

    // AD cleared the pending state in the same frame - the bridge must not
    // fire a stale scroll.
    expect(scrollToIndex).not.toHaveBeenCalled();
  });
});

@Component({
  imports: [CngxActiveDescendant],
  template: `<div cngxActiveDescendant [items]="rows()" [virtualCount]="100" [windowStart]="start()"></div>`,
})
class BridgeHost {
  readonly start = signal(0);
  readonly rows = signal<ActiveDescendantItem[]>(rowsFrom(0));
  readonly ad = viewChild.required(CngxActiveDescendant);
  moveWindow(start: number): void {
    this.start.set(start);
    this.rows.set(rowsFrom(start));
  }
}

function rowsFrom(start: number): ActiveDescendantItem[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `row-${start + i}`,
    value: start + i,
    label: `Row ${start + i}`,
  }));
}

describe('connectRecyclerToActiveDescendant - with the real directive', () => {
  it('scrolls a pending target once, clears it on render and stays away afterwards', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(BridgeHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const scrollToIndex = vi.fn();
    runInInjectionContext(TestBed.inject(Injector), () => {
      connectRecyclerToActiveDescendant(
        { scrollToIndex } as unknown as CngxRecycler,
        host.ad(),
      );
    });
    const settle = (): void => {
      fixture.detectChanges();
      TestBed.flushEffects();
      vi.advanceTimersByTime(16);
    };
    settle();

    host.ad().highlightLast();
    settle();
    expect(host.ad().pendingHighlight()).toBe(99);
    expect(scrollToIndex).toHaveBeenCalledExactlyOnceWith(99);

    host.moveWindow(90);
    settle();
    expect(host.ad().pendingHighlight()).toBeNull();
    expect(host.ad().activeId()).toBe('row-99');

    host.moveWindow(30);
    settle();
    expect(host.ad().pendingHighlight()).toBeNull();
    expect(scrollToIndex).toHaveBeenCalledTimes(1);
  });
});
