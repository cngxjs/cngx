import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Responsive collapse',
  subtitle:
    'Compose both <code>cngx-pgn-pages</code> and <code>cngx-pgn-status</code> and the collapse is already on - no attribute to set. A container query swaps the number row for a "Page n of m" readout once the control narrows past its breakpoint. Drag the right edge to shrink it.',
  description:
    'The collapse is a <code>@container</code> rule, not a media query, so it tracks the paginator’s own inline size rather than the viewport. It is on by default; the opt-out is the <code>--cngx-paginator-collapse: none</code> custom property, toggled below, not a boolean input. <code>cngx-pgn-status</code> derives "Page n of m" from the host signals through the config <code>pageStatus</code> formatter - no stored state - and stays in the accessibility tree on both sides of the swap.',
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
  setupChrome: `protected readonly collapse = signal(true);`,
  template: `  <div style="resize:horizontal;overflow:auto;inline-size:40rem;min-inline-size:13rem;max-inline-size:100%;padding:12px;border:1px solid var(--cngx-color-border, #ccc);border-radius:8px"
       [style.--cngx-paginator-collapse]="collapse() ? null : 'none'">
    <cngx-paginator
      skin="numbered"
      [total]="240"
      [pageSize]="10"
      [pageIndex]="pageIndex()" (pageIndexChange)="pageIndex.set($event)"
    >
      <cngx-pgn-prev />
      <cngx-pgn-pages />
      <cngx-pgn-status />
      <cngx-pgn-next />
    </cngx-paginator>
  </div>`,
  templateChromeBefore: `<p style="margin:0 0 12px;color:var(--cngx-color-text-muted, #555)">Drag the right edge of the box to narrow the control past its collapse breakpoint.</p>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button class="sort-btn" type="button" (click)="collapse.set(!collapse())">
      {{ collapse() ? 'Opt out (--cngx-paginator-collapse: none)' : 'Re-enable collapse' }}
    </button>
    <span class="status-badge" [class.active]="collapse()">collapse: {{ collapse() ? 'on (default)' : 'off' }}</span>
  </div>`,
};
