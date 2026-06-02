import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';

import {
  CngxStepperPresenter,
  CNGX_STEPPER_HOST,
  injectStepperI18n,
} from '@cngx/common/stepper';
import { CngxProgress } from '@cngx/ui/feedback';

/**
 * Progress-Bar stepper variant. Thin Level-4 organism composing
 * `CngxStepperPresenter` via `hostDirectives` and rendering the
 * existing `<cngx-progress>` primitive as the visual bar instead of
 * reinventing `<div role="progressbar">`. Material consumers inherit
 * Material progress styling through `CngxProgress` automatically.
 *
 * `completedPercent()` is `computed` from `presenter.activeStepIndex()`
 * and the count of step nodes in `presenter.flatSteps()`. Optional
 * `[showStepCount]` adds a `Step N of M` caption sourced from
 * `CngxStepperI18n.textStepperFormat`.
 *
 * @category ui/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/stepper/progress-bar-stepper.component.ts
 * @since 0.1.0
 * @relatedTo CngxStepperPresenter, CngxProgress, CngxDotStepper, CngxTextStepper
 * <example-url>http://localhost:4200/#/ui/stepper/progress-bar/onboarding-flow</example-url>
 */
@Component({
  selector: 'cngx-progress-bar-stepper',
  exportAs: 'cngxProgressBarStepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxProgress],
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: ['activeStepIndex', 'linear', 'orientation'],
      outputs: ['activeStepIndexChange'],
    },
  ],
  templateUrl: './progress-bar-stepper.component.html',
  styleUrl: './progress-bar-stepper.component.css',
  host: {
    class: 'cngx-progress-bar-stepper',
    role: 'group',
    '[attr.aria-roledescription]': '"stepper"',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
  },
})
export class CngxProgressBarStepper {
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** Render a `Step N of M` caption below the bar. Off by default. */
  readonly showStepCount = input<boolean>(false);

  protected readonly presenter = inject(CNGX_STEPPER_HOST);
  protected readonly i18n = injectStepperI18n();

  /** Total step count (group nodes excluded). */
  protected readonly totalSteps = computed<number>(() => this.presenter.stepsOnly().length);

  /** 1-based active position used in the caption format. */
  protected readonly currentStep = computed<number>(() => {
    const total = this.totalSteps();
    if (total === 0) {
      return 0;
    }
    return Math.min(this.presenter.activeStepIndex() + 1, total);
  });

  /**
   * Completion percentage 0-100. Reads `(active / max(total - 1, 1)) * 100`
   * so the final step renders the bar full. Equality is `Object.is` per
   * the cngx primitive-number computed rule.
   */
  protected readonly completedPercent = computed<number>(() => {
    const total = this.totalSteps();
    if (total === 0) {
      return 0;
    }
    const denominator = Math.max(total - 1, 1);
    return Math.max(0, Math.min(100, (this.presenter.activeStepIndex() / denominator) * 100));
  }, { equal: Object.is });

  protected readonly captionText = computed<string>(() =>
    this.i18n.textStepperFormat(this.currentStep(), this.totalSteps()),
  );
}
