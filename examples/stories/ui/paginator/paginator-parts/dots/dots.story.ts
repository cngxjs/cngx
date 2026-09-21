import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorDots: Dots indicator',
  subtitle:
    'The <code>cngx-pgn-dots</code> part in isolation - one circular button per page, iOS page-control style. The active dot carries <code>aria-current</code>; clicking a dot sets the shared <code>pageIndex</code>.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants'],
  apiComponents: ['CngxPaginatorDots', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorDots } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorDots'],
  setup: `protected readonly pageIndex = signal(2);`,
  template: `  <cngx-paginator
    skin="dots"
    [total]="60"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
  >
    <cngx-pgn-dots />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
