import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorStatus: Page-status readout',
  subtitle:
    'The <code>cngx-pgn-status</code> part in isolation - a pure <code>Page n of m</code> readout derived from the shared <code>pageIndex</code> and <code>total</code>. It is the responsive collapse target the number row swaps to when space runs out.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorStatus', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorStatus } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorStatus'],
  setup: `protected readonly pageIndex = signal(2);`,
  template: `  <cngx-paginator
    [total]="120"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
  >
    <cngx-pgn-status />
  </cngx-paginator>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" (click)="pageIndex.set(pageIndex() + 1)">Next page</button>
  </div>`,
};
