import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Dots skin',
  subtitle:
    'The <code>dots</code> skin pairs with the <code>cngx-pgn-dots</code> segment - one dot per page with an iOS-style edge-shrink for large counts. The active dot carries <code>aria-current="page"</code>; the dots render organism-internal (no new public atom).',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxPaginator', 'CngxPaginatorDots'],
  moduleImports: ["import { CngxPaginator, CngxPaginatorDots } from '@cngx/ui/paginator';"],
  imports: ['CngxPaginator', 'CngxPaginatorDots'],
  setup: `protected readonly pageIndex = signal(2);`,
  template: `  <cngx-paginator skin="dots" [total]="60" [(pageIndex)]="pageIndex">
    <cngx-pgn-dots />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
