import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: custom tab busy spinner slot',
  subtitle: 'Replace the default pulse-animation span with branded markup while a commit is in flight. Slot context is <code>{ tab, intendedIndex }</code>; the slot only fires when the tab matches <code>presenter.intendedIndex()</code> with <code>commitState.status() === \'pending\'</code>. Click "Review" to trigger an 800ms pessimistic commit - the spinner slot replaces the default chrome on the target tab.',
  description: 'Slot focus: <code>*cngxTabBusySpinner</code>. An 800ms pessimistic commit keeps the pending state on screen long enough to observe; the chip uses tokenised colors so the slot themes alongside the host.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxTabGroup',
    'CngxTab',
    'CngxTabContent',
    'CngxTabBusySpinner',
  ],
  moduleImports: [
    'import { CngxTab, CngxTabBusySpinner, CngxTabContent, type CngxTabsCommitAction } from \'@cngx/common/tabs\';',
    'import { CngxTabGroup } from \'@cngx/ui/tabs\';',
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabBusySpinner'],
  setup: `protected readonly active = signal(0);
  protected readonly slowAttempts = signal(0);
  protected readonly slowCommit: CngxTabsCommitAction = () => {
    this.slowAttempts.update((n) => n + 1);
    return new Promise((resolve) => setTimeout(() => resolve(true), 800));
  };`,
  template: `  <cngx-tab-group
    [(activeIndex)]="active"
    [commitAction]="slowCommit"
    commitMode="pessimistic"
    aria-label="Slot-overrides - busy spinner"
  >
    <ng-template cngxTabBusySpinner let-intendedIndex="intendedIndex">
      <span aria-hidden="true" class="chip demo-slot-busy">
        ...syncing #{{ intendedIndex }}
      </span>
    </ng-template>
    <div cngxTab [label]="'Form'">
      <ng-template cngxTabContent>
        <p>Tab 1. Click "Review" to advance - the commit takes ~800ms in pessimistic mode.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Review'">
      <ng-template cngxTabContent>
        <p>Tab 2. Defaults restored after commit resolves.</p>
      </ng-template>
    </div>
  </cngx-tab-group>`,
  templateChrome: `<div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Slow commit attempts</span><span class="event-value">{{ slowAttempts() }}</span></div>
  </div>`,
};
