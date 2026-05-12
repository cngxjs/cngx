import type { DestroyRef, Injector } from '@angular/core';
import type { MatStepper } from '@angular/material/stepper';

import { createMaterialBidirectionalSync } from '@cngx/common/data';
import type { CngxStepperHost } from '@cngx/common/stepper';

/**
 * Options for {@link createMatStepperBidirectionalSync}.
 */
export interface CngxMatStepperBidirectionalSyncOptions {
  /** Material stepper the helper bridges against. */
  readonly matStepper: MatStepper;
  /** cngx stepper presenter — write target for Material→presenter. */
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
 * was identical at both call sites — same `presenterIndex`, same
 * `readSelectedIndex` / `writeSelectedIndex` shape, same
 * `selectedIndexChange.asObservable()` source, same
 * `onMaterialSelection` write-back. This helper is the single entry
 * point: each call site reduces to one line.
 *
 * Behaviour stays identical to the prior inline blocks — the helper
 * is a pure shape-adapter, no policy. The underlying generic factory
 * owns:
 * - presenter→Material `effect()` with read-equality guard.
 * - Material→presenter subscription with re-entrancy guard.
 * - Material-eager-advance reconciliation
 *   (`tabs-accepted-debt §6` closure path; same code path applies
 *   here because Material's MDC click handler advances
 *   `selectedIndex` synchronously before the bidirectional sync sees
 *   the event).
 * - `destroyRef` cleanup of both directions.
 *
 * Phase 7.2 of `mat-stepper-mat-tabs-hardening-plan` extracted this
 * helper to close E-C12 + E-C13 (duplicated bidirectional-sync glue
 * between the wrapper component and the instrumentation directive).
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
    // `MatStepper.selectedIndexChange` already emits a plain index,
    // so no `.pipe(map(e => e.selectedIndex))` adapter is needed —
    // mirrors the `MatTabGroup.selectedIndexChange` shape used by
    // `[cngxMatTabs]`.
    selectionChange$: opts.matStepper.selectedIndexChange.asObservable(),
    onMaterialSelection: (i) => opts.presenter.select(i),
    injector: opts.injector,
    destroyRef: opts.destroyRef,
  });
}
