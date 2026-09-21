import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorLoadMore: Load-more button',
  subtitle:
    'The <code>cngx-pgn-load-more</code> part in isolation - an append rather than replace trigger over the same brain. One <code>host.next()</code> button plus a <code>shown / total</code> readout, disabled once the last page is reached.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorLoadMore', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorLoadMore } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorLoadMore'],
  setup: `protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);`,
  template: `  <cngx-paginator
    [total]="120"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
    [pageSize]="pageSize()"
    (pageSizeChange)="pageSize.set($event)"
  >
    <cngx-pgn-load-more />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
