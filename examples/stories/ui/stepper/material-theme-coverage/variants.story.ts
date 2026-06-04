import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxProgressBarStepper: material theme coverage across variants',
  subtitle:
    'The 3 Phase-C variants (<code>CngxProgressBarStepper</code>, <code>CngxDotStepper</code>, <code>CngxTextStepper</code>) rendered under the Material color mixin. The mixin extends the dot variant with <code>--cngx-dot-step-*</code> overrides; the progress-bar inherits palette through <code>CngxProgress</code>; the text variant inherits typography from the surrounding context.',
  description:
    'Demonstrates that every Phase-C variant honours Material palette tokens without consumer-side workarounds. Three sections, three variants, one shared active index.',
  level: 'organism',
  audience: ['design', 'dev'],
  artifact: 'standalone',
  focus: ['visual-variants', 'integration'],
  apiComponents: [
    'CngxProgressBarStepper',
    'CngxDotStepper',
    'CngxTextStepper',
    'CngxStep',
  ],
  moduleImports: [
    "import { CngxStep } from '@cngx/common/stepper';",
    "import { CngxProgressBarStepper, CngxDotStepper, CngxTextStepper } from '@cngx/ui/stepper';",
  ],
  imports: [
    'CngxProgressBarStepper',
    'CngxDotStepper',
    'CngxTextStepper',
    'CngxStep',
  ],
  setup: `protected readonly active = signal(1);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <div class="cngx-stepper-mat-variant-coverage">
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
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
