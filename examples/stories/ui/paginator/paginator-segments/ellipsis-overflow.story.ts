import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Ellipsis overflow',
  subtitle:
    'With many pages the number row truncates: a run of hidden pages collapses into an ellipsis button that opens a <code>CngxMenu</code> of the clipped pages. The overflow reuses the menu + popover stack - no bespoke overflow code.',
  description:
    'A large <code>[total]</code> forces two gaps when the current page sits in the middle. Open a gap menu and pick a hidden page to jump straight to it.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  references: [
    {
      label: 'WAI-ARIA APG - Menu Button',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    },
  ],
  apiComponents: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorPages', 'CngxPaginatorNext'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorPages', 'CngxPaginatorNext'],
  setup: `protected readonly pageIndex = signal(11);`,
  template: `  <cngx-paginator skin="numbered" [total]="250" [(pageIndex)]="pageIndex">
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
