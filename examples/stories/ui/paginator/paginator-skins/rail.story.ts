import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Rail',
  subtitle:
    'The <code>rail</code> skin is paginator-native: a horizontal progress rail with a position knob, flanked by prev / next and a "Page n of m" status. Suited to wide footers and dashboards where the position reads at a glance.',
  description:
    'The rail composes the <code>CngxProgress</code> atom for the track, fill, and <code>role="progressbar"</code> a11y - the knob is the only new part, a decorative dot riding the fill edge. A screen reader reads the inherited progressbar value; the fill and knob derive from the host page signals, nothing is stored.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorRail',
    'CngxPaginatorStatus',
    'CngxPaginatorNext',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorRail, CngxPaginatorStatus, CngxPaginatorNext } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorRail',
    'CngxPaginatorStatus',
    'CngxPaginatorNext',
  ],
  setup: `protected readonly pageIndex = signal(5);`,
  template: `  <cngx-paginator skin="rail" [total]="200" [(pageIndex)]="pageIndex">
    <cngx-pgn-prev />
    <cngx-pgn-rail />
    <cngx-pgn-status />
    <cngx-pgn-next />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
