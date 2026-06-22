import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Density',
  subtitle:
    'A single density axis shifts the whole control - hit-target, gap, and font - between <code>compact</code>, default, and <code>comfortable</code>. One token set, three sizes; the skin, brain, and keyboard model are identical.',
  description:
    'Density is orthogonal to skin: <code>[density]</code> reflects onto <code>[data-density]</code> and the structural base re-points the size / gap / font tokens. All three rows share one page signal, so stepping one steps them together.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  apiComponents: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorPages', 'CngxPaginatorNext'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorPages', 'CngxPaginatorNext'],
  setup: `protected readonly page = signal(2);`,
  template: `  <div style="display:flex;flex-direction:column;gap:1.25rem">
    <cngx-paginator skin="numbered" density="compact" [total]="70" [pageIndex]="page()" (pageIndexChange)="page.set($event)">
      <cngx-pgn-prev />
      <cngx-pgn-pages />
      <cngx-pgn-next />
    </cngx-paginator>
    <cngx-paginator skin="numbered" [total]="70" [pageIndex]="page()" (pageIndexChange)="page.set($event)">
      <cngx-pgn-prev />
      <cngx-pgn-pages />
      <cngx-pgn-next />
    </cngx-paginator>
    <cngx-paginator skin="numbered" density="comfortable" [total]="70" [pageIndex]="page()" (pageIndexChange)="page.set($event)">
      <cngx-pgn-prev />
      <cngx-pgn-pages />
      <cngx-pgn-next />
    </cngx-paginator>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ page() + 1 }}</span></div>
  </div>`,
};
