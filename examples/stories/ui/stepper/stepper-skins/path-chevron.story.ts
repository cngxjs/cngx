import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: path-chevron skin',
  subtitle:
    'Each step is a clipped chevron tile - boarding-pass aesthetic. Opt in via <code>skin="path-chevron"</code> on the host or <code>provideStepperConfig(withStepperSkin(\'path-chevron\'))</code> at root.',
  description:
    'The path-chevron skin renders each step as a clip-path polygon with a notched right edge in horizontal orientation (rotated to the bottom edge in vertical). Active fills with the primary tone, completed with a 80% success tint, errored with the danger tone, upcoming reads as outline-only. The structural pattern lives entirely in CSS clip-path; the numbered indicator disc collapses to the glyph since the tile shape carries the state cue. ARIA attributes (<code>aria-current</code>, <code>data-state</code>) are unchanged from the classic skin.',
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
  template: `  <cngx-stepper [(activeStepIndex)]="active" skin="path-chevron" aria-label="Checkout">
    <div cngxStep label="Cart" [completed]="true">
      <ng-template cngxStepContent>
        <p>Review the items in the cart.</p>
      </ng-template>
    </div>
    <div cngxStep label="Address" [completed]="true">
      <ng-template cngxStepContent>
        <p>Enter the shipping address.</p>
      </ng-template>
    </div>
    <div cngxStep label="Shipping">
      <ng-template cngxStepContent>
        <p>Pick a shipping option.</p>
      </ng-template>
    </div>
    <div cngxStep label="Payment">
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
