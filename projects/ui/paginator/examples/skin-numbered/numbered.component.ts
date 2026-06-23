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
  CngxPaginatorRange,
} from '@cngx/ui/paginator';

/**
 * The `numbered` skin - paint-only, default (system-ui) themed.
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
    CngxPaginatorRange,
  ],
  styleUrl: './numbered.component.scss',
  template: `
    <div class="skin-stage">
      <cngx-paginator
        skin="numbered"
        [total]="120"
        [pageIndex]="pageIndex()"
        (pageIndexChange)="pageIndex.set($event)"
      >
        <cngx-pgn-first />
        <cngx-pgn-prev />
        <cngx-pgn-pages />
        <cngx-pgn-next />
        <cngx-pgn-last />
        <cngx-pgn-range />
      </cngx-paginator>
    </div>
  `,
})
export class NumberedSkinExample {
  protected readonly pageIndex = signal(2);
}
