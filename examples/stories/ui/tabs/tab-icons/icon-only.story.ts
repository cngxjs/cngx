import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: icon-only layout',
  subtitle:
    'Set <code>iconLayout="only"</code> to show just the icon. The label is hidden visually but stays in the DOM and the accessibility tree, so screen-reader users still hear "Overview", "Activity", "Settings". A dev-mode warning fires if no <code>*cngxTabIcon</code> template is supplied.',
  description:
    'Icon-layout axis: <code>only</code>. The label is clipped (not <code>display:none</code>) so it remains the accessible-name source alongside each tab button\'s <code>aria-label</code> - icon-only never costs assistive-technology users the tab name. Inspect any tab in the a11y tree to confirm the name survives. Distinct glyph per <code>index</code> keeps the icon-only tabs distinguishable.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  references: [
    { label: 'WAI-ARIA APG - Tabs', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
  ],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabIcon'],
  moduleImports: [
    "import { CngxTab, CngxTabContent, CngxTabIcon } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabIcon'],
  setup: `protected readonly active = signal(0);`,
  template: `  <cngx-tab-group iconLayout="only" [(activeIndex)]="active" aria-label="Workspace - icon only">
    <ng-template cngxTabIcon let-active="active" let-index="index">
      <svg viewBox="0 0 16 16" width="20" height="20"
           [attr.fill]="active ? 'currentColor' : 'none'"
           stroke="currentColor" stroke-width="1.5">
        @switch (index) {
          @case (0) { <circle cx="8" cy="8" r="6" /> }
          @case (1) { <rect x="2.5" y="2.5" width="11" height="11" rx="2" /> }
          @default { <path d="M8 2 L14 13 L2 13 Z" stroke-linejoin="round" /> }
        }
      </svg>
    </ng-template>
    <div cngxTab [label]="'Overview'">
      <ng-template cngxTabContent><p>Overview content - the tab above shows only its icon, but its name is still "Overview" for assistive tech.</p></ng-template>
    </div>
    <div cngxTab [label]="'Activity'">
      <ng-template cngxTabContent><p>Activity content.</p></ng-template>
    </div>
    <div cngxTab [label]="'Settings'">
      <ng-template cngxTabContent><p>Settings content.</p></ng-template>
    </div>
  </cngx-tab-group>`,
};
