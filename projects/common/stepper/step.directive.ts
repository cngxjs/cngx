import {
  contentChild,
  DestroyRef,
  Directive,
  inject,
  input,
  linkedSignal,
  type Signal,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import { CNGX_STEP_GROUP_HOST } from './step-group-host.token';
import { CngxStepContent } from './step-content.directive';
import { CngxStepLabel } from './step-label.directive';
import {
  CNGX_STEPPER_HOST,
  type CngxStepStatus,
} from './stepper-host.token';

/**
 * Single-step atom. Registers with the nearest host — either a
 * `CngxStepGroup` ({@link CNGX_STEP_GROUP_HOST}) or the root
 * `CngxStepperPresenter` ({@link CNGX_STEPPER_HOST}).
 *
 * `state` is a `linkedSignal` over `[disabled]`, `[completed]`, and
 * the optional `[errorAggregator]`'s `hasError()`.
 * <example-url>http://localhost:4200/ui/stepper/stepper-commit-action/pessimistic-optimistic-commits-with-bridge-directives</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-custom-labels/mixing-code-label-code-input-with-code-cngxsteplabel-code-slot</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-error-aggregation/per-step-error-badges</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-hierarchical/group-nested-steps-trailing-root-step</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-horizontal/three-step-wizard</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-linear/linear-gating-with-completion-checkboxes</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-router-sync/deep-linking-with-fragment-queryparam-modes</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-busy-spinner-via-code-cngxstepbusyspinner-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-error-badge-via-code-cngxstepbadge-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-group-header-via-code-cngxstepgroupheader-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-indicator-glyph-via-code-cngxstepindicator-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/empty-state-placeholder-via-code-cngxstepperempty-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/rejection-decoration-via-code-cngxsteprejection-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-vertical/vertical-sidebar-layout</example-url>
 */
@Directive({
  selector: '[cngxStep]',
  exportAs: 'cngxStep',
  standalone: true,
})
export class CngxStep {
  readonly id = input<string>(nextUid('cngx-step'));
  readonly disabled = input<boolean>(false);
  readonly completed = input<boolean>(false);
  readonly label = input<string>('');
  readonly errorAggregator = input<CngxErrorAggregatorContract | undefined>(
    undefined,
  );

  protected readonly labelSlot = contentChild(CngxStepLabel);
  protected readonly contentSlot = contentChild(CngxStepContent);

  readonly labelTemplate = this.labelSlot;
  readonly contentTemplate = this.contentSlot;

  /**
   * Per-step status derived from inputs + aggregator. `linkedSignal`
   * with structural equal — never written via `effect`.
   */
  readonly state: Signal<CngxStepStatus> = linkedSignal({
    source: () => ({
      disabled: this.disabled(),
      completed: this.completed(),
      errored: this.errorAggregator()?.hasError?.() ?? false,
    }),
    computation: ({ disabled, completed, errored }) => {
      if (disabled) {
        return 'disabled';
      }
      if (errored) {
        return 'error';
      }
      if (completed) {
        return 'success';
      }
      return 'idle';
    },
    equal: Object.is,
  });

  constructor() {
    const groupHost = inject(CNGX_STEP_GROUP_HOST, { optional: true });
    const stepperHost = inject(CNGX_STEPPER_HOST, { optional: true });
    const host = groupHost ?? stepperHost;
    if (!host) {
      // No enclosing presenter or group — atom can't register. Fail loud.
      throw new Error(
        'CngxStep: no enclosing CngxStepperPresenter or CngxStepGroup found. ' +
          'Wrap the step inside an element carrying [cngxStepper] or [cngxStepGroup].',
      );
    }
    const stepId = this.id();
    host.register({
      id: stepId,
      kind: 'step',
      label: this.label,
      disabled: this.disabled,
      state: this.state,
      errorAggregator: this.errorAggregator,
    });
    inject(DestroyRef).onDestroy(() => host.unregister(stepId));
  }
}
