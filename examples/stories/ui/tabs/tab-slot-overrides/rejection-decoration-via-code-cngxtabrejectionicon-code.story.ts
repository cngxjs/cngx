import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: custom tab rejection icon slot',
  subtitle: 'Surface a commit rollback visually - when <code>commitAction</code> rejects, the presenter sets <code>lastFailedIndex</code> and the slot fires for the rejected tab. Context is <code>{ failedIndex, originLabel? }</code>. Click the "Security" tab; the first attempt rejects, the rejection-icon appears, and a retry succeeds.',
  description: 'Slot focus: <code>*cngxTabRejectionIcon</code>. First commit to tab 3 rejects, the slot fires with <code>let-originLabel</code> so the SR phrase wires up automatically and the rollback glyph stays until a successful retry.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants', 'error-handling'],
  apiComponents: [
    'CngxTabGroup',
    'CngxTab',
    'CngxTabContent',
    'CngxTabRejectionIcon',
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
      return Promise.reject(new Error('Security check failed - retry'));
    }
    return Promise.resolve(true);
  };`,
  template: `  <cngx-tab-group
    [(activeIndex)]="active"
    [commitAction]="commitAction"
    commitMode="optimistic"
    aria-label="Slot-overrides - rejection icon"
  >
    <ng-template cngxTabRejectionIcon let-originLabel="originLabel">
      <span aria-hidden="true">&#8634;</span>
      @if (originLabel) {
        <span class="cngx-sr-only">Rolled back to {{ originLabel }}</span>
      }
    </ng-template>
    <div cngxTab [label]="'Profile'">
      <ng-template cngxTabContent>
        <p>Tab 1 - origin tab for the upcoming rejection.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Notifications'">
      <ng-template cngxTabContent>
        <p>Tab 2.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Security'">
      <ng-template cngxTabContent>
        <p>Tab 3 - the commit target. The first click rejects with "Security check failed - retry"; the slot renders the rollback glyph until the second attempt succeeds.</p>
      </ng-template>
    </div>
  </cngx-tab-group>`,
  templateChrome: `<div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Commit attempts</span><span class="event-value">{{ busyAttempts() }}</span></div>
  </div>`,
};
