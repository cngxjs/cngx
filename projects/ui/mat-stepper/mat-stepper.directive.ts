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
 * The Material twin of the cngx stepper: attach `cngxMatStepper` to a
 * vanilla `<mat-stepper>` and it is bridged to a
 * {@link CngxStepperPresenter} - consumers gain the commit-action
 * lifecycle, `CNGX_STATEFUL` (so `<cngx-toast-on />` /
 * `<cngx-banner-on />` compose as children), the shared
 * `CNGX_STEPPER_HOST` contract (so a `<cngx-stepper-footer>` can drive
 * Back / Next instead of Material's own buttons via
 * `[host]="ref.presenter"`), and the step-handle registry - all from
 * one attribute.
 *
 * This is the instrumentation pattern: Material owns the rendering and
 * the consumer authors native `<mat-step>` markup; cngx is the
 * behaviour layer. Topology mirrors `[cngxMatTabs]`.
 *
 * @playground Bridge instrumentation ./examples/bridge/bridge-example.component.ts
 *
 * @category ui/mat-stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-stepper/mat-stepper.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepper, CngxStepperPresenter, CngxMatTabs, CngxStepperFooter
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
  /**
   * Shared host contract. Public so a `<cngx-stepper-footer>` placed
   * outside the `<mat-stepper>` can bind `[host]="ref.presenter"` (via
   * `#ref="cngxMatStepperDirective"`) and drive navigation.
   */
  readonly presenter = inject(CNGX_STEPPER_HOST);
  private readonly destroyRef: DestroyRef = inject(InjectableDestroyRef);
  private readonly injector: Injector = inject(InjectableInjector);

  private readonly matSteps = contentChildren(MatStep, { descendants: true });
  // Map not WeakMap - syncHandles needs to iterate to find removed steps.
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

    // Snapshot before iterating - guards against non-current-key deletes inside the body.
    for (const [step, setup] of Array.from(this.setupsByStep.entries())) {
      if (liveSteps.has(step)) {
        continue;
      }
      this.setupsByStep.delete(step);
      this.presenter.unregister(setup.handle.id);
    }
  }
}
