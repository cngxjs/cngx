import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Data-table footer',
  subtitle:
    'Full <code>mat-paginator</code> parity in the <code>bar</code> skin: an items-per-page select, a range label, and first / prev / next / last. Changing the page size resets to page 1 and recomputes the range - the same contract as Material.',
  description:
    'One enclosed strip with hairline dividers between the segment cells. The range connector ("of … items") localises through <code>withPaginatorRangeFormat</code>; everything else derives from the shared brain signals.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'integration'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorPageSize',
    'CngxPaginatorRange',
    'CngxPaginatorFirst',
    'CngxPaginatorPrev',
    'CngxPaginatorNext',
    'CngxPaginatorLast',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPageSize, CngxPaginatorRange, CngxPaginatorFirst, CngxPaginatorPrev, CngxPaginatorNext, CngxPaginatorLast, provideCngxPaginatorConfigAt, withPaginatorRangeFormat } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorPageSize',
    'CngxPaginatorRange',
    'CngxPaginatorFirst',
    'CngxPaginatorPrev',
    'CngxPaginatorNext',
    'CngxPaginatorLast',
  ],
  viewProviders: [
    'provideCngxPaginatorConfigAt(withPaginatorRangeFormat((start, end, total) => `<b>${start}-${end}</b> of ${total} items`))',
  ],
  setup: `protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly sizes = [10, 25, 50, 100] as const;`,
  template: `  <cngx-paginator skin="bar" [total]="100" [(pageIndex)]="pageIndex" [(pageSize)]="pageSize">
    <span class="cngx-paginator__segment" aria-hidden="true">Items per page:</span>
    <cngx-pgn-page-size [options]="sizes" />
    <cngx-pgn-range />
    <cngx-pgn-first />
    <cngx-pgn-prev />
    <cngx-pgn-next />
    <cngx-pgn-last />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Page size</span><span class="event-value">{{ pageSize() }}</span></div>
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
