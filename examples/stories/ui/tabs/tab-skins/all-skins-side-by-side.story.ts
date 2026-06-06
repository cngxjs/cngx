import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: all skins side by side',
  subtitle:
    'The same three tabs, the same bound <code>[(activeIndex)]</code>, rendered under <code>line</code>, <code>contained</code>, and <code>pill</code>. Switching a tab in any group updates all three - the skin is purely visual, the state is shared.',
  description:
    'Skin axis comparison. Each group differs only by its <code>[skin]</code> input, which maps to the <code>[data-skin]</code> host attribute and selects a CSS scope. Structure, slots, ARIA, and keyboard behaviour are byte-identical across the three; only the painted indicator changes (underline ink-bar / panel-fused box / rounded fill).',
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
  setup: `protected readonly active = signal(0);
  protected readonly skins = ['line', 'contained', 'pill'] as const;`,
  template: `  <div style="display:flex;flex-direction:column;gap:24px">
    @for (skin of skins; track skin) {
      <div style="display:flex;flex-direction:column;gap:6px">
        <span style="font-weight:600;text-transform:capitalize">{{ skin }}</span>
        <cngx-tab-group [skin]="skin" [(activeIndex)]="active" [attr.aria-label]="skin + ' skin demo'">
          <div cngxTab [label]="'Overview'">
            <ng-template cngxTabContent><p>Overview content.</p></ng-template>
          </div>
          <div cngxTab [label]="'Activity'">
            <ng-template cngxTabContent><p>Activity content.</p></ng-template>
          </div>
          <div cngxTab [label]="'Settings'">
            <ng-template cngxTabContent><p>Settings content.</p></ng-template>
          </div>
        </cngx-tab-group>
      </div>
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row"><span class="event-label">Shared active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
