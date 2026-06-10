import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: icon-top layout',
  subtitle:
    'Set <code>iconLayout="top"</code> to stack the icon above the label in a column - the bottom-navigation / segmented-card pattern. Same <code>*cngxTabIcon</code> slot, same <code>{ tab, active, index }</code> context.',
  description:
    'Icon-layout axis: <code>top</code> (icon above label, column). The axis only changes the tab button flex-direction via the <code>[data-icon-layout]</code> host attribute; it composes freely with every skin. The icon stays <code>aria-hidden</code>, the label below it remains the accessible name.',
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
  template: `  <cngx-tab-group iconLayout="top" [(activeIndex)]="active" aria-label="Workspace - icon top">
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
      <ng-template cngxTabContent><p>Overview content.</p></ng-template>
    </div>
    <div cngxTab [label]="'Activity'">
      <ng-template cngxTabContent><p>Activity content.</p></ng-template>
    </div>
    <div cngxTab [label]="'Settings'">
      <ng-template cngxTabContent><p>Settings content.</p></ng-template>
    </div>
  </cngx-tab-group>`,
};
