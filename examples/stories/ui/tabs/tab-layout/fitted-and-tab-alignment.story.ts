import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: fitted and tab alignment',
  subtitle:
    'Two horizontal-only layout inputs. <code>[fitted]</code> stretches the tabs to fill the strip (each grows to an equal share); <code>[tabAlign]</code> aligns the content-hugging cluster <code>start</code> / <code>center</code> / <code>end</code>. Both no-op under <code>orientation="vertical"</code>, where tabs already fill the column.',
  description:
    'Layout axis, orthogonal to skin. The same three tabs and shared <code>[(activeIndex)]</code> render once fitted and once per alignment inside a fixed-width strip so the difference is visible. <code>fitted</code> reflects to <code>[data-fitted]</code> and grows each tab via its wrapper; <code>tabAlign</code> reflects to <code>[data-tab-align]</code> and sets the strip <code>justify-content</code>. App-wide defaults come from <code>provideCngxTabs(withTabsFitted(...), withTabsAlign(...))</code>; the per-instance input wins.',
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
  protected readonly aligns = ['start', 'center', 'end'] as const;`,
  template: `  <div style="display:flex;flex-direction:column;gap:24px;max-width:520px">
    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">[fitted]="true"</span>
      <cngx-tab-group [fitted]="true" [(activeIndex)]="active" aria-label="Fitted tabs">
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
    @for (align of aligns; track align) {
      <div style="display:flex;flex-direction:column;gap:6px">
        <span style="font-weight:600">[tabAlign]="'{{ align }}'"</span>
        <cngx-tab-group [tabAlign]="align" [(activeIndex)]="active" [aria-label]="align + '-aligned tabs'">
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
