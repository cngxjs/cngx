import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorPageOfPages: Page-of-pages trigger',
  subtitle:
    'The <code>cngx-pgn-page-of-pages</code> part in isolation - a <code>current / total</code> button that opens a <code>CngxListbox</code> of every page; picking page <code>n</code> sets the shared <code>pageIndex</code>.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorPageOfPages', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPageOfPages } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPageOfPages'],
  setup: `protected readonly pageIndex = signal(2);`,
  template: `  <cngx-paginator
    [total]="120"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
  >
    <cngx-pgn-page-of-pages />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
