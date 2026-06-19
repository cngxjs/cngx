import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Async loading',
  subtitle:
    'Bind <code>[state]</code> to gate navigation while data loads: the buttons report <code>aria-disabled</code>, an indeterminate <code>cngx-progress</code> bar appears, <code>aria-busy</code> flips on the landmark, and the live region announces "Loading" then "Updated".',
  description:
    'The paginator is an async-state consumer. While busy, <code>setPage</code> is a no-op, so a page click cannot race an in-flight load.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Live Region Practices',
      href: 'https://www.w3.org/WAI/ARIA/apg/practices/live-regions/',
    },
    { label: 'WAI-ARIA 1.2: aria-busy (state)', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-busy' },
  ],
  apiComponents: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorPages', 'CngxPaginatorNext'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext } from '@cngx/ui/paginator';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorPages', 'CngxPaginatorNext'],
  setup: `protected readonly pageIndex = signal(2);
  protected readonly loading = createManualState<unknown>();`,
  template: `  <cngx-paginator skin="numbered" [total]="120" [state]="loading" [(pageIndex)]="pageIndex">
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
  </cngx-paginator>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" (click)="loading.set('loading')">Start loading</button>
    <button type="button" (click)="loading.set('success')">Finish</button>
  </div>
  <div class="event-grid">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
