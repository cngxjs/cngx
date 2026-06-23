import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorPrev: Previous-page button',
  subtitle:
    'The <code>cngx-pgn-prev</code> part in isolation - a single chevron button that steps the shared <code>pageIndex</code> back by one and disables itself on the first page.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorPrev', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPrev'],
  setup: `protected readonly pageIndex = signal(2);`,
  template: `  <cngx-paginator
    [total]="120"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
  >
    <cngx-pgn-prev />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
