import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Rejection-decoration via <code>*cngxStepRejection</code>',
  subtitle: 'Surface a commit rollback visually — when <code>commitAction</code> rejects, the presenter sets <code>lastFailedIndex</code> and the slot fires for the rejected step. Context is <code>{ failedIndex, originLabel?, node }</code>. Click "Next" to advance to "Security"; the first attempt rejects, the rejection-icon appears, and a retry succeeds.',
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
    'import { CngxStep, CngxStepContent, type CngxStepperCommitAction, CngxStepRejection } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepRejection'],
  setup: `protected readonly active = signal(0);
  protected readonly busyAttempts = signal(0);
  protected readonly commitAction: CngxStepperCommitAction = (_from, to) => {
    if (to === 2 && this.busyAttempts() === 0) {
      this.busyAttempts.update((n) => n + 1);
      return Promise.reject(new Error('Security check failed — retry'));
    }
    return Promise.resolve(true);
  };`,
  template: `  <cngx-stepper
    [(activeStepIndex)]="active"
    [commitAction]="commitAction"
    commitMode="optimistic"
    aria-label="Slot-overrides — rejection"
  >
    <ng-template cngxStepRejection let-originLabel="originLabel">
      <span aria-hidden="true">↶</span>
      @if (originLabel) {
        <span class="cngx-sr-only">Rolled back to {{ originLabel }}</span>
      }
    </ng-template>
    <div cngxStep label="Profile">
      <ng-template cngxStepContent>
        <p>Step 1.</p>
      </ng-template>
    </div>
    <div cngxStep label="Notifications">
      <ng-template cngxStepContent>
        <p>Step 2 — origin step for the upcoming rejection. Press Next to attempt the commit; the first attempt fails.</p>
      </ng-template>
    </div>
    <div cngxStep label="Security">
      <ng-template cngxStepContent>
        <p>Step 3 — the commit target. The first attempt rejects with "Security check failed — retry"; the slot renders the ↶ glyph until the second attempt succeeds.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Commit attempts</span><span class="event-value">{{ busyAttempts() }}</span></div>
  </div>`,
};
