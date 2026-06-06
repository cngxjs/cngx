import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: pill vs CngxButtonToggleGroup',
  subtitle:
    'Two rounded-segment controls that look alike but answer different questions. <strong>Pill tabs</strong> (left) own content panels - picking one reveals a <code>tabpanel</code>. A <strong>button-toggle group</strong> (right) is a value-only segmented control - it emits a value and renders no panel. Reach for tabs when each choice has its own region; reach for the toggle group when you only need the selected value.',
  description:
    'Composition boundary (Pillar 3): the pill skin is a real tab set with full <code>tablist</code> / <code>tab</code> / <code>tabpanel</code> semantics, so use it when each option owns a content panel. <code>CngxButtonToggleGroup</code> is a radiogroup-semantics segmented control with no panel - use it for filters, view switches, and form fields where you only need <code>[(value)]</code>. Same look, different ARIA contract; do not use pill tabs as a value picker or a toggle group as a panel switcher.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition'],
  references: [
    { label: 'WAI-ARIA APG - Tabs', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
    { label: 'WAI-ARIA APG - Radio Group', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/' },
  ],
  apiComponents: [
    'CngxTabGroup',
    'CngxTab',
    'CngxTabContent',
    'CngxButtonToggleGroup',
    'CngxButtonToggle',
  ],
  moduleImports: [
    "import { CngxTab, CngxTabContent } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
    "import { CngxButtonToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
  ],
  imports: [
    'CngxTabGroup',
    'CngxTab',
    'CngxTabContent',
    'CngxButtonToggleGroup',
    'CngxButtonToggle',
  ],
  setup: `protected readonly active = signal(0);
  protected readonly view = signal<'grid' | 'list' | 'table' | undefined>('grid');`,
  template: `  <div style="display:flex;flex-wrap:wrap;gap:32px;align-items:flex-start">
    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">Pill tabs - own content panels</span>
      <cngx-tab-group skin="pill" [(activeIndex)]="active" aria-label="Pill tabs with panels">
        <div cngxTab [label]="'Overview'">
          <ng-template cngxTabContent><p>Overview panel.</p></ng-template>
        </div>
        <div cngxTab [label]="'Activity'">
          <ng-template cngxTabContent><p>Activity panel.</p></ng-template>
        </div>
        <div cngxTab [label]="'Settings'">
          <ng-template cngxTabContent><p>Settings panel.</p></ng-template>
        </div>
      </cngx-tab-group>
    </div>

    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">Button-toggle group - value only</span>
      <cngx-button-toggle-group label="Layout" [(value)]="view">
        <button type="button" cngxButtonToggle value="grid">Grid</button>
        <button type="button" cngxButtonToggle value="list">List</button>
        <button type="button" cngxButtonToggle value="table">Table</button>
      </cngx-button-toggle-group>
      <p>Selected view: <code>{{ view() ?? '(none)' }}</code> - no panel, just a value.</p>
    </div>
  </div>`,
};
