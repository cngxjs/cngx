import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: path-chevron skin (vertical)',
  subtitle:
    'Vertical chevron tiles - the clip-path notch rotates onto the bottom edge so the flow reads top-to-bottom. Same skin, only <code>[orientation]="\'vertical\'"</code> changes; the tile shape adapts via the vertical-orientation scope rule.',
  description:
    'Vertical companion to the horizontal path-chevron demo. Each step is a downward-pointing chevron tile, and a thin diagonal gap separates the segments so the flow reads top-to-bottom. Active fills with the primary tone, completed with the success tone, errored with the danger tone. The tile fill alone carries state, so every tile stays label-only with the label centred - no indicator glyph or check, which keeps each segment the same width as the rest.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  setup: `protected readonly active = signal(2);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 4));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" skin="path-chevron" [orientation]="'vertical'" aria-label="Checkout">
    <div cngxStep label="Cart" [completed]="active() > 0">
      <ng-template cngxStepContent>
        <p>Review the items in the cart.</p>
      </ng-template>
    </div>
    <div cngxStep label="Address" [completed]="active() > 1">
      <ng-template cngxStepContent>
        <p>Enter the shipping address.</p>
      </ng-template>
    </div>
    <div cngxStep label="Shipping" [completed]="active() > 2">
      <ng-template cngxStepContent>
        <p>Pick a shipping option.</p>
      </ng-template>
    </div>
    <div cngxStep label="Payment" [completed]="active() > 3">
      <ng-template cngxStepContent>
        <p>Provide payment details.</p>
      </ng-template>
    </div>
    <div cngxStep label="Review">
      <ng-template cngxStepContent>
        <p>Review the order before placing it.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
