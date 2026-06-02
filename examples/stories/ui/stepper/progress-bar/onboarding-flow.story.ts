import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxProgressBarStepper: onboarding flow',
  subtitle: 'Bind <code>[(activeStepIndex)]</code> and let the embedded <code>&lt;cngx-progress&gt;</code> render the bar. <code>[showStepCount]</code> appends a <code>Step N of M</code> caption.',
  description: 'Five-step onboarding sequence. The progress bar tracks the active step ratio. Bar palette inherits Material via @cngx/themes/material/feedback-theme when bridged.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxProgressBarStepper', 'CngxStep'],
  moduleImports: [
    'import { CngxStep } from \'@cngx/common/stepper\';',
    'import { CngxProgressBarStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxProgressBarStepper', 'CngxStep'],
  setup: `protected readonly active = signal(0);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 4));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-progress-bar-stepper
    [(activeStepIndex)]="active"
    [showStepCount]="true"
    aria-label="Onboarding"
  >
    <div cngxStep label="Account"></div>
    <div cngxStep label="Profile"></div>
    <div cngxStep label="Preferences"></div>
    <div cngxStep label="Connections"></div>
    <div cngxStep label="Finish"></div>
  </cngx-progress-bar-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
