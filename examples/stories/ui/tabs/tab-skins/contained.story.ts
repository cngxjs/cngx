import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: contained skin',
  subtitle:
    'The active tab fuses with the panel into one enclosed box - the seam under the active tab is suppressed, while resting tabs stay visibly set back. Set <code>skin="contained"</code>.',
  description:
    'Skin axis: <code>contained</code>. The one skin whose CSS scope spans both the strip and the panel: the active tab resolves to the panel surface and overlaps the strip seam, so tab and content read as a single card. Resting tabs keep a muted surface so they read as controls, not headings. Surfaces chain to <code>--mat-sys-surface</code> / <code>--mat-sys-surface-container</code> with foundation fallbacks.',
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
  template: `  <cngx-tab-group skin="contained" [(activeIndex)]="active" aria-label="Workspace - contained skin">
    <div cngxTab [label]="'Overview'">
      <ng-template cngxTabContent>
        <p>Overview content. The active tab merges with this panel into one box.</p>
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
