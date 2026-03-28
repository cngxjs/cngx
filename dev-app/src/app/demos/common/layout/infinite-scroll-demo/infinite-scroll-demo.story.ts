import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Infinite Scroll',
  navLabel: 'Infinite Scroll',
  navCategory: 'layout',
  description:
    'Intersection-based infinite scroll directive that triggers a callback when a sentinel element enters the viewport.',
  apiComponents: ['CngxInfiniteScroll'],
  overview:
    '<p><code>CngxInfiniteScroll</code> uses <code>IntersectionObserver</code> to detect when a sentinel element ' +
    'becomes visible. Bind a loading function to the <code>scrolled</code> output. ' +
    'Disable via <code>[enabled]</code> when there are no more items to load.</p>',
  moduleImports: [
    "import { CngxInfiniteScroll } from '@cngx/common/layout';",
  ],
  setup: `
  protected readonly items = signal(Array.from({ length: 5 }, (_, i) => \`Item \${i + 1}\`));
  protected readonly loading = signal(false);
  protected readonly hasMore = computed(() => this.items().length < 100);

  protected loadMore(): void {
    if (this.loading() || !this.hasMore()) return;
    this.loading.set(true);
    setTimeout(() => {
      const current = this.items();
      const next = Array.from({ length: 10 }, (_, i) => \`Item \${current.length + i + 1}\`);
      this.items.set([...current, ...next]);
      this.loading.set(false);
    }, 800);
  }
  `,
  sections: [
    {
      title: 'Scrollable List',
      subtitle:
        'Scroll to the bottom to load more items. The sentinel element triggers <code>(scrolled)</code> when it enters the viewport. ' +
        'Loading stops at 100 items.',
      imports: ['CngxInfiniteScroll'],
      template: `
  <div class="status-row" style="margin-bottom:12px">
    <span class="status-badge">Items: {{ items().length }}</span>
    <span class="status-badge">Has more: {{ hasMore() }}</span>
    @if (loading()) {
      <span class="status-badge">Loading...</span>
    }
  </div>
  <div class="scroll-root" style="max-height:300px;overflow-y:auto;border:1px solid var(--cngx-border,#e0e0e0);border-radius:8px">
    @for (item of items(); track item) {
      <div style="padding:12px 16px;border-bottom:1px solid var(--cngx-border,#e0e0e0)">
        {{ item }}
      </div>
    }
    <div cngxInfiniteScroll [enabled]="hasMore()" [loading]="loading()" [root]="'.scroll-root'" (loadMore)="loadMore()"
      style="padding:16px;text-align:center;color:var(--text-muted,#999)">
      @if (loading()) {
        Loading more...
      } @else if (!hasMore()) {
        All items loaded.
      }
    </div>
  </div>`,
    },
  ],
};
