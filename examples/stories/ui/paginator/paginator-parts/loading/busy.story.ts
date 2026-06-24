import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorLoading: Busy-indicator slot',
  subtitle:
    'The <code>*cngxPaginatorLoading</code> structural slot in isolation - project a template inside <code>cngx-paginator</code> and the shell renders it (instead of the default <code>cngx-progress</code> bar) while the bound async <code>[state]</code> is busy.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state'],
  apiComponents: ['CngxPaginatorLoading', 'CngxPaginator', 'CngxPaginatorPages'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorLoading, CngxPaginatorPages } from '@cngx/ui/paginator';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorLoading', 'CngxPaginatorPages'],
  setup: `protected readonly pageIndex = signal(2);
  protected readonly loading = createManualState<unknown>();

  constructor() {
    this.loading.set('loading');
  }`,
  template: `  <cngx-paginator
    [total]="120"
    [state]="loading"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
  >
    <ng-template cngxPaginatorLoading>
      <span class="event-value">Loading rows…</span>
    </ng-template>
    <cngx-pgn-pages />
  </cngx-paginator>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" (click)="loading.set('loading')">Start loading</button>
    <button type="button" (click)="loading.set('success')">Finish</button>
  </div>`,
};
