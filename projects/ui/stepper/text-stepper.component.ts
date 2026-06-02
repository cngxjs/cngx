import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  type Signal,
} from '@angular/core';

import {
  CngxStepperPresenter,
  CNGX_STEPPER_HOST,
  injectStepperI18n,
  type CngxStepNode,
} from '@cngx/common/stepper';

/**
 * Text stepper variant. Smallest possible stepper: a single
 * `<span aria-live="polite">` driven by the presenter. Renders
 * `Step N of M` by default (sourced from
 * `CngxStepperI18n.textStepperFormat`); optional `[showCurrentLabel]`
 * appends the active step's label next to the count. Material consumers
 * inherit surrounding text styling via CSS inheritance, no theme bridge
 * required.
 *
 * @category ui/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/stepper/text-stepper.component.ts
 * @since 0.1.0
 * @relatedTo CngxStepperPresenter, CngxProgressBarStepper, CngxDotStepper
 * <example-url>http://localhost:4200/#/ui/stepper/text-stepper/inline-progress</example-url>
 */
@Component({
  selector: 'cngx-text-stepper',
  exportAs: 'cngxTextStepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: ['activeStepIndex', 'linear'],
      outputs: ['activeStepIndexChange'],
    },
  ],
  templateUrl: './text-stepper.component.html',
  styleUrl: './text-stepper.component.css',
  host: {
    class: 'cngx-text-stepper',
  },
})
export class CngxTextStepper {
  /** Append the active step's label to the count text. Off by default. */
  readonly showCurrentLabel = input<boolean>(false);

  protected readonly presenter = inject(CNGX_STEPPER_HOST);
  protected readonly i18n = injectStepperI18n();

  protected readonly stepNodes: Signal<readonly CngxStepNode[]> = this.presenter.stepsOnly;

  protected readonly totalSteps = computed<number>(() => this.stepNodes().length);

  protected readonly currentStep = computed<number>(() => {
    const total = this.totalSteps();
    if (total === 0) {
      return 0;
    }
    return Math.min(this.presenter.activeStepIndex() + 1, total);
  });

  protected readonly stepText = computed<string>(() => {
    const base = this.i18n.textStepperFormat(this.currentStep(), this.totalSteps());
    if (!this.showCurrentLabel()) {
      return base;
    }
    const idx = this.presenter.activeStepIndex();
    const node = this.stepNodes()[idx];
    if (!node) {
      return base;
    }
    return `${base}: ${node.label()}`;
  });
}
