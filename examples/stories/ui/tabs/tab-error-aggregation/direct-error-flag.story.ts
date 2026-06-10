import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: direct error flag',
  subtitle: 'Bind <code>[error]</code> straight from a validity signal - no <code>CngxErrorAggregator</code>, no hidden source DOM. A non-empty string lights the badge and doubles as the SR descriptor message.',
  description: 'The simple-case error channel on <code>CngxTab</code>, mirroring <code>CngxStep</code>. <code>[error]="msg"</code> (string) or <code>[error]="flag"</code> (boolean) flips the folded <code>hasError</code>; the organism lights the badge and the always-present descriptor span carries the message for AT. The aggregator stays the opt-in multi-source path; the two channels compose.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['error-handling', 'a11y-pattern', 'composition'],
  references: [
    { label: 'WAI-ARIA APG - Tabs', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
  ],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  moduleImports: [
    'import { CngxTab, CngxTabContent } from \'@cngx/common/tabs\';',
    'import { CngxTabGroup } from \'@cngx/ui/tabs\';',
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  setup: `protected readonly active = signal(0);
  protected readonly detailsInvalid = signal(true);`,
  template: `  <cngx-tab-group [(activeIndex)]="active" aria-label="Checkout steps">
    <div cngxTab [label]="'Details'" [error]="detailsInvalid() ? 'Required fields missing' : false">
      <ng-template cngxTabContent>
        <p>Toggle "details invalid" to flip the badge on this tab.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Payment'">
      <ng-template cngxTabContent><p>Payment fields go here.</p></ng-template>
    </div>
    <div cngxTab [label]="'Review'">
      <ng-template cngxTabContent><p>Final review.</p></ng-template>
    </div>
  </cngx-tab-group>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row" style="gap:8px">
      <label><input type="checkbox" [checked]="detailsInvalid()" (change)="detailsInvalid.set($any($event.target).checked)" /> details invalid</label>
    </div>
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
