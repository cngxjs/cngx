import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: icon sidebar (vertical)',
  subtitle:
    'The icon-layout axis composes with <code>orientation="vertical"</code> - here <code>iconLayout="start"</code> gives a classic icon-plus-label sidebar nav. The <code>*cngxTabIcon</code> slot and its <code>{ tab, active, index }</code> context work identically in either orientation.',
  description:
    'Icon-layout x orientation. The icon renders ahead of the label in each stacked tab; the icon element stays <code>aria-hidden</code> and the label carries the accessible name. Swap <code>iconLayout</code> to <code>only</code> for a compact icon rail (keep the label in the DOM for assistive tech).',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabIcon'],
  moduleImports: [
    "import { CngxTab, CngxTabContent, CngxTabIcon } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabIcon'],
  setup: `protected readonly active = signal(0);`,
  template: `  <cngx-tab-group
    iconLayout="start"
    orientation="vertical"
    [(activeIndex)]="active"
    aria-label="Icon sidebar"
  >
    <ng-template cngxTabIcon let-active="active" let-index="index">
      <svg viewBox="0 0 16 16" width="18" height="18"
           [attr.fill]="active ? 'currentColor' : 'none'"
           stroke="currentColor" stroke-width="1.5">
        @switch (index) {
          @case (0) { <circle cx="8" cy="8" r="6" /> }
          @case (1) { <rect x="2.5" y="2.5" width="11" height="11" rx="2" /> }
          @default { <path d="M8 2 L14 13 L2 13 Z" stroke-linejoin="round" /> }
        }
      </svg>
    </ng-template>
    <div cngxTab [label]="'Dashboard'">
      <ng-template cngxTabContent><p>Dashboard content.</p></ng-template>
    </div>
    <div cngxTab [label]="'Reports'">
      <ng-template cngxTabContent><p>Reports content.</p></ng-template>
    </div>
    <div cngxTab [label]="'Alerts'">
      <ng-template cngxTabContent><p>Alerts content.</p></ng-template>
    </div>
  </cngx-tab-group>`,
};
