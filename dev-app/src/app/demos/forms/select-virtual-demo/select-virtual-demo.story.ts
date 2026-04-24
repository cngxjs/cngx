import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select — Virtualized',
  navLabel: 'Select (virtual)',
  navCategory: 'field',
  description:
    '10,000-option <code>&lt;cngx-select&gt;</code> via <code>CNGX_PANEL_RENDERER_FACTORY</code> + in-house <code>injectRecycler</code>. Only ~20 option rows in the DOM at any time.',
  apiComponents: [
    'CngxSelect',
    'CNGX_PANEL_RENDERER_FACTORY',
    'createRecyclerPanelRendererFactory',
    'injectRecycler',
    'connectRecyclerToActiveDescendant',
  ],
  overview:
    '<p>The select family renders every option into the DOM by default — fine up to ~500 options, degrades beyond. ' +
    'The <code>CNGX_PANEL_RENDERER_FACTORY</code> token is the opt-in extension point for virtualisation.</p>' +
    '<p>The demo wraps <code>&lt;cngx-select&gt;</code> in a thin component that:</p>' +
    '<ol>' +
    '<li>Creates a <code>CngxRecycler</code> via <code>injectRecycler({ scrollElement: ".cngx-select__panel", ... })</code></li>' +
    '<li>Provides <code>CNGX_PANEL_RENDERER_FACTORY</code> as <code>createRecyclerPanelRendererFactory(this.recycler)</code> via <code>viewProviders</code></li>' +
    '</ol>' +
    '<p>The select itself handles the AD-virtual-scroll bridge internally — arrow navigation past the rendered window triggers <code>recycler.scrollToIndex()</code>; <code>aria-activedescendant</code> follows the rendered range as it scrolls into view.</p>' +
    '<p>Each option row gets <code>aria-setsize="10000"</code> + <code>aria-posinset</code> for the absolute position, so AT reads "5 of 10000" correctly.</p>',
  moduleImports: [
    "import { SelectVirtualDemoWrapper } from './select-virtual-wrapper.component';",
    "import type { CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  setup: `
  protected readonly hugeDataset: CngxSelectOptionDef<string>[] = Array.from(
    { length: 10000 },
    (_, i) => ({ value: 'id-' + i, label: 'Item #' + (i + 1).toString().padStart(5, '0') }),
  );

  protected readonly largeValue = signal<string | undefined>(undefined);
  protected readonly smallValue = signal<string | undefined>(undefined);
  protected readonly smallDataset: CngxSelectOptionDef<string>[] = this.hugeDataset.slice(0, 20);
  `,
  sections: [
    {
      title: '10,000 options via recycler — only ~20 rendered',
      subtitle:
        'Open the panel and inspect the DOM. The option row count is roughly <code>floor(max-height / estimateSize) + overscan × 2</code> — ~20 rows for the default 16rem panel + 32 px estimated row height + 6 overscan. The rest of the 10,000 items are spacer height.',
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
      title: 'Same wrapper with only 20 options',
      subtitle:
        'With 20 items × 32 px estimated height the content exceeds the panel\'s 16rem viewport — the recycler still windows (~8 visible + overscan). <code>aria-setsize</code> reports the full 20; the window slides on scroll. The identity shortcut only kicks in when the viewport exceeds the total content height.',
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
