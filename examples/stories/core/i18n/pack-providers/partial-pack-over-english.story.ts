import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'withPartialPack: partial pack over English',
  subtitle:
    '<code>withPartialPack(pack)</code> accepts a pack with missing sections or keys. Every key it sets replaces the English copy; every key it leaves out reads English, formatted for the pack locale.',
  description:
    "Where <code>withPack</code> demands a complete pack (a missing key is a compile error), <code>withPartialPack</code> takes gaps. The pack opened with <code>?pack=partial</code> sets <code>locale: 'de'</code> and two paginator keys, <code>range</code> and <code>loadMore</code>; <code>pageStatus</code> and <code>loadMoreReadout</code> stay English, with German number grouping (1.200). A provider takes one pack, the last pack feature wins, so overriding a few keys of the German pack means spreading <code>CNGX_LANGUAGE_DE</code> into the partial pack yourself. Like <code>withPack</code>, the pack is app-wide and belongs in the root providers: the examples app installs it only for <code>?pack=partial</code>. Without the parameter the paginator reads English; reload with the link to apply it.",
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'composition'],
  apiComponents: ['withPartialPack', 'provideCngxI18n', 'CNGX_LANGUAGE_PACK'],
  moduleImports: [
    "import { CNGX_LANGUAGE_PACK } from '@cngx/core/i18n';",
    "import { CngxPaginator, CngxPaginatorLoadMore, CngxPaginatorRange, CngxPaginatorStatus } from '@cngx/ui/paginator';",
    "import { demoPackParam } from '../../../../fixtures';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorRange', 'CngxPaginatorStatus', 'CngxPaginatorLoadMore'],
  setup: `
  // App config (here installed for ?pack=partial):
  // provideCngxI18n(withPartialPack({
  //   locale: 'de',
  //   paginator: { range: '<b>{start}–{end}</b> von {total}', loadMore: 'Weitere laden' },
  // }))
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);`,
  template: `
  <cngx-paginator
    aria-label="Orders"
    [total]="1200"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
    [pageSize]="pageSize()"
    (pageSizeChange)="pageSize.set($event)"
  >
    <cngx-pgn-range />
    <cngx-pgn-status />
    <cngx-pgn-load-more />
  </cngx-paginator>`,
  setupChrome: `
  protected readonly packParam = demoPackParam();
  protected readonly activePack = inject(CNGX_LANGUAGE_PACK);
  protected readonly paginatorKeys = computed(() =>
    Object.keys(this.activePack().paginator ?? {}).join(', ') || '(none, every key reads English)',
  );`,
  templateChrome: `
  <div class="button-row">
    <a href="?pack=partial#/core/i18n/pack-providers/partial-pack-over-english">Reload with ?pack=partial</a>
    <a href="./#/core/i18n/pack-providers/partial-pack-over-english">Reload without a pack</a>
  </div>
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">?pack parameter</span>
      <span class="event-value">{{ packParam ?? '(none, English defaults)' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Root CNGX_LANGUAGE_PACK locale</span>
      <span class="event-value">{{ activePack().locale }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Paginator keys the pack sets</span>
      <span class="event-value">{{ paginatorKeys() }}</span>
    </div>
  </div>`,
};
