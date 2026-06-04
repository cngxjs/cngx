import { computed, Directive, effect, inject, input, output, type Signal } from '@angular/core';

import { CngxAsyncClick } from '@cngx/common/interactive';
import { createTransitionTracker } from '@cngx/core/utils';

import { CNGX_STEPPER_HOST, type CngxStepperHost } from '../stepper-host.token';

/**
 * Turns any clickable element into a stepper "Finish" control. Unlike
 * `CngxStepperNext` (which *reflects* the commit state and advances),
 * the finish action *runs*: the directive composes `CngxAsyncClick` via
 * `hostDirectives`, so the runner owns the click lifecycle, `aria-busy`,
 * and the pending-disable exactly as it does on a standalone button. The
 * finish action is fed through the aliased `[cngxStepperComplete]` input.
 *
 * Resolves its host like the sibling controls - explicit `[host]` input
 * falling back to the ambient {@link CNGX_STEPPER_HOST}. {@link isActive}
 * exposes whether the active step is the last one, so a consumer renders
 * the finish control only on the final step. `(completed)` emits once
 * after the action resolves successfully.
 *
 * ```html
 * @if (s.presenter.isLastStep()) {
 *   <button [cngxStepperComplete]="submit" (completed)="done()">Finish</button>
 * }
 * ```
 *
 * @category common/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/controls/stepper-complete.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepperNext, CngxStepperPrevious, CngxAsyncClick, CngxStepperHost
 */
@Directive({
  selector: '[cngxStepperComplete]',
  standalone: true,
  exportAs: 'cngxStepperComplete',
  hostDirectives: [
    {
      directive: CngxAsyncClick,
      inputs: [
        'cngxAsyncClick: cngxStepperComplete',
        'feedbackDuration',
        'enabled',
        'succeededAnnouncement',
        'failedAnnouncement',
      ],
    },
  ],
})
export class CngxStepperComplete {
  /**
   * Explicit stepper-host reference for placement *outside* the stepper
   * tree (`[host]="s.presenter"`). When unset, the ambient
   * {@link CNGX_STEPPER_HOST} is injected.
   */
  readonly host = input<CngxStepperHost | null>(null);

  /**
   * Emits once per `pending → success` transition of the finish action.
   * Does NOT re-emit when the `feedbackDuration` window resets the runner
   * back to idle - the transition tracker guards on the success edge only.
   */
  readonly completed = output<void>();

  private readonly injectedHost = inject(CNGX_STEPPER_HOST, { optional: true });
  private readonly resolvedHost = computed<CngxStepperHost | null>(
    () => this.host() ?? this.injectedHost,
  );
  private readonly runner = inject(CngxAsyncClick, { host: true });

  /** `true` when the active step is the last one - the finish step. */
  readonly isActive: Signal<boolean> = computed(() => this.resolvedHost()?.isLastStep() ?? false);

  constructor() {
    const tracker = createTransitionTracker(() => this.runner.status());
    effect(() => {
      if (tracker.current() === 'success' && tracker.previous() !== 'success') {
        this.completed.emit();
      }
    });
  }
}
