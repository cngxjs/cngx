import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: line skin',
  subtitle:
    'The default skin. The active tab is marked by an underline ink-bar; the strip carries a single bottom border. Set <code>skin="line"</code> explicitly or omit it - <code>line</code> is the cascade default.',
  description:
    'Skin axis: <code>line</code>. A pure CSS concern routed through the <code>[data-skin]</code> host attribute - structure, slots, ARIA, and keyboard behaviour are identical across every skin. The underline indicator is drawn via an inset box-shadow so the active tab never shifts layout against its resting neighbours.',
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
  template: `  <cngx-tab-group skin="line" [(activeIndex)]="active" aria-label="Workspace - line skin">
    <div cngxTab [label]="'Overview'">
      <ng-template cngxTabContent>
        <p>Overview content. The active tab is underlined; resting tabs stay flat.</p>
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
