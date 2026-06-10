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

/**
 * Options for {@link createMaterialBidirectionalSync}.
 *
 * Material types never enter this surface. The caller maps Material's
 * own event/property shape to a host-agnostic `Signal<number>` /
 * `Observable<number>` / getter / setter at the directive boundary. \
 * That keeps `@cngx/common/data` independent of `@angular/material`.
 *
 * @category common/data/material-bridge
 */
export interface CngxMaterialBidirectionalSyncOptions {
  /**
   * Reactive source for the presenter's current index. The factory's
   * `effect()` tracks this signal — when it changes, Material is
   * written (subject to the equality guard against the Material
   * read-side).
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
 * Handle returned by {@link createMaterialBidirectionalSync}.
 *
 * @category common/data/material-bridge
 */
export interface CngxMaterialBidirectionalSyncHandle {
  /**
   * Force Material's selected index to the presenter's current index,
   * routed through the factory's self-echo suppression so it never
   * re-enters the Material→presenter path. Hosts call this from their
   * commit lifecycle when a pessimistic commit settles WITHOUT advancing
   * the presenter (a rejected switch), which leaves Material eager-
   * advanced on the refused tab. A no-op when already in sync.
   */
  readonly reconcile: () => void;
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
 *    writes through `writeSelectedIndex`, equality-guarded against
 *    `readSelectedIndex()` to suppress redundant writes. The Material
 *    read+write pair runs inside `untracked()` per
 *    `reference_signal_architecture` rule 2.
 * 2. A Material→presenter subscription that forwards each
 *    `selectionChange$` emission to `onMaterialSelection`
 *    (equality-guarded against `presenterIndex()` so a Material event
 *    whose value already matches the presenter is dropped — closes
 *    the re-entrancy loop).
 *
 * Both sides clean up via `destroyRef`.
 *
 * **Material-eager-advance reconciliation.** Material's MDC click
 * handler advances `selectedIndex` *before* the Material→presenter
 * subscription forwards the click. When the presenter HOLDS its index
 * (pessimistic mode + bound `commitAction`), the subscriber does NOT
 * write Material back: on a SUCCESSFUL commit the presenter later
 * advances to the clicked target and Material is already there, so the
 * mirror effect is a no-op (no flash); on a REJECTED commit the presenter
 * never moves, leaving Material eager-advanced on the refused tab. The
 * host detects the rejection through its own commit lifecycle and calls
 * {@link CngxMaterialBidirectionalSyncHandle.reconcile} to snap Material
 * back. Writing from inside the subscriber instead is unsafe: Material's
 * `selectedIndex` read-back lags a programmatic write, so the mirror
 * effect's equality guard reads a stale value and skips the corrective
 * write, sticking the visual on the wrong tab.
 *
 * **Self-echo suppression (loop-safety).** Every programmatic
 * `selectedIndex` write makes Material re-emit `selectionChange`. The
 * factory records each value it writes and drops the matching echo
 * (`indexOf` + splice, which also prunes earlier writes whose echo
 * Material coalesced away) before any other processing. This is
 * load-bearing for an ASYNC commit-action: Material emits the echo a
 * microtask later, by which point the commit may have advanced
 * `presenterIndex`, so an equality-only guard (`presenterIndex() ===
 * idx`) would FAIL to drop the echo — it would re-enter the subscriber
 * and ping-pong against the in-flight navigation (the demo freezes).
 * Matching the echo by the value we wrote drops it regardless of where
 * the presenter has moved.
 *
 * @category common/data/material-bridge
 */
export function createMaterialBidirectionalSync(
  opts: CngxMaterialBidirectionalSyncOptions,
): CngxMaterialBidirectionalSyncHandle {
  const {
    presenterIndex,
    readSelectedIndex,
    writeSelectedIndex,
    selectionChange$,
    onMaterialSelection,
    injector,
    destroyRef,
  } = opts;

  // Indices WE wrote into Material, awaiting their echo. Material
  // re-emits `selectionChange` for every programmatic `selectedIndex`
  // write, so each of our writes produces an echo that must NOT be
  // treated as a user selection. Equality against `presenterIndex()`
  // alone is insufficient: with an async commit-action the presenter may
  // have advanced by the time the echo arrives, so the echo no longer
  // equality-drops and would re-enter the subscriber. `indexOf` + splice
  // drops the echo by the value we wrote (and prunes any earlier write
  // whose echo Material coalesced away), regardless of where the
  // presenter has since moved - the loop can never form.
  const selfEchoes: number[] = [];
  const writeMaterial = (idx: number): void => {
    selfEchoes.push(idx);
    writeSelectedIndex(idx);
  };

  runInInjectionContext(injector, () => {
    effect(() => {
      const desired = presenterIndex();
      untracked(() => {
        if (readSelectedIndex() === desired) {
          return;
        }
        writeMaterial(desired);
      });
    });
  });

  selectionChange$.pipe(takeUntilDestroyed(destroyRef)).subscribe((idx) => {
    // Drop our own write-echo (and any coalesced-away earlier write).
    const echoAt = selfEchoes.indexOf(idx);
    if (echoAt !== -1) {
      selfEchoes.splice(0, echoAt + 1);
      return;
    }
    if (presenterIndex() === idx) {
      return;
    }
    onMaterialSelection(idx);
    // No write-back here. Material eager-advanced to the clicked tab; in
    // pessimistic mode the presenter HOLDS at origin, so on SUCCESS the
    // presenter later advances to this target and Material is already
    // there (no flash, no fight with Material's async `selectedIndex`).
    // On REJECTION the presenter never moves, leaving Material diverged -
    // the host detects that and calls `reconcile()` from its commit
    // lifecycle. Writing here while the commit is in flight is unsafe:
    // Material's `selectedIndex` read-back lags a programmatic write, so
    // the mirror effect's equality guard reads a stale value and skips
    // the corrective write (the visual sticks on the wrong tab).
  });

  return {
    reconcile: () => {
      writeMaterial(presenterIndex());
    },
  };
}
