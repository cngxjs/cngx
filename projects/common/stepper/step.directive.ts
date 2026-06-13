import {
  computed,
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
import { CNGX_STEPPER_HOST, type CngxStepStatus } from './stepper-host.token';

/**
 * Single-step atom. Registers with the nearest host - either a
 * `CngxStepGroup` ({@link CNGX_STEP_GROUP_HOST}) or the root
 * `CngxStepperPresenter` ({@link CNGX_STEPPER_HOST}).
 *
 * `state` is a `linkedSignal` over `[disabled]`, `[completed]`, and
 * the optional `[errorAggregator]`'s `hasError()`.
 *
 * @category common/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/step.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepGroup, CngxStepperPresenter, CngxStepLabel, CngxStepContent
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-step-content/typed-lazy-panels</example-url>
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
  readonly errorAggregator = input<CngxErrorAggregatorContract | undefined>(undefined);

  /**
   * Direct error flag for the common "this step is invalid" case - no
   * `errorAggregator` boilerplate required. `true` or a non-empty string
   * drives the error state; a string doubles as the inline message
   * (surfaced via the `*cngxStepError` slot and the mini-skin aggregate
   * line). `false` / `''` clear it. The aggregator stays the rich
   * multi-source forms path; the two channels compose (either errors).
   */
  readonly error = input<string | boolean>(false);

  /**
   * Resolved direct-error message: the `[error]` string when non-empty,
   * else `undefined`. Carried onto the registration / node so the error
   * slot + aggregate line can render it. `computed` over the input -
   * never written.
   */
  readonly errorMessage: Signal<string | undefined> = computed(() => {
    const value = this.error();
    return typeof value === 'string' && value !== '' ? value : undefined;
  });

  protected readonly labelSlot = contentChild(CngxStepLabel);
  protected readonly contentSlot = contentChild(CngxStepContent);

  readonly labelTemplate = this.labelSlot;
  readonly contentTemplate = this.contentSlot;

  /**
   * Per-step status derived from inputs + aggregator. `linkedSignal`
   * with structural equal - never written via `effect`.
   */
  readonly state: Signal<CngxStepStatus> = linkedSignal({
    source: () => {
      const directError = this.error();
      return {
        disabled: this.disabled(),
        completed: this.completed(),
        errored:
          (directError !== false && directError !== '') ||
          (this.errorAggregator()?.hasError?.() ?? false),
      };
    },
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
      errorMessage: this.errorMessage,
    });
    inject(DestroyRef).onDestroy(() => host.unregister(stepId));
  }
}
