import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxProgressBarStepper: onboarding flow',
  subtitle: 'Bind <code>[(activeStepIndex)]</code> and let the embedded <code>&lt;cngx-progress&gt;</code> render the bar. <code>[showStepCount]</code> appends a <code>Step N of M</code> caption.',
  description: 'Five-step onboarding sequence. The progress bar tracks the active step ratio. Bar palette inherits Material via @cngx/themes/material/feedback-theme when bridged. Toggle "simulate error" to flag the Preferences step - the bar turns red and an error caption names the failing step beneath it.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'error-handling'],
  apiComponents: ['CngxProgressBarStepper', 'CngxStep'],
  moduleImports: [
    'import { CngxStep } from \'@cngx/common/stepper\';',
    'import { CngxProgressBarStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxProgressBarStepper', 'CngxStep'],
  setup: `protected readonly active = signal(0);
  protected readonly prefsInvalid = signal(false);
  protected readonly steps = [
    { heading: 'Account', body: 'Pick a username and verify the email address.' },
    { heading: 'Profile', body: 'Add an avatar and short bio so teammates know who you are.' },
    { heading: 'Preferences', body: 'Choose theme, notifications, and locale defaults.' },
    { heading: 'Connections', body: 'Link the apps you already use.' },
    { heading: 'Finish', body: 'Review and jump in.' },
  ];`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 4));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <article style="display:grid;gap:12px">
    <cngx-progress-bar-stepper
      [(activeStepIndex)]="active"
      [showStepCount]="true"
      aria-label="Onboarding"
    >
      <div cngxStep label="Account"></div>
      <div cngxStep label="Profile"></div>
      <div cngxStep label="Preferences" [error]="prefsInvalid()"></div>
      <div cngxStep label="Connections"></div>
      <div cngxStep label="Finish"></div>
    </cngx-progress-bar-stepper>
    @let step = steps[active()];
    <section aria-live="polite" style="display:grid;gap:4px;min-height:64px">
      <h4 style="margin:0">{{ step.heading }}</h4>
      <p style="margin:0">{{ step.body }}</p>
    </section>
  </article>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
      <label style="margin-inline-start:12px"><input type="checkbox" [checked]="prefsInvalid()" (change)="prefsInvalid.set($any($event.target).checked)" /> simulate error</label>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
