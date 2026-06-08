import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: icon-end layout',
  subtitle:
    'A single group-level <code>*cngxTabIcon</code> template renders an icon after each label, in a row. The slot context is <code>{ tab, active, index }</code> - here the glyph fills when its tab is active and switches shape by index. Set <code>iconLayout="end"</code> for a trailing icon (external-link, caret, status affordance).',
  description:
    'Icon-layout axis: <code>end</code> (icon after label, row-reverse). Mirror of <code>start</code> - the label leads, the icon qualifies it. The icon is one group-level template slot with per-tab context, not a per-tab input (stepper-slot parity). The icon element is <code>aria-hidden</code>; the label carries the accessible name. Orthogonal to skin and orientation.',
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
  template: `  <cngx-tab-group iconLayout="end" [(activeIndex)]="active" aria-label="Workspace - icon end">
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
