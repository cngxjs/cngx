import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Config-default page sizes',
  subtitle:
    'The items-per-page dropdown needs no per-instance <code>[options]</code>: <code>withPaginatorPageSizeOptions</code> supplies the size ladder through the config cascade, so <code>&lt;cngx-pgn-page-size /&gt;</code> renders configured choices with zero boilerplate. A per-instance <code>[options]</code> still wins where a region needs bespoke sizes.',
  description:
    'The page-size segment here carries no <code>[options]</code> input. A scoped <code>provideCngxPaginatorConfigAt(withPaginatorPageSizeOptions([12, 24, 48]))</code> in the component <code>viewProviders</code> feeds the dropdown. The rendered sizes are a <code>computed</code> fallback - the instance input wins when non-empty, otherwise the cascade default - so the panel selection and the trigger label never drift from the brain page size.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['integration'],
  apiComponents: ['CngxPaginator', 'CngxPaginatorPageSize', 'CngxPaginatorRange'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext, CngxPaginatorRange, CngxPaginatorPageSize, provideCngxPaginatorConfigAt, withPaginatorPageSizeOptions } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorRange',
    'CngxPaginatorPageSize',
  ],
  viewProviders: ['provideCngxPaginatorConfigAt(withPaginatorPageSizeOptions([12, 24, 48]))'],
  setup: `protected readonly page = signal(0);`,
  template: `  <cngx-paginator skin="numbered" [total]="240" [pageIndex]="page()" (pageIndexChange)="page.set($event)">
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
    <cngx-pgn-range />
    <cngx-pgn-page-size />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ page() + 1 }}</span></div>
  </div>`,
};
