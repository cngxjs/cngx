import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Minimal',
  subtitle:
    'The <code>minimal</code> skin pares the control to labelled prev / next buttons around a "Page n of m" status - the text-forward idiom for dense toolbars and table footers.',
  description:
    'Same shell, same brain, different paint. The nav buttons reveal their otherwise visually-hidden text label, so the visible label is the accessible name; the cascade shortens them to "Prev" / "Next" via <code>provideCngxPaginatorConfigAt</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorStatus', 'CngxPaginatorNext'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorStatus, CngxPaginatorNext, provideCngxPaginatorConfigAt, withPaginatorAriaLabels } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorStatus', 'CngxPaginatorNext'],
  viewProviders: [
    "provideCngxPaginatorConfigAt(withPaginatorAriaLabels({ previous: 'Prev', next: 'Next' }))",
  ],
  setup: `protected readonly pageIndex = signal(2);`,
  template: `  <cngx-paginator skin="minimal" [total]="100" [(pageIndex)]="pageIndex">
    <cngx-pgn-prev />
    <cngx-pgn-status />
    <cngx-pgn-next />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
