import {
  type DestroyRef,
  type Injector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DestroyRef as InjectableDestroyRef, Injector as InjectableInjector } from '@angular/core';
import {
  createMaterialBidirectionalSync,
  type CngxMaterialBidirectionalSyncOptions,
} from './bidirectional-sync';

interface Harness {
  presenterIndex: ReturnType<typeof signal<number>>;
  selectionChange$: Subject<number>;
  matIndex: { value: number };
  writeSpy: ReturnType<typeof vi.fn>;
  onMaterialSelectionSpy: ReturnType<typeof vi.fn>;
  injector: Injector;
  destroyRef: DestroyRef;
  reconcile: () => void;
  install: (over?: Partial<CngxMaterialBidirectionalSyncOptions>) => void;
}

function makeHarness(initialIndex = 0): Harness {
  const presenterIndex = signal<number>(initialIndex);
  const selectionChange$ = new Subject<number>();
  const matIndex = { value: initialIndex };

  const writeSpy = vi.fn((idx: number) => {
    matIndex.value = idx;
  });
  const onMaterialSelectionSpy = vi.fn((idx: number) => {
    presenterIndex.set(idx);
  });

  const injector = TestBed.inject(InjectableInjector);
  const destroyRef = TestBed.inject(InjectableDestroyRef);

  const harness: Harness = {
    presenterIndex,
    selectionChange$,
    matIndex,
    writeSpy,
    onMaterialSelectionSpy,
    injector,
    destroyRef,
    reconcile: () => undefined,
    install: (over) => {
      const handle = createMaterialBidirectionalSync({
        presenterIndex,
        readSelectedIndex: () => matIndex.value,
        writeSelectedIndex: writeSpy,
        selectionChange$,
        onMaterialSelection: onMaterialSelectionSpy,
        injector,
        destroyRef,
        ...over,
      });
      harness.reconcile = handle.reconcile;
    },
  };
  return harness;
}

