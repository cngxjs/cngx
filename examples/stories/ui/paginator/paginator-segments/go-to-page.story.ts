import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Go to page',
  subtitle:
    'Two ways to jump: <code>cngx-pgn-goto</code> is a native number input (Enter or blur navigates), and <code>cngx-pgn-page-of-pages</code> is a <code>current / total</code> dropdown. The brain clamps out-of-range entries and the field reflects the clamped page back.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorGoto',
    'CngxPaginatorPageOfPages',
    'CngxPaginatorNext',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorGoto, CngxPaginatorPageOfPages, CngxPaginatorNext } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorGoto',
    'CngxPaginatorPageOfPages',
    'CngxPaginatorNext',
  ],
  setup: `protected readonly pageIndex = signal(0);`,
  template: `  <cngx-paginator skin="numbered" [total]="300" [(pageIndex)]="pageIndex">
    <cngx-pgn-prev />
    <cngx-pgn-goto />
    <cngx-pgn-page-of-pages />
    <cngx-pgn-next />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
