import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorLast: Last-page button',
  subtitle:
    'The <code>cngx-pgn-last</code> part in isolation - a single chevron button that jumps the shared <code>pageIndex</code> to the last page and disables itself once it is there.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorLast', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorLast } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorLast'],
  setup: `protected readonly pageIndex = signal(2);`,
  template: `  <cngx-paginator
    [total]="120"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
  >
    <cngx-pgn-last />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
