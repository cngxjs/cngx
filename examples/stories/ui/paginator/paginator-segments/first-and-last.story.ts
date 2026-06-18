import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'First / last boundary nav',
  subtitle:
    'The <code>cngx-pgn-first</code> and <code>cngx-pgn-last</code> segments jump to the boundaries. At a bound the button reports <code>aria-disabled</code> but stays focusable, so a screen-reader user still hears the boundary state.',
  description:
    'Boundary buttons use <code>aria-disabled</code> rather than the native <code>disabled</code> attribute - communication over silence (the bound state is announced, not removed from the tab order).',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
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
  setup: `protected readonly pageIndex = signal(0);`,
  template: `  <cngx-paginator skin="numbered" [total]="90" [(pageIndex)]="pageIndex">
    <cngx-pgn-first />
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
    <cngx-pgn-last />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
    <div class="event-row"><span class="event-label">At first</span><span class="event-value">{{ pageIndex() === 0 }}</span></div>
  </div>`,
};
