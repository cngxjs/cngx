import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInfiniteScroll: Scrollable list',
  subtitle:
    'Scroll to the bottom to load more items. The sentinel element emits <code>(loadMore)</code> when it enters the viewport and the debounce window has elapsed. Loading stops at 100 items.',
  description:
    'Sentinel-based infinite scroll inside a max-height container. CngxInfiniteScroll watches the bottom row with IntersectionObserver, gates re-fires with debounceMs and the loading input, and disconnects entirely when enabled is false.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'async-state'],
  apiComponents: ['CngxInfiniteScroll'],
  moduleImports: ["import { CngxInfiniteScroll } from '@cngx/common/layout';"],
  imports: ['CngxInfiniteScroll'],
  setup: `protected readonly items = signal(Array.from({ length: 5 }, (_, i) => \`Item \${i + 1}\`));
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
  }`,
  template: `  <div class="scroll-root demo-infinite-scroll-frame">
    @for (item of items(); track item) {
      <div class="demo-infinite-scroll-item">
        {{ item }}
      </div>
    }
    <div cngxInfiniteScroll
         [enabled]="hasMore()" [loading]="loading()" [root]="'.scroll-root'"
         (loadMore)="loadMore()"
         class="demo-infinite-scroll-sentinel">
      @if (loading()) {
        Loading more...
      } @else if (!hasMore()) {
        All items loaded.
      }
    </div>
  </div>`,
  css: `.demo-infinite-scroll-frame {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #e0e0e0));
  border-radius: var(--cngx-radius-md, 8px);
}

.demo-infinite-scroll-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #e0e0e0));
}

.demo-infinite-scroll-sentinel {
  padding: 16px;
  text-align: center;
  color: var(--cngx-color-text-muted, var(--cngx-ex-muted, #6b7280));
}`,
  templateChrome: `<div class="status-row" style="margin-bottom:12px">
    <span class="status-badge">Items: {{ items().length }}</span>
    <span class="status-badge">Has more: {{ hasMore() }}</span>
    @if (loading()) {
      <span class="status-badge">Loading...</span>
    }
  </div>`,
};
