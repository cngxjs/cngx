import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom error badge via <code>*cngxTabErrorBadge</code>',
  subtitle: 'Replace the default <code>!</code> glyph with a counter pill driven by the tab\'s aggregator. Context is <code>{ tab }</code>; the badge only renders when <code>tab.errorAggregator()?.shouldShow()</code> is truthy, so the slot is purely additive — no visibility plumbing in consumer markup. Toggle the "profile invalid" checkbox to flip the badge.',
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
    'import { CngxTab, CngxTabContent, CngxTabErrorBadge } from \'@cngx/common/tabs\';',
    'import { CngxTabGroup } from \'@cngx/ui/tabs\';',
    'import { CngxErrorAggregator, CngxErrorSource } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabErrorBadge', 'CngxErrorAggregator', 'CngxErrorSource'],
  setup: `protected readonly active = signal(0);
  protected readonly profileInvalid = signal(true);`,
  template: `  <cngx-tab-group [(activeIndex)]="active" aria-label="Slot-overrides — error badge">
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
