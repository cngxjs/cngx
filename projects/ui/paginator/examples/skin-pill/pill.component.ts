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
  CngxPaginatorPages,
  CngxPaginatorPrev,
} from '@cngx/ui/paginator';

/**
 * The `pill` skin - paint-only, default (system-ui) themed.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CngxPaginator,
    CngxPaginatorFirst,
    CngxPaginatorPrev,
    CngxPaginatorPages,
    CngxPaginatorNext,
    CngxPaginatorLast,
  ],
  styleUrl: './pill.component.scss',
  template: `
    <div class="skin-stage">
      <cngx-paginator
        skin="pill"
        [total]="150"
        [pageIndex]="pageIndex()"
        (pageIndexChange)="pageIndex.set($event)"
      >
        <cngx-pgn-first />
        <cngx-pgn-prev />
        <cngx-pgn-pages />
        <cngx-pgn-next />
        <cngx-pgn-last />
      </cngx-paginator>
    </div>
  `,
})
export class PillSkinExample {
  protected readonly pageIndex = signal(4);
}
