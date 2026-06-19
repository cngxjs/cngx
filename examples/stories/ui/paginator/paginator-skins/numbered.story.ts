import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Numbered',
  subtitle:
    'The default <code>numbered</code> skin: first/prev, a roving page-number row with ellipsis overflow, next/last, and a range readout. <code>[skin]</code> is paint-only - the DOM, ARIA, and keyboard model are identical across every skin.',
  description:
    'Arrow keys / Home / End move the active page button (one tab stop); the current page carries <code>aria-current="page"</code>. A truncated run collapses into an ellipsis button that opens a menu of the hidden pages.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG - landmark regions',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/',
    },
  ],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorFirst',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorLast',
    'CngxPaginatorRange',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorFirst, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext, CngxPaginatorLast, CngxPaginatorRange } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorFirst',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorLast',
    'CngxPaginatorRange',
  ],
  setup: `protected readonly pageIndex = signal(2);`,
  template: `  <cngx-paginator skin="numbered" [total]="120" [(pageIndex)]="pageIndex">
    <cngx-pgn-first />
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
    <cngx-pgn-last />
    <cngx-pgn-range />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
