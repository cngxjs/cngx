import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Rail',
  subtitle:
    'The <code>rail</code> skin is paginator-native: the controls sit on a horizontal rail with a range readout, suited to wide footers and dashboards.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorRange',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext, CngxPaginatorRange } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorRange',
  ],
  setup: `protected readonly pageIndex = signal(5);`,
  template: `  <cngx-paginator skin="rail" [total]="200" [(pageIndex)]="pageIndex">
    <cngx-pgn-range />
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
