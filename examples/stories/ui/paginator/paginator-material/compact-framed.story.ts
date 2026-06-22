import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Compact framed',
  subtitle:
    'Tiny enclosed framers for cards and tiles: a zero-padded "page / total" status with prev / next, and a range "11-15 of 50 items" with prev / next. Each is its own <code>bar</code>-skin strip.',
  description:
    'The same segments, framed small. The padded status and the "of … items" range are pure config formatters (<code>withPaginatorPageStatusFormat</code> / <code>withPaginatorRangeFormat</code>), scoped to the demo via <code>provideCngxPaginatorConfigAt</code>; both strips share the override.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorStatus',
    'CngxPaginatorRange',
    'CngxPaginatorNext',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorStatus, CngxPaginatorRange, CngxPaginatorNext, provideCngxPaginatorConfigAt, withPaginatorPageStatusFormat, withPaginatorRangeFormat } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorStatus',
    'CngxPaginatorRange',
    'CngxPaginatorNext',
  ],
  viewProviders: [
    'provideCngxPaginatorConfigAt(withPaginatorPageStatusFormat((page, totalPages) => `<b>${String(page).padStart(2, "0")}</b> /${totalPages}`), withPaginatorRangeFormat((start, end, total) => `<b>${start}-${end}</b> of ${total} items`))',
  ],
  setup: `protected readonly framePage = signal(3);
  protected readonly rangePage = signal(2);`,
  template: `  <div style="display:flex;flex-wrap:wrap;gap:1rem">
    <cngx-paginator skin="bar" [total]="230" [pageSize]="10" [(pageIndex)]="framePage">
      <cngx-pgn-prev />
      <cngx-pgn-status />
      <cngx-pgn-next />
    </cngx-paginator>
    <cngx-paginator skin="bar" [total]="50" [pageSize]="5" [(pageIndex)]="rangePage">
      <cngx-pgn-range />
      <cngx-pgn-prev />
      <cngx-pgn-next />
    </cngx-paginator>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Frame page</span><span class="event-value">{{ framePage() + 1 }}</span></div>
  </div>`,
};
