import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorGoto: Go-to-page input',
  subtitle:
    'The <code>cngx-pgn-goto</code> part in isolation - a native number input. Typing or the spinner navigates live; Enter or blur clamps and re-syncs the field to the shared <code>pageIndex</code>.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorGoto', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorGoto } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorGoto'],
  setup: `protected readonly pageIndex = signal(0);`,
  template: `  <cngx-paginator
    [total]="300"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
  >
    <cngx-pgn-goto />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
