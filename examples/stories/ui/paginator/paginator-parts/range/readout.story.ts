import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorRange: Range readout',
  subtitle:
    'The <code>cngx-pgn-range</code> part in isolation - a pure <code>start-end of total</code> readout (for example <code>1-10 of 120</code>) derived from the shared <code>pageIndex</code>, <code>pageSize</code>, and <code>total</code>.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorRange', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorRange } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorRange'],
  setup: `protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);`,
  template: `  <cngx-paginator
    [total]="120"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
    [pageSize]="pageSize()"
    (pageSizeChange)="pageSize.set($event)"
  >
    <cngx-pgn-range />
  </cngx-paginator>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" (click)="pageIndex.set(pageIndex() + 1)">Next page</button>
  </div>`,
};
