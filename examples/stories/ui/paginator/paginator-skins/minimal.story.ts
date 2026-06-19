import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Minimal',
  subtitle:
    'The <code>minimal</code> skin pares the control down to prev / next around a range readout - the text-forward idiom for dense toolbars and table footers.',
  description:
    'Same shell, same brain, different paint. The range text comes from the config range formatter, so it localises with the rest of the cascade.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  apiComponents: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorRange', 'CngxPaginatorNext'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorRange, CngxPaginatorNext } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorRange', 'CngxPaginatorNext'],
  setup: `protected readonly pageIndex = signal(0);`,
  template: `  <cngx-paginator skin="minimal" [total]="86" [(pageIndex)]="pageIndex">
    <cngx-pgn-prev />
    <cngx-pgn-range />
    <cngx-pgn-next />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
