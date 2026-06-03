import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: custom busy spinner slot',
  subtitle:
    "Replace the default pulse-animation span with branded markup while a commit is in flight. Slot context is <code>{ node }</code>; the slot only fires when the step row matches <code>presenter.intendedStepIndex()</code> with <code>commitState.status() === 'pending'</code>. Click the Review step header to trigger an 800ms pessimistic commit - the spinner slot replaces the default chrome on the target row.",
  description:
    'Slot focus: <code>*cngxStepBusySpinner</code>. An 800ms pessimistic commit reliably triggers the pending state so the slot is observable, and the spinner chip carries a tokenised background so it themes with the host.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepBusySpinner'],
  moduleImports: [
    "import { CngxStep, CngxStepBusySpinner, CngxStepContent, type CngxStepperCommitAction } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepBusySpinner', 'CngxStepContent'],
  setup: `protected readonly active = signal(0);
  protected readonly slowAttempts = signal(0);
  protected readonly slowCommit: CngxStepperCommitAction = () => {
    this.slowAttempts.update((n) => n + 1);
    return new Promise((resolve) => setTimeout(() => resolve(true), 800));
  };`,
  template: `  <cngx-stepper
    [(activeStepIndex)]="active"
    [commitAction]="slowCommit"
    commitMode="pessimistic"
    aria-label="Slot-overrides - busy spinner"
  >
    <ng-template cngxStepBusySpinner>
      <span aria-hidden="true" class="chip demo-slot-busy">...syncing</span>
    </ng-template>
    <div cngxStep label="Form">
      <ng-template cngxStepContent>
        <p>Step 1. Click the Review step header to advance - the commit takes ~800ms in pessimistic mode.</p>
      </ng-template>
    </div>
    <div cngxStep label="Review">
      <ng-template cngxStepContent>
        <p>Step 2. Defaults restored after commit resolves.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Slow commit attempts</span><span class="event-value">{{ slowAttempts() }}</span></div>
  </div>`,
};
