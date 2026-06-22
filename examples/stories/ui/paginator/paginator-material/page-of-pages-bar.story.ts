import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Page-of-pages bar',
  subtitle:
    'The Carbon-style variant: items-per-page, a range label, an "n of m pages" select, then prev / next. The page select is a real control - pick a page and the bar jumps straight to it.',
  description:
    'Same enclosed <code>bar</code> strip, a different jump affordance: <code>cngx-pgn-page-of-pages</code> is a current/total dropdown beside the range. Both the range and the page select derive from the shared brain, so they never drift.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'integration'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorPageSize',
    'CngxPaginatorRange',
    'CngxPaginatorPageOfPages',
    'CngxPaginatorPrev',
    'CngxPaginatorNext',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPageSize, CngxPaginatorRange, CngxPaginatorPageOfPages, CngxPaginatorPrev, CngxPaginatorNext, provideCngxPaginatorConfigAt, withPaginatorRangeFormat } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorPageSize',
    'CngxPaginatorRange',
    'CngxPaginatorPageOfPages',
    'CngxPaginatorPrev',
    'CngxPaginatorNext',
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
    <cngx-pgn-page-of-pages />
    <cngx-pgn-prev />
    <cngx-pgn-next />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Page size</span><span class="event-value">{{ pageSize() }}</span></div>
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
