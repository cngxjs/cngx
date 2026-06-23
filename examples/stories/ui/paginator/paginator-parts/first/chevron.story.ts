import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorFirst: First-page button',
  subtitle:
    'The <code>cngx-pgn-first</code> part in isolation - a single chevron button that jumps the shared <code>pageIndex</code> to the first page and disables itself once it is there.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorFirst', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorFirst } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorFirst'],
  setup: `protected readonly pageIndex = signal(2);`,
  template: `  <cngx-paginator
    [total]="120"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
  >
    <cngx-pgn-first />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
