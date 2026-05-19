import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom busy-spinner via <code>*cngxStepBusySpinner</code>',
  subtitle: 'Replace the default pulse-animation span with branded markup while a commit is in flight. Slot context is <code>{ node }</code>; the slot only fires when the step row matches <code>presenter.intendedStepIndex()</code> with <code>commitState.status() === \'pending\'</code>. Press Next to trigger an 800ms pessimistic commit — the spinner slot replaces the default chrome on the target row.',
  description: 'Override every visual region inside <code>&lt;cngx-stepper&gt;</code> via the six new slot directives — <code>*cngxStepIndicator</code>, <code>*cngxStepBadge</code>, <code>*cngxStepBusySpinner</code>, <code>*cngxStepRejection</code>, <code>*cngxStepGroupHeader</code>, <code>*cngxStepperEmpty</code>. Each slot ships a typed context object — destructure via <code>let-status="status"</code> / <code>let-failedIndex="failedIndex"</code> / <code>let-group="group"</code> / etc. The library renders sensible defaults; the slots are purely additive.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxStepper',
    'CngxStep',
    'CngxStepGroup',
    'CngxStepContent',
    'CngxStepIndicator',
    'CngxStepBadge',
    'CngxStepBusySpinner',
    'CngxStepGroupHeader',
    'CngxStepperEmpty',
    'CngxStepRejection',
  ],
  moduleImports: [
    'import { CngxStep, CngxStepBusySpinner, CngxStepContent, type CngxStepperCommitAction } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepBusySpinner', 'CngxStepContent'],
  setup: `protected readonly active = signal(0);
  protected readonly busyAttempts = signal(0);
  protected readonly slowAttempts = signal(0);
  protected readonly commitAction: CngxStepperCommitAction = (_from, to) => {
    if (to === 2 && this.busyAttempts() === 0) {
      this.busyAttempts.update((n) => n + 1);
      return Promise.reject(new Error('Security check failed — retry'));
    }
    return Promise.resolve(true);
  };
  protected readonly slowCommit: CngxStepperCommitAction = () => {
    this.slowAttempts.update((n) => n + 1);
    return new Promise((resolve) => setTimeout(() => resolve(true), 800));
  };`,
  template: `  <cngx-stepper
    [(activeStepIndex)]="active"
    [commitAction]="slowCommit"
    commitMode="pessimistic"
    aria-label="Slot-overrides — busy spinner"
  >
    <ng-template cngxStepBusySpinner>
      <span aria-hidden="true" class="chip" style="padding:0 6px;font-size:0.7em;background:#1d4ed8;color:#fff">…syncing</span>
    </ng-template>
    <div cngxStep label="Form">
      <ng-template cngxStepContent>
        <p>Step 1. Press Next to advance — the commit takes ~800ms in pessimistic mode.</p>
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
