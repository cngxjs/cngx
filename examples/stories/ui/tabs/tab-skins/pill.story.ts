import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: pill skin',
  subtitle:
    'Each tab renders as a rounded shape with gaps; the active tab is a solid fill rather than an underline. Set <code>skin="pill"</code>.',
  description:
    'Skin axis: <code>pill</code>. Strip-only - the active state is carried by a filled rounded surface (<code>--mat-sys-primary</code> / <code>--mat-sys-on-primary</code> with foundation fallbacks), not an ink-bar. Resting pills stay transparent and gain a subtle hover fill so the row reads as a set of controls. Still a full <code>tablist</code> / <code>tab</code> / <code>tabpanel</code> with content panels - see the pill-vs-toggle-group story for when to reach for a value-only segmented control instead.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  moduleImports: [
    "import { CngxTab, CngxTabContent } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  setup: `protected readonly active = signal(0);`,
  template: `  <cngx-tab-group skin="pill" [(activeIndex)]="active" aria-label="Workspace - pill skin">
    <div cngxTab [label]="'Overview'">
      <ng-template cngxTabContent>
        <p>Overview content. The active pill is a solid fill.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Activity'">
      <ng-template cngxTabContent>
        <p>Activity content.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Settings'">
      <ng-template cngxTabContent>
        <p>Settings content.</p>
      </ng-template>
    </div>
  </cngx-tab-group>`,
};
