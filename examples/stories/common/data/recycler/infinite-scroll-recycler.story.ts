import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Infinite Scroll + Recycler',
  subtitle: 'Combine <code>CngxInfiniteScroll</code> with the recycler for large HTTP-loaded lists. The sentinel sits outside the spacer container. Items append to the array — scrolling back up never re-fetches because already-loaded items stay in memory.',
  description: 'Signal-based virtualizer for long lists. Items outside the viewport are removed from the DOM. Consumer renders with @for and two spacer containers.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern', 'async-state'],
  apiComponents: [
    'CngxRecycler',
    'CngxMeasure',
    'CngxVirtualItem',
    'CngxRecyclerAnnouncer',
  ],
  moduleImports: [
    'import { injectRecycler } from \'@cngx/common/data\';',
    'import { CngxInfiniteScroll } from \'@cngx/common/layout\';',
  ],
  imports: ['CngxInfiniteScroll'],
  setup: `protected readonly infiniteItems = signal<string[]>([]);
  protected readonly infiniteLoading = signal(false);
  protected readonly infiniteHasMore = computed(() => this.infiniteItems().length < 500);
  private infinitePage = 0;
  protected readonly infRecycler = injectRecycler({
    scrollElement: '.inf-scroll',
    totalCount: () => this.infiniteItems().length,
    estimateSize: 48,
    overscan: 5,
  });
  protected readonly infVisible = this.infRecycler.sliced(this.infiniteItems);
  protected handleLoadMore(): void {
    if (this.infiniteLoading() || !this.infiniteHasMore()) { return; }
    this.infiniteLoading.set(true);
    setTimeout(() => {
      const start = this.infinitePage * 50;
      const page = Array.from({ length: 50 }, (_, i) => 'Item ' + (start + i + 1));
      this.infiniteItems.update(prev => [...prev, ...page]);
      this.infiniteLoading.set(false);
      this.infinitePage++;
    }, 300);
  }`,
  template: `  <div class="inf-scroll"
       style="height:300px;overflow-y:auto;border:1px solid var(--cngx-color-border,#e0e0e0);border-radius:8px">
    <div [style.paddingTop.px]="infRecycler.offsetBefore()"
         [style.paddingBottom.px]="infRecycler.offsetAfter()">
      @for (item of infVisible(); track item) {
        <div style="height:48px;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--cngx-color-border,#e0e0e0)">
          {{ item }}
        </div>
      }
    </div>
    <div cngxInfiniteScroll
         [enabled]="infiniteHasMore()"
         [loading]="infiniteLoading()"
         [root]="'.inf-scroll'"
         (loadMore)="handleLoadMore()"
         style="padding:8px;text-align:center;color:var(--cngx-text-muted,#999)">
      @if (infiniteLoading()) {
        Loading more...
      } @else if (!infiniteHasMore()) {
        All 500 items loaded.
      }
    </div>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-bottom:8px">
    <span class="status-badge">Loaded: {{ infiniteItems().length }}</span>
    <span class="status-badge">
      Visible: {{ infRecycler.firstVisible() + 1 }}&ndash;{{ infRecycler.lastVisible() + 1 }}
    </span>
    <span class="status-badge">DOM: {{ infRecycler.end() - infRecycler.start() }}</span>
    @if (infiniteLoading()) {
      <span class="status-badge">Loading...</span>
    }
  </div>`,
};
