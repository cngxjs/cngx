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
 * Single-step atom. Registers with the nearest enclosing host —
 * either a `CngxStepGroup` (via {@link CNGX_STEP_GROUP_HOST}) or
 * the root `CngxStepperPresenter` (via {@link CNGX_STEPPER_HOST}).
 *
 * Inputs are pure data; reactive state derivation lives in the
 * `state` linkedSignal which combines `[disabled]`, `[completed]`,
 * the optional `[errorAggregator]`'s `hasError()`, and the
 * presenter's per-step pending flag.
 *
 * @category interactive
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
   * Per-step status derived from inputs + aggregator + presenter
   * commit lifecycle. Uses `linkedSignal` per
   * `reference_signal_architecture` Equality Rule — never write
   * via an `effect`.
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
      // Dev-only error: a stepper atom outside any host can't
      // contribute to the registry. The Level-2 contract requires
      // the consumer to compose the presenter directive on an
      // ancestor — surface this loudly.
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
      errorAggregator: this.errorAggregator(),
    });
    inject(DestroyRef).onDestroy(() => host.unregister(stepId));
  }
}
