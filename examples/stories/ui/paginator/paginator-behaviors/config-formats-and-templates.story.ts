import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Config formats and templates',
  subtitle:
    '<code>provideCngxPaginatorConfigAt(...)</code> rewrites two readouts and the busy indicator for every paginator below it: <code>withPaginatorPageOfPagesFormat</code> builds the page-of-pages trigger text, <code>withPaginatorLoadMoreFormat</code> the load-more progress, <code>withPaginatorTemplates({ loading })</code> replaces the built-in progress bar. The left column reads the library defaults, the right column the scoped config.',
  description:
    'A <code>TemplateRef</code> exists only once a view is rendered, so the loading template cannot be handed to a provider in <code>viewProviders</code>. The demo builds the scope with <code>Injector.create</code> from the rendered template and passes it to <code>ngTemplateOutlet</code>; the paginators inside the outlet resolve <code>CNGX_PAGINATOR_CONFIG</code> from that injector, the ones next to them do not. Both columns share the page state, so they always show the same numbers in different words. Pick a page or press Load more: the shared async state turns busy for a moment, and the default column shows the progress bar while the scoped column shows the configured template. The page-of-pages readout renders as sanitised HTML, so the <code>&lt;b&gt;</code> in the formatter is kept; the load-more readout is plain decorative text, and the button keeps its accessible name.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'async-state'],
  apiComponents: ['CngxPaginator', 'CngxPaginatorPageOfPages', 'CngxPaginatorLoadMore'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorNext, CngxPaginatorPageOfPages, CngxPaginatorLoadMore, provideCngxPaginatorConfigAt, withPaginatorLoadMoreFormat, withPaginatorPageOfPagesFormat, withPaginatorTemplates } from '@cngx/ui/paginator';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorNext',
    'CngxPaginatorPageOfPages',
    'CngxPaginatorLoadMore',
    'NgTemplateOutlet',
  ],
  setup: `private readonly injector = inject(Injector);
  private readonly loadingTpl = viewChild.required<TemplateRef<unknown>>('pagerLoading');

  protected readonly pagerScope = computed(() =>
    Injector.create({
      parent: this.injector,
      providers: [
        provideCngxPaginatorConfigAt(
          withPaginatorPageOfPagesFormat((page, totalPages) => 'Page <b>' + page + '</b> of ' + totalPages),
          withPaginatorLoadMoreFormat((shown, total) => shown + ' of ' + total + ' shown'),
          withPaginatorTemplates({ loading: this.loadingTpl() }),
        ),
      ],
    }),
  );

  protected readonly loading = createManualState<unknown>();
  protected readonly page = signal(0);
  protected readonly batch = signal(0);

  protected setPage(index: number): void {
    // Both columns emit the shared index; only a real change loads.
    if (index === this.page()) {
      return;
    }
    this.page.set(index);
    this.simulateLoad();
  }

  protected setBatch(index: number): void {
    // Both columns emit the shared index; only a real change loads.
    if (index === this.batch()) {
      return;
    }
    this.batch.set(index);
    this.simulateLoad();
  }

  private simulateLoad(): void {
    this.loading.set('loading');
    setTimeout(() => this.loading.setSuccess(null), 900);
  }`,
  template: `  <ng-template #pagerLoading>
    <span class="demo-pgn-config-loading">Loading the requested rows</span>
  </ng-template>

  <ng-template #pagers let-scope>
    <cngx-paginator [aria-label]="'Report pages, ' + scope" [total]="120" [state]="loading" [pageIndex]="page()" (pageIndexChange)="setPage($event)">
      <cngx-pgn-prev />
      <cngx-pgn-page-of-pages />
      <cngx-pgn-next />
    </cngx-paginator>
    <cngx-paginator [aria-label]="'Report rows, ' + scope" [total]="42" [pageSize]="10" [state]="loading" [pageIndex]="batch()" (pageIndexChange)="setBatch($event)">
      <cngx-pgn-load-more />
    </cngx-paginator>
  </ng-template>

  <div class="demo-scope-compare">
    <div class="demo-pgn-config-column">
      <h3 class="demo-pgn-config-heading">Library defaults</h3>
      <ng-container *ngTemplateOutlet="pagers; context: { $implicit: 'library defaults' }" />
    </div>
    <div class="demo-pgn-config-column">
      <h3 class="demo-pgn-config-heading">Scoped config</h3>
      <ng-container *ngTemplateOutlet="pagers; context: { $implicit: 'scoped config' }; injector: pagerScope()" />
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ page() + 1 }}</span></div>
    <div class="event-row"><span class="event-label">Rows shown</span><span class="event-value">{{ (batch() + 1) * 10 > 42 ? 42 : (batch() + 1) * 10 }}</span></div>
    <div class="event-row"><span class="event-label">Status</span><span class="event-value">{{ loading.status() }}</span></div>
  </div>`,
};
