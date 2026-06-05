import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';

import {
  CngxStepperCount,
  CngxStepperPresenter,
  CNGX_STEPPER_GLYPHS,
  CNGX_STEPPER_HOST,
  createStepperStateView,
  injectStepperI18n,
  resolveStepperErrorSummary,
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
  imports: [CngxProgress, CngxStepperCount],
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: ['activeStepIndex', 'linear'],
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
    '[attr.data-state]': 'stateView.hasAnyError() ? "error" : null',
    '[attr.aria-invalid]': 'stateView.hasAnyError() ? "true" : null',
  },
})
export class CngxProgressBarStepper {
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** Render a `Step N of M` caption below the bar. Off by default. */
  readonly showStepCount = input<boolean>(false);

  protected readonly presenter = inject(CNGX_STEPPER_HOST);
  protected readonly i18n = injectStepperI18n();

  /** Shared per-step/aggregate state derivations - the single error source. */
  protected readonly stateView = createStepperStateView({
    presenter: this.presenter,
    stepsOnly: this.presenter.stepsOnly,
  });

  /** Default error glyph for the error caption. */
  protected readonly errorGlyph = CNGX_STEPPER_GLYPHS.errorBadge;

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
   * Completion percentage 0-100. `(active / max(total - 1, 1)) * 100`
   * so the final step renders the bar full.
   */
  protected readonly completedPercent = computed<number>(() => {
    const total = this.totalSteps();
    if (total === 0) {
      return 0;
    }
    const denominator = Math.max(total - 1, 1);
    return Math.max(0, Math.min(100, (this.presenter.activeStepIndex() / denominator) * 100));
  });

  protected readonly captionText = computed<string>(() =>
    this.i18n.textStepperFormat(this.currentStep(), this.totalSteps()),
  );

  /**
   * Aggregate error caption. A single errored step names itself
   * (`"Payment: Errored"`), several collapse to the i18n count phrase.
   * Read only when `stateView.hasAnyError()` gates the template.
   */
  protected readonly errorText = computed<string>(() =>
    resolveStepperErrorSummary(this.stateView, this.presenter.stepsOnly, this.i18n),
  );
}
