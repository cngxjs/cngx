import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';

import {
  CngxPaginator,
  CngxPaginatorNext,
  CngxPaginatorPages,
  CngxPaginatorPrev,
} from '@cngx/ui/paginator';

/**
 * The `segmented` skin - paint-only, default (system-ui) themed.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxPaginator, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext],
  styleUrl: './segmented.component.scss',
  template: `
    <div class="skin-stage">
      <cngx-paginator
        skin="segmented"
        [total]="120"
        [pageIndex]="pageIndex()"
        (pageIndexChange)="pageIndex.set($event)"
      >
        <cngx-pgn-prev />
        <cngx-pgn-pages />
        <cngx-pgn-next />
      </cngx-paginator>
    </div>
  `,
})
export class SegmentedSkinExample {
  protected readonly pageIndex = signal(3);
}
