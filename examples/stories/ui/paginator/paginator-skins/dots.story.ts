import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Dots',
  subtitle:
    'The <code>dots</code> skin pairs with the <code>cngx-pgn-dots</code> segment - one dot per page, flanked by prev / next. A small fixed set renders every dot; a large set windows with an iOS-style edge-shrink.',
  description:
    'The active dot carries <code>aria-current="page"</code>; the dots render organism-internal (no new public atom). The same segment covers both the fixed and the windowed case - the edge-shrink kicks in automatically past the visible-dot cap.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-current (state)',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-current',
    },
  ],
  apiComponents: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorDots', 'CngxPaginatorNext'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorDots, CngxPaginatorNext } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorDots', 'CngxPaginatorNext'],
  setup: `protected readonly small = signal(2);
  protected readonly large = signal(4);`,
  template: `  <div style="display:flex;flex-direction:column;gap:1.5rem">
    <cngx-paginator skin="dots" [total]="50" [(pageIndex)]="small">
      <cngx-pgn-prev />
      <cngx-pgn-dots />
      <cngx-pgn-next />
    </cngx-paginator>
    <cngx-paginator skin="dots" [total]="320" [(pageIndex)]="large">
      <cngx-pgn-prev />
      <cngx-pgn-dots />
      <cngx-pgn-next />
    </cngx-paginator>
  </div>`,
  templateChromeBefore: `<div class="event-grid" style="margin-bottom:12px">
    <div class="event-row"><span class="event-label">Fixed</span><span class="event-value">5 pages</span></div>
    <div class="event-row"><span class="event-label">Variable</span><span class="event-value">32 pages</span></div>
  </div>`,
};
