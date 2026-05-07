import { computed, signal, type Signal } from '@angular/core';
import type { MatStep } from '@angular/material/stepper';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';
import type { CngxStepRegistration, CngxStepStatus } from '@cngx/common/stepper';

/**
 * Shared `signal(undefined)` constant used as the `errorAggregator`
 * slot for every Material-instrumented step handle. The
 * instrumentation path does not bind cngx error-aggregation per
 * `MatStep` — Material's own visual error surface (driven by
 * `MatStep.hasError` / `MatStep.optional`) stays authoritative — so
 * per-step allocation of a writable signal would be dead capacity.
 *
 * @internal
 */
const NO_ERROR_AGGREGATOR: Signal<CngxErrorAggregatorContract | undefined> =
  signal<CngxErrorAggregatorContract | undefined>(undefined).asReadonly();

/**
 * Wiring bundle returned from {@link createMatStepHandle}. The
 * instrumentation directive holds the bundle in a `Map<MatStep,
 * Setup>` for diff-only registry churn; only `handle` is exposed to
 * the presenter.
 *
 * @category material-bridge
 */
export interface CngxMatStepHandleSetup {
  readonly handle: CngxStepRegistration;
}

/**
 * Translates a Material `MatStep` into a cngx
 * {@link CngxStepRegistration}.
 *
 * - `id` — always a fresh `idSeed()` value. Mirrors the tabs
 *   instrumentation handle: a label-keyed id would collide when
 *   two steps share a label.
 * - `kind` — fixed at `'step'`. The instrumentation path does not
 *   project nested `<mat-step>` groups (Material's stepper has no
 *   group-of-steps concept; group-aware semantics belong to the
 *   `<cngx-stepper>` thin-wrapper organism).
 * - `label` — snapshot signal seeded from `MatStep.label` when it
 *   is a plain string. When `MatStep.label` is a projected
 *   `<ng-template matStepLabel>`, the cngx label slot is left as
 *   the empty string — Material renders the template directly and
 *   cngx label is informational only. Phase-2 limitation: runtime
 *   string-label changes do not propagate (CdkStep does not expose
 *   a `_stateChanges` Subject analogous to MatTab; the only
 *   reactive surface is `_completedOverride: WritableSignal<...>`
 *   on the completed flag, exploited by `state` below).
 * - `disabled` — fixed `false`. Material owns step gating via
 *   `linear` + `editable` + `completed`; surfacing a cngx-side
 *   `disabled` would duplicate Material's own click-time enforcement
 *   and is ignored by `<mat-stepper>` itself.
 * - `state` — `computed()` over `MatStep.hasError` / `MatStep.completed`.
 *   `CdkStep.completed` reads `_completedOverride()` (a Signal); the
 *   computed tracks that signal through the getter and re-fires when
 *   Material flips completion. `hasError` is plain-property; the
 *   computed will pick up changes only when the dependency-tracked
 *   read of `_completedOverride` re-fires the computed (acceptable
 *   in practice — error toggles typically come paired with
 *   completion writes).
 * - `errorAggregator` — points at the shared
 *   {@link NO_ERROR_AGGREGATOR} constant.
 *
 * @category material-bridge
 */
export function createMatStepHandle(
  matStep: MatStep,
  idSeed: () => string,
): CngxMatStepHandleSetup {
  const id = idSeed();
  const labelInput = matStep.label;
  const labelText = typeof labelInput === 'string' ? labelInput : '';
  const label = signal<string>(labelText).asReadonly();
  const disabled = signal<boolean>(false).asReadonly();
  const state = computed<CngxStepStatus>(() => {
    if (matStep.hasError) {
      return 'error';
    }
    if (matStep.completed) {
      return 'success';
    }
    return 'idle';
  });
  return {
    handle: {
      id,
      kind: 'step',
      label,
      disabled,
      state,
      errorAggregator: NO_ERROR_AGGREGATOR,
    },
  };
}
