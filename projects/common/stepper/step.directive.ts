import {
  computed,
  contentChild,
  DestroyRef,
  Directive,
  inject,
  input,
  type OnInit,
  type Signal,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import { CNGX_STEP_GROUP_HOST } from './step-group-host.token';
import { CngxStepContent } from './step-content.directive';
import { CngxStepLabel } from './step-label.directive';
import {
  CNGX_STEPPER_HOST,
  type CngxStepRegistration,
  type CngxStepStatus,
} from './stepper-host.token';

/**
 * Single-step atom. Registers with the nearest host - either a
 * `CngxStepGroup` ({@link CNGX_STEP_GROUP_HOST}) or the root
 * `CngxStepperPresenter` ({@link CNGX_STEPPER_HOST}).
 *
 * `state` is a pure `computed` over `[disabled]`, `[completed]`, and
 * the optional `[errorAggregator]`'s `hasError()`.
 *
 * @category common/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/step.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepGroup, CngxStepperPresenter, CngxStepLabel, CngxStepContent
 * @slot cngxStepLabel The step's own header label.
 * @slot cngxStepContent The step body, rendered lazily when the step activates.
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-step-content/typed-lazy-panels</example-url>
 */
@Directive({
  selector: '[cngxStep]',
  exportAs: 'cngxStep',
  standalone: true,
})
export class CngxStep implements OnInit {
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
   * Per-step status derived from inputs + aggregator. Pure `computed` -
   * nothing ever writes it, so the writable `linkedSignal` shape it
   * shipped with was surface without a writer.
   */
  readonly state: Signal<CngxStepStatus> = computed(
    () => {
      if (this.disabled()) {
        return 'disabled';
      }
      const directError = this.error();
      const errored =
        (directError !== false && directError !== '') ||
        (this.errorAggregator()?.hasError?.() ?? false);
      if (errored) {
        return 'error';
      }
      if (this.completed()) {
        return 'success';
      }
      return 'idle';
    },
    { equal: Object.is },
  );

  private readonly groupHost = inject(CNGX_STEP_GROUP_HOST, { optional: true });
  private readonly stepperHost = inject(CNGX_STEPPER_HOST, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (!this.groupHost && !this.stepperHost) {
      throw new Error(
        'CngxStep: no enclosing CngxStepperPresenter or CngxStepGroup found. ' +
          'Wrap the step inside an element carrying [cngxStepper] or [cngxStepGroup].',
      );
    }
  }

  ngOnInit(): void {
    // Register in ngOnInit, NOT the constructor: a bound `[id]` signal
    // input is not applied until the first change detection, so a
    // constructor read captures the default auto-id. The registered id is
    // the key the router-sync deep-link seed and consumers match against,
    // so it must reflect the bound `[id]`. ngOnInit still runs before the
    // host's ngAfterContentInit, so the seed's registry precondition holds;
    // and it fires ancestor-group-before-descendant-step in DOM order, so
    // the presenter's insertion-order tree is unchanged. Mirrors CngxTab.
    const host = this.groupHost ?? this.stepperHost!;
    const stepId = this.id();
    const handle: CngxStepRegistration = {
      id: stepId,
      kind: 'step',
      label: this.label,
      disabled: this.disabled,
      state: this.state,
      errorAggregator: this.errorAggregator,
      errorMessage: this.errorMessage,
    };
    host.register(handle);
    this.destroyRef.onDestroy(() => host.unregister(stepId, handle));
  }
}
