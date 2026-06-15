import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';

import { CngxStep } from '@cngx/common/stepper';
import { CngxStepper } from '@cngx/ui/stepper';

/**
 * Every `CngxStepper` skin rendered against a Material 3 palette.
 *
 * The example's stylesheet builds a real M3 theme in SCSS: `mat.theme`
 * emits the `--mat-sys-*` system tokens, then the published
 * `@cngx/themes/material/stepper-theme` bridge maps every `--cngx-step-*`
 * onto its Material counterpart:
 *
 * ```scss
 * @use '@angular/material' as mat;
 * @use '@cngx/themes/material/stepper-theme' as stepper;
 *
 * $theme: mat.define-theme((color: (theme-type: light, primary: mat.$azure-palette)));
 * html {
 *   @include mat.theme($theme);
 *   @include stepper.theme($theme);
 * }
 * ```
 *
 * So each skin inherits primary / error / surface / tertiary colours from
 * the Material palette with no per-skin overrides and no hand-copied tokens.
 * `ViewEncapsulation.None` lets the global `html` theme and the
 * `:where(cngx-stepper)` bridge rules reach the steppers.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxStepper, CngxStep],
  styleUrl: './skins-coverage.component.scss',
  template: `
    <div class="coverage">
      <section>
        <h3>classic</h3>
        <cngx-stepper [(activeStepIndex)]="active" aria-label="Classic skin">
          <div cngxStep label="Customer" [completed]="active() > 0"></div>
          <div cngxStep label="Payment" [completed]="active() > 1"></div>
          <div cngxStep label="Review"></div>
        </cngx-stepper>
      </section>
      <section>
        <h3>linear-minimal</h3>
        <cngx-stepper [(activeStepIndex)]="active" skin="linear-minimal" aria-label="Linear minimal">
          <div cngxStep label="Customer" [completed]="active() > 0"></div>
          <div cngxStep label="Payment" [completed]="active() > 1"></div>
          <div cngxStep label="Review"></div>
        </cngx-stepper>
      </section>
      <section>
        <h3>stripe-status-rich</h3>
        <cngx-stepper [(activeStepIndex)]="active" skin="stripe-status-rich" aria-label="Stripe status rich">
          <div cngxStep label="Customer" [completed]="active() > 0"></div>
          <div cngxStep label="Payment" [completed]="active() > 1"></div>
          <div cngxStep label="Review"></div>
        </cngx-stepper>
      </section>
      <section>
        <h3>path-chevron</h3>
        <cngx-stepper [(activeStepIndex)]="active" skin="path-chevron" aria-label="Path chevron">
          <div cngxStep label="Customer" [completed]="active() > 0"></div>
          <div cngxStep label="Payment" [completed]="active() > 1"></div>
          <div cngxStep label="Review"></div>
        </cngx-stepper>
      </section>
      <section>
        <h3>pill-segment</h3>
        <cngx-stepper [(activeStepIndex)]="active" skin="pill-segment" aria-label="Pill segment">
          <div cngxStep label="Customer" [completed]="active() > 0"></div>
          <div cngxStep label="Payment" [completed]="active() > 1"></div>
          <div cngxStep label="Review"></div>
        </cngx-stepper>
      </section>
      <section>
        <h3>chips</h3>
        <cngx-stepper [(activeStepIndex)]="active" skin="chips" aria-label="Chips">
          <div cngxStep label="Customer" [completed]="active() > 0"></div>
          <div cngxStep label="Payment" [completed]="active() > 1"></div>
          <div cngxStep label="Review"></div>
        </cngx-stepper>
      </section>
      <section>
        <h3>breadcrumb</h3>
        <cngx-stepper [(activeStepIndex)]="active" skin="breadcrumb" aria-label="Breadcrumb">
          <div cngxStep label="Customer" [completed]="active() > 0"></div>
          <div cngxStep label="Payment" [completed]="active() > 1"></div>
          <div cngxStep label="Review"></div>
        </cngx-stepper>
      </section>
      <div class="coverage__toolbar">
        <button type="button" (click)="prev()">Previous</button>
        <button type="button" (click)="next()">Next</button>
        <span>Active step: {{ active() }}</span>
      </div>
    </div>
  `,
})
export class SkinsCoverageExample {
  protected readonly active = signal(1);

  constructor() {
    const doc = inject(DOCUMENT);
    doc.body.classList.add('mat-typography', 'mat-app-background');
    // Roboto via a runtime <link> - the StackBlitz scaffold only wires the
    // font when Material auto-detect fires (a <mat-*> selector), which a
    // cngx-only template never triggers. A <link> beats a CSS @import that can
    // land below other rules in the concatenated sheet and be ignored.
    const font = doc.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap';
    doc.head.appendChild(font);
  }

  protected next(): void {
    this.active.update((i) => Math.min(i + 1, 2));
  }

  protected prev(): void {
    this.active.update((i) => Math.max(i - 1, 0));
  }
}
