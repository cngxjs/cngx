import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIncrementalList: Virtualized 10k rows',
  subtitle:
    'Opt into DOM recycling with <code>[virtualize]</code>: a 10,000-row accumulated list renders only the rows inside the bounded viewport (plus a small overscan), so the DOM node count stays flat while the scrollbar still reflects the full set. <code>[estimateSize]</code> seeds the per-row height before measurement.',
  description:
    'Without <code>[virtualize]</code> the content branch renders every accumulated row - fine for a few hundred, the bottleneck at thousands. Setting <code>[virtualize]</code> swaps the render-all loop for a recycled window inside a bounded scroll viewport (height tuned via the <code>--cngx-incremental-list-viewport-height</code> custom property); every off-window row collapses into a pixel spacer, and each rendered row still carries <code>aria-setsize</code> / <code>aria-posinset</code> for the full set. The projected trigger still drives <code>next()</code> - only rendering is virtualized. Scroll the frame and watch the rendered-row readout stay flat near the window size instead of climbing toward 10,000.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxIncrementalList'],
  moduleImports: [
    "import { CngxIncrementalList, CngxIncrementalItem } from '@cngx/ui/collection';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxIncrementalList', 'CngxIncrementalItem'],
  setup: `protected readonly rows: string[] = Array.from({ length: 10_000 }, (_, i) => 'Row ' + (i + 1));
  protected readonly listState = createManualState<string[]>();
  constructor() {
    this.listState.setSuccess(this.rows);
  }`,
  setupChrome: `protected readonly renderedRows = signal(0);
  private readonly _rowsHost = inject(ElementRef<HTMLElement>);
  private readonly _rowsDestroy = inject(DestroyRef);
  // Live rendered-<li> count. A MutationObserver over the list subtree updates
  // the readout on every window recycle, so the reader sees the node count stay
  // flat while scrolling rather than growing with the dataset.
  private readonly _rowsWatch = afterNextRender(() => {
    const root = this._rowsHost.nativeElement as HTMLElement;
    const update = (): void =>
      this.renderedRows.set(root.querySelectorAll('.cngx-incremental-list__item').length);
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { childList: true, subtree: true });
    this._rowsDestroy.onDestroy(() => observer.disconnect());
  });`,
  template: `  <cngx-incremental-list
    [state]="listState"
    [total]="rows.length"
    [pageSize]="rows.length"
    [virtualize]="true"
    [estimateSize]="36"
    [style.--cngx-incremental-list-viewport-height]="'360px'"
  >
    <ng-template cngxIncrementalItem let-row>
      {{ row }}
    </ng-template>
  </cngx-incremental-list>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout"
      >rendered DOM rows: {{ renderedRows() }} of {{ rows.length }}</span
    >
  </div>`,
};
