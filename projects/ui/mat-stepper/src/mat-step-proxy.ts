import {
  type AfterRenderRef,
  afterRenderEffect,
  type Injector,
  runInInjectionContext,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { type MatStep } from '@angular/material/stepper';

import {
  type CngxStepRegistration,
  type CngxStepStatus,
} from '@cngx/common/stepper';

/**
 * Internal adapter that bridges Angular Material's `MatStep` plain
 * properties (`label`, `disabled`, `completed`, `hasError`) into the
 * cngx stepper's signal-native registration shape. Used by
 * `<cngx-mat-stepper>` to adopt natively projected `<mat-step>`
 * children alongside `<cngx-step>` atoms.
 *
 * Pillar 1 — every prop is exposed as `Signal<T>`, so the rest of
 * the graph stays signal-native. Pillar 3 — the proxy is one
 * focused unit, never escapes the `@cngx/ui/mat-stepper` boundary.
 *
 * The proxy polls MatStep on every render via `afterRenderEffect`
 * and idempotent `.set()` calls (signal slots carry an explicit
 * `equal: Object.is` so unchanged values do not re-emit). Property
 * mutations that bypass change detection (e.g. inside an imperative
 * `setTimeout` that does not trigger CD) are observed at the next
 * render boundary — see `.internal/architektur/stepper-accepted-debt.md §1`.
 *
 * Lifecycle: instantiate via `new MatStepProxy(matStep, id, injector)`.
 * The constructor captures the `AfterRenderRef` returned by
 * `afterRenderEffect` and exposes `destroy()` so the consumer can
 * tear down the polling effect in lockstep with `presenter.unregister(id)`.
 *
 * Instantiation pattern is `new`, NOT a `createMatStepProxy()`
 * factory — see `stepper-accepted-debt.md §2` for the over-
 * abstraction rationale.
 *
 * @internal
 */
export class MatStepProxy {
  /** Live MatStep label. Updates at the next render boundary. */
  readonly label: WritableSignal<string>;
  /** Live MatStep disabled flag. Editable + linear policy still owned by the presenter. */
  readonly disabled: WritableSignal<boolean>;
  /** Projected status: 'success' when completed, 'error' when hasError, else 'idle'. */
  readonly state: WritableSignal<CngxStepStatus>;

  private readonly renderRef: AfterRenderRef;
  private destroyed = false;

  constructor(
    private readonly matStep: MatStep,
    readonly id: string,
    injector: Injector,
  ) {
    this.label = signal(matStep.label ?? '', { equal: Object.is });
    this.disabled = signal(this.readDisabled(), { equal: Object.is });
    this.state = signal(this.readState(), { equal: Object.is });

    this.renderRef = runInInjectionContext(injector, () =>
      afterRenderEffect(() => {
        if (this.destroyed) {
          return;
        }
        this.label.set(this.matStep.label ?? '');
        this.disabled.set(this.readDisabled());
        this.state.set(this.readState());
      }),
    );
  }

  /**
   * Returns the registration shape consumed by `CngxStepperHost.register`.
   * Slots are narrowed to `Signal<T>` so consumers cannot widen-and-mutate
   * the proxy's writable backing — the proxy is the only writer, the rest
   * of the graph is read-only by contract.
   *
   * Always returns the same signal references — safe to call repeatedly.
   */
  toRegistration(): CngxStepRegistration {
    return {
      id: this.id,
      kind: 'step',
      label: this.label as Signal<string>,
      disabled: this.disabled as Signal<boolean>,
      state: this.state as Signal<CngxStepStatus>,
    };
  }

  /**
   * Stops the `afterRenderEffect` polling. Idempotent. Call from
   * the consumer in lockstep with `presenter.unregister(id)` so
   * the proxy does not outlive its registration.
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.renderRef.destroy();
  }

  private readDisabled(): boolean {
    // The linear policy lives on the parent stepper; the registration
    // contract just mirrors `editable` so consumer overrides via
    // `[editable]` propagate into the cngx flatSteps projection.
    return this.matStep.editable === false;
  }

  private readState(): CngxStepStatus {
    if (this.matStep.hasError) {
      return 'error';
    }
    if (this.matStep.completed) {
      return 'success';
    }
    return 'idle';
  }
}
