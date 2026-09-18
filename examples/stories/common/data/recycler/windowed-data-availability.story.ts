import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRecyclerRow: Windowed data-availability placeholders',
  subtitle:
    '<code>*cngxRecyclerRow</code> renders the real row when the sliced item is loaded and a placeholder row when it is still <code>undefined</code>. Both placeholder layers run at once: the two offset spacers carry <code>[cngxRecyclerPlaceholder]</code> for the fast-fling background, while <code>*cngxRecyclerRow</code> fills in-window holes. Scroll into an unloaded region to watch placeholder rows resolve to real rows as pages arrive.',
  description:
    'A 100,000-row windowed dataset backed by a sparse array sized to the server total (not the loaded count), so injectRecycler scrolls across the whole range and sliced(items) returns undefined for holes. The load effect mirrors the recycler own scroll-target effect: one tracked neededRange() read, all dispatch inside untracked(), plain non-reactive Sets for page dedup, so a re-fire never re-requests a page. Placeholder rows stay in the a11y tree with aria-busy and honest aria-posinset/aria-setsize, never aria-hidden.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'async-state', 'composition'],
  apiComponents: ['CngxRecyclerRow', 'CngxRecycler', 'CngxRecyclerPlaceholder'],
  moduleImports: [
    "import { injectRecycler, CngxRecyclerRow, CngxRecyclerPlaceholder } from '@cngx/common/data';",
  ],
  imports: ['CngxRecyclerRow', 'CngxRecyclerPlaceholder'],
  setup: `private readonly SERVER_TOTAL = 100_000;
  private readonly PAGE_SIZE = 100;
  private readonly PAGE_LATENCY_MS = 400;

  // Sparse array sized to the SERVER total (not loaded count) so the scroll range
  // spans the whole dataset and sliced() returns undefined for unloaded holes.
  protected readonly items = signal<({ id: number; name: string } | undefined)[]>(
    new Array(this.SERVER_TOTAL),
  );
  protected readonly recycler = injectRecycler({
    scrollElement: '.windowed-scroll',
    totalCount: () => this.SERVER_TOTAL,
    estimateSize: 56,
    overscan: 6,
  });
  protected readonly visibleItems = this.recycler.sliced(this.items);

  // Loop-safe page loader - mirrors the recycler's own scroll-target effect:
  // one tracked read (neededRange), all dispatch inside untracked(), plain
  // non-reactive Sets for dedup so a re-fire never re-requests a page.
  private readonly loadedPages = new Set<number>();
  private readonly inFlightPages = new Set<number>();
  protected readonly loadedPageCount = signal(0);
  protected readonly inFlightCount = signal(0);

  private readonly pageLoader = effect(() => {
    const { start, end } = this.recycler.neededRange();
    untracked(() => {
      const firstPage = Math.floor(start / this.PAGE_SIZE);
      const lastPage = Math.floor((end - 1) / this.PAGE_SIZE);
      for (let page = firstPage; page <= lastPage; page++) {
        if (page < 0 || this.loadedPages.has(page) || this.inFlightPages.has(page)) {
          continue;
        }
        this.loadPage(page);
      }
    });
  });

  private loadPage(page: number): void {
    this.inFlightPages.add(page);
    this.inFlightCount.set(this.inFlightPages.size);
    setTimeout(() => {
      const base = page * this.PAGE_SIZE;
      this.items.update((current) => {
        const next = current.slice();
        for (let i = 0; i < this.PAGE_SIZE && base + i < this.SERVER_TOTAL; i++) {
          next[base + i] = { id: base + i, name: 'Row ' + (base + i + 1) };
        }
        return next;
      });
      this.inFlightPages.delete(page);
      this.loadedPages.add(page);
      this.inFlightCount.set(this.inFlightPages.size);
      this.loadedPageCount.set(this.loadedPages.size);
    }, this.PAGE_LATENCY_MS);
  }`,
  template: `  <div class="windowed-scroll demo-scroll-frame" role="list" aria-label="Windowed dataset"
       style="height:400px">
    <ul style="margin:0;padding-inline:0;list-style:none">
      @if (recycler.offsetBefore(); as before) {
        <li role="presentation" aria-hidden="true"
            [cngxRecyclerPlaceholder]="recycler" [style.height.px]="before"></li>
      }
      @for (item of visibleItems(); track item?.id ?? ('ph:' + (recycler.start() + $index)); let i = $index) {
        <li *cngxRecyclerRow="item; index: recycler.start() + i; recycler: recycler; let row"
            role="listitem"
            style="height:56px;display:flex;align-items:center;padding-inline:16px;box-sizing:border-box">
          {{ row?.name }}
        </li>
      }
      @if (recycler.offsetAfter(); as after) {
        <li role="presentation" aria-hidden="true"
            [cngxRecyclerPlaceholder]="recycler" [style.height.px]="after"></li>
      }
    </ul>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px;gap:16px">
    <span class="status-badge">
      Window {{ recycler.start() + 1 }}-{{ recycler.end() }} of {{ recycler.ariaSetSize() }}
    </span>
    <span class="status-badge">DOM rows: {{ recycler.end() - recycler.start() }}</span>
    <span class="status-badge">Loaded pages: {{ loadedPageCount() }}</span>
    <span class="status-badge">In-flight: {{ inFlightCount() }}</span>
  </div>`,
};
