import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorInfinite: Infinite-scroll sentinel',
  subtitle:
    'The <code>cngx-pgn-infinite</code> part in isolation - a bottom-of-list sentinel composing <code>CngxInfiniteScroll</code> that auto-advances the shared <code>pageIndex</code> as it scrolls into view, swapping its busy spinner for the all-loaded label once exhausted.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorInfinite', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorInfinite } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorInfinite'],
  setup: `protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);`,
  template: `  <cngx-paginator
    [total]="120"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
    [pageSize]="pageSize()"
    (pageSizeChange)="pageSize.set($event)"
  >
    <cngx-pgn-infinite />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
