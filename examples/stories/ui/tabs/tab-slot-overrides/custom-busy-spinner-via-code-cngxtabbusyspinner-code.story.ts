import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom busy-spinner via <code>*cngxTabBusySpinner</code>',
  subtitle: 'Replace the default pulse-animation span with branded markup while a commit is in flight. Slot context is <code>{ tab, intendedIndex }</code>; the slot only fires when the tab matches <code>presenter.intendedIndex()</code> with <code>commitState.status() === \'pending\'</code>. Click "Review" to trigger an 800ms pessimistic commit — the spinner slot replaces the default chrome on the target tab.',
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
    'import { CngxTab, CngxTabBusySpinner, CngxTabContent, type CngxTabsCommitAction } from \'@cngx/common/tabs\';',
    'import { CngxTabGroup } from \'@cngx/ui/tabs\';',
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabBusySpinner'],
  setup: `protected readonly active = signal(0);
  protected readonly busyAttempts = signal(0);
  protected readonly slowAttempts = signal(0);
  protected readonly commitAction: CngxTabsCommitAction = (_from, to) => {
    if (to === 2 && this.busyAttempts() === 0) {
      this.busyAttempts.update((n) => n + 1);
      return Promise.reject(new Error('Security check failed — retry'));
    }
    return Promise.resolve(true);
  };
  protected readonly slowCommit: CngxTabsCommitAction = () => {
    this.slowAttempts.update((n) => n + 1);
    return new Promise((resolve) => setTimeout(() => resolve(true), 800));
  };`,
  template: `
  <cngx-tab-group
    [(activeIndex)]="active"
    [commitAction]="slowCommit"
    commitMode="pessimistic"
    aria-label="Slot-overrides — busy spinner"
  >
    <ng-template cngxTabBusySpinner let-intendedIndex="intendedIndex">
      <span aria-hidden="true" class="chip" style="padding:0 6px;font-size:0.7em;background:#1d4ed8;color:#fff">
        …syncing #{{ intendedIndex }}
      </span>
    </ng-template>
    <div cngxTab [label]="'Form'">
      <ng-template cngxTabContent>
        <p>Tab 1. Click "Review" to advance — the commit takes ~800ms in pessimistic mode.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Review'">
      <ng-template cngxTabContent>
        <p>Tab 2. Defaults restored after commit resolves.</p>
      </ng-template>
    </div>
  </cngx-tab-group>
  <div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Slow commit attempts</span><span class="event-value">{{ slowAttempts() }}</span></div>
  </div>`,
};
