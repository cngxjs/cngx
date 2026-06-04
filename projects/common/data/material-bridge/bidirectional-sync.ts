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
 * `Observable<number>` / getter / setter at the directive boundary.
 * That keeps `@cngx/common/data` independent of `@angular/material`
 * (Sheriff Level-2 invariant).
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
 * **Pessimistic-commit gate (deliberately absent).** An earlier draft
 * carried a third option `commitState: CngxAsyncState<unknown>` that
 * gated the Material write while `commitState.isPending()`. The plan
 * (`global-material-bridge-and-architecture-hardening-plan` §54)
 * specified this gate "for the pessimistic flow." Implementation
 * showed the gate is redundant: cngx commit handlers already keep
 * `presenter.activeIndex` at the origin during pessimistic-pending,
 * so the equality guard alone suppresses the Material write.
 * Conversely, in optimistic mode the presenter advances IMMEDIATELY
 * (before the commit settles); a `pending`-keyed gate would suppress
 * that legitimate advance and break the optimistic UX. Dropping the
 * gate makes both modes work via the simple presenter→Material
 * mirror — same outcome as the gate version for pessimistic, and the
 * correct outcome for optimistic.
 *
 * **Material-eager-advance reconciliation.** Material's MDC click
 * handler advances `selectedIndex` synchronously *before* the
 * Material→presenter subscription forwards the click to
 * `onMaterialSelection`. When the presenter HOLDS its index
 * (pessimistic mode + bound `commitAction`, or any future contract
 * that refuses a select), the presenter→Material `effect()` does
 * NOT fire — `presenterIndex` did not change — so Material's
 * eager-advance is never reverted, and the visual diverges from the
 * cngx semantic state. Closes `tabs-accepted-debt §6` by force-
 * writing Material back to the presenter's value when the
 * forwarding callback returns and the values still diverge. Idempotent
 * with the regular presenter→Material effect (the read-equality guard
 * at the effect site suppresses a duplicate write when the presenter
 * later changes to the same value).
 *
 * @category common/data/material-bridge
 */
export function createMaterialBidirectionalSync(
  opts: CngxMaterialBidirectionalSyncOptions,
): void {
  const {
    presenterIndex,
    readSelectedIndex,
    writeSelectedIndex,
    selectionChange$,
    onMaterialSelection,
    injector,
    destroyRef,
  } = opts;

  runInInjectionContext(injector, () => {
    effect(() => {
      const desired = presenterIndex();
      untracked(() => {
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
      // Material-eager-advance reconciliation (tabs-accepted-debt §6).
      // The forwarding callback above lets the presenter run its
      // commit-action gate; in pessimistic mode the presenter holds
      // `activeIndex` at origin instead of advancing. The
      // presenter→Material effect only fires on signal CHANGE, so a
      // hold-at-origin leaves Material at the user-clicked target —
      // out of sync with the cngx semantic state. Detect the
      // post-callback divergence and force a Material write so the
      // visual snaps back to the presenter's authoritative index.
      // Loop-safe: writing `selectedIndex` re-emits `selectionChange$`,
      // but the early-return guard at the top of this subscriber
      // (`presenterIndex() === idx`) drops the re-entrant emission.
      const reconciled = presenterIndex();
      if (readSelectedIndex() !== reconciled) {
        writeSelectedIndex(reconciled);
      }
    });
}
