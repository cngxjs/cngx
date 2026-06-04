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
    install: (over) => {
      createMaterialBidirectionalSync({
        presenterIndex,
        readSelectedIndex: () => matIndex.value,
        writeSelectedIndex: writeSpy,
        selectionChange$,
        onMaterialSelection: onMaterialSelectionSpy,
        injector,
        destroyRef,
        ...over,
      });
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

  test('axis 4b: Material-eager-advance reconciliation — when the forwarding callback returns and the presenter held its index (pessimistic-mode shape), Material is force-written back', () => {
    const h = makeHarness(0);
    // Simulate the pessimistic-mode user-side click contract: Material
    // advanced eagerly to 2 BEFORE the subscriber fires; the
    // presenter holds activeIndex at origin (does NOT call
    // onMaterialSelection's default presenterIndex.set).
    const holdingHandler = vi.fn((_idx: number) => {
      // Presenter intentionally holds — no presenterIndex.set call.
      // (Mirrors `presenter.select(idx)` in pessimistic + bound
      // commitAction: writes originIndexDuringCommit, calls
      // beginTransition, but does NOT advance activeIndex.)
    });
    h.install({ onMaterialSelection: holdingHandler });
    TestBed.flushEffects();

    // Material's MDC click handler advances first; selectionChange
    // emits 2 with matIndex.value already at 2 (Material-side state).
    h.matIndex.value = 2;
    h.selectionChange$.next(2);

    // Forwarding callback ran; presenter held its index; reconciliation
    // detects matIndex (2) !== presenterIndex (0) and force-writes 0.
    expect(holdingHandler).toHaveBeenCalledTimes(1);
    expect(holdingHandler).toHaveBeenCalledWith(2);
    expect(h.writeSpy).toHaveBeenCalledTimes(1);
    expect(h.writeSpy).toHaveBeenCalledWith(0);
    expect(h.matIndex.value).toBe(0);
    expect(h.presenterIndex()).toBe(0);
  });

  test('axis 4c: reconciliation no-op — when the forwarding callback advances the presenter (optimistic-mode shape), no force-write happens', () => {
    const h = makeHarness(0);
    // Default onMaterialSelectionSpy already advances presenterIndex
    // to the forwarded value (mirrors optimistic-mode select).
    h.install();
    TestBed.flushEffects();

    h.matIndex.value = 2;
    h.selectionChange$.next(2);

    // Forwarding advanced the presenter to 2 → matches matIndex →
    // reconciliation guard short-circuits; no extra writeSpy call.
    expect(h.onMaterialSelectionSpy).toHaveBeenCalledTimes(1);
    expect(h.writeSpy).not.toHaveBeenCalled();
    expect(h.matIndex.value).toBe(2);
    expect(h.presenterIndex()).toBe(2);
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
