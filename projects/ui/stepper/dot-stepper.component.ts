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
 * Dot stepper variant. Mobile-first sequential-flow indicator. Renders
 * one `<span role="presentation">` per step inside a
 * `<div role="group" aria-roledescription="Step indicator">`. The active
 * dot carries `aria-current="step"` per the W3C APG step-indicator
 * pattern (NOT `role="tablist"` / `role="tab"` - those are reserved
 * for parallel content panels, not sequential flow).
 *
 * Theming flows through new `--cngx-dot-step-*` custom properties whose
 * defaults cascade through `var(--cngx-step-active-fill, ...)`, so the
 * Phase A active-fill chain reaches the dot variant without duplication.
 *
 * @category ui/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/stepper/dot-stepper.component.ts
 * @since 0.1.0
 * @relatedTo CngxStepperPresenter, CngxProgressBarStepper, CngxTextStepper
 * <example-url>http://localhost:4200/#/ui/stepper/dot-stepper/mobile-carousel</example-url>
 */
@Component({
  selector: 'cngx-dot-stepper',
  exportAs: 'cngxDotStepper',
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
  templateUrl: './dot-stepper.component.html',
  styleUrl: './dot-stepper.component.css',
  host: {
    class: 'cngx-dot-stepper',
    role: 'group',
    '[attr.aria-roledescription]': 'i18n.stepIndicatorRoleDescription',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '(keydown)': 'handleKeyDown($event)',
  },
})
export class CngxDotStepper {
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  protected readonly presenter = inject(CNGX_STEPPER_HOST);
  protected readonly i18n = injectStepperI18n();

  protected readonly flatSteps: Signal<readonly CngxStepNode[]> = this.presenter.flatSteps;

  protected readonly stepNodes = computed<readonly CngxStepNode[]>(
    () => this.flatSteps().filter((n) => n.kind === 'step'),
    { equal: (a, b) => a.length === b.length && a.every((n, i) => n.id === b[i].id) },
  );

  protected readonly activeIndex = computed<number>(() => this.presenter.activeStepIndex());

  protected isActive(node: CngxStepNode, index: number): boolean {
    return index === this.activeIndex() && node.kind === 'step';
  }

  protected ariaLabelFor(node: CngxStepNode, index: number): string {
    return this.i18n.selectedStep(node.label(), index + 1, this.stepNodes().length);
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    if (this.presenter.linear()) {
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.presenter.selectNext();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.presenter.selectPrevious();
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.presenter.select(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.presenter.select(this.stepNodes().length - 1);
    }
  }
}
