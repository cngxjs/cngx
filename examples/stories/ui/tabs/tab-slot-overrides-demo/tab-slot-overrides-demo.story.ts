import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Tabs — slot overrides',
  navLabel: 'Slot overrides',
  navCategory: 'tabs',
  description:
    'Override every visual region inside <code>&lt;cngx-tab-group&gt;</code> via the three new slot directives — <code>*cngxTabErrorBadge</code>, <code>*cngxTabRejectionIcon</code>, <code>*cngxTabBusySpinner</code>. Each slot ships a typed context object — destructure via <code>let-tab="tab"</code> / <code>let-failedIndex="failedIndex"</code> / <code>let-originLabel="originLabel"</code> / <code>let-intendedIndex="intendedIndex"</code>. Sibling-shape parity with the stepper Phase-3 slots, so consumer-authored templates port across families with zero re-authoring. The library renders sensible defaults; the slots are purely additive.',
  apiComponents: [
    'CngxTabGroup',
    'CngxTab',
    'CngxTabContent',
    'CngxTabErrorBadge',
    'CngxTabRejectionIcon',
    'CngxTabBusySpinner',
  ],
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  moduleImports: [
    "import { CngxTab, CngxTabBusySpinner, CngxTabContent, CngxTabErrorBadge, CngxTabRejectionIcon, type CngxTabsCommitAction } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
    "import { CngxErrorAggregator, CngxErrorSource } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly active = signal(0);
  protected readonly profileInvalid = signal(true);
  protected readonly busyAttempts = signal(0);
  protected readonly slowAttempts = signal(0);

  // Reject the first commit attempt onto tab 2 ('Security'); succeed
  // on retry. Drives the *cngxTabRejectionIcon slot — presenter sets
  // lastFailedIndex on the rejection arm and clears it on the next success.
  protected readonly commitAction: CngxTabsCommitAction = (_from, to) => {
    if (to === 2 && this.busyAttempts() === 0) {
      this.busyAttempts.update((n) => n + 1);
      return Promise.reject(new Error('Security check failed — retry'));
    }
    return Promise.resolve(true);
  };

  // Slow commit so the busy-spinner slot stays visible long enough to
  // observe. Resolves after 800ms — drives the *cngxTabBusySpinner slot.
  protected readonly slowCommit: CngxTabsCommitAction = () => {
    this.slowAttempts.update((n) => n + 1);
    return new Promise((resolve) => setTimeout(() => resolve(true), 800));
  };
  `,
  sections: [
    {
      title: 'Custom error badge via <code>*cngxTabErrorBadge</code>',
      subtitle:
        'Replace the default <code>!</code> glyph with a counter pill driven by the tab\'s aggregator. Context is <code>{ tab }</code>; the badge only renders when <code>tab.errorAggregator()?.shouldShow()</code> is truthy, so the slot is purely additive — no visibility plumbing in consumer markup. Toggle the "profile invalid" checkbox to flip the badge.',
      imports: [
        'CngxTabGroup',
        'CngxTab',
        'CngxTabContent',
        'CngxTabErrorBadge',
        'CngxErrorAggregator',
        'CngxErrorSource',
      ],
      template: `
  <cngx-tab-group [(activeIndex)]="active" aria-label="Slot-overrides — error badge">
    <ng-template cngxTabErrorBadge let-tab="tab">
      <span class="chip" style="background:#dc2626;color:#fff;font-size:0.7em;padding:0 6px">
        {{ tab.errorAggregator()?.errorCount() }}
      </span>
    </ng-template>
    <fieldset cngxErrorAggregator #profileAgg="cngxErrorAggregator" style="display:contents">
      <input cngxErrorSource="profile-name" [when]="profileInvalid()" hidden />
      <div cngxTab [label]="'Profile'" [errorAggregator]="profileAgg">
        <ng-template cngxTabContent>
          <p>Toggle "profile invalid" below — the badge counter pill appears with the aggregator's error count.</p>
        </ng-template>
      </div>
    </fieldset>
    <div cngxTab [label]="'Account'">
      <ng-template cngxTabContent>
        <p>No aggregator bound — no badge rendered.</p>
      </ng-template>
    </div>
  </cngx-tab-group>
  <div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px);gap:8px">
    <div class="event-row" style="gap:8px">
      <label>
        <input type="checkbox"
               [checked]="profileInvalid()"
               (change)="profileInvalid.set($any($event.target).checked)" />
        profile invalid
      </label>
    </div>
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
    },
    {
      title: 'Rejection-decoration via <code>*cngxTabRejectionIcon</code>',
      subtitle:
        'Surface a commit rollback visually — when <code>commitAction</code> rejects, the presenter sets <code>lastFailedIndex</code> and the slot fires for the rejected tab. Context is <code>{ failedIndex, originLabel? }</code>. Click the "Security" tab; the first attempt rejects, the rejection-icon appears, and a retry succeeds.',
      imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabRejectionIcon'],
      template: `
  <cngx-tab-group
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
  </cngx-tab-group>
  <div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Commit attempts</span><span class="event-value">{{ busyAttempts() }}</span></div>
  </div>`,
    },
    {
      title: 'Custom busy-spinner via <code>*cngxTabBusySpinner</code>',
      subtitle:
        'Replace the default pulse-animation span with branded markup while a commit is in flight. Slot context is <code>{ tab, intendedIndex }</code>; the slot only fires when the tab matches <code>presenter.intendedIndex()</code> with <code>commitState.status() === \'pending\'</code>. Click "Review" to trigger an 800ms pessimistic commit — the spinner slot replaces the default chrome on the target tab.',
      imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabBusySpinner'],
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
    },
  ],
};
