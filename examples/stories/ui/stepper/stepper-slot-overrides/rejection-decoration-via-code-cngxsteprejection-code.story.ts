import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: custom step rejection slot',
  subtitle: 'Surface a commit rollback visually - when <code>commitAction</code> rejects, the presenter sets <code>lastFailedIndex</code> and the slot fires for the rejected step. Context is <code>{ failedIndex, originLabel?, node }</code>. Click the "Security" step header to advance; the first attempt rejects, the rejection-icon appears, and a retry succeeds.',
  description: 'Slot focus: <code>*cngxStepRejection</code>. The first commit to step 3 reliably rejects; the slot fires with <code>let-originLabel</code> so the SR phrase ("Rolled back to ...") is wired without consumer state.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants', 'error-handling'],
  apiComponents: [
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
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
      return Promise.reject(new Error('Security check failed - retry'));
    }
    return Promise.resolve(true);
  };`,
  template: `  <cngx-stepper
    [(activeStepIndex)]="active"
    [commitAction]="commitAction"
    commitMode="optimistic"
    aria-label="Slot-overrides - rejection"
  >
    <ng-template cngxStepRejection let-originLabel="originLabel">
      <span aria-hidden="true">&#8634;</span>
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
        <p>Step 2 - origin step for the upcoming rejection. Click the "Security" step header to attempt the commit; the first attempt fails.</p>
      </ng-template>
    </div>
    <div cngxStep label="Security">
      <ng-template cngxStepContent>
        <p>Step 3 - the commit target. The first attempt rejects with "Security check failed - retry"; the slot renders the rollback glyph until the second attempt succeeds.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Commit attempts</span><span class="event-value">{{ busyAttempts() }}</span></div>
  </div>`,
};
