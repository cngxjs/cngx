import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorPages: Numbered page row',
  subtitle:
    'The <code>cngx-pgn-pages</code> part in isolation - the numbered page buttons with a single roving tab stop; the current page carries <code>aria-current</code> and clicking a number sets the shared <code>pageIndex</code>.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorPages', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPages } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPages'],
  setup: `protected readonly pageIndex = signal(2);`,
  template: `  <cngx-paginator
    [total]="120"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
  >
    <cngx-pgn-pages />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
