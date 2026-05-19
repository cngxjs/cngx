import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Rejection-decoration via <code>*cngxTabRejectionIcon</code>',
  subtitle: 'Surface a commit rollback visually — when <code>commitAction</code> rejects, the presenter sets <code>lastFailedIndex</code> and the slot fires for the rejected tab. Context is <code>{ failedIndex, originLabel? }</code>. Click the "Security" tab; the first attempt rejects, the rejection-icon appears, and a retry succeeds.',
  description: 'Override every visual region inside <code>&lt;cngx-tab-group&gt;</code> via the three new slot directives — <code>*cngxTabErrorBadge</code>, <code>*cngxTabRejectionIcon</code>, <code>*cngxTabBusySpinner</code>. Each slot ships a typed context object — destructure via <code>let-tab="tab"</code> / <code>let-failedIndex="failedIndex"</code> / <code>let-originLabel="originLabel"</code> / <code>let-intendedIndex="intendedIndex"</code>. Sibling-shape parity with the stepper Phase-3 slots, so consumer-authored templates port across families with zero re-authoring. The library renders sensible defaults; the slots are purely additive.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxTabGroup',
    'CngxTab',
    'CngxTabContent',
    'CngxTabErrorBadge',
    'CngxTabRejectionIcon',
    'CngxTabBusySpinner',
  ],
  moduleImports: [
    'import { CngxTab, CngxTabContent, CngxTabRejectionIcon, type CngxTabsCommitAction } from \'@cngx/common/tabs\';',
    'import { CngxTabGroup } from \'@cngx/ui/tabs\';',
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabRejectionIcon'],
  setup: `protected readonly active = signal(0);
  protected readonly busyAttempts = signal(0);
  protected readonly commitAction: CngxTabsCommitAction = (_from, to) => {
    if (to === 2 && this.busyAttempts() === 0) {
      this.busyAttempts.update((n) => n + 1);
      return Promise.reject(new Error('Security check failed — retry'));
    }
    return Promise.resolve(true);
  };`,
  template: `  <cngx-tab-group
    [(activeIndex)]="active"
    [commitAction]="commitAction"
    commitMode="optimistic"
    aria-label="Slot-overrides — rejection icon"
  >
    <ng-template cngxTabRejectionIcon let-originLabel="originLabel">
      <span aria-hidden="true">↶</span>
      @if (originLabel) {
        <span class="cngx-sr-only">Rolled back to {{ originLabel }}</span>
      }
    </ng-template>
    <div cngxTab [label]="'Profile'">
      <ng-template cngxTabContent>
        <p>Tab 1 — origin tab for the upcoming rejection.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Notifications'">
      <ng-template cngxTabContent>
        <p>Tab 2.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Security'">
      <ng-template cngxTabContent>
        <p>Tab 3 — the commit target. The first click rejects with "Security check failed — retry"; the slot renders the ↶ glyph until the second attempt succeeds.</p>
      </ng-template>
    </div>
  </cngx-tab-group>`,
  templateChrome: `<div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Commit attempts</span><span class="event-value">{{ busyAttempts() }}</span></div>
  </div>`,
};
