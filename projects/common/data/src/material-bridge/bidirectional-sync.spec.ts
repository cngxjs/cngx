import {
  DestroyRef,
  Injector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createManualState } from '../async-state/create-manual-state';
import {
  createMaterialBidirectionalSync,
  type CngxMaterialBidirectionalSyncOptions,
} from './bidirectional-sync';

interface Harness {
  presenterIndex: ReturnType<typeof signal<number>>;
  selectionChange$: Subject<number>;
  commitState: ReturnType<typeof createManualState<unknown>>;
  matIndex: { value: number };
  writeSpy: ReturnType<typeof vi.fn>;
  onMaterialSelectionSpy: ReturnType<typeof vi.fn>;
  injector: Injector;
  destroyRef: DestroyRef;
  destroy: () => void;
  install: (over?: Partial<CngxMaterialBidirectionalSyncOptions>) => void;
}

function makeHarness(initialIndex = 0): Harness {
  const presenterIndex = signal<number>(initialIndex);
  const selectionChange$ = new Subject<number>();
  const commitState = createManualState<unknown>();
  const matIndex = { value: initialIndex };

  const writeSpy = vi.fn((idx: number) => {
    matIndex.value = idx;
  });
  const onMaterialSelectionSpy = vi.fn((idx: number) => {
    presenterIndex.set(idx);
  });

  const injector = TestBed.inject(Injector);
  const destroyRef = TestBed.inject(DestroyRef);

  const harness: Harness = {
    presenterIndex,
    selectionChange$,
    commitState,
    matIndex,
    writeSpy,
    onMaterialSelectionSpy,
    injector,
    destroyRef,
    destroy: () => {
      // TestBed reset destroys the root injector — see test cleanup.
    },
    install: (over) => {
      createMaterialBidirectionalSync({
        presenterIndex,
        readSelectedIndex: () => matIndex.value,
        writeSelectedIndex: writeSpy,
        selectionChange$,
        commitState,
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

  test('axis 3: gate freeze under pending — write suppressed while commitState.isPending()', () => {
    const h = makeHarness(0);
    h.install();
    TestBed.flushEffects();

    h.commitState.set('pending');
    h.presenterIndex.set(2);
    TestBed.flushEffects();

    expect(h.writeSpy).not.toHaveBeenCalled();
    expect(h.matIndex.value).toBe(0);
  });

  test('axis 4: gate release on resolution — write fires after status flips off pending', () => {
    const h = makeHarness(0);
    h.install();
    TestBed.flushEffects();

    h.commitState.set('pending');
    h.presenterIndex.set(2);
    TestBed.flushEffects();
    expect(h.writeSpy).not.toHaveBeenCalled();

    h.commitState.setSuccess(undefined);
    TestBed.flushEffects();
    expect(h.writeSpy).toHaveBeenCalledTimes(1);
    expect(h.matIndex.value).toBe(2);
  });

  test('axis 5: untracked() discipline — write does not re-trigger the same effect', () => {
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

  test('axis 6: DestroyRef teardown stops further writes and unsubscribes selectionChange$', () => {
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

  test('axis 7: re-entrancy guard — Material event during presenter→Material write does not double-fire', () => {
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
