import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorRail: Progress rail',
  subtitle:
    'The <code>cngx-pgn-rail</code> part in isolation - a horizontal progress rail (a composed <code>cngx-progress</code> plus a riding knob) whose fill derives purely from the shared <code>pageIndex</code> across the page span.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants'],
  apiComponents: ['CngxPaginatorRail', 'CngxPaginator'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorRail } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorRail'],
  setup: `protected readonly pageIndex = signal(2);`,
  template: `  <cngx-paginator
    skin="rail"
    [total]="120"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
  >
    <cngx-pgn-rail />
  </cngx-paginator>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" (click)="pageIndex.set(pageIndex() + 1)">Next page</button>
  </div>`,
};
