import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';

import {
  CngxPaginator,
  CngxPaginatorFirst,
  CngxPaginatorLast,
  CngxPaginatorNext,
  CngxPaginatorPageSize,
  CngxPaginatorPages,
  CngxPaginatorPrev,
  CngxPaginatorRange,
} from '@cngx/ui/paginator';

/**
 * The `bar` skin - paint-only, default (system-ui) themed.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CngxPaginator,
    CngxPaginatorPageSize,
    CngxPaginatorRange,
    CngxPaginatorFirst,
    CngxPaginatorPrev,
    CngxPaginatorPages,
    CngxPaginatorNext,
    CngxPaginatorLast,
  ],
  styleUrl: './bar.component.scss',
  template: `
    <div class="skin-stage">
      <cngx-paginator
        skin="bar"
        [total]="240"
        [pageIndex]="pageIndex()"
        (pageIndexChange)="pageIndex.set($event)"
        [pageSize]="pageSize()"
        (pageSizeChange)="pageSize.set($event)"
      >
        <cngx-pgn-page-size [options]="sizes" />
        <cngx-pgn-range />
        <cngx-pgn-first />
        <cngx-pgn-prev />
        <cngx-pgn-pages />
        <cngx-pgn-next />
        <cngx-pgn-last />
      </cngx-paginator>
    </div>
  `,
})
export class BarSkinExample {
  protected readonly sizes = [10, 25, 50] as const;
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(10);
}
