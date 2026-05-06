import {
  type DestroyRef,
  effect,
  type Injector,
  runInInjectionContext,
  type Signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';

import type { CngxAsyncState } from '@cngx/core/utils';

/**
 * Options for {@link createMaterialBidirectionalSync}.
 *
 * Material types never enter this surface. The caller maps Material's
 * own event/property shape to a host-agnostic `Signal<number>` /
 * `Observable<number>` / getter / setter at the directive boundary.
 * That keeps `@cngx/common/data` independent of `@angular/material`
 * (Sheriff Level-2 invariant).
 *
 * @category material-bridge
 */
export interface CngxMaterialBidirectionalSyncOptions {
  /**
   * Reactive source for the presenter's current index. The factory's
   * `effect()` tracks this signal — when it changes, Material is
   * written (subject to the gate and the equality guard).
   */
  readonly presenterIndex: Signal<number>;

  /**
   * Pulls the Material instance's current `selectedIndex` (or
   * equivalent). Called inside `untracked()` so the effect does not
   * subscribe to any signals the getter might read internally.
   */
  readonly readSelectedIndex: () => number;

  /**
   * Writes the Material instance's `selectedIndex` (or equivalent).
   * Called inside `untracked()` per
   * `reference_signal_architecture` rule 2.
   */
  readonly writeSelectedIndex: (idx: number) => void;

  /**
   * Stream of Material-driven selection changes, already mapped to a
   * plain index by the caller (`MatTabGroup.selectedIndexChange`
   * forwards directly; `MatStepper.selectionChange` needs
   * `.pipe(map(e => e.selectedIndex))`).
   */
  readonly selectionChange$: Observable<number>;

  /**
   * Presenter's commit-state. The factory reads `commitState.isPending()`
   * inside the effect to gate the Material write — while a commit is
   * pending, presenter→Material writes are suppressed so the Material
   * surface stays on the origin until the commit resolves.
   */
  readonly commitState: CngxAsyncState<unknown>;

  /**
   * Routes a Material→presenter selection event into the presenter's
   * `select(idx)` method. Subject to an equality guard against
   * `presenterIndex()` so re-entrant events (the presenter's own
   * write firing back through Material) drop without re-routing.
   */
  readonly onMaterialSelection: (idx: number) => void;

  /** Injector used to install the effect inside an injection context. */
  readonly injector: Injector;

  /** DestroyRef used to clean up the effect and the subscription. */
  readonly destroyRef: DestroyRef;
}

/**
 * Single shared bidirectional-sync factory for cngx organisms /
 * directives that bridge a cngx presenter against a Material parent
 * (`<mat-tab-group>`, `<mat-stepper>`, etc.).
 *
 * Lives at Level 2 in `@cngx/common/data` parallel to
 * `createCommitController`. Material types never enter the signature —
 * the caller maps Material-specific events and property accessors to a
 * host-agnostic shape at the directive boundary.
 *
 * Installs:
 *
 * 1. A presenter→Material `effect()` that tracks `presenterIndex` and
 *    writes through `writeSelectedIndex` (gated on
 *    `commitState.isPending()` to suppress writes while a commit is in
 *    flight; equality-guarded against `readSelectedIndex()` to
 *    suppress redundant writes; both reads on the Material side are
 *    wrapped in `untracked()`).
 * 2. A Material→presenter subscription that forwards each
 *    `selectionChange$` emission to `onMaterialSelection`
 *    (equality-guarded against `presenterIndex()` so a Material event
 *    whose value already matches the presenter is dropped — closes
 *    the re-entrancy loop).
 *
 * Both sides clean up via `destroyRef`.
 *
 * @category material-bridge
 */
export function createMaterialBidirectionalSync(
  opts: CngxMaterialBidirectionalSyncOptions,
): void {
  const {
    presenterIndex,
    readSelectedIndex,
    writeSelectedIndex,
    selectionChange$,
    commitState,
    onMaterialSelection,
    injector,
    destroyRef,
  } = opts;

  runInInjectionContext(injector, () => {
    effect(() => {
      // Track BOTH presenter index and pending — flipping the gate
      // from pending→success must re-fire the effect so a queued
      // intent lands on Material once the commit settles. Reading
      // both inside the tracked block (not inside `untracked`) is
      // load-bearing for axis 4 (gate release on resolution).
      const desired = presenterIndex();
      const pending = commitState.isPending();
      untracked(() => {
        if (pending) {
          return;
        }
        if (readSelectedIndex() === desired) {
          return;
        }
        writeSelectedIndex(desired);
      });
    });
  });

  selectionChange$
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((idx) => {
      if (presenterIndex() === idx) {
        return;
      }
      onMaterialSelection(idx);
    });
}
