import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorPageSize: Items-per-page dropdown',
  subtitle:
    'The <code>cngx-pgn-page-size</code> part in isolation - a <code>CngxListbox</code> dropdown of page sizes. <code>[options]</code> is plain data; picking a size routes through the brain and resets to the first page.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorPageSize', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPageSize } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPageSize'],
  setup: `protected readonly pageSize = signal(10);
  protected readonly sizes = [10, 25, 50] as const;`,
  template: `  <cngx-paginator
    [total]="240"
    [pageSize]="pageSize()"
    (pageSizeChange)="pageSize.set($event)"
  >
    <cngx-pgn-page-size [options]="sizes" />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Page size</span><span class="event-value">{{ pageSize() }}</span></div>
  </div>`,
};
