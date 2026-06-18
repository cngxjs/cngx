import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Bar skin',
  subtitle:
    'The <code>bar</code> skin is the full enclosed toolbar: page-size select, range readout, and the complete first/prev/pages/next/last nav in one bordered strip - the data-grid footer idiom.',
  description:
    'The page-size select is a <code>CngxListbox</code> popover (never a native select, never the forms family), so the entry stays free of a <code>@cngx/forms</code> dependency.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'behavior'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorFirst',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorLast',
    'CngxPaginatorPageSize',
    'CngxPaginatorRange',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorFirst, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext, CngxPaginatorLast, CngxPaginatorPageSize, CngxPaginatorRange } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorFirst',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorLast',
    'CngxPaginatorPageSize',
    'CngxPaginatorRange',
  ],
  setup: `protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly sizes = [10, 25, 50] as const;`,
  template: `  <cngx-paginator skin="bar" [total]="240" [(pageIndex)]="pageIndex" [(pageSize)]="pageSize">
    <cngx-pgn-page-size [options]="sizes" />
    <cngx-pgn-range />
    <cngx-pgn-first />
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
    <cngx-pgn-last />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
    <div class="event-row"><span class="event-label">Page size</span><span class="event-value">{{ pageSize() }}</span></div>
  </div>`,
};
