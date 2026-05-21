import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRecycler: Infinite-scroll integration',
  subtitle: 'Combine <code>CngxInfiniteScroll</code> with the recycler for large HTTP-loaded lists. The sentinel sits outside the spacer container. Items append to the array; scrolling back up never refetches because already-loaded items stay in memory.',
  description: 'Composes CngxInfiniteScroll with the recycler for HTTP-loaded lists. The sentinel sits outside the spacer block, so the IntersectionObserver fires whenever the bottom enters the viewport. Loaded pages stay in memory; scrolling back never refetches.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'async-state', 'composition'],
  apiComponents: [
    'CngxRecycler',
    'CngxInfiniteScroll',
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
  template: `  <div class="inf-scroll demo-scroll-frame" style="height:300px">
    <div [style.paddingTop.px]="infRecycler.offsetBefore()"
         [style.paddingBottom.px]="infRecycler.offsetAfter()">
      @for (item of infVisible(); track item) {
        <div class="demo-scroll-row" style="height:48px">
          {{ item }}
        </div>
      }
    </div>
    <div cngxInfiniteScroll
         class="demo-card-label demo-scroll-sentinel"
         [enabled]="infiniteHasMore()"
         [loading]="infiniteLoading()"
         [root]="'.inf-scroll'"
         (loadMore)="handleLoadMore()">
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
      Visible: {{ infRecycler.firstVisible() + 1 }}-{{ infRecycler.lastVisible() + 1 }}
    </span>
    <span class="status-badge">DOM: {{ infRecycler.end() - infRecycler.start() }}</span>
    @if (infiniteLoading()) {
      <span class="status-badge">Loading...</span>
    }
  </div>`,
};
