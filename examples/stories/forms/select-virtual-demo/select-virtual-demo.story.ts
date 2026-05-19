import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select — Virtualized',
  navLabel: 'Select (virtual)',
  navCategory: 'field',
  description:
    '10,000-option virtualisation for every select-family variant via <code>provideSelectConfig(withVirtualization())</code> + the in-house <code>injectRecycler</code>. No consumer wrapper needed.',
  apiComponents: [
    'CngxSelect',
    'CngxMultiSelect',
    'CngxCombobox',
    'withVirtualization',
    'provideSelectConfig',
    'CNGX_PANEL_RENDERER_FACTORY',
    'createRecyclerPanelRendererFactory',
    'injectRecycler',
    'connectRecyclerToActiveDescendant',
  ],
  overview:
    '<p>The select family renders every option into the DOM by default — fine up to ~500 options, degrades beyond. ' +
    '<code>CngxSelectConfig.virtualization</code> (app-wide via <code>provideSelectConfig(withVirtualization())</code>, feature-scoped via <code>provideSelectConfigAt</code>) opts in every variant — <code>&lt;cngx-select&gt;</code>, <code>&lt;cngx-multi-select&gt;</code>, <code>&lt;cngx-combobox&gt;</code>, <code>&lt;cngx-typeahead&gt;</code>, <code>&lt;cngx-reorderable-multi-select&gt;</code>, <code>&lt;cngx-action-select&gt;</code>, <code>&lt;cngx-action-multi-select&gt;</code> — to the in-house recycler.</p>' +
    '<p>The variant itself owns the wire-up (<code>setupVirtualization</code> helper): injects the recycler against its own popover as scroll container, binds <code>[virtualCount]</code> on the listbox so <code>CngxActiveDescendant</code> treats the window as a virtual list, and wires the AD → recycler scroll bridge so arrow navigation past the rendered window calls <code>recycler.scrollToIndex()</code>.</p>' +
    '<p>Each option row gets <code>aria-setsize="10000"</code> + <code>aria-posinset</code> so AT reads "5 of 10000" correctly. The consumer-level <code>CNGX_PANEL_RENDERER_FACTORY</code> still wins as a full escape hatch for CDK viewport / third-party / server-side paging.</p>' +
    '<p>CngxTreeSelect does NOT virtualise — tree semantics (expand/collapse mid-scroll, per-level aria-setsize, scrollToIndex requiring ancestor-expansion) are tracked as separate work.</p>',
  moduleImports: [
    "import { SelectVirtualDemoWrapper } from './select-virtual-wrapper.component';",
    "import { SelectVirtualComboDemoWrapper } from './select-virtual-combo-wrapper.component';",
    "import type { CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  setup: `
  protected readonly hugeDataset: CngxSelectOptionDef<string>[] = Array.from(
    { length: 10000 },
    (_, i) => ({ value: 'id-' + i, label: 'Item #' + (i + 1).toString().padStart(5, '0') }),
  );

  protected readonly largeValue = signal<string | undefined>(undefined);
  protected readonly comboValues = signal<string[]>([]);
  protected readonly smallValue = signal<string | undefined>(undefined);
  protected readonly smallDataset: CngxSelectOptionDef<string>[] = this.hugeDataset.slice(0, 20);
  `,
  sections: [
    {
      title: '10,000 options — CngxSelect via withVirtualization()',
      subtitle:
        'The wrapper adds a single <code>provideSelectConfigAt(withVirtualization({ estimateSize: 32, overscan: 6 }))</code> in <code>viewProviders</code> — no manual <code>injectRecycler</code> call, no custom factory. Open the panel and inspect the DOM: ~14 rows rendered out of 10,000, spacer divs before/after, <code>aria-setsize="10000"</code> on each row.',
      imports: ['SelectVirtualDemoWrapper'],
      template: `
  <cngx-demo-virtual-select
    [label]="'10,000 items'"
    [options]="hugeDataset"
    [(value)]="largeValue"
    placeholder="Scroll or search…"
    data-testid="virtual-select"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Selected</span><span class="event-value">{{ largeValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Total options</span><span class="event-value">{{ hugeDataset.length }}</span></div>
  </div>`,
    },
    {
      title: 'Same wire-up on CngxCombobox — multi-select with live filter',
      subtitle:
        'Identical config, different variant. Type to filter — the recycler tracks the filtered totalCount live. Arrow keys past the rendered window trigger <code>scrollToIndex</code> via the AD bridge.',
      imports: ['SelectVirtualComboDemoWrapper'],
      template: `
  <cngx-demo-virtual-combo
    [label]="'10,000 items (combobox)'"
    [options]="hugeDataset"
    [(values)]="comboValues"
    placeholder="Type to filter…"
    data-testid="virtual-combobox"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Selected</span><span class="event-value">{{ comboValues().length }} chips</span></div>
  </div>`,
    },
    {
      title: 'Same wrapper with only 20 options',
      subtitle:
        'With 20 items × 32 px estimated height the content exceeds the panel\'s 16rem viewport — the recycler still windows (~14 visible + overscan). <code>aria-setsize</code> reports the full 20; the window slides on scroll. The identity shortcut only kicks in when the viewport exceeds the total content height.',
      imports: ['SelectVirtualDemoWrapper'],
      template: `
  <cngx-demo-virtual-select
    [label]="'Small list'"
    [options]="smallDataset"
    [(value)]="smallValue"
    placeholder="All 20 rendered…"
    data-testid="small-virtual-select"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Selected</span><span class="event-value">{{ smallValue() ?? '—' }}</span></div>
  </div>`,
    },
  ],
};
