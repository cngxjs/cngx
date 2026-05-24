import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: custom tab error badge slot',
  subtitle: 'Replace the default <code>!</code> glyph with a counter pill driven by the tab\'s aggregator. Context is <code>{ tab }</code>; the badge only renders when <code>tab.errorAggregator()?.shouldShow()</code> is truthy, so the slot is purely additive - no visibility plumbing in consumer markup. Toggle the "profile invalid" checkbox to flip the badge.',
  description: 'Slot focus: <code>*cngxTabErrorBadge</code>. Slot context exposes <code>let-tab</code> so the counter chip can read <code>tab.errorAggregator()?.errorCount()</code> directly without lifting state.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxTabGroup',
    'CngxTab',
    'CngxTabContent',
    'CngxTabErrorBadge',
  ],
  moduleImports: [
    'import { CngxTab, CngxTabContent, CngxTabErrorBadge } from \'@cngx/common/tabs\';',
    'import { CngxTabGroup } from \'@cngx/ui/tabs\';',
    'import { CngxErrorAggregator, CngxErrorSource } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabErrorBadge', 'CngxErrorAggregator', 'CngxErrorSource'],
  setup: `protected readonly active = signal(0);
  protected readonly profileInvalid = signal(true);`,
  template: `  <cngx-tab-group [(activeIndex)]="active" aria-label="Slot-overrides - error badge">
    <ng-template cngxTabErrorBadge let-tab="tab">
      <span class="chip demo-slot-error-pill">
        {{ tab.errorAggregator()?.errorCount() }}
      </span>
    </ng-template>
    <fieldset cngxErrorAggregator #profileAgg="cngxErrorAggregator" style="display:contents">
      <input cngxErrorSource="profile-name" [when]="profileInvalid()" hidden />
      <div cngxTab [label]="'Profile'" [errorAggregator]="profileAgg">
        <ng-template cngxTabContent>
          <p>Toggle "profile invalid" below - the badge counter pill appears with the aggregator's error count.</p>
        </ng-template>
      </div>
    </fieldset>
    <div cngxTab [label]="'Account'">
      <ng-template cngxTabContent>
        <p>No aggregator bound - no badge rendered.</p>
      </ng-template>
    </div>
  </cngx-tab-group>`,
  templateChrome: `<div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px);gap:8px">
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
};
