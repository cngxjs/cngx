import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';

import { CngxStep } from '@cngx/common/stepper';
import { CngxDotStepper, CngxProgressBarStepper, CngxTextStepper } from '@cngx/ui/stepper';

/**
 * The three indicator-only stepper variants under one Material 3 palette.
 *
 * `CngxProgressBarStepper`, `CngxDotStepper`, and `CngxTextStepper` each
 * honour the Material bridge: the progress bar inherits palette through
 * `CngxProgress`, the dot variant picks up the `--cngx-dot-step-*`
 * overrides, and the text variant follows the surrounding typography. The
 * stylesheet builds a real M3 theme in SCSS - `mat.theme` emits the
 * `--mat-sys-*` tokens and the published `@cngx/themes/material/stepper-theme`
 * bridge mixin maps the `--cngx-step-*` / `--cngx-dot-step-*` tokens onto
 * them, so nothing is hand-copied.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxProgressBarStepper, CngxDotStepper, CngxTextStepper, CngxStep],
  styleUrl: './variants-coverage.component.scss',
  template: `
    <div class="coverage">
      <section>
        <h3>CngxProgressBarStepper</h3>
        <cngx-progress-bar-stepper [(activeStepIndex)]="active" [showStepCount]="true" aria-label="Progress bar">
          <div cngxStep label="Customer"></div>
          <div cngxStep label="Payment"></div>
          <div cngxStep label="Review"></div>
        </cngx-progress-bar-stepper>
      </section>
      <section>
        <h3>CngxDotStepper</h3>
        <cngx-dot-stepper [(activeStepIndex)]="active" aria-label="Dots" tabindex="0">
          <div cngxStep label="Customer"></div>
          <div cngxStep label="Payment"></div>
          <div cngxStep label="Review"></div>
        </cngx-dot-stepper>
      </section>
      <section>
        <h3>CngxTextStepper</h3>
        <cngx-text-stepper [(activeStepIndex)]="active" [showCurrentLabel]="true">
          <div cngxStep label="Customer"></div>
          <div cngxStep label="Payment"></div>
          <div cngxStep label="Review"></div>
        </cngx-text-stepper>
      </section>
      <div class="coverage__toolbar">
        <button type="button" (click)="prev()">Previous</button>
        <button type="button" (click)="next()">Next</button>
        <span>Active step: {{ active() }}</span>
      </div>
    </div>
  `,
})
export class VariantsCoverageExample {
  protected readonly active = signal(1);

  protected next(): void {
    this.active.update((i) => Math.min(i + 1, 2));
  }

  protected prev(): void {
    this.active.update((i) => Math.max(i - 1, 0));
  }
}
