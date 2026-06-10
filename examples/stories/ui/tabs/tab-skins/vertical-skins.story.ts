import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: skins in vertical orientation',
  subtitle:
    'Every skin under <code>orientation="vertical"</code>. Skin and orientation are orthogonal axes - <code>line</code> moves its ink-bar to the inline-end edge, <code>contained</code> fuses the active tab with the panel along the side seam, <code>segmented</code> stacks its track into a column, and <code>pill</code> / <code>pill-outline</code> keep their rounded fills stacked.',
  description:
    'Skin x orientation. <code>orientation</code> is its own axis (not a skin); each skin ships the vertical treatment of its indicator. The <code>contained</code> skin is the notable one - its fusion seam follows the inline-end edge in vertical mode so the active tab still reads as one box with the panel. Same shared <code>[(activeIndex)]</code> drives all skins.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  moduleImports: [
    "import { CngxTab, CngxTabContent } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  setup: `protected readonly active = signal(0);
  protected readonly skins = ['line', 'contained', 'segmented', 'pill', 'pill-outline'] as const;`,
  template: `  <div style="display:flex;flex-direction:column;gap:24px">
    @for (skin of skins; track skin) {
      <div style="display:flex;flex-direction:column;gap:6px">
        <span style="font-weight:600;text-transform:capitalize">{{ skin }}</span>
        <cngx-tab-group
          [skin]="skin"
          orientation="vertical"
          [(activeIndex)]="active"
          [attr.aria-label]="skin + ' skin, vertical'"
        >
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
