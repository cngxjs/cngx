import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: three tab navigation',
  subtitle: 'Bind <code>[(activeIndex)]</code> for two-way control. ArrowLeft / ArrowRight cycle tabs; Home / End jump to ends; Tab leaves the strip and lands inside the active panel.',
  description: 'Baseline horizontal tabs: three tabs with text labels and panel bodies. W3C Tabs ARIA pattern fully wired - <code>role="tablist"</code>, <code>role="tab"</code>, <code>role="tabpanel"</code>, roving tabindex via composed host-directive.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    { label: 'WAI-ARIA APG - Tabs', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
  ],
  apiComponents: [
    'CngxTabGroup',
    'CngxTab',
    'CngxTabLabel',
    'CngxTabContent',
  ],
  moduleImports: [
    'import { CngxTab, CngxTabLabel, CngxTabContent } from \'@cngx/common/tabs\';',
    'import { CngxTabGroup } from \'@cngx/ui/tabs\';',
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabLabel', 'CngxTabContent'],
  setup: `protected readonly active = signal(0);`,
  template: `  <cngx-tab-group [(activeIndex)]="active" aria-label="Settings tabs">
    <div cngxTab [label]="'Profile'">
      <ng-template cngxTabLabel>Profile</ng-template>
      <ng-template cngxTabContent>
        <p>Profile content - name, avatar, bio.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Account'">
      <ng-template cngxTabLabel>Account</ng-template>
      <ng-template cngxTabContent>
        <p>Account content - email, password, authentication method.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Notifications'">
      <ng-template cngxTabLabel>Notifications</ng-template>
      <ng-template cngxTabContent>
        <p>Notifications content - email + push channel preferences.</p>
      </ng-template>
    </div>
  </cngx-tab-group>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
