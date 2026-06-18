import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Infinite',
  subtitle:
    'Scroll-to-load over the same brain. <code>cngx-pgn-infinite</code> drops a sentinel that auto-advances <code>pageIndex</code> as it enters the scroll container, so the list grows as you scroll - while each batch keeps its addressable page boundary (the sticky "Page n" divider).',
  description:
    'The segment composes <code>CngxInfiniteScroll</code> on an in-template sentinel: <code>[enabled]</code> binds to <code>!isLast()</code>, <code>[loading]</code> to <code>isBusy()</code>, <code>(loadMore)</code> to <code>next()</code>, and <code>[root]</code> points it at the scroll box. The directive owns the debounce, busy-gate, and auto-disconnect, so the segment holds no observer code and no accumulation state - the consumer slices its own array per revealed page. Binding <code>[state]</code> makes the busy-gate pace the auto-load: each fetch flips busy, so the sentinel waits instead of racing through every page. On the last page the sentinel disables and swaps its spinner for the all-loaded label, so the tail is never a silent or stale affordance.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxPaginator', 'CngxPaginatorInfinite'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorInfinite } from '@cngx/ui/paginator';",
    "import { createManualState } from '@cngx/common/data';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorInfinite'],
  setup: `protected readonly people = signal<Person[]>(
    Array.from({ length: 6 }, (_, copy: number) =>
      PEOPLE.map((p: Person) => (copy === 0 ? p : { ...p, name: p.name + ' #' + (copy + 1) })),
    ).flat(),
  );
  protected readonly pageSize = signal(6);
  protected readonly pageIndex = signal(0);
  // Simulated fetch state: each advance flips busy for a beat, so the sentinel's
  // busy-gate paces the auto-load instead of racing through every page at once.
  protected readonly loadState = createManualState<void>();
  // Reveal a page only once its simulated fetch has settled - the row appearing
  // on settle is what re-arms the observer for the next scroll.
  protected readonly loadedPages = signal(1);
  protected readonly revealed = computed<{ page: number; items: Person[] }[]>(() => {
    const size = this.pageSize();
    const groups: { page: number; items: Person[] }[] = [];
    for (let page = 0; page < this.loadedPages(); page++) {
      const items = this.people().slice(page * size, (page + 1) * size);
      if (items.length) {
        groups.push({ page: page + 1, items });
      }
    }
    return groups;
  });
  private readonly _pace = effect(() => {
    const wanted = this.pageIndex() + 1;
    untracked(() => {
      if (wanted <= this.loadedPages()) {
        return;
      }
      this.loadState.set('loading');
      setTimeout(() => {
        this.loadedPages.set(wanted);
        this.loadState.set('success');
      }, 500);
    });
  });`,
  template: `  <div class="demo-pgn-infinite-frame">
    @for (group of revealed(); track group.page) {
      <div class="demo-page-divider">Page {{ group.page }}</div>
      <ul class="demo-list-flush">
        @for (p of group.items; track p.name) {
          <li class="demo-list-row"><strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}</li>
        }
      </ul>
    }
    <cngx-paginator
      aria-label="People"
      [total]="people().length"
      [state]="loadState"
      [(pageIndex)]="pageIndex"
      [(pageSize)]="pageSize"
    >
      <cngx-pgn-infinite root=".demo-pgn-infinite-frame" rootMargin="0px 0px 48px 0px" />
    </cngx-paginator>
  </div>`,
};
