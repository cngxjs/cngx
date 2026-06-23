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
  CngxPaginatorStatus,
} from '@cngx/ui/paginator';

/**
 * The `minimal` skin - paint-only, default (system-ui) themed.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxPaginator, CngxPaginatorPrev, CngxPaginatorStatus, CngxPaginatorNext],
  styleUrl: './minimal.component.scss',
  template: `
    <div class="skin-stage">
      <cngx-paginator
        skin="minimal"
        data-nav-labels
        [total]="100"
        [pageIndex]="pageIndex()"
        (pageIndexChange)="pageIndex.set($event)"
      >
        <cngx-pgn-prev />
        <cngx-pgn-status />
        <cngx-pgn-next />
      </cngx-paginator>
    </div>
  `,
})
export class MinimalSkinExample {
  protected readonly pageIndex = signal(2);
}
