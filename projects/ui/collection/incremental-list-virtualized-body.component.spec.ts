import { provideZonelessChangeDetection, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CngxRecycler } from '@cngx/common/data';

import { CngxIncrementalVirtualizedBody } from './incremental-list-virtualized-body.component';

class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** Typed view of the component's protected read surface. */
interface BodyInternals {
  recycler: CngxRecycler;
  windowItems: Signal<readonly number[]>;
}

describe('CngxIncrementalVirtualizedBody', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    // Run the scroll observer's rAF callback synchronously so a `scroll` event
    // updates the range in the same tick, no frame wait.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => {
    // stubGlobal is NOT undone by restoreAllMocks - a leaked sync rAF stub
    // corrupts later specs in the worker.
    vi.unstubAllGlobals();
    // Detach any fixture roots the focus specs attached to the document.
    document.body.replaceChildren();
  });

  function setup(count = 1000, estimate = 48) {
    const fixture = TestBed.createComponent(CngxIncrementalVirtualizedBody);
    const el = fixture.nativeElement as HTMLElement;
    // Attach to the document so jsdom treats rows as focusable areas - focus()
    // is a no-op on a detached tree, which the focus-restore specs depend on.
    document.body.appendChild(el);
    // jsdom reports 0 for both; seed a real viewport before the scroll observer
    // reads them on its first effect run.
    Object.defineProperty(el, 'clientHeight', { value: 500, writable: true, configurable: true });
    Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true });
    fixture.componentRef.setInput('items', Array.from({ length: count }, (_, i) => i));
    fixture.componentRef.setInput('estimateSize', estimate);
    fixture.componentRef.setInput('trackItem', (_index: number, item: number) => item);
    fixture.detectChanges();
    TestBed.flushEffects();
    const internals = fixture.componentInstance as unknown as BodyInternals;
    return { fixture, el, internals };
  }

  it('renders a bounded window, not the full slice', () => {
    const { internals } = setup(1000, 48);
    const window = internals.windowItems();
    expect(window.length).toBe(internals.recycler.end() - internals.recycler.start());
    expect(window.length).toBeGreaterThan(0);
    expect(window.length).toBeLessThan(100);
    expect(internals.recycler.start()).toBe(0);
  });

  it('shifts the window start when the viewport scrolls', () => {
    const { el, internals } = setup(1000, 48);
    expect(internals.recycler.start()).toBe(0);

    el.scrollTop = 48 * 200;
    el.dispatchEvent(new Event('scroll'));
    TestBed.flushEffects();

    expect(internals.recycler.start()).toBeGreaterThan(150);
  });

  it('announces the load count through the recycler announcer when the total grows', () => {
    // Construction seeds previousTotal at 0 (items default []); binding 500 is
    // the first growth from 0, which the no-state branch does not announce
    // (prevTotal must be > 0). The next growth is the real load.
    const { fixture, el } = setup(500, 48);
    expect(el.querySelector('cngx-recycler-announcer')).not.toBeNull();

    fixture.componentRef.setInput(
      'items',
      Array.from({ length: 600 }, (_, i) => i),
    );
    fixture.detectChanges();
    TestBed.flushEffects();

    const announcer = el.querySelector('cngx-recycler-announcer');
    // 100 more rows revealed, 600 accumulated (default EN recycler i18n - the
    // organism's config routing is exercised in the organism spec).
    expect(announcer?.textContent).toContain('100');
    expect(announcer?.textContent).toContain('600');
  });

  it('restores focus to an in-window row when the focused row recycles out', () => {
    const { el, internals } = setup(1000, 48);
    // Focus enters the first rendered row (its data-cngx-recycle-index is set by
    // CngxVirtualItem); the recycler's focusin handler tracks it.
    const firstRow = el.querySelector<HTMLElement>('[data-cngx-recycle-index]');
    firstRow?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    TestBed.flushEffects();

    // Scroll far past the focused row so it leaves the window.
    el.scrollTop = 48 * 400;
    el.dispatchEvent(new Event('scroll'));
    TestBed.flushEffects();
    // tick() paints the recycled window, then runs the focus-restore
    // afterRenderEffect against the new rows.
    TestBed.tick();

    const active = document.activeElement as HTMLElement;
    const idx = Number(active.getAttribute('data-cngx-recycle-index'));
    expect(idx).toBeGreaterThanOrEqual(internals.recycler.start());
    expect(idx).toBeLessThan(internals.recycler.end());
    // Landing focus in-window pulls focusedIndex back into range and nulls
    // lostFocus - the effect early-returns next run, so no re-fire loop.
    expect(internals.recycler.lostFocus()).toBeNull();
  });

  it('emits focusEscaped when no rendered row remains to catch focus', () => {
    const { el, fixture } = setup(1000, 48);
    let escaped = 0;
    fixture.componentInstance.focusEscaped.subscribe(() => (escaped += 1));

    const firstRow = el.querySelector<HTMLElement>('[data-cngx-recycle-index]');
    firstRow?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    TestBed.flushEffects();

    // Empty the list: the window renders no rows, and the focused index (0) is
    // now outside the empty range, so lostFocus fires with nothing to catch it.
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    TestBed.flushEffects();
    TestBed.tick();

    expect(escaped).toBe(1);
  });

  it('keeps window reference identity when the window does not move (equal fn)', () => {
    const { fixture, internals } = setup(1000, 48);
    const first = internals.windowItems();

    // New source array, identical primitive values -> the structural equal must
    // preserve the reference so the row @for does not thrash.
    fixture.componentRef.setInput(
      'items',
      Array.from({ length: 1000 }, (_, i) => i),
    );
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(internals.windowItems()).toBe(first);
  });
});
