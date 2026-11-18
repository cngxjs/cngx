import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: all skins side by side',
  subtitle:
    'Every <code>[skin]</code> on one page, all bound to the same <code>pageIndex</code> and <code>pageSize</code>. Paging in any one moves the current page in all seven.',
  description:
    'Skin axis comparison. Each paginator projects the segments its skin is built for (the dots skin takes <code>cngx-pgn-dots</code>, rail takes <code>cngx-pgn-rail</code> and a status, bar takes the full toolbar); the shared state shows how each skin marks the current page.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorFirst',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorDots',
    'CngxPaginatorRail',
    'CngxPaginatorStatus',
    'CngxPaginatorRange',
    'CngxPaginatorPageSize',
    'CngxPaginatorNext',
    'CngxPaginatorLast',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorFirst, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorDots, CngxPaginatorRail, CngxPaginatorStatus, CngxPaginatorRange, CngxPaginatorPageSize, CngxPaginatorNext, CngxPaginatorLast } from '@cngx/ui/paginator';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorFirst',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorDots',
    'CngxPaginatorRail',
    'CngxPaginatorStatus',
    'CngxPaginatorRange',
    'CngxPaginatorPageSize',
    'CngxPaginatorNext',
    'CngxPaginatorLast',
  ],
  setup: `protected readonly pageIndex = signal(3);
  protected readonly pageSize = signal(10);
  protected readonly sizes = [10, 25, 50] as const;`,
  template: `  <div style="display:flex;flex-direction:column;gap:24px">
    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">numbered</span>
      <cngx-paginator skin="numbered" aria-label="Numbered skin" [total]="120" [pageSize]="pageSize()" [pageIndex]="pageIndex()" (pageIndexChange)="pageIndex.set($event)">
        <cngx-pgn-first />
        <cngx-pgn-prev />
        <cngx-pgn-pages />
        <cngx-pgn-next />
        <cngx-pgn-last />
        <cngx-pgn-range />
      </cngx-paginator>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">minimal</span>
      <cngx-paginator skin="minimal" aria-label="Minimal skin" [total]="120" [pageSize]="pageSize()" [pageIndex]="pageIndex()" (pageIndexChange)="pageIndex.set($event)">
        <cngx-pgn-prev />
        <cngx-pgn-status />
        <cngx-pgn-next />
      </cngx-paginator>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">pill</span>
      <cngx-paginator skin="pill" aria-label="Pill skin" [total]="120" [pageSize]="pageSize()" [pageIndex]="pageIndex()" (pageIndexChange)="pageIndex.set($event)">
        <cngx-pgn-first />
        <cngx-pgn-prev />
        <cngx-pgn-pages />
        <cngx-pgn-next />
        <cngx-pgn-last />
      </cngx-paginator>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">segmented</span>
      <cngx-paginator skin="segmented" aria-label="Segmented skin" [total]="120" [pageSize]="pageSize()" [pageIndex]="pageIndex()" (pageIndexChange)="pageIndex.set($event)">
        <cngx-pgn-prev />
        <cngx-pgn-pages />
        <cngx-pgn-next />
      </cngx-paginator>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">rail</span>
      <cngx-paginator skin="rail" aria-label="Rail skin" [total]="120" [pageSize]="pageSize()" [pageIndex]="pageIndex()" (pageIndexChange)="pageIndex.set($event)">
        <cngx-pgn-prev />
        <cngx-pgn-rail />
        <cngx-pgn-status />
        <cngx-pgn-next />
      </cngx-paginator>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">dots</span>
      <cngx-paginator skin="dots" aria-label="Dots skin" [total]="120" [pageSize]="pageSize()" [pageIndex]="pageIndex()" (pageIndexChange)="pageIndex.set($event)">
        <cngx-pgn-prev />
        <cngx-pgn-dots />
        <cngx-pgn-next />
      </cngx-paginator>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">bar</span>
      <cngx-paginator skin="bar" aria-label="Bar skin" [total]="120" [pageIndex]="pageIndex()" (pageIndexChange)="pageIndex.set($event)" [pageSize]="pageSize()" (pageSizeChange)="pageSize.set($event)">
        <cngx-pgn-page-size [options]="sizes" />
        <cngx-pgn-range />
        <cngx-pgn-first />
        <cngx-pgn-prev />
        <cngx-pgn-pages />
        <cngx-pgn-next />
        <cngx-pgn-last />
      </cngx-paginator>
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Shared current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
  </div>`,
};
