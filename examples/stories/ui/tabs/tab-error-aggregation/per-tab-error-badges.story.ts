import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Per-tab error badges',
  subtitle: 'Toggle the validity flags below — the tab badge appears the moment <code>aggregator.shouldShow()</code> turns true. The descriptor span carries the announcement phrase for SR; the ID is always present in the DOM, content is reactive (cngx A11y rule).',
  description: 'Bind <code>[errorAggregator]</code> on a tab to surface a badge + SR descriptor whenever the aggregator opts to show errors. Compose <code>CngxErrorAggregator</code> on a fieldset around the tab; the organism reads <code>shouldShow()</code> and <code>announcement()</code> reactively. NO duplicate aggregator — this is pure consumer composition over the existing primitive.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['error-handling', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxTabGroup',
    'CngxTab',
    'CngxTabContent',
    'CngxErrorAggregator',
    'CngxErrorSource',
  ],
  moduleImports: [
    'import { CngxTab, CngxTabContent } from \'@cngx/common/tabs\';',
    'import { CngxTabGroup } from \'@cngx/ui/tabs\';',
    'import { CngxErrorAggregator, CngxErrorSource } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxErrorAggregator', 'CngxErrorSource'],
  setup: `protected readonly active = signal(0);
  protected readonly profileInvalid = signal(true);
  protected readonly accountInvalid = signal(false);`,
  template: `
  <cngx-tab-group [(activeIndex)]="active" aria-label="Validated tabs">
    <fieldset cngxErrorAggregator #profileAgg="cngxErrorAggregator" style="display:contents">
      <input cngxErrorSource="profile-name" [when]="profileInvalid()" hidden />
      <div cngxTab [label]="'Profile'" [errorAggregator]="profileAgg">
        <ng-template cngxTabContent>
          <p>Profile fields go here. Toggle "profile invalid" to flip the badge.</p>
        </ng-template>
      </div>
    </fieldset>
    <fieldset cngxErrorAggregator #accountAgg="cngxErrorAggregator" style="display:contents">
      <input cngxErrorSource="account-email" [when]="accountInvalid()" hidden />
      <div cngxTab [label]="'Account'" [errorAggregator]="accountAgg">
        <ng-template cngxTabContent>
          <p>Account fields go here.</p>
        </ng-template>
      </div>
    </fieldset>
    <div cngxTab [label]="'Confirm'">
      <ng-template cngxTabContent><p>Final review.</p></ng-template>
    </div>
  </cngx-tab-group>
  <div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row" style="gap:8px">
      <label><input type="checkbox" [checked]="profileInvalid()" (change)="profileInvalid.set($any($event.target).checked)" /> profile invalid</label>
      <label><input type="checkbox" [checked]="accountInvalid()" (change)="accountInvalid.set($any($event.target).checked)" /> account invalid</label>
    </div>
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
