import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Responsive collapse',
  subtitle:
    'Mark the paginator <code>[responsive]</code> and compose both <code>cngx-pgn-pages</code> and <code>cngx-pgn-status</code>. A container query swaps the number row for a "Page n of m" readout once the control narrows past its breakpoint. Drag the right edge to shrink it.',
  description:
    'The collapse is a <code>@container</code> rule, not a media query, so it tracks the paginator’s own inline size rather than the viewport. <code>cngx-pgn-status</code> derives "Page n of m" from the host signals through the config <code>pageStatus</code> formatter - no stored state - and stays in the accessibility tree on both sides of the swap.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorStatus',
    'CngxPaginatorNext',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorStatus, CngxPaginatorNext } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorStatus',
    'CngxPaginatorNext',
  ],
  setup: `protected readonly pageIndex = signal(0);`,
  setupChrome: '',
  template: `  <div style="resize:horizontal;overflow:auto;inline-size:30rem;min-inline-size:13rem;max-inline-size:100%;padding:12px;border:1px solid var(--cngx-color-border, #ccc);border-radius:8px">
    <cngx-paginator
      skin="numbered"
      [total]="240"
      [pageSize]="10"
      [(pageIndex)]="pageIndex"
      [responsive]="true"
    >
      <cngx-pgn-prev />
      <cngx-pgn-pages />
      <cngx-pgn-status />
      <cngx-pgn-next />
    </cngx-paginator>
  </div>`,
  templateChromeBefore: `<p style="margin:0 0 12px;color:var(--cngx-color-text-muted, #555)">Drag the right edge of the box to narrow the control past its collapse breakpoint.</p>`,
};
