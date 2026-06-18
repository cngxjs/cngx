import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Page-size + range segments',
  subtitle:
    'Compose <code>cngx-pgn-page-size</code> and <code>cngx-pgn-range</code> into any skin. Picking a size routes through the brain and resets to the first page; the range readout stays in sync because both derive from the same brain signals.',
  description:
    'The page-size dropdown is a <code>CngxListbox</code> popover. <code>[options]</code> is plain data, not a feature toggle - the segment is content-agnostic.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorPageSize',
    'CngxPaginatorRange',
    'CngxPaginatorPrev',
    'CngxPaginatorNext',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPageSize, CngxPaginatorRange, CngxPaginatorPrev, CngxPaginatorNext } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorPageSize',
    'CngxPaginatorRange',
    'CngxPaginatorPrev',
    'CngxPaginatorNext',
  ],
  setup: `protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly sizes = [10, 25, 50, 100] as const;`,
  template: `  <cngx-paginator skin="bar" [total]="500" [(pageIndex)]="pageIndex" [(pageSize)]="pageSize">
    <cngx-pgn-page-size [options]="sizes" />
    <cngx-pgn-range />
    <cngx-pgn-prev />
    <cngx-pgn-next />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Page size</span><span class="event-value">{{ pageSize() }}</span></div>
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
