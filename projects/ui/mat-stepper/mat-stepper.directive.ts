import {
  contentChildren,
  type DestroyRef,
  Directive,
  effect,
  inject,
  type Injector,
  untracked,
  DestroyRef as InjectableDestroyRef,
  Injector as InjectableInjector,
} from '@angular/core';
import { MatStep, MatStepper } from '@angular/material/stepper';

import { CNGX_STEPPER_HOST, CngxStepperPresenter } from '@cngx/common/stepper';
import { nextUid } from '@cngx/core/utils';

import { createMatStepperBidirectionalSync } from './material-bridge/bidirectional-sync';
import {
  CNGX_MAT_STEP_HANDLE_FACTORY,
  type CngxMatStepHandleSetup,
} from './material-bridge/handle';

/**
 * Attaches to an existing `<mat-stepper>` and bridges it to a
 * {@link CngxStepperPresenter} — consumers gain the commit-action
 * lifecycle, `CNGX_STATEFUL` (so `<cngx-toast-on />` /
 * `<cngx-banner-on />` compose as children), and the step-handle
 * registry from one attribute.
 *
 * Sibling-additive to `<cngx-mat-stepper>` (the thin-wrapper
 * organism in `@cngx/ui/mat-stepper`): the wrapper authors fresh
 * markup, this directive upgrades existing Material markup.
 * `exportAs` differs (`cngxMatStepperDirective`) to avoid colliding
 * with the wrapper's `cngxMatStepper`.
 *
 * Topology mirrors `[cngxMatTabs]`: Material is the host, cngx is
 * the instrumentation layer.
 */
@Directive({
  selector: '[cngxMatStepper]',
  exportAs: 'cngxMatStepperDirective',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: ['activeStepIndex', 'linear', 'orientation', 'commitAction', 'commitMode'],
      outputs: ['activeStepIndexChange'],
    },
  ],
})
export class CngxMatStepperBridge {
  private readonly matStepper = inject(MatStepper, { self: true });
  private readonly presenter = inject(CNGX_STEPPER_HOST);
  private readonly destroyRef: DestroyRef = inject(InjectableDestroyRef);
  private readonly injector: Injector = inject(InjectableInjector);

  private readonly matSteps = contentChildren(MatStep, { descendants: true });
  // Map not WeakMap — syncHandles needs to iterate to find removed steps.
  private readonly setupsByStep = new Map<MatStep, CngxMatStepHandleSetup>();
  private readonly createHandle = inject(CNGX_MAT_STEP_HANDLE_FACTORY);

  constructor() {
    effect(() => {
      const steps = this.matSteps();
      untracked(() => this.syncHandles(steps));
    });

    this.destroyRef.onDestroy(() => {
      for (const setup of this.setupsByStep.values()) {
        this.presenter.unregister(setup.handle.id);
      }
      this.setupsByStep.clear();
    });

    createMatStepperBidirectionalSync({
      matStepper: this.matStepper,
      presenter: this.presenter,
      injector: this.injector,
      destroyRef: this.destroyRef,
    });
  }

  private syncHandles(steps: readonly MatStep[]): void {
    const liveSteps = new Set<MatStep>(steps);

    // Only fresh MatSteps get registered; cached ones survive untouched.
    for (const step of steps) {
      if (this.setupsByStep.has(step)) {
        continue;
      }
      const setup = this.createHandle(step, () => nextUid('cngx-mat-step-'));
      this.setupsByStep.set(step, setup);
      this.presenter.register(setup.handle);
    }

    // Snapshot before iterating — guards against non-current-key deletes inside the body.
    for (const [step, setup] of Array.from(this.setupsByStep.entries())) {
      if (liveSteps.has(step)) {
        continue;
      }
      this.setupsByStep.delete(step);
      this.presenter.unregister(setup.handle.id);
    }
  }
}
