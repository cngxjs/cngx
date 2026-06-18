import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Pill skin',
  subtitle:
    'The <code>pill</code> skin renders rounded page buttons with a filled current page - the marketing-site / blog idiom. Identical roving keyboard and ellipsis overflow as every other skin.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorFirst',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorLast',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorFirst, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext, CngxPaginatorLast } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorFirst',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorLast',
  ],
  setup: `protected readonly pageIndex = signal(4);`,
  template: `  <cngx-paginator skin="pill" [total]="150" [(pageIndex)]="pageIndex">
    <cngx-pgn-first />
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
    <cngx-pgn-last />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
