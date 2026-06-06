import type { DestroyRef, Injector } from '@angular/core';
import type { MatStepper } from '@angular/material/stepper';

import { createMaterialBidirectionalSync } from '@cngx/common/data';
import type { CngxStepperHost } from '@cngx/common/stepper';

/**
 * Options for {@link createMatStepperBidirectionalSync}.
 *
 * @internal
 */
export interface CngxMatStepperBidirectionalSyncOptions {
  /** Material stepper the helper bridges against. */
  readonly matStepper: MatStepper;
  /** cngx stepper presenter - write target for Material→presenter. */
  readonly presenter: CngxStepperHost;
  /** Injection context for the underlying `effect()` in `@cngx/common/data`. */
  readonly injector: Injector;
  /**
   * Destroy ref the underlying subscriber teardown attaches to.
   * Same lifetime as the host directive / component.
   */
  readonly destroyRef: DestroyRef;
}

/**
 * Stepper-specific glue over {@link createMaterialBidirectionalSync}
 * (`@cngx/common/data`). Both `<cngx-mat-stepper>` (Component) and
 * `[cngxMatStepper]` (Directive) need to install the same
 * presenter↔Material `selectedIndex` sync; the option-mapping body
 * was identical at both call sites - same `presenterIndex`, same
 * `readSelectedIndex` / `writeSelectedIndex` shape, same
 * `selectedIndexChange.asObservable()` source, same
 * `onMaterialSelection` write-back. This helper is the single entry
 * point: each call site reduces to one line.
 *
 * Behaviour stays identical to the prior inline blocks - the helper
 * is a pure shape-adapter, no policy. The underlying generic factory
 * owns:
 * - presenter→Material `effect()` with read-equality guard.
 * - Material→presenter subscription with re-entrancy guard.
 * - Material-eager-advance reconciliation (Material's MDC click
 *   handler advances `selectedIndex` synchronously before the
 *   bidirectional sync sees the event).
 * - `destroyRef` cleanup of both directions.
 *
 * @internal
 */
export function createMatStepperBidirectionalSync(
  opts: CngxMatStepperBidirectionalSyncOptions,
): void {
  createMaterialBidirectionalSync({
    presenterIndex: opts.presenter.activeStepIndex,
    readSelectedIndex: () => opts.matStepper.selectedIndex,
    writeSelectedIndex: (i) => {
      opts.matStepper.selectedIndex = i;
    },
    // `MatStepper.selectedIndexChange` emits a plain index - no adapter needed,
    // unlike `MatTabGroup.selectedIndexChange`.
    selectionChange$: opts.matStepper.selectedIndexChange.asObservable(),
    onMaterialSelection: (i) => opts.presenter.select(i),
    injector: opts.injector,
    destroyRef: opts.destroyRef,
  });
}
