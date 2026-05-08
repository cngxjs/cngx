import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Stepper — slot overrides',
  navLabel: 'Slot overrides',
  navCategory: 'stepper',
  description:
    'Override the visual regions inside <code>&lt;cngx-stepper&gt;</code> via the six new slot directives — <code>*cngxStepIndicator</code>, <code>*cngxStepBadge</code>, <code>*cngxStepBusySpinner</code>, <code>*cngxStepRejection</code>, <code>*cngxStepGroupHeader</code>, <code>*cngxStepperEmpty</code>. Three sections demonstrate the consumer-visible triad consumers ask for first: a custom indicator glyph, a custom error badge, and a rejection-decoration that surfaces commit rollback. Each slot has a typed context object — destructure via <code>let-status="status"</code> / <code>let-failedIndex="failedIndex"</code> / etc.',
  apiComponents: [
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
    'CngxStepIndicator',
    'CngxStepBadge',
    'CngxStepRejection',
  ],
  moduleImports: [
    "import { CngxStep, CngxStepBadge, CngxStepContent, CngxStepIndicator, type CngxStepperCommitAction, CngxStepRejection } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  setup: `
  protected readonly active = signal(0);
  protected readonly busyAttempts = signal(0);

  // Reject the first commit attempt onto step 2 ('Security'); succeed
  // on retry. Drives the *cngxStepRejection slot — presenter sets
  // lastFailedIndex on the rejection arm and clears it on the next success.
  protected readonly commitAction: CngxStepperCommitAction = (_from, to) => {
    if (to === 2 && this.busyAttempts() === 0) {
      this.busyAttempts.update((n) => n + 1);
      return Promise.reject(new Error('Security check failed — retry'));
    }
    return Promise.resolve(true);
  };
  `,
  sections: [
    {
      title: 'Custom indicator glyph via <code>*cngxStepIndicator</code>',
      subtitle:
        'Replace the default 1-based number with a status-aware glyph (✓ on success, ✕ on error, fallback to position number). The slot context carries <code>{ position, node, active, status, busy }</code> — destructure what you need.',
      imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepIndicator'],
      template: `
  <cngx-stepper [(activeStepIndex)]="active" aria-label="Slot-overrides — indicator">
    <ng-template cngxStepIndicator let-position let-status="status">
      @if (status === 'success') {
        <span aria-hidden="true">✓</span>
      } @else if (status === 'error') {
        <span aria-hidden="true">✕</span>
      } @else {
        <span aria-hidden="true">{{ position }}</span>
      }
    </ng-template>
    <div cngxStep label="Profile">
      <ng-template cngxStepContent>
        <p>Indicator glyph is now status-aware — finish this step (advance) and the badge becomes ✓.</p>
      </ng-template>
    </div>
    <div cngxStep label="Address">
      <ng-template cngxStepContent>
        <p>Same glyph contract — the slot fires once per step row, status comes from <code>node.state()</code>.</p>
      </ng-template>
    </div>
    <div cngxStep label="Done">
      <ng-template cngxStepContent>
        <p>Final step. Notice the indicator on completed steps.</p>
      </ng-template>
    </div>
  </cngx-stepper>
  <div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
    },
    {
      title: 'Custom error badge via <code>*cngxStepBadge</code>',
      subtitle:
        'Replace the default <code>!</code> glyph with a counter pill driven by the step\'s aggregator. Context is <code>{ count, node }</code>; the badge only renders when <code>node.errorAggregator()?.shouldShow()</code> is truthy, so the slot is purely additive — no visibility plumbing in consumer markup.',
      imports: ['CngxStepper', 'CngxStep', 'CngxStepBadge', 'CngxStepContent'],
      template: `
  <cngx-stepper [(activeStepIndex)]="active" aria-label="Slot-overrides — badge">
    <ng-template cngxStepBadge let-count="count">
      <span class="chip" style="background:#dc2626;color:#fff;font-size:0.7em;padding:0 6px">{{ count }}</span>
    </ng-template>
    <div cngxStep label="Profile">
      <ng-template cngxStepContent>
        <p>No errors registered — no badge rendered.</p>
      </ng-template>
    </div>
    <div cngxStep label="Validation">
      <ng-template cngxStepContent>
        <p>The aggregator integration belongs to the consumer; in production wire <code>[errorAggregator]</code> on the <code>cngxStep</code> directive. The slot context's <code>count</code> field is the same source of truth as the default <code>!</code> glyph.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
    },
    {
      title: 'Rejection-decoration via <code>*cngxStepRejection</code>',
      subtitle:
        'Surface a commit rollback visually — when <code>commitAction</code> rejects, the presenter sets <code>lastFailedIndex</code> and the slot fires for the rejected step. Context is <code>{ failedIndex, originLabel?, node }</code>. Click "Next" to advance to "Security"; the first attempt rejects, the rejection-icon appears, and a retry succeeds.',
      imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepRejection'],
      template: `
  <cngx-stepper
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
  </cngx-stepper>
  <div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Commit attempts</span><span class="event-value">{{ busyAttempts() }}</span></div>
  </div>`,
    },
  ],
};