describe('createMaterialBidirectionalSync', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  test('axis 1: presenter→Material idempotence — write suppressed when already at target', () => {
    const h = makeHarness(0);
    h.install();
    TestBed.flushEffects();
    expect(h.writeSpy).not.toHaveBeenCalled();

    h.presenterIndex.set(2);
    TestBed.flushEffects();
    expect(h.writeSpy).toHaveBeenCalledTimes(1);
    expect(h.matIndex.value).toBe(2);

    // Re-set to the same value — Material is already there, no write.
    h.matIndex.value = 2;
    h.presenterIndex.set(2);
    TestBed.flushEffects();
    expect(h.writeSpy).toHaveBeenCalledTimes(1);
  });

  test('axis 2: Material→presenter routing — each emission invokes onMaterialSelection once', () => {
    const h = makeHarness(0);
    h.install();
    TestBed.flushEffects();

    h.selectionChange$.next(1);
    expect(h.onMaterialSelectionSpy).toHaveBeenCalledTimes(1);
    expect(h.onMaterialSelectionSpy).toHaveBeenCalledWith(1);

    h.selectionChange$.next(3);
    expect(h.onMaterialSelectionSpy).toHaveBeenCalledTimes(2);
    expect(h.onMaterialSelectionSpy).toHaveBeenCalledWith(3);
  });

  test('axis 3: untracked() discipline — write does not re-trigger the same effect', () => {
    const h = makeHarness(0);
    // Custom write spy that touches signals to prove tracking would
    // re-fire if the write were tracked. The `readSelectedIndex` call
    // inside the effect is also wrapped in untracked() — confirm that
    // by reading a sentinel signal in writeSelectedIndex and asserting
    // a write to it does NOT re-trigger the effect.
    const sentinel = signal(0);
    let effectFires = 0;
    const writeSpy = vi.fn((idx: number) => {
      h.matIndex.value = idx;
      // Read + write a signal — if the effect tracked this, we'd loop.
      sentinel.update((v) => v + 1);
    });
    h.install({
      writeSelectedIndex: (idx) => {
        effectFires++;
        writeSpy(idx);
      },
    });
    TestBed.flushEffects();
    h.presenterIndex.set(1);
    TestBed.flushEffects();
    h.presenterIndex.set(2);
    TestBed.flushEffects();
    expect(effectFires).toBe(2);
    expect(sentinel()).toBe(2);
  });

  test('axis 4: DestroyRef teardown stops further writes and unsubscribes selectionChange$', () => {
    const h = makeHarness(0);
    h.install();
    TestBed.flushEffects();

    h.presenterIndex.set(1);
    TestBed.flushEffects();
    expect(h.writeSpy).toHaveBeenCalledTimes(1);
    expect(h.onMaterialSelectionSpy).not.toHaveBeenCalled();

    TestBed.resetTestingModule();

    // Post-destroy: presenter writes do not propagate; Material events
    // do not invoke the callback.
    h.presenterIndex.set(5);
    h.selectionChange$.next(7);

    expect(h.writeSpy).toHaveBeenCalledTimes(1);
    expect(h.onMaterialSelectionSpy).not.toHaveBeenCalled();
  });

  test('axis 4b: a held select leaves Material eager-advanced; the subscriber does NOT write back', () => {
    const h = makeHarness(0);
    // Pessimistic-mode click contract: Material advanced eagerly to 2
    // BEFORE the subscriber fires; the presenter holds activeIndex at
    // origin (does NOT advance via onMaterialSelection's default).
    const holdingHandler = vi.fn((_idx: number) => {
      // Mirrors `presenter.select(idx)` in pessimistic + bound
      // commitAction: opens the commit window but does NOT advance
      // activeIndex until the action resolves.
    });
    h.install({ onMaterialSelection: holdingHandler });
    TestBed.flushEffects();

    h.matIndex.value = 2;
    h.selectionChange$.next(2);

    // The subscriber forwards but does NOT write Material back - writing
    // mid-commit fights Material's async `selectedIndex`. Material stays
    // eager-advanced; the host reconciles on commit settle (axis 4c).
    expect(holdingHandler).toHaveBeenCalledWith(2);
    expect(h.writeSpy).not.toHaveBeenCalled();
    expect(h.matIndex.value).toBe(2);
    expect(h.presenterIndex()).toBe(0);
  });

  test('axis 4c: reconcile() snaps Material back to the held presenter index (rejected-commit shape)', () => {
    const h = makeHarness(0);
    const holdingHandler = vi.fn((_idx: number) => {});
    h.install({ onMaterialSelection: holdingHandler });
    TestBed.flushEffects();

    h.matIndex.value = 2;
    h.selectionChange$.next(2);
    expect(h.writeSpy).not.toHaveBeenCalled();

    // Host detects the rejected commit and reconciles: Material returns
    // to the presenter's authoritative (held) index.
    h.reconcile();
    expect(h.writeSpy).toHaveBeenCalledWith(0);
    expect(h.matIndex.value).toBe(0);
    expect(h.presenterIndex()).toBe(0);
  });

  test('axis 6: self-echo suppression — a reconcile write-echo is dropped by value even after the presenter advanced (async-commit ping-pong)', () => {
    const h = makeHarness(0);
    const holding = vi.fn((_idx: number) => {});
    h.install({ onMaterialSelection: holding });
    TestBed.flushEffects();

    // Click tab 1: Material eager-advanced; presenter holds at 0.
    h.matIndex.value = 1;
    h.selectionChange$.next(1);
    expect(holding).toHaveBeenCalledTimes(1);

    // Host reconciles to the held origin 0 (echo of 0 now queued).
    h.reconcile();
    expect(h.writeSpy).toHaveBeenCalledWith(0);
    expect(h.matIndex.value).toBe(0);

    // A later successful commit advances the presenter to 1; the mirror
    // effect writes Material to 1 (echo of 1 queued).
    h.presenterIndex.set(1);
    TestBed.flushEffects();
    expect(h.matIndex.value).toBe(1);

    // The delayed echo of the reconcile write (0) now arrives. A plain
    // equality guard (presenterIndex()=1 !== 0) would re-enter
    // onMaterialSelection(0) and ping-pong against the navigation;
    // value-based self-echo suppression drops it.
    h.selectionChange$.next(0);
    expect(holding).toHaveBeenCalledTimes(1);
    expect(h.matIndex.value).toBe(1);
  });

  test('axis 6b: self-echo suppression — a coalesced echo prunes earlier un-echoed writes (no queue leak)', () => {
    const h = makeHarness(0);
    h.install();
    TestBed.flushEffects();

    // Two presenter advances: the mirror writes 1 then 2 (echoes [1, 2]).
    h.presenterIndex.set(1);
    TestBed.flushEffects();
    h.presenterIndex.set(2);
    TestBed.flushEffects();
    expect(h.writeSpy).toHaveBeenNthCalledWith(1, 1);
    expect(h.writeSpy).toHaveBeenNthCalledWith(2, 2);

    // Material coalesced the two writes and emits only the final echo (2).
    // `indexOf` finds 2 at position 1 and prunes BOTH queued entries, so
    // the echo is dropped and the queue does not leak.
    h.selectionChange$.next(2);
    expect(h.onMaterialSelectionSpy).not.toHaveBeenCalled();

    // A later genuine user selection of 1 is forwarded - not mistaken for
    // the long-gone queued echo of the earlier write.
    h.matIndex.value = 1;
    h.selectionChange$.next(1);
    expect(h.onMaterialSelectionSpy).toHaveBeenCalledWith(1);
  });

  test('axis 5: re-entrancy guard — Material event during presenter→Material write does not double-fire', () => {
    const h = makeHarness(0);
    // Simulate the natural loop: presenter writes 2 → Material setter
    // fires its own selectionChange event (carrying the same index)
    // → onMaterialSelection MUST be a no-op.
    const loopingWrite = vi.fn((idx: number) => {
      h.matIndex.value = idx;
      // Material's setter would emit selectionChange synchronously.
      h.selectionChange$.next(idx);
    });
    h.install({ writeSelectedIndex: loopingWrite });
    TestBed.flushEffects();

    h.presenterIndex.set(2);
    TestBed.flushEffects();

    // The emitted Material event matches presenterIndex() === 2 → guard
    // drops it; onMaterialSelection is never invoked.
    expect(loopingWrite).toHaveBeenCalledTimes(1);
    expect(h.onMaterialSelectionSpy).not.toHaveBeenCalled();
    expect(h.matIndex.value).toBe(2);
  });
});
