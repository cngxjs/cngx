import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';

import {
  CngxPaginator,
  CngxPaginatorNext,
  CngxPaginatorPrev,
  CngxPaginatorRail,
  CngxPaginatorStatus,
} from '@cngx/ui/paginator';

/**
 * The `rail` skin - paint-only, default (system-ui) themed.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CngxPaginator,
    CngxPaginatorPrev,
    CngxPaginatorRail,
    CngxPaginatorStatus,
    CngxPaginatorNext,
  ],
  styleUrl: './rail.component.scss',
  template: `
    <div class="skin-stage">
      <cngx-paginator
        skin="rail"
        [total]="200"
        [pageIndex]="pageIndex()"
        (pageIndexChange)="pageIndex.set($event)"
      >
        <cngx-pgn-prev />
        <cngx-pgn-rail />
        <cngx-pgn-status />
        <cngx-pgn-next />
      </cngx-paginator>
    </div>
  `,
})
export class RailSkinExample {
  protected readonly pageIndex = signal(5);
}
